using System.Diagnostics;
using System.Drawing;
using Microsoft.Win32;
using System.Text.Json;
using System.Windows.Forms;
using System.Net.WebSockets;
using System.Text;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

internal static class Program
{
  private const int ProcessTimeoutMilliseconds = 15_000;

  [STAThread]
  private static int Main(string[] args)
  {
    try {
      var options = Options.Parse(args);
      if (options.ShowHelp) {
        Console.WriteLine(Options.HelpText);
        return 0;
      }
      if (options.InstallProtocol) {
        ProtocolRegistration.Install();
        Console.WriteLine("ブラウザ起動用プロトコルを登録しました。");
        return 0;
      }
      if (options.UninstallProtocol) {
        ProtocolRegistration.Uninstall();
        Console.WriteLine("ブラウザ起動用プロトコルを解除しました。");
        return 0;
      }
      if (options.ProtocolUri is not null) {
        ProtocolRegistration.ValidateUri(options.ProtocolUri);
        options = options.WithProtocolOptions();
      }
      if (options.Mode == "pokemon-quote") {
        RunPokemonQuoteServer(options).GetAwaiter().GetResult();
        return 0;
      }

      var config = AppConfig.Load();
      var adbPath = options.AdbPath ?? config.GetAdbPath() ?? FindAdbPath();
      if (adbPath is null) {
        throw new InvalidOperationException(
          "adb.exe が見つかりません。設定ファイル、PATH、または ANDROID_SDK_ROOT を確認してください。"
        );
      }

      using var screenshot = CaptureScreenshot(adbPath, options.Serial ?? config.Serial);
      Clipboard.SetImage(screenshot);
      Console.WriteLine("スマートフォンのスクリーンショットをクリップボードへコピーしました。");
      return 0;
    } catch (Exception exception) {
      Console.Error.WriteLine($"スクリーンショットの取得に失敗しました。{exception.Message}");
      return 1;
    }
  }

  private static async Task RunPokemonQuoteServer(Options options)
  {
    var builder = WebApplication.CreateSlimBuilder();
    builder.Logging.ClearProviders();
    builder.WebHost.UseUrls($"http://127.0.0.1:{options.Port}");
    await using var app = builder.Build();
    app.UseWebSockets();
    var finished = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
    var connected = 0;
    app.Map("/pokemon-quote", async context => {
      if (!context.WebSockets.IsWebSocketRequest
        || (options.Session is not null && context.Request.Query["session"] != options.Session)) {
        context.Response.StatusCode = 403;
        return;
      }
      if (Interlocked.CompareExchange(ref connected, 1, 0) != 0) {
        context.Response.StatusCode = 409;
        return;
      }
      try {
        using var socket = await context.WebSockets.AcceptWebSocketAsync();
        Console.WriteLine("ブラウザの接続を確認しました。");
        var screenshotSize = await SendScreenshot(socket, options, context.RequestAborted);
        var buffer = new byte[1024];
        while (socket.State == WebSocketState.Open) {
          var message = await socket.ReceiveAsync(new ArraySegment<byte>(buffer), context.RequestAborted);
          if (message.MessageType == WebSocketMessageType.Close) {
            await socket.CloseOutputAsync(WebSocketCloseStatus.NormalClosure, "終了", CancellationToken.None);
            finished.TrySetResult();
            break;
          }
          if (!message.EndOfMessage || message.MessageType != WebSocketMessageType.Text) {
            await socket.CloseAsync(WebSocketCloseStatus.InvalidMessageType, "短いテキストが必要です", CancellationToken.None);
            break;
          }
          var command = Encoding.UTF8.GetString(buffer, 0, message.Count);
          if (command == "complete" || command == "next") {
            try {
              if (screenshotSize is null) throw new InvalidOperationException("スクリーンショットが未取得です。");
              await SwipeAfterCapture(options, screenshotSize.Value, context.RequestAborted);
            } catch (Exception exception) when (!context.RequestAborted.IsCancellationRequested) {
              Console.Error.WriteLine($"ADBスワイプエラー: {exception.Message}");
              var error = JsonSerializer.SerializeToUtf8Bytes(new { type = "error", message = exception.Message });
              await socket.SendAsync(new ArraySegment<byte>(error), WebSocketMessageType.Text, true, context.RequestAborted);
              continue;
            }
            if (command == "next") {
              var ready = JsonSerializer.SerializeToUtf8Bytes(new { type = "next" });
              await socket.SendAsync(new ArraySegment<byte>(ready), WebSocketMessageType.Text, true, context.RequestAborted);
              continue;
            }
            await socket.CloseOutputAsync(WebSocketCloseStatus.NormalClosure, "取得・スワイプ完了", CancellationToken.None);
            finished.TrySetResult();
            break;
          }
          if (command == "close") {
            await socket.CloseOutputAsync(WebSocketCloseStatus.NormalClosure, "取得終了", CancellationToken.None);
            finished.TrySetResult();
            break;
          }
          if (command == "capture") screenshotSize = await SendScreenshot(socket, options, context.RequestAborted);
        }
      } catch (Exception exception) {
        Console.Error.WriteLine($"WebSocket接続エラー: {exception.Message}");
      } finally {
        Interlocked.Exchange(ref connected, 0);
      }
    });
    await app.StartAsync();
    Console.WriteLine($"ポケモン取得サーバーを起動しました（127.0.0.1:{options.Port}）。ブラウザの接続を待っています。");
    await finished.Task;
    await app.StopAsync();
  }

