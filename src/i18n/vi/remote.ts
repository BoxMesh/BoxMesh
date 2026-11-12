// Vietnamese for the remote screens. Keys are the English copy exactly as passed to t().
// The PickFirst `what` phrases follow 'Chọn một thiết bị để …', e.g. 'Chọn một thiết bị để mở terminal'.
const vi: Record<string, string> = {
  // src/pages/remote-terminal/TerminalPage.tsx
  'Remote Terminal': 'Terminal',
  "Run a command through the device's own tunnel. Every command is written to the audit log.":
    'Chạy lệnh qua tunnel riêng của thiết bị. Mọi lệnh đều được ghi vào nhật ký kiểm tra.',
  'open a terminal on': 'mở terminal',
  'Connected to {host} over the agent tunnel.': 'Đã kết nối tới {host} qua tunnel của agent.',
  'Try whoami, hostname, uptime, df, ipconfig, ls or get-service.':
    'Thử whoami, hostname, uptime, df, ipconfig, ls hoặc get-service.',
  Shell: 'Shell',

  // src/pages/remote-desktop/DesktopPage.tsx
  auto: 'tự động',
  high: 'cao',
  balanced: 'cân bằng',
  low: 'thấp',
  'Remote Desktop': 'Màn hình',
  "See and control a device's screen over its agent tunnel.": 'Xem và điều khiển màn hình thiết bị qua tunnel của agent.',
  'view the screen of': 'xem màn hình',
  '{host} is reachable. Connecting opens a screen session and records it in the audit log.':
    'Có thể kết nối tới {host}. Khi kết nối, một phiên màn hình sẽ được mở và ghi vào nhật ký kiểm tra.',
  'Connect to {host}': 'Kết nối tới {host}',
  Live: 'Trực tiếp',
  'started {when}': 'bắt đầu {when}',
  Quality: 'Chất lượng',
  'Clipboard sync': 'Đồng bộ clipboard',
  'Sending Ctrl+Alt+Del': 'Gửi Ctrl+Alt+Del',
  Screenshots: 'Chụp màn hình',
  Screenshot: 'Chụp màn hình',
  'Session ended': 'Đã kết thúc phiên',
  Disconnect: 'Ngắt kết nối',
  'Screen of {host}, {resolution}': 'Màn hình của {host}, {resolution}',
  'Demo mode has no video stream. A real session draws frames here.':
    'Chế độ demo không có luồng video. Phiên thật sẽ hiển thị hình ảnh tại đây.',
  '{quality} quality · clipboard on': 'Chất lượng {quality} · clipboard bật',
  '{quality} quality · clipboard off': 'Chất lượng {quality} · clipboard tắt',

  // src/pages/remote-services/ServicesPage.tsx
  Service: 'Dịch vụ',
  Port: 'Cổng',
  Status: 'Trạng thái',
  running: 'Đang chạy',
  stopped: 'Đã dừng',
  Address: 'Địa chỉ',
  Actions: 'Thao tác',
  'Address copied': 'Đã sao chép địa chỉ',
  'Copy failed. Select the address and copy it manually.': 'Không sao chép được. Hãy chọn địa chỉ và sao chép thủ công.',
  'Copy link': 'Sao chép liên kết',
  Open: 'Mở',
  'Remote Service': 'Dịch vụ',
  "Open web apps running on a device — Grafana, an internal dashboard — through the panel's proxy.":
    'Mở các ứng dụng web đang chạy trên thiết bị (Grafana, dashboard nội bộ…) qua proxy của panel.',
  'list the web apps on': 'liệt kê ứng dụng web',
  'Web apps on {host}': 'Ứng dụng web trên {host}',
  "The service list didn't load. {reason}": 'Không tải được danh sách dịch vụ. {reason}',
  'No web app is listening on {host}.': 'Không có ứng dụng web nào đang lắng nghe trên {host}.',

  // src/pages/remote-files/FilesPage.tsx
  'Remote Files': 'Tệp & Thư mục',
  'Copy files between two devices, each through its own agent tunnel.':
    'Sao chép tệp giữa hai thiết bị, mỗi thiết bị qua tunnel agent riêng.',
  'Browse, download and upload files on a device through its agent tunnel.':
    'Duyệt, tải xuống và tải lên tệp trên thiết bị qua tunnel của agent.',
  'Comparing folders': 'Đang so sánh thư mục',
  'Compare folders': 'So sánh thư mục',
  'Add a second device': 'Thêm thiết bị thứ hai',
  'browse files on': 'duyệt tệp',
  'Uploading files': 'Tải lên tệp',
  Upload: 'Tải lên',
  '{n} file': '{n} tệp',
  '{n} files': '{n} tệp',
  'the other device': 'thiết bị kia',
  'Sync {files} to {target}: copies newer and missing files, deletes nothing':
    'Đồng bộ {files} tới {target}: sao chép tệp mới hơn và tệp còn thiếu, không xóa gì',
  'Copy {files} to {target}': 'Sao chép {files} tới {target}',
  'Tick files, or drag them across, to copy them to {target}':
    'Đánh dấu tệp hoặc kéo sang để sao chép tới {target}',
  'Drop to copy {files} to {host} · {path}': 'Thả để sao chép {files} tới {host} · {path}',
  'copy files to': 'sao chép tệp tới',
  'Close the second device': 'Đóng thiết bị thứ hai',

  // src/pages/remote-files/FileBrowser.tsx
  'Newer here': 'Mới hơn ở đây',
  'Only here': 'Chỉ có ở đây',
  'Older here': 'Cũ hơn ở đây',
  Same: 'Giống nhau',
  'Different size': 'Khác kích thước',
  Name: 'Tên',
  Size: 'Kích thước',
  Modified: 'Ngày sửa',
  Compared: 'So sánh',
  'Downloading files': 'Tải xuống tệp',
  Download: 'Tải xuống',
  Rename: 'Đổi tên',
  'Copy path': 'Sao chép đường dẫn',
  Delete: 'Xóa',
  'Path copied': 'Đã sao chép đường dẫn',
  'Copy failed. Select the path and copy it manually.': 'Không sao chép được. Hãy chọn đường dẫn và sao chép thủ công.',
  'Deleting files': 'Xóa tệp',
  'Renaming files': 'Đổi tên tệp',
  'More actions for {name}': 'Thao tác khác cho {name}',
  Up: 'Lên',
  '{n} selected': 'Đã chọn {n}',
  Clear: 'Bỏ chọn',
  'Select {name}': 'Chọn {name}',
  "This folder didn't load. {reason}": 'Không tải được thư mục này. {reason}',
  'This folder is empty.': 'Thư mục này trống.',

  // src/pages/remote-files/Transfers.tsx
  Replace: 'Thay thế',
  'Keep both': 'Giữ cả hai',
  Skip: 'Bỏ qua',
  Transfers: 'Truyền tệp',
  'Clear finished': 'Xóa mục đã xong',
  'already exists on {host}.': 'đã tồn tại trên {host}.',
  'Both copies have the same size and time, so replacing it changes nothing.':
    'Hai bản có cùng kích thước và thời gian, nên thay thế cũng không thay đổi gì.',
  'The copy on {host} is newer ({when}, {size}) than the one there ({thereWhen}, {thereSize}).':
    'Bản trên {host} ({when}, {size}) mới hơn bản ở đích ({thereWhen}, {thereSize}).',
  'The copy on {host} is older ({when}, {size}) than the one there ({thereWhen}, {thereSize}).':
    'Bản trên {host} ({when}, {size}) cũ hơn bản ở đích ({thereWhen}, {thereSize}).',
  'The copy on {host} is the same ({when}, {size}) than the one there ({thereWhen}, {thereSize}).':
    'Bản trên {host} ({when}, {size}) giống bản ở đích ({thereWhen}, {thereSize}).',
  'The copy on {host} is the only one ({when}, {size}) than the one there ({thereWhen}, {thereSize}).':
    'Chỉ có bản trên {host} ({when}, {size}), không có bản ở đích ({thereWhen}, {thereSize}).',
  'The copy on {host} is a different size ({when}, {size}) than the one there ({thereWhen}, {thereSize}).':
    'Bản trên {host} ({when}, {size}) khác kích thước với bản ở đích ({thereWhen}, {thereSize}).',
  'Apply to all {n}': 'Áp dụng cho cả {n} mục',
  'Cancel copy': 'Hủy sao chép',
  Done: 'Xong',
  Skipped: 'Đã bỏ qua',
  Cancelled: 'Đã hủy',
  Failed: 'Thất bại',
  'Copy to {host}': 'Sao chép tới {host}',
  'Copying {files} to {host}': 'Đang sao chép {files} tới {host}',
  'Copied {files} to {host}': 'Đã sao chép {files} tới {host}',
  Cancel: 'Hủy',
  '{name} copied': 'Tiến độ sao chép {name}',
}

export default vi
