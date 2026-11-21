var commandLog = Environment.GetEnvironmentVariable("POKESLE_TEST_ADB_LOG");
if (!string.IsNullOrEmpty(commandLog)) File.AppendAllText(commandLog, string.Join(" ", args) + Environment.NewLine);
if (File.Exists(Environment.GetEnvironmentVariable("POKESLE_TEST_ADB_ERROR"))) {
  Console.Error.WriteLine("device offline (test)");
  return 1;
}
if (args.SequenceEqual(new[] { "shell", "input", "swipe", "1", "4", "3", "4", "300" })) return 0;
if (!args.SequenceEqual(new[] { "exec-out", "screencap", "-p" })) return 2;
// テスト専用の幅4・高さ8のPNG。実端末には接続しない。
var png = Convert.FromBase64String("iVBORw0KGgoAAAANSUhEUgAAAAQAAAAICAIAAABRUclSAAAAD0lEQVR4nGP4jwQYaMcBAG4FX6GzdZeAAAAAAElFTkSuQmCC");
Console.OpenStandardOutput().Write(png);
return 0;
