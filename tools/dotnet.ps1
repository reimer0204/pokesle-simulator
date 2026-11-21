# Git管理外に配置した開発用.NET SDKを使う。SDKの自動取得は行わない。
$dotnetPath = Join-Path $PSScriptRoot '../.local-tools/dotnet/dotnet.exe'
if (-not (Test-Path -LiteralPath $dotnetPath)) {
  throw '.NET SDKがありません。.local-tools/dotnet/にSDKを配置してください。'
}
& $dotnetPath @args
exit $LASTEXITCODE