  private static async Task<Size?> SendScreenshot(WebSocket socket, Options options, CancellationToken cancellationToken)
  {
    byte[] data;
    WebSocketMessageType type;
    Size? size = null;
    try {
      var config = AppConfig.Load();
      var adbPath = options.AdbPath ?? config.GetAdbPath() ?? FindAdbPath()
        ?? throw new InvalidOperationException("adb.exe が見つかりません。設定ファイルを確認してください。");
      data = await RunAdbCommand(adbPath, options.Serial ?? config.Serial, new[] { "exec-out", "screencap", "-p" }, cancellationToken);
      using var stream = new MemoryStream(data);
      using var image = Image.FromStream(stream);
      size = image.Size;
      type = WebSocketMessageType.Binary;
    } catch (Exception exception) when (!cancellationToken.IsCancellationRequested) {
      Console.Error.WriteLine($"ADBスクリーンショット取得エラー: {exception.Message}");
      data = JsonSerializer.SerializeToUtf8Bytes(new { type = "error", message = exception.Message });
      type = WebSocketMessageType.Text;
    }
    await socket.SendAsync(new ArraySegment<byte>(data), type, true, cancellationToken);
    return size;
  }

  private static async Task SwipeAfterCapture(Options options, Size size, CancellationToken cancellationToken)
  {
    var config = AppConfig.Load();
    var adbPath = options.AdbPath ?? config.GetAdbPath() ?? FindAdbPath()
      ?? throw new InvalidOperationException("adb.exe が見つかりません。");
    // 撮影した画像の寸法を使い、端末の解像度や画面の向きに合わせて座標を求める。
    var x1 = Math.Min((int)(size.Width * 0.25), size.Width - 1);
    var x2 = Math.Min((int)(size.Width * 0.75), size.Width - 1);
    var y = Math.Min((int)(size.Height * 0.5), size.Height - 1);
    await RunAdbCommand(adbPath, options.Serial ?? config.Serial,
      new[] { "shell", "input", "swipe", x1.ToString(), y.ToString(), x2.ToString(), y.ToString(), "300" }, cancellationToken);
    Console.WriteLine("取得完了後のスワイプ（25%,50% → 75%,50%）が完了しました。");
  }

  private static async Task<byte[]> RunAdbCommand(string adbPath, string? serial, string[] arguments, CancellationToken cancellationToken)
  {
    using var process = new Process {
      StartInfo = new ProcessStartInfo {
        FileName = adbPath,
        RedirectStandardOutput = true,
        RedirectStandardError = true,
        UseShellExecute = false,
        CreateNoWindow = true,
      },
    };
    if (!string.IsNullOrEmpty(serial)) {
      process.StartInfo.ArgumentList.Add("-s");
      process.StartInfo.ArgumentList.Add(serial);
    }
    foreach (var argument in arguments) process.StartInfo.ArgumentList.Add(argument);
    process.Start();
    using var timeout = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
    timeout.CancelAfter(ProcessTimeoutMilliseconds);
    try {
      var errorTask = process.StandardError.ReadToEndAsync(timeout.Token);
      using var output = new MemoryStream();
      await process.StandardOutput.BaseStream.CopyToAsync(output, timeout.Token);
      await process.WaitForExitAsync(timeout.Token);
      var error = (await errorTask).Trim();
      if (process.ExitCode != 0) throw new InvalidOperationException(string.IsNullOrEmpty(error) ? $"adb 終了コード: {process.ExitCode}" : error);
      return output.ToArray();
    } catch (OperationCanceledException) {
      if (!process.HasExited) process.Kill(entireProcessTree: true);
      if (cancellationToken.IsCancellationRequested) throw;
      throw new TimeoutException("ADBからの応答がタイムアウトしました。");
    }
  }

