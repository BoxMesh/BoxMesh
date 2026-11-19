// Vietnamese for shared copy: layout, nav, shared components, hooks, utils, sign-in, users and tokens. Keys are the English copy exactly as passed to t().
const vi: Record<string, string> = {
  // src/utils/time.ts
  'just now': 'vừa xong',
  '{n} s ago': '{n} giây trước',
  '{n} min ago': '{n} phút trước',
  '{n} h ago': '{n} giờ trước',
  '1 day ago': '1 ngày trước',
  '{n} days ago': '{n} ngày trước',

  // src/hooks/useNotSupported.ts
  "{action} isn't available yet.": '{action} hiện chưa khả dụng.',

  // src/hooks/useThemeMode.ts
  'Switch to light theme': 'Chuyển sang giao diện sáng',
  'Switch to dark theme': 'Chuyển sang giao diện tối',

  // src/App.tsx
  'Page not found': 'Không tìm thấy trang',
  'Check the address, or pick a page from the menu.': 'Kiểm tra lại địa chỉ hoặc chọn một trang từ menu.',

  // src/config/nav.ts
  Overview: 'Tổng quan',
  Dashboard: 'Bảng điều khiển',
  Device: 'Thiết bị',
  Devices: 'Thiết bị',
  Groups: 'Nhóm',
  Remote: 'Điều khiển',
  'Remote Terminal': 'Terminal',
  'Remote Files': 'Tệp & Thư mục',
  'Remote Service': 'Dịch vụ',
  Alert: 'Cảnh báo',
  Alerts: 'Cảnh báo',
  Rules: 'Quy tắc',
  Channels: 'Kênh',
  System: 'Hệ thống',
  'Users & Access': 'Người dùng & quyền',
  'Enrollment tokens': 'Token đăng ký',

  // src/layouts/AppLayout.tsx
  'Sign out': 'Đăng xuất',
  'Search hostname, IP…': 'Tìm theo tên máy, IP…',
  'Search devices': 'Tìm kiếm thiết bị',
  'Account: {email}': 'Tài khoản: {email}',

  // src/services/http.ts
  'That took too long. Try again.': 'Yêu cầu mất quá nhiều thời gian. Hãy thử lại.',
  "Can't reach the server. Check your connection, then try again.":
    'Không kết nối được máy chủ. Hãy kiểm tra kết nối rồi thử lại.',
  'Your session has ended. Sign in again.': 'Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại.',
  "You don't have permission to do this.": 'Bạn không có quyền thực hiện thao tác này.',
  'That is no longer available.': 'Mục này không còn tồn tại.',
  'Too many requests at once. Wait a moment, then try again.':
    'Có quá nhiều yêu cầu cùng lúc. Hãy chờ một chút rồi thử lại.',
  'Try again in a moment.': 'Hãy thử lại sau giây lát.',
  'The request could not be completed.': 'Không thể hoàn tất yêu cầu.',
  'Something went wrong. Try again.': 'Đã xảy ra lỗi. Hãy thử lại.',

  // src/services/authService.ts
  'Wrong email or password.': 'Email hoặc mật khẩu không đúng.',
  'Sign-in failed. {reason}': 'Đăng nhập thất bại. {reason}',
  "Couldn't send the reset email. {reason}": 'Không gửi được email đặt lại mật khẩu. {reason}',

  // src/utils/devices.ts
  'Heartbeat lost': 'Mất heartbeat',
  'High CPU': 'CPU cao',
  'High RAM': 'RAM cao',
  'Disk almost full': 'Ổ đĩa sắp đầy',
  'Outdated agent': 'Agent cũ',

  // src/components/AgentVersion.tsx
  'A newer agent has been released': 'Đã có phiên bản agent mới hơn',
  '{version}, update available': '{version}, có bản cập nhật',

  // src/components/DeviceGroups.tsx
  'Change groups': 'Đổi nhóm',
  'Change groups for {host}': 'Đổi nhóm cho {host}',
  'Add {host} to a group': 'Thêm {host} vào nhóm',
  'Add to group': 'Thêm vào nhóm',
  'Groups for {host}': 'Nhóm của {host}',
  'Pick one or more groups': 'Chọn một hoặc nhiều nhóm',
  'No groups yet. Create one on the Groups page.': 'Chưa có nhóm nào. Hãy tạo nhóm ở trang Nhóm.',

  // src/components/DevicePicker.tsx
  'Pick a device': 'Chọn thiết bị',
  Online: 'Trực tuyến',
  Offline: 'Ngoại tuyến',
  'Pick a device to {what}': 'Chọn một thiết bị để {what}',
  'Choose one from the list above, or open a device and use its tab.':
    'Chọn một thiết bị trong danh sách trên, hoặc mở trang thiết bị và dùng tab tương ứng.',
  '{host} is offline': '{host} đang ngoại tuyến',
  "Its agent has no open tunnel, so remote actions can't reach it. This screen works again when the agent reconnects.":
    'Agent của thiết bị không có kết nối (tunnel) nào đang mở nên các thao tác từ xa không tới được. Màn hình này sẽ hoạt động lại khi agent kết nối lại.',

  // src/components/ErrorBoundary.tsx
  "This page couldn't load": 'Không tải được trang này',
  'Try again': 'Thử lại',
  'Reconnecting to the server…': 'Đang kết nối lại với máy chủ…',

  // src/components/LanguageSelect.tsx
  Language: 'Ngôn ngữ',

  // src/components/ScopeFields.tsx
  'Applies to': 'Áp dụng cho',
  'All devices': 'Tất cả thiết bị',
  'Pick at least one group.': 'Chọn ít nhất một nhóm.',
  'Pick groups': 'Chọn nhóm',
  'Pick at least one device.': 'Chọn ít nhất một thiết bị.',
  'Pick devices': 'Chọn thiết bị',

  // src/components/StatusButton.tsx
  '{host} answered in {ms} ms': '{host} phản hồi sau {ms} ms',
  '{host} did not answer': '{host} không phản hồi',
  'Waiting for {host} to report in': 'Đang chờ {host} gửi báo cáo',
  'Ping {host}': 'Ping {host}',
  '{state} — ping {host}': '{state} — ping {host}',

  // src/pages/login/LoginPage.tsx
  'Reset password': 'Đặt lại mật khẩu',
  'Sign in': 'Đăng nhập',
  'Enter your email and we’ll send you a link to reset your password.':
    'Nhập email, chúng tôi sẽ gửi liên kết để đặt lại mật khẩu.',
  'Manage all your devices in one place.': 'Quản lý mọi thiết bị tại một nơi.',
  'Check your inbox': 'Kiểm tra hộp thư đến',
  'If an account exists for {email}, a reset link is on its way.':
    'Nếu {email} có tài khoản, liên kết đặt lại mật khẩu đang được gửi tới.',
  Email: 'Email',
  'Enter your email.': 'Nhập email.',
  'Enter a valid email.': 'Nhập email hợp lệ.',
  Password: 'Mật khẩu',
  'Forgot password?': 'Quên mật khẩu?',
  'Enter your password.': 'Nhập mật khẩu.',
  'Sending…': 'Đang gửi…',
  'Send again': 'Gửi lại',
  'Send reset link': 'Gửi liên kết đặt lại',
  'Signing in…': 'Đang đăng nhập…',
  'Back to sign in': 'Quay lại đăng nhập',
  or: 'hoặc',
  'Explore the demo': 'Dùng thử bản demo',

  // src/pages/tokens/TokensPage.tsx
  'Token …{tail} revoked': 'Đã thu hồi token …{tail}',
  Token: 'Token',
  Status: 'Trạng thái',
  Active: 'Còn hiệu lực',
  Expired: 'Đã hết hạn',
  Expires: 'Ngày hết hạn',
  'Used by': 'Đang dùng',
  Actions: 'Thao tác',
  'Revoke token …{tail}?': 'Thu hồi token …{tail}?',
  'Agents can no longer enroll with it. Devices already enrolled keep working.':
    'Agent sẽ không thể dùng token này để đăng ký nữa. Các thiết bị đã đăng ký vẫn hoạt động bình thường.',
  Revoke: 'Thu hồi',
  'Revoke token …{tail}': 'Thu hồi token …{tail}',
  'A token lets a new BoxAgent enroll. Copy it from here whenever you need it.': 'Token cho phép một BoxAgent mới đăng ký. Cần lúc nào thì sao chép ở đây.',
  'Create token': 'Tạo token',
  'No tokens yet. Create one to enroll an agent.': 'Chưa có token nào. Hãy tạo một token để đăng ký agent.',

  // src/pages/users/Access.tsx
  'Search groups': 'Tìm kiếm nhóm',
  'Add the checked groups': 'Thêm các nhóm đã chọn',
  'Remove the checked groups': 'Bỏ các nhóm đã chọn',
  group: 'nhóm',
  groups: 'nhóm',
  'Add the checked devices': 'Thêm các thiết bị đã chọn',
  'Remove the checked devices': 'Bỏ các thiết bị đã chọn',
  device: 'thiết bị',
  devices: 'thiết bị',
  '{n} device': '{n} thiết bị',
  '{n} devices': '{n} thiết bị',
  'Groups ({n})': 'Nhóm ({n})',
  'Single devices ({n})': 'Thiết bị riêng lẻ ({n})',
  Available: 'Có thể chọn',
  Chosen: 'Đã chọn',
  None: 'Không có',
  'Reaches 1 device in all, groups and single devices together. New devices added to a group are included.':
    'Truy cập được tổng cộng 1 thiết bị, tính cả nhóm và thiết bị riêng lẻ. Thiết bị mới được thêm vào nhóm cũng được tính.',
  'Reaches {n} devices in all, groups and single devices together. New devices added to a group are included.':
    'Truy cập được tổng cộng {n} thiết bị, tính cả nhóm và thiết bị riêng lẻ. Thiết bị mới được thêm vào nhóm cũng được tính.',
  'Reaches no device yet.': 'Chưa truy cập được thiết bị nào.',
  'All groups': 'Tất cả nhóm',

  // src/pages/users/UserPage.tsx
  'Changes saved': 'Đã lưu thay đổi',
  '{name} no longer has an account': 'Đã xóa tài khoản của {name}',
  'User not found': 'Không tìm thấy người dùng',
  "This account doesn't exist, or it was deleted.": 'Tài khoản này không tồn tại hoặc đã bị xóa.',
  'Back to Users & Access': 'Quay lại Người dùng & quyền truy cập',
  'the System account': 'tài khoản Hệ thống',
  'your own account': 'tài khoản của chính bạn',
  'Reached through': 'Truy cập qua',
  'System role': 'Vai trò Hệ thống',
  'Single device': 'Thiết bị riêng lẻ',
  Group: 'Nhóm',
  Disabled: 'Đã tắt',
  "You can't delete {locked}.": 'Không thể xóa {locked}.',
  'Delete {name}?': 'Xóa {name}?',
  "They lose access at once. This can't be undone.": 'Người này sẽ mất quyền truy cập ngay lập tức. Không thể hoàn tác.',
  Delete: 'Xóa',
  'Delete user': 'Xóa người dùng',
  Account: 'Tài khoản',
  Role: 'Vai trò',
  'Last sign-in': 'Đăng nhập gần nhất',
  Never: 'Chưa bao giờ',
  All: 'Tất cả',
  'Can sign in': 'Được đăng nhập',
  "You can't turn off {locked}.": 'Không thể tắt {locked}.',
  '{email} can sign in': '{email} được đăng nhập',
  'What they can reach': 'Phạm vi truy cập',
  'A System account reaches every device.': 'Tài khoản Hệ thống truy cập được mọi thiết bị.',
  'Discard changes': 'Bỏ thay đổi',
  'Save changes': 'Lưu thay đổi',
  'Devices they reach ({n})': 'Thiết bị truy cập được ({n})',
  'No device yet. Add groups or single devices above.': 'Chưa có thiết bị nào. Hãy thêm nhóm hoặc thiết bị riêng lẻ ở trên.',

  // src/pages/users/UsersPage.tsx
  'Account created for {email}': 'Đã tạo tài khoản cho {email}',
  Name: 'Tên',
  'Open {name}': 'Mở {name}',
  'Who can sign in, what they may do, and which devices each User can reach.':
    'Ai được đăng nhập, được làm gì và mỗi Người dùng truy cập được những thiết bị nào.',
  'Create user': 'Tạo người dùng',
  'Create a user': 'Tạo người dùng',
  Cancel: 'Hủy',
  'Enter their name.': 'Nhập tên của họ.',
  'Enter a password.': 'Nhập mật khẩu.',
  'Profile': 'Hồ sơ',
  'Your email and role are set by the System account.': 'Email và vai trò do tài khoản Hệ thống đặt.',
  'Leave these empty to keep your current password.': 'Để trống nếu không muốn đổi mật khẩu.',
  'They join as a User with no devices. Grant access on their page afterwards.': 'Tài khoản mới là Người dùng và chưa có thiết bị nào. Cấp quyền ở trang của họ sau.',
  'You set it and share it with them; no email is sent. At least {min} characters.': 'Bạn đặt mật khẩu và tự gửi cho họ; hệ thống không gửi email. Tối thiểu {min} ký tự.',
  'My account': 'Tài khoản của tôi',
  'Enter your name.': 'Nhập tên của bạn.',
  'Current password': 'Mật khẩu hiện tại',
  'New password': 'Mật khẩu mới',
  'Confirm new password': 'Nhập lại mật khẩu mới',
  'Enter your current password.': 'Nhập mật khẩu hiện tại.',
  'The current password is wrong.': 'Mật khẩu hiện tại không đúng.',
  'The passwords do not match.': 'Hai mật khẩu không khớp.',
  'Your account was updated.': 'Đã cập nhật tài khoản của bạn.',
  'The password needs at least {min} characters.': 'Mật khẩu cần ít nhất {min} ký tự.',
  'Keep the name to {max} characters or fewer.': 'Tên tối đa {max} ký tự.',
  'An account with this email already exists.': 'Đã có tài khoản dùng email này.',
  'Enter their email.': 'Nhập email của người này.',
}

export default vi
