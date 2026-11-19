// Japanese for shared copy: layout, nav, shared components, hooks, utils, sign-in, users and tokens.
// Keys are the English copy exactly as passed to t().
const ja: Record<string, string> = {
  // src/utils/time.ts
  'just now': 'たった今',
  '{n} s ago': '{n} 秒前',
  '{n} min ago': '{n} 分前',
  '{n} h ago': '{n} 時間前',
  '1 day ago': '1 日前',
  '{n} days ago': '{n} 日前',

  // src/hooks/useNotSupported.ts
  "{action} isn't available yet.": '{action}はまだ利用できません。',

  // src/hooks/useThemeMode.ts
  'Switch to light theme': 'ライトテーマに切り替え',
  'Switch to dark theme': 'ダークテーマに切り替え',

  // src/App.tsx
  'Page not found': 'ページが見つかりません',
  'Check the address, or pick a page from the menu.': 'アドレスを確認するか、メニューからページを選んでください。',

  // src/config/nav.ts
  Overview: '概要',
  Dashboard: 'ダッシュボード',
  Device: 'デバイス',
  Devices: 'デバイス',
  Groups: 'グループ',
  Remote: 'リモート',
  'Remote Terminal': 'リモートターミナル',
  'Remote Files': 'リモートファイル',
  'Remote Service': 'リモートサービス',
  Alert: 'アラート',
  Alerts: 'アラート',
  Rules: 'ルール',
  Channels: 'チャンネル',
  System: 'システム',
  'Users & Access': 'ユーザーとアクセス',
  'Enrollment tokens': '登録トークン',

  // src/layouts/AppLayout.tsx
  'Sign out': 'サインアウト',
  'Search hostname, IP…': 'ホスト名、IP で検索…',
  'Search devices': 'デバイスを検索',
  'Account: {email}': 'アカウント: {email}',

  // src/services/http.ts
  'That took too long. Try again.': '時間がかかりすぎました。もう一度お試しください。',
  "Can't reach the server. Check your connection, then try again.":
    'サーバーに接続できません。接続を確認してから、もう一度お試しください。',
  'Your session has ended. Sign in again.': 'セッションが終了しました。もう一度サインインしてください。',
  "You don't have permission to do this.": 'この操作を行う権限がありません。',
  'That is no longer available.': 'この項目はもう利用できません。',
  'Too many requests at once. Wait a moment, then try again.':
    'リクエストが集中しています。しばらく待ってから、もう一度お試しください。',
  'Try again in a moment.': 'しばらくしてからもう一度お試しください。',
  'The request could not be completed.': 'リクエストを完了できませんでした。',
  'Something went wrong. Try again.': '問題が発生しました。もう一度お試しください。',

  // src/services/authService.ts
  'Wrong email or password.': 'メールアドレスまたはパスワードが正しくありません。',
  'Sign-in failed. {reason}': 'サインインに失敗しました。{reason}',
  "Couldn't send the reset email. {reason}": 'リセット用のメールを送信できませんでした。{reason}',

  // src/utils/devices.ts
  'Heartbeat lost': 'ハートビート途絶',
  'High CPU': 'CPU 高負荷',
  'High RAM': 'RAM 高負荷',
  'Disk almost full': 'ディスク残量わずか',
  'Outdated agent': '古いエージェント',

  // src/components/AgentVersion.tsx
  'A newer agent has been released': '新しいエージェントがリリースされています',
  '{version}, update available': '{version}、アップデートあり',

  // src/components/DeviceGroups.tsx
  'Change groups': 'グループを変更',
  'Change groups for {host}': '{host} のグループを変更',
  'Add {host} to a group': '{host} をグループに追加',
  'Add to group': 'グループに追加',
  'Groups for {host}': '{host} のグループ',
  'Pick one or more groups': 'グループを 1 つ以上選択',
  'No groups yet. Create one on the Groups page.': 'グループはまだありません。グループページで作成してください。',

  // src/components/DevicePicker.tsx
  'Pick a device': 'デバイスを選択',
  Online: 'オンライン',
  Offline: 'オフライン',
  'Pick a device to {what}': '{what}デバイスを選択してください',
  'Choose one from the list above, or open a device and use its tab.':
    '上のリストから選ぶか、デバイスを開いてそのタブを使ってください。',
  '{host} is offline': '{host} はオフラインです',
  "Its agent has no open tunnel, so remote actions can't reach it. This screen works again when the agent reconnects.":
    'エージェントのトンネルが開いていないため、リモート操作が届きません。エージェントが再接続すると、この画面は再び使えます。',

  // src/components/ErrorBoundary.tsx
  "This page couldn't load": 'このページを読み込めませんでした',
  'Try again': '再試行',
  'Reconnecting to the server…': 'サーバーに再接続しています…',

  // src/components/LanguageSelect.tsx
  Language: '言語',

  // src/components/ScopeFields.tsx
  'Applies to': '適用先',
  'All devices': 'すべてのデバイス',
  'Pick at least one group.': 'グループを 1 つ以上選択してください。',
  'Pick groups': 'グループを選択',
  'Pick at least one device.': 'デバイスを 1 つ以上選択してください。',
  'Pick devices': 'デバイスを選択',

  // src/components/StatusButton.tsx
  '{host} answered in {ms} ms': '{host} が {ms} ms で応答しました',
  '{host} did not answer': '{host} から応答がありません',
  'Waiting for {host} to report in': '{host} からの報告を待っています',
  'Ping {host}': '{host} に Ping',
  '{state} — ping {host}': '{state} — {host} に Ping',

  // src/pages/login/LoginPage.tsx
  'Reset password': 'パスワードのリセット',
  'Sign in': 'サインイン',
  'Enter your email and we’ll send you a link to reset your password.':
    'メールアドレスを入力すると、パスワードをリセットするリンクをお送りします。',
  'Manage all your devices in one place.': 'すべてのデバイスを一か所で管理します。',
  'Check your inbox': '受信トレイを確認してください',
  'If an account exists for {email}, a reset link is on its way.':
    '{email} のアカウントが存在する場合、リセット用のリンクを送信しました。',
  Email: 'メールアドレス',
  'Enter your email.': 'メールアドレスを入力してください。',
  'Enter a valid email.': '有効なメールアドレスを入力してください。',
  Password: 'パスワード',
  'Forgot password?': 'パスワードをお忘れですか？',
  'Enter your password.': 'パスワードを入力してください。',
  'Sending…': '送信中…',
  'Send again': '再送信',
  'Send reset link': 'リセットリンクを送信',
  'Signing in…': 'サインイン中…',
  'Back to sign in': 'サインインに戻る',
  or: 'または',
  'Explore the demo': 'デモを試す',

  // src/pages/tokens/TokensPage.tsx
  'Token …{tail} revoked': 'トークン …{tail} を失効しました',
  Token: 'トークン',
  Status: '状態',
  Active: '有効',
  Expired: '期限切れ',
  Expires: '有効期限',
  'Used by': '使用中',
  Actions: '操作',
  'Revoke token …{tail}?': 'トークン …{tail} を失効しますか？',
  'Agents can no longer enroll with it. Devices already enrolled keep working.':
    'このトークンではエージェントを登録できなくなります。登録済みのデバイスは引き続き動作します。',
  Revoke: '失効',
  'Revoke token …{tail}': 'トークン …{tail} を失効',
  'A token lets a new BoxAgent enroll. Copy it from here whenever you need it.': 'トークンを使うと新しい BoxAgent を登録できます。必要なときにここからコピーできます。',
  'Create token': 'トークンを作成',
  'No tokens yet. Create one to enroll an agent.': 'トークンはまだありません。作成してエージェントを登録してください。',

  // src/pages/users/Access.tsx
  'Search groups': 'グループを検索',
  'Add the checked groups': 'チェックしたグループを追加',
  'Remove the checked groups': 'チェックしたグループを外す',
  group: 'グループ',
  groups: 'グループ',
  'Add the checked devices': 'チェックしたデバイスを追加',
  'Remove the checked devices': 'チェックしたデバイスを外す',
  device: 'デバイス',
  devices: 'デバイス',
  '{n} device': '{n} 台のデバイス',
  '{n} devices': '{n} 台のデバイス',
  'Groups ({n})': 'グループ ({n})',
  'Single devices ({n})': '個別のデバイス ({n})',
  Available: '選択可能',
  Chosen: '選択済み',
  None: 'なし',
  'Reaches 1 device in all, groups and single devices together. New devices added to a group are included.':
    'グループと個別のデバイスを合わせて、計 1 台のデバイスにアクセスできます。グループに追加された新しいデバイスも含まれます。',
  'Reaches {n} devices in all, groups and single devices together. New devices added to a group are included.':
    'グループと個別のデバイスを合わせて、計 {n} 台のデバイスにアクセスできます。グループに追加された新しいデバイスも含まれます。',
  'Reaches no device yet.': 'まだアクセスできるデバイスはありません。',
  'All groups': 'すべてのグループ',

  // src/pages/users/UserPage.tsx
  'Changes saved': '変更を保存しました',
  '{name} no longer has an account': '{name} のアカウントを削除しました',
  'User not found': 'ユーザーが見つかりません',
  "This account doesn't exist, or it was deleted.": 'このアカウントは存在しないか、削除されています。',
  'Back to Users & Access': 'ユーザーとアクセスに戻る',
  'the System account': 'システムアカウント',
  'your own account': '自分のアカウント',
  'Reached through': 'アクセス経路',
  'System role': 'システムロール',
  'Single device': '個別のデバイス',
  Group: 'グループ',
  Disabled: '無効',
  "You can't delete {locked}.": '{locked}は削除できません。',
  'Delete {name}?': '{name} を削除しますか？',
  "They lose access at once. This can't be undone.": 'すぐにアクセスできなくなります。この操作は元に戻せません。',
  Delete: '削除',
  'Delete user': 'ユーザーを削除',
  Account: 'アカウント',
  Role: 'ロール',
  'Last sign-in': '最終サインイン',
  Never: 'なし',
  All: 'すべて',
  'Can sign in': 'サインインを許可',
  "You can't turn off {locked}.": '{locked}は無効にできません。',
  '{email} can sign in': '{email} のサインインを許可',
  'What they can reach': 'アクセスできる範囲',
  'A System account reaches every device.': 'システムアカウントはすべてのデバイスにアクセスできます。',
  'Discard changes': '変更を破棄',
  'Save changes': '変更を保存',
  'Devices they reach ({n})': 'アクセスできるデバイス ({n})',
  'No device yet. Add groups or single devices above.': 'デバイスはまだありません。上でグループまたは個別のデバイスを追加してください。',

  // src/pages/users/UsersPage.tsx
  'Account created for {email}': '{email} のアカウントを作成しました',
  Name: '名前',
  'Open {name}': '{name} を開く',
  'Who can sign in, what they may do, and which devices each User can reach.':
    'サインインできる人、できる操作、各ユーザーがアクセスできるデバイスを管理します。',
  'Create user': 'ユーザーを作成',
  'Create a user': 'ユーザーを作成',
  Cancel: 'キャンセル',
  'Enter their name.': '名前を入力してください。',
  'Enter a password.': 'パスワードを入力してください。',
  'Profile': 'プロフィール',
  'Your email and role are set by the System account.': 'メールアドレスとロールはシステムアカウントが設定します。',
  'Leave these empty to keep your current password.': 'パスワードを変更しない場合は空のままにしてください。',
  'They join as a User with no devices. Grant access on their page afterwards.': 'ユーザーとして追加され、デバイスはありません。アクセスは後でユーザーのページで付与します。',
  'You set it and share it with them; no email is sent. At least {min} characters.': 'パスワードはシステムアカウントが設定して本人に伝えます。メールは送信されません。{min}文字以上。',
  'My account': 'マイアカウント',
  'Enter your name.': '名前を入力してください。',
  'Current password': '現在のパスワード',
  'New password': '新しいパスワード',
  'Confirm new password': '新しいパスワード（確認）',
  'Enter your current password.': '現在のパスワードを入力してください。',
  'The current password is wrong.': '現在のパスワードが正しくありません。',
  'The passwords do not match.': 'パスワードが一致しません。',
  'Your account was updated.': 'アカウントを更新しました。',
  'The password needs at least {min} characters.': 'パスワードは{min}文字以上にしてください。',
  'Keep the name to {max} characters or fewer.': '名前は{max}文字以内にしてください。',
  'An account with this email already exists.': 'このメールアドレスのアカウントは既にあります。',
  'Enter their email.': 'メールアドレスを入力してください。',
}

export default ja
