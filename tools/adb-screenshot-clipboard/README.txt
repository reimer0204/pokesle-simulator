ADB スクリーンショットをクリップボードへコピー

このツールは、USB 接続した Android 端末からスクリーンショットを取得し、
Windows のクリップボードへ画像としてコピーします。画像ファイルは保存しません。

■ 初めて使う前の準備

1. Android SDK Platform-Tools を、次のページからダウンロードして展開します。
   https://developer.android.com/tools/releases/platform-tools?hl=ja

2. Android 端末で開発者向けオプションを有効にして、USB デバッグを有効にします。

3. 端末を USB 接続します。端末に「USB デバッグを許可しますか」と表示されたら、
   許可してください。

4. このフォルダにある AdbScreenshotClipboard.json をメモ帳などで開きます。
   adbPath に、手順 1 で展開したフォルダ内の adb.exe の絶対パスを設定してください。

   設定例:
   {
     "adbPath": "C:\\Android\\platform-tools\\adb.exe",
     "serial": ""
   }

   複数の端末を接続する場合は、serial に対象端末の ID を設定してください。
   端末 ID は、コマンドプロンプトまたは PowerShell で「adb devices」を実行して確認できます。

■ ブラウザから起動する準備

Chrome または Edge の「スマホ画面から読取」ボタンから起動するには、
このフォルダで PowerShell を開き、次のコマンドを 1 回実行してください。

  .\AdbScreenshotClipboard.exe --install-protocol

これにより、現在の Windows ユーザーにブラウザ起動用の設定が追加されます。
管理者権限は不要です。exe を別の場所へ移動した場合は、もう一度このコマンドを
実行してください。

設定を解除するには、次のコマンドを実行してください。

  .\AdbScreenshotClipboard.exe --uninstall-protocol

ブラウザで外部アプリの起動またはクリップボード読み取りの確認が表示された場合は、
許可してください。食材バッグ画面の「その他設定」で
「食材数をスマホから読み取るボタンを表示」を有効にすると、スマホ読取ボタンを表示できます。

■ 直接実行する場合

端末が 1 台だけ接続されていれば、AdbScreenshotClipboard.exe を直接実行するだけで、
スクリーンショットをクリップボードへコピーできます。

■ 免責事項

本ツールは無保証で提供されます。本ツールの利用、利用不能、端末・PC・データ・
アカウントへの影響、または第三者との紛争その他いかなる損害についても、作者は
一切の責任を負いません。利用者自身の責任で使用してください。