  private static Bitmap CaptureScreenshot(string adbPath, string? serial)
  {
    using var process = new Process {
      StartInfo = new ProcessStartInfo {
        FileName = adbPath,
        RedirectStandardOutput = true,
        RedirectStandardError = true,
        UseShellExecute = false,
        CreateNoWindow = true,
      },
    };
    if (!string.IsNullOrEmpty(serial)) {
      process.StartInfo.ArgumentList.Add("-s");
      process.StartInfo.ArgumentList.Add(serial);
    }
    process.StartInfo.ArgumentList.Add("exec-out");
    process.StartInfo.ArgumentList.Add("screencap");
    process.StartInfo.ArgumentList.Add("-p");

    process.Start();
    var errorTask = process.StandardError.ReadToEndAsync();
    using var output = new MemoryStream();
    process.StandardOutput.BaseStream.CopyTo(output);
    if (!process.WaitForExit(ProcessTimeoutMilliseconds)) {
      process.Kill(entireProcessTree: true);
      throw new TimeoutException("ADB からの応答がタイムアウトしました。端末の接続を確認してください。");
    }

    var standardError = errorTask.GetAwaiter().GetResult().Trim();
    if (process.ExitCode != 0) {
      throw new InvalidOperationException(
        string.IsNullOrEmpty(standardError) ? $"adb が終了コード {process.ExitCode} を返しました。" : standardError
      );
    }
    if (output.Length == 0) {
      throw new InvalidOperationException("ADB から画像データを取得できませんでした。USB デバッグの許可を確認してください。");
    }

    output.Position = 0;
    using var image = Image.FromStream(output);
    return new Bitmap(image);
  }

