// Japanese for the remote area. Keys are the English copy exactly as passed to t().
// The PickFirst `what` phrases read as a relative clause before 「デバイス」, e.g. 「ターミナルを開くデバイスを選択」.
const ja: Record<string, string> = {
  // src/pages/remote-terminal/TerminalPage.tsx
  'Remote Terminal': 'リモートターミナル',
  "Run a command through the device's own tunnel. Every command is written to the audit log.":
    'デバイス専用のトンネル経由でコマンドを実行します。すべてのコマンドは監査ログに記録されます。',
  'open a terminal on': 'ターミナルを開く',
  'Connected to {host} over the agent tunnel.': 'エージェントのトンネル経由で {host} に接続しました。',
  'Try whoami, hostname, uptime, df, ipconfig, ls or get-service.':
    'whoami、hostname、uptime、df、ipconfig、ls、get-service などを試してください。',
  Shell: 'シェル',

  // src/pages/remote-desktop/DesktopPage.tsx
  auto: '自動',
  high: '高',
  balanced: 'バランス',
  low: '低',
  'Remote Desktop': 'リモートデスクトップ',
  "See and control a device's screen over its agent tunnel.": 'エージェントのトンネル経由でデバイスの画面を表示・操作します。',
  'view the screen of': '画面を表示する',
  '{host} is reachable. Connecting opens a screen session and records it in the audit log.':
    '{host} に接続できます。接続すると画面セッションが開始され、監査ログに記録されます。',
  'Connect to {host}': '{host} に接続',
  Live: 'ライブ',
  'started {when}': '{when}に開始',
  Quality: '画質',
  'Clipboard sync': 'クリップボード同期',
  'Sending Ctrl+Alt+Del': 'Ctrl+Alt+Del の送信',
  Screenshots: 'スクリーンショット',
  Screenshot: 'スクリーンショット',
  'Session ended': 'セッションを終了しました',
  Disconnect: '切断',
  'Screen of {host}, {resolution}': '{host} の画面、{resolution}',
  'Demo mode has no video stream. A real session draws frames here.':
    'デモモードには映像ストリームがありません。実際のセッションではここに画面が表示されます。',
  '{quality} quality · clipboard on': '画質: {quality} · クリップボード: オン',
  '{quality} quality · clipboard off': '画質: {quality} · クリップボード: オフ',

  // src/pages/remote-services/ServicesPage.tsx
  Service: 'サービス',
  Port: 'ポート',
  Status: '状態',
  running: '実行中',
  stopped: '停止',
  Address: 'アドレス',
  Actions: '操作',
  'Address copied': 'アドレスをコピーしました',
  'Copy failed. Select the address and copy it manually.': 'コピーできませんでした。アドレスを選択して手動でコピーしてください。',
  'Copy link': 'リンクをコピー',
  Open: '開く',
  'Remote Service': 'リモートサービス',
  "Open web apps running on a device — Grafana, an internal dashboard — through the panel's proxy.":
    'デバイス上で動作している Web アプリ (Grafana や社内ダッシュボードなど) を、パネルのプロキシ経由で開きます。',
  'list the web apps on': 'Web アプリを一覧表示する',
  'Web apps on {host}': '{host} の Web アプリ',
  "The service list didn't load. {reason}": 'サービス一覧を読み込めませんでした。{reason}',
  'No web app is listening on {host}.': '{host} で待ち受けている Web アプリはありません。',

  // src/pages/remote-files/FilesPage.tsx
  'Remote Files': 'リモートファイル',
  'Copy files between two devices, each through its own agent tunnel.':
    '2 台のデバイス間で、それぞれのエージェントのトンネル経由でファイルをコピーします。',
  'Browse, download and upload files on a device through its agent tunnel.':
    'エージェントのトンネル経由で、デバイス上のファイルの参照、ダウンロード、アップロードを行います。',
  'Comparing folders': 'フォルダーを比較中',
  'Compare folders': 'フォルダーを比較',
  'Add a second device': '2 台目のデバイスを追加',
  'browse files on': 'ファイルを参照する',
  'Uploading files': 'ファイルのアップロード',
  Upload: 'アップロード',
  '{n} file': '{n} 個のファイル',
  '{n} files': '{n} 個のファイル',
  'the other device': 'もう一方のデバイス',
  'Sync {files} to {target}: copies newer and missing files, deletes nothing':
    '{files}を {target} に同期: 新しいファイルと不足しているファイルをコピーし、削除は行いません',
  'Copy {files} to {target}': '{files}を {target} にコピー',
  'Tick files, or drag them across, to copy them to {target}':
    'ファイルにチェックを入れるかドラッグすると、{target} にコピーできます',
  'Drop to copy {files} to {host} · {path}': 'ドロップすると{files}を {host} · {path} にコピーします',
  'copy files to': 'ファイルのコピー先となる',
  'Close the second device': '2 台目のデバイスを閉じる',

  // src/pages/remote-files/FileBrowser.tsx
  'Newer here': 'こちらが新しい',
  'Only here': 'こちらのみ',
  'Older here': 'こちらが古い',
  Same: '同一',
  'Different size': 'サイズが異なる',
  Name: '名前',
  Size: 'サイズ',
  Modified: '更新日時',
  Compared: '比較結果',
  'Downloading files': 'ファイルのダウンロード',
  Download: 'ダウンロード',
  Rename: '名前を変更',
  'Copy path': 'パスをコピー',
  Delete: '削除',
  'Path copied': 'パスをコピーしました',
  'Copy failed. Select the path and copy it manually.': 'コピーできませんでした。パスを選択して手動でコピーしてください。',
  'Deleting files': 'ファイルの削除',
  'Renaming files': 'ファイル名の変更',
  'More actions for {name}': '{name} のその他の操作',
  Up: '上へ',
  '{n} selected': '{n} 件選択中',
  Clear: '解除',
  'Select {name}': '{name} を選択',
  "This folder didn't load. {reason}": 'このフォルダーを読み込めませんでした。{reason}',
  'This folder is empty.': 'このフォルダーは空です。',

  // src/pages/remote-files/Transfers.tsx
  Replace: '置き換え',
  'Keep both': '両方残す',
  Skip: 'スキップ',
  Transfers: '転送',
  'Clear finished': '完了分を消去',
  'already exists on {host}.': 'は {host} に既に存在します。',
  'Both copies have the same size and time, so replacing it changes nothing.':
    '両方のサイズと日時が同じため、置き換えても変化はありません。',
  'The copy on {host} is newer ({when}, {size}) than the one there ({thereWhen}, {thereSize}).':
    '{host} のファイル ({when}、{size}) は、コピー先のファイル ({thereWhen}、{thereSize}) より新しいです。',
  'The copy on {host} is older ({when}, {size}) than the one there ({thereWhen}, {thereSize}).':
    '{host} のファイル ({when}、{size}) は、コピー先のファイル ({thereWhen}、{thereSize}) より古いです。',
  'The copy on {host} is the same ({when}, {size}) than the one there ({thereWhen}, {thereSize}).':
    '{host} のファイル ({when}、{size}) は、コピー先のファイル ({thereWhen}、{thereSize}) と同じです。',
  'The copy on {host} is the only one ({when}, {size}) than the one there ({thereWhen}, {thereSize}).':
    '{host} のファイル ({when}、{size}) のみが存在し、コピー先のファイル ({thereWhen}、{thereSize}) はありません。',
  'The copy on {host} is a different size ({when}, {size}) than the one there ({thereWhen}, {thereSize}).':
    '{host} のファイル ({when}、{size}) は、コピー先のファイル ({thereWhen}、{thereSize}) とサイズが異なります。',
  'Apply to all {n}': '{n} 件すべてに適用',
  'Cancel copy': 'コピーをキャンセル',
  Done: '完了',
  Skipped: 'スキップ済み',
  Cancelled: 'キャンセル済み',
  Failed: '失敗',
  'Copy to {host}': '{host} へのコピー',
  'Copying {files} to {host}': '{files}を {host} にコピー中',
  'Copied {files} to {host}': '{files}を {host} にコピーしました',
  Cancel: 'キャンセル',
  '{name} copied': '{name} のコピー進捗',
}

export default ja
