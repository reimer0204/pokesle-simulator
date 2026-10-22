using System.Diagnostics;
using System.Drawing;
using Microsoft.Win32;
using System.Text.Json;
using System.Windows.Forms;

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
      if (options.ProtocolUri is not null) ProtocolRegistration.ValidateUri(options.ProtocolUri);

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
    bool ShowHelp
  )
  {
    public const string HelpText = """
      使い方: AdbScreenshotClipboard.exe [--serial <端末ID>] [--adb <adb.exeのパス>]
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
      for (var index = 0; index < args.Length; index++) {
        switch (args[index]) {
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
      return new Options(serial, adbPath, protocolUri, installProtocol, uninstallProtocol, false);
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