  private static string? FindAdbPath()
  {
    var candidateList = new List<string?> {
      Environment.GetEnvironmentVariable("ANDROID_SDK_ROOT"),
      Environment.GetEnvironmentVariable("ANDROID_HOME"),
      Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Android", "Sdk"),
      Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), "Android", "Android Studio", "sdk"),
    };
    foreach (var directory in candidateList.Where(directory => !string.IsNullOrWhiteSpace(directory))) {
      var candidate = Path.Combine(directory!, "platform-tools", "adb.exe");
      if (File.Exists(candidate)) return candidate;
    }

    var pathList = (Environment.GetEnvironmentVariable("PATH") ?? string.Empty)
      .Split(Path.PathSeparator, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
    return pathList
      .Select(directory => Path.Combine(directory, "adb.exe"))
      .FirstOrDefault(File.Exists);
  }

  private sealed record Options(
    string? Serial,
    string? AdbPath,
    string? ProtocolUri,
    bool InstallProtocol,
    bool UninstallProtocol,
    bool ShowHelp,
    string? Mode = null,
    int Port = 23720,
    string? Session = null
  )
  {
    public const string HelpText = """
      使い方: AdbScreenshotClipboard.exe [--serial <端末ID>] [--adb <adb.exeのパス>]
             AdbScreenshotClipboard.exe --mode pokemon-quote [--port <ポート番号>]
             AdbScreenshotClipboard.exe --install-protocol
             AdbScreenshotClipboard.exe --uninstall-protocol

      接続端末が1台なら引数は不要です。複数台の場合は --serial を指定してください。
      """;

    public static Options Parse(string[] args)
    {
      string? serial = null;
      string? adbPath = null;
      string? protocolUri = null;
      var installProtocol = false;
      var uninstallProtocol = false;
      string? mode = null;
      var port = 23720;
      for (var index = 0; index < args.Length; index++) {
        switch (args[index]) {
          case "--mode" when index + 1 < args.Length:
            mode = args[++index];
            break;
          case "--port" when index + 1 < args.Length:
            port = ParsePort(args[++index]);
            break;
          case "--serial" when index + 1 < args.Length:
            serial = args[++index];
            break;
          case "--adb" when index + 1 < args.Length:
            adbPath = args[++index];
            break;
          case "--protocol" when index + 1 < args.Length:
            protocolUri = args[++index];
            break;
          case "--install-protocol":
            installProtocol = true;
            break;
          case "--uninstall-protocol":
            uninstallProtocol = true;
            break;
          case "--help" or "-h":
            return new Options(null, null, null, false, false, true);
          default:
            throw new ArgumentException($"不明な引数です: {args[index]}");
        }
      }
      if (installProtocol && uninstallProtocol) {
        throw new ArgumentException("--install-protocol と --uninstall-protocol は同時に指定できません。");
      }
      if (mode is not null && mode != "pokemon-quote") throw new ArgumentException("不明なmodeです。");
      return new Options(serial, adbPath, protocolUri, installProtocol, uninstallProtocol, false, mode, port);
    }

    private static int ParsePort(string value) => int.TryParse(value, out var port) && port is >= 1 and <= 65535
      ? port : throw new ArgumentException("portは1～65535で指定してください。");

    public Options WithProtocolOptions()
    {
      var query = Microsoft.AspNetCore.WebUtilities.QueryHelpers.ParseQuery(new Uri(ProtocolUri!).Query);
      var mode = query.TryGetValue("mode", out var modeValue) ? modeValue.ToString() : Mode;
      if (mode is not null && mode != "pokemon-quote") throw new ArgumentException("不明なmodeです。");
      return this with {
        Mode = mode,
        Port = query.TryGetValue("port", out var port) ? ParsePort(port.ToString()) : Port,
        Session = query.TryGetValue("session", out var session) ? session.ToString() : null,
      };
    }
  }

  private sealed record AppConfig(string? AdbPath, string? Serial)
  {
    private const string FileName = "AdbScreenshotClipboard.json";

    public static AppConfig Load()
    {
      var configPath = Path.Combine(AppContext.BaseDirectory, FileName);
      if (!File.Exists(configPath)) return new AppConfig(null, null);

      try {
        return JsonSerializer.Deserialize<AppConfig>(File.ReadAllText(configPath), new JsonSerializerOptions {
          PropertyNameCaseInsensitive = true,
          ReadCommentHandling = JsonCommentHandling.Skip,
        }) ?? new AppConfig(null, null);
      } catch (JsonException exception) {
        throw new InvalidOperationException($"設定ファイル {FileName} の形式が正しくありません。", exception);
      }
    }

    public string? GetAdbPath()
    {
      if (string.IsNullOrWhiteSpace(AdbPath)) return null;
      return Path.IsPathRooted(AdbPath)
        ? AdbPath
        : Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, AdbPath));
    }
  }

  private static class ProtocolRegistration
  {
    private const string Scheme = "pokesle-adb-screenshot";
    private const string RegistryPath = @"Software\Classes\pokesle-adb-screenshot";

    public static void Install()
    {
      var executablePath = Environment.ProcessPath
        ?? throw new InvalidOperationException("実行中のexeのパスを取得できませんでした。");
      using var protocolKey = Registry.CurrentUser.CreateSubKey(RegistryPath);
      protocolKey.SetValue(string.Empty, "URL:Pokesle ADB Screenshot Protocol");
      protocolKey.SetValue("URL Protocol", string.Empty);
      using var commandKey = protocolKey.CreateSubKey(@"shell\open\command");
      commandKey.SetValue(string.Empty, $"\"{executablePath}\" --protocol \"%1\"");
    }

    public static void Uninstall()
    {
      Registry.CurrentUser.DeleteSubKeyTree(RegistryPath, throwOnMissingSubKey: false);
    }

    public static void ValidateUri(string uriText)
    {
      if (!Uri.TryCreate(uriText, UriKind.Absolute, out var uri)
        || uri.Scheme != Scheme
        || uri.Host != "capture") {
        throw new ArgumentException("無効な起動URLです。");
      }
    }
  }
}
