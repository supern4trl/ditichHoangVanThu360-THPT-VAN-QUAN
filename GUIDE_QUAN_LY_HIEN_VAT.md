# HƯỚNG DẪN XÂY DỰNG BẢO TÀNG ẢO 360 (DÀNH CHO HỌC SINH)

Tài liệu này giúp bạn tự xây dựng một bảo tàng ảo chuyên nghiệp từ con số 0, ngay cả khi bạn chưa biết nhiều về lập trình.

---

## 💻 PHẦN I: CHUẨN BỊ MÔI TRƯỜNG LÀM VIỆC
Trước khi bắt đầu, hãy cài đặt các công cụ sau đây vào máy tính của bạn:

### 1. Cài đặt VS Code (Trình soạn thảo mã nguồn)
*   Tải tại: [code.visualstudio.com](https://code.visualstudio.com/)
*   **Cách cài:** Tải về, mở lên và nhấn Next cho đến khi hoàn tất.

### 2. Cài đặt Node.js (Bộ máy chạy lệnh đồng bộ)
*   Tải bản **LTS** tại: [nodejs.org](https://nodejs.org/en)
*   **Cách cài:** Tải file `.msi`, chạy và nhấn Next liên tục. (Lưu ý: Sau khi cài xong, hãy khởi động lại máy tính).

### 3. Cài đặt các Tiện ích mở rộng (Extensions) trong VS Code
Mở VS Code, nhấn vào biểu tượng **Extensions** (hình 4 ô vuông ở cột trái) và tìm cài 3 món sau:
1.  **Live Server**: Dùng để xem trang web chạy trực tiếp (Nhấn nút "Go Live" ở góc dưới bên phải).
2.  **Edit CSV**: Giúp bạn sửa file `items.csv` như đang dùng Excel ngay trong VS Code.
3.  **Rainbow CSV**: Giúp các cột dữ liệu trong file CSV hiện màu sắc khác nhau, cực kỳ dễ nhìn.

---

## 🏗️ PHẦN II: CẤU TRÚC HỆ THỐNG QUẢN LÝ
Dự án sử dụng cơ chế **"Data-Driven"** (Lấy dữ liệu làm trung tâm):
1.  **Nguồn dữ liệu gốc**: File `items.csv` (Nơi bạn nhập tên, mô tả hiện vật).
2.  **Bộ lọc đồng bộ**: Script Node.js (`scripts/sync_data.js`) chuyển đổi CSV sang JSON mà web hiểu được.
3.  **Trình biên tập trực quan**: Công cụ Editor trong Tour để lấy tọa độ hiện vật.

---

## 🖼️ BƯỚC 0: THÊM ẢNH PANORAMA & TẠO PHÒNG MỚI
Trước khi đưa hiện vật vào, bạn cần có không gian (phòng).

### 1. Chuẩn bị ảnh:
*   Sử dụng ảnh 360 độ (dạng equirectangular).
*   Lưu ảnh vào thư mục: `images/panorama/`.
*   **Quy tắc đặt tên:** Viết liền không dấu (Ví dụ: `phong_trung_bay_1.jpg`).

### 2. Khai báo trong `tour_config.json`:
Mở file `tour_config.json`, tìm đến phần `"scenes"` và thêm một khối mới theo mẫu:
```json
"ten_phong_cua_ban": {
    "title": "Tên Hiển Thị Của Phòng",
    "panorama": "images/panorama/ten_file_anh.jpg",
    "hotSpots": [] 
}
```
> **Lưu ý:** Các phòng được ngăn cách nhau bởi dấu phẩy (`,`). Phòng cuối cùng trong danh sách thì KHÔNG có dấu phẩy ở cuối.

---

## 📝 BƯỚC 1: NHẬP LIỆU (FILE `items.csv`)
Thay vì sửa code, bạn chỉ cần quản lý danh sách hiện vật trong file `items.csv`.

### Các cột dữ liệu quan trọng:
*   **id**: Mã định danh duy nhất (Ví dụ: `binh_gom_01`). **Quy tắc:** Viết liền không dấu, không khoảng trắng, không ký tự đặc biệt.
*   **name**: Tên hiển thị của hiện vật.
*   **period**: Niên đại hoặc thời kỳ.
*   **description**: Mô tả chi tiết. (Có thể copy văn bản dài từ Word vào đây).
*   **images** (Tùy chọn): Đường dẫn ảnh. Nếu để trống, hệ thống sẽ tự tìm ảnh tại `images/hien-vat/[id].jpg`.

> **Mẹo:** cài exstension edit CSV trong VSCode để chỉnh sửa file items.csv

---

## ⚡ BƯỚC 2: ĐỒNG BỘ DỮ LIỆU (Node.js)
Sau khi cập nhật file CSV hoặc thêm ảnh mới vào thư mục, bạn cần chạy lệnh để hệ thống cập nhật vào website.

1.  Mở thư mục dự án bằng Terminal (hoặc CMD/PowerShell).
2.  Gõ lệnh sau và nhấn Enter: node scripts/sync_data.js
3.  **Kết quả:** Hệ thống sẽ sinh ra file `info.json` chứa toàn bộ dữ liệu hiện vật đã được chuẩn hóa.

---

## 📍 BƯỚC 3: ĐẶT HIỆN VẬT VÀO TOUR (Visual Editor)
Đây là bước quan trọng nhất để cố định hiện vật vào không gian 360.

1.  Mở website trên trình duyệt qua Live Server.
2.  Tại góc trên bên phải màn hình, bạn sẽ thấy bảng **🛠️ Artifact Editor**.
3.  **Quy trình đặt vị trí:**
    *   Xoay ảnh 360 đến đúng vị trí vật phẩm thực tế.
    *   **Click chuột trái** chính xác vào điểm bạn muốn đặt nút bấm.
    *   Trong bảng Editor, nhấn vào danh sách thả xuống và **chọn ID hiện vật** bạn vừa nạp ở Bước 1.
    *   Nhấn nút **Copy JSON**.
4.  Mở file `tour_config.json`, tìm đến mảng `hotSpots` của phòng hiện tại.
5.  **Dán (Paste)** đoạn code vừa copy vào cuối mảng đó.
    *   *Ví dụ đoạn code được copy:* 
        ```json
        {
            "type": "artifact",
            "pitch": -12.45,
            "yaw": 145.2,
            "artifactId": "binh_gom_01"
        },
        ```

---

## 🚀 TỐI ƯU HÓA (Dành cho hàng trăm hiện vật)
Khi số lượng hiện vật lớn, trang web có thể nặng. Hãy áp dụng các quy tắc sau:

### 1. Sử dụng định dạng ảnh WebP
Thay vì dùng `.jpg` hay `.png` nặng nề, hãy chuyển đổi tất cả ảnh hiện vật sang định dạng `.webp`. 
*   Ảnh sẽ nhẹ hơn 2-3 lần nhưng chất lượng không đổi.
*   Chỉnh sửa dòng 34 trong file `scripts/sync_data.js` thành `.webp` để hệ thống tự nhận diện.

### 2. Quy tắc đặt tên ảnh (Convention)
Để tiết kiệm thời gian, hãy luôn đặt tên file ảnh trùng với **ID** của hiện vật.
*   Ví dụ: Hiện vật có ID là `trong_dong_ngoc_lu` thì file ảnh nên là `trong_dong_ngoc_lu.webp`. Hệ thống sẽ tự động ghép nối mà bạn không cần phải khai báo đường dẫn ảnh trong CSV.

### 3. Tải ảnh từ xa (CDN)
Nếu không muốn lưu hàng GB ảnh trong source code, bạn có thể upload ảnh lên các dịch vụ như **Cloudinary** hoặc **Imgur** và dán link ảnh trực tiếp vào cột `images` trong file CSV.

---

## 🎵 BƯỚC 7: THAY ĐỔI NHẠC NỀN (AUDIO)
Website mặc định sẽ tự động phát nhạc khi bạn bắt đầu tham quan.

### 1. Thay file nhạc mới:
*   Chuẩn bị file nhạc định dạng `.mp3`.
*   Lưu vào thư mục: `audio/`.
*   Đặt tên file là: `background_music.mp3` (hoặc sửa tên file tại dòng 23 trong `tour.html`).

### 2. Cách chỉnh âm lượng (Volume):
Để nhạc to hơn hoặc nhỏ đi, HS hãy thực hành sửa code như sau:
*   Mở file `script_tour.js`.
*   Tìm hàm `setupMusic()`.
*   Sửa dòng: `music.volume = 0.3;` thành con số bạn muốn (Từ `0.1` là rất nhỏ đến `1.0` là to nhất).

---

## ⚠️ CÁC LỖI THƯỜNG GẶP KHI SỬA JSON (Dành cho HS)
Khi sửa file `tour_config.json`, hãy kiểm tra kỹ:
1.  **Dấu phẩy (`,`)**: Chỉ dùng để ngăn cách giữa 2 phần tử. Phần tử cuối cùng trong mảng `[]` hoặc đối tượng `{}` thì **không được có dấu phẩy**.
2.  **Dấu ngoặc `{ }` và `[ ]`**: Luôn đi theo cặp. Mở cái gì thì phải đóng cái đó.
3.  **Dấu ngoặc kép (`"`)**: Mọi từ khóa (key) và chuỗi văn bản (string) đều phải nằm trong cặp ngoặc kép.

*Chúc bạn xây dựng được một bảo tàng ảo chuyên nghiệp!*

---
## 🎙️ BƯỚC 8: THIẾT LẬP HƯỚNG DẪN VIÊN ẢO CHO TỪNG PHÒNG
Hệ thống hỗ trợ một nhân hướng dẫn viên xuất hiện ở góc màn hình để thuyết minh khi bạn đi vào mỗi phòng.

### 1. Chuẩn bị file âm thanh (Audio):
*   Sử dụng lời dẫn tự thu âm hoặc dùng công cụ AI đọc văn bản. 
*   Lưu file vào thư mục: `audio/` (Ví dụ: `phong1_thuyetminh.mp3`).

### 2. Cấu hình để Hướng dẫn viên "nói" đúng phòng:
Mở file `tour_config.json`, tìm đến phòng bạn muốn thêm và bổ sung dòng `"guideAudio"` như mẫu dưới đây:
```json
"ten_phong_cua_ban": {
    "title": "Tên Phòng",
    "panorama": "images/panorama/anh.jpg",
    "guideAudio": "audio/phong1_thuyetminh.mp3", 
    "hotSpots": []
}
```

### 4. Thay đổi Hướng dẫn viên ở trang chủ (index.html):
Tương tự như trong từng phòng, bạn có thể thay đổi lời chào ngay khi mở bảo tàng bằng cách sửa khối `"welcome"` trong `tour_config.json`:
```json
"welcome": {
    "guideAudio": "audio/welcome.mp3",
    "guideImage": "images/guide.gif"
}
```

> **Mẹo:** Nếu một phòng bạn không muốn có hướng dẫn viên, chỉ cần xóa bỏ hoặc không điền dòng `guideAudio` trong phòng đó. Nhân vật sẽ tự động ẩn đi để không làm phiền người xem.

---

## 🗺️ BƯỚC 9: THIẾT LẬP BẢN ĐỒ VỊ TRÍ (SHARED MAP)
Hệ thống cho phép bạn cấu hình bản đồ Google Maps một cách nhanh chóng. Bản đồ này sẽ xuất hiện ở cả **Trang chủ** và **Trang Tour** (khi nhấn nút Bản đồ).

Để thay đổi địa điểm bản đồ, bạn chỉ cần sửa **duy nhất một chỗ** trong file `tour_config.json`:

1.  Truy cập Google Maps, tìm địa điểm bạn muốn.
2.  Nhấn **Chia sẻ** -> **Nhúng bản đồ** -> Copy đoạn mã `iframe`.
3.  Lấy phần đường link nằm trong `src="..."` (Ví dụ: `https://www.google.com/maps/embed?pb=...`).
4.  Mở file `tour_config.json`, tìm khối `"welcome"` và dán link vào dòng `mapSrc`:
    ```json
    "welcome": {
        "guideAudio": "audio/welcome.mp3",
        "guideImage": "images/guide.gif",
        "mapSrc": "DÁN_LINK_GOOGLE_MAPS_VÀO_ĐÂY"
    }
    ```
> **Mẹo:** Nếu bạn muốn đơn giản, chỉ cần điền theo cú pháp: `https://www.google.com/maps?q=Tên_Địa_Điểm&output=embed` (Ví dụ: `https://www.google.com/maps?q=Bảo+tàng+tỉnh+Tuyên+Quang&output=embed`). Hệ thống sẽ tự tìm đúng vị trí cho bạn!

