# AI Millionaire — HTML PPT Game

Interactive 10-slide “Ai Là Triệu Phú” deck built from the `graphify-dark-graph` full-deck template of `lewislulu/html-ppt-skill`.

## Run offline

Open `index.html` directly in a browser. No server and no internet are required.

## Controls

- `← / → / Space` — navigate
- `F` — fullscreen
- `O` — overview
- `N` — notes drawer
- `S` — presenter view
- `A` — cycle animation on the current slide
- `T` — theme cycle (one bundled theme in this offline build)

## Game interaction

Click answer buttons, then use the next button. Lifelines are interactive:
- 50:50 removes two wrong options
- Audience Poll opens a simulated poll
- Phone opens a playful fake call
- Cover gift box opens a troll reveal

## Validation

This package is intended to be validated with:
1. static relative-path scan
2. JavaScript syntax check
3. headless Chromium screenshot/render test
4. ZIP -> extract -> repeat the checks


## Voice / giọng đọc offline

- Dùng Web Speech API (`window.speechSynthesis`) trực tiếp bằng JavaScript.
- Không tải audio, API, CDN hoặc dịch vụ bên ngoài.
- Khi vào mỗi câu hỏi: đọc câu hỏi → A → B → C → D → mời người chơi lựa chọn.
- Khi chọn: đọc xác nhận “Bạn đã chọn đáp án X. X là câu trả lời cuối cùng của tôi.”
- Sau đó công bố đúng/sai bằng giọng đọc.
- Có nút `🔊 ĐỌC LẠI CÂU HỎI` trên từng câu và nút bật/tắt giọng đọc cố định.
- Ưu tiên voice `vi-VN`; nếu trình duyệt không có voice tiếng Việt, Web Speech API sẽ dùng voice mặc định của hệ điều hành.
