# testlogin · Tủ Đồ

Web phối đồ (dự án Hackathon). Giai đoạn hiện tại gồm:

- Màn mở đầu: tủ đồ chật cứng rung dần rồi nổ tung, quần áo văng khắp màn hình, lớp mờ chuyển cảnh, sau đó cửa tủ mở ra với lời chào.
- Đăng nhập / đăng ký bằng email hoặc tiếp tục với Google (Firebase Authentication, hồ sơ lưu ở Firestore).
- Quần áo trôi quanh trang: kéo thả được, bấm vào thì xoay, rê chuột thì hiện tên.
- Thanh thời tiết các thành phố Việt Nam và công tắc giao diện sáng/tối.
- Màn hình chính sau khi đăng nhập: chào theo biệt danh, có lối vào các phần sẽ làm tiếp (phối đồ, gợi ý AI, lịch sử, hồ sơ).
- Hồ sơ người dùng: nhân viên cửa hàng mở cửa chào đón, form số đo (bắt buộc), độ cân bằng cơ thể (BMI ẩn), phong cách được AI lưu thành JSON.
- Trợ lý AI (Gemini) dạng bong bóng chat, dùng hồ sơ + thời tiết + thời gian khi gợi ý.
- Phòng phối đồ: lưu hồ sơ xong có phím tắt "Đi phối đồ" (phím P); khách người que đứng suy nghĩ trước giá đồ rồi vào phòng thử; hỏi hoàn cảnh (dịp, mùa, đi cùng ai) và lưu lại; gợi ý bộ phối theo hồ sơ + hoàn cảnh (AI xếp lại nếu có); ma-nơ-canh người que mặc đồ vẽ bằng SVG, đổi dáng, xoay 0–180°, vừa với vóc dáng trong hồ sơ; đổi màu, họa tiết (sọc, caro, chấm bi…) và phối màu nhanh.

## Chạy dự án

```bash
npm install
npm run dev
```

Chưa có file `.env` thì app chạy **chế độ demo**: tài khoản chỉ lưu trong trình duyệt (localStorage), đủ để thử toàn bộ luồng đăng ký / đăng nhập.

## Kết nối Firebase

1. Tạo project tại [Firebase Console](https://console.firebase.google.com), thêm một **Web app**.
2. **Authentication → Sign-in method**: bật **Email/Password** và **Google**.
3. **Authentication → Settings → Authorized domains**: có sẵn `localhost`; thêm tên miền khi deploy.
4. **Firestore Database**: tạo database, rồi dán rules để mỗi người chỉ đọc/ghi hồ sơ của mình:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```

5. Sao chép `.env.example` thành `.env`, điền các giá trị `VITE_FIREBASE_*` lấy từ cấu hình Web app, rồi chạy lại `npm run dev`.

Hồ sơ người dùng nằm ở `users/{uid}` với các trường `nickname`, `email`, `provider`, `createdAt` và `profile`:

```json
{
  "gender": "nu",
  "heightCm": 158,
  "weightKg": 47.5,
  "bmi": 19,
  "bodyBalance": "can-doi",
  "style": {
    "styles": ["Tối giản", "Hàn Quốc"],
    "favoriteColors": ["Trắng"],
    "avoidColors": ["Cam"],
    "favoriteItems": ["Sơ mi", "Chân váy"],
    "avoidItems": ["Giày cao gót"],
    "occasions": ["Đi làm"],
    "fit": "rộng rãi",
    "notes": "Tóm tắt gu ăn mặc do AI viết"
  },
  "styleInput": { "...": "các lựa chọn gốc trong form" },
  "aiProcessed": true,
  "updatedAt": "..."
}
```

Hoàn cảnh phối đồ cũng nằm trong `users/{uid}`: `outfitContext` (lần gần nhất, có `updatedAt`) và `outfitContextHistory` (tối đa 8 lần, mới nhất trước), mỗi mục dạng `{ occasion, occasionText, season, companion, companionText, note, savedAt }`. Rules ở trên đã đủ, không cần sửa.

`bmi` chỉ lưu để trợ lý AI và ma-nơ-canh dùng; giao diện chỉ hiện "độ cân bằng cơ thể". `style` là JSON do Gemini chuẩn hoá từ các lựa chọn và phần mô tả tự do (nếu AI lỗi thì lưu đúng các lựa chọn).

## Trợ lý AI

- Bong bóng chat ở góc dưới bên phải (sau khi đăng nhập). Mỗi tin nhắn tự gửi kèm giờ hiện tại, hồ sơ và thời tiết thành phố đang chọn.
- "Huấn luyện" AI bằng hướng dẫn trong `src/services/stylistKnowledge.js`: thêm quy tắc mới vào mục tương ứng (hoàn cảnh, thời tiết, vóc dáng...).
- Có `VITE_GEMINI_API_KEY` thì gọi thẳng Gemini; để trống thì dùng Firebase AI Logic (an toàn hơn vì key không nằm trong trình duyệt).

## Phòng phối đồ

- **Gợi ý**: 75 bộ phối soạn sẵn trong `src/data/outfits.js` (nam theo công thức của [Maison Online](https://www.maisononline.vn/blogs/news/phoi-do-nam), nữ theo nguyên tắc và cặp màu của [Canifa](https://canifa.com/blog/phoi-mau-quan-ao-nu), cộng xu hướng màu 2026). `src/services/outfitEngine.js` chấm điểm theo dịp, mùa, người đi cùng (độ trang trọng), phong cách, phép lịch sự (khách dự cưới tránh trắng, đi chùa kín đáo…), rồi đổi màu/món người dùng muốn tránh.
- **AI chọn bộ**: có Gemini thì AI chỉ được chọn trong danh sách ứng viên (tối đa 5 bộ) và viết lý do; AI lỗi hoặc hết hạn mức thì vẫn dùng gợi ý theo quy tắc. Không gửi số đo cho AI.
- **Tủ đồ**: 96 món trong `src/data/wardrobe.js` (áo, khoác, quần, váy, đầm, áo dài, giày, túi, mũ, kính, đồng hồ, trang sức, khăn, thắt lưng, cà vạt). Thêm món mới bằng hàm `item(...)` với loại (`kind`) và thông số hình dáng (`shape`) có sẵn.
- **Ma-nơ-canh**: `src/components/outfit/rig.js` là khung xương 2.5D (tư thế, xoay quanh trục dọc, chiếu xuống màn hình). Quần áo vẽ theo các điểm đã chiếu nên chi tiết trượt quanh thân khi xoay. Vóc dáng lấy từ chiều cao (tỉ lệ người) và BMI (độ đầy đặn). Màu da đặt trong `src/components/outfit/skinTone.js`.
- **Kiểu tóc**: tab "Kiểu tóc" trong phòng thử (không hỏi ở hồ sơ). 10 kiểu nam theo [Liêm Barber Shop](https://liembarbershop.com/141996/), 17 kiểu nữ theo [Thế Giới Nệm](https://thegioinem.com/20-kieu-toc-nu-phu-hop-voi-moi-khuon-mat.html), kèm màu tóc và độ bồng bềnh. Thông số từng kiểu ở `src/data/hairstyles.js`; lựa chọn lưu trên trình duyệt theo tài khoản.

## Đổi giao diện sáng/tối

Giao diện mới lật từ phải sang trái (View Transitions): sang tối có sao, sao chổi, trăng; sang sáng có dải ánh sáng quét qua. Trong lúc đổi, mọi transition CSS tạm tắt để chữ và nền đổi màu cùng lúc. Trình duyệt chưa hỗ trợ View Transitions hoặc bật "giảm chuyển động" thì đổi ngay, không hiệu ứng lật. Xem `src/lib/themeTransition.js` và `src/components/ThemeTransitionFx.jsx`.

## Thời tiết

Mặc định dùng [Open-Meteo](https://open-meteo.com), miễn phí và không cần key. Nếu muốn dùng [WeatherAPI.com](https://www.weatherapi.com), điền `VITE_WEATHER_KEY` trong `.env`.

## Cấu trúc chính

```
src/
  App.jsx                     chuyển giữa màn chào/đăng nhập và màn hình chính
  pages/Welcome.jsx           dòng thời gian màn mở đầu (chật → nổ → mờ → mở cửa → form)
  pages/Home.jsx              màn hình chính sau khi đăng nhập
  pages/ProfilePage.jsx       nhân viên mở cửa chào đón → trang hồ sơ (trang duy nhất có cuộn)
  pages/OutfitPage.jsx        cảnh vào phòng thử → câu hỏi hoàn cảnh → phòng phối đồ
  components/outfit/          ma-nơ-canh (khung xương, quần áo, giày, phụ kiện), danh sách, bảng chỉnh màu
  data/                       tủ đồ, bộ phối, bảng màu & họa tiết, lựa chọn hoàn cảnh
  components/profile/         cảnh cửa hàng, nhân vật, form hồ sơ, độ cân bằng cơ thể
  components/chat/            bong bóng trợ lý AI
  components/scene/           tủ đồ (Wardrobe) và quần áo trôi (FloatingClothes)
  components/clothes/         quần áo & phụ kiện vẽ bằng SVG + danh mục
  components/auth/            lời chào, form đăng nhập/đăng ký
  components/topbar/          thanh thời tiết, công tắc sáng/tối, menu tài khoản
  context/AuthProvider.jsx    Firebase Auth + chế độ demo
  services/                   thời tiết, hồ sơ, hoàn cảnh phối đồ, gợi ý bộ phối, Gemini, tài khoản demo
  lib/scene.js                mốc thời gian màn mở đầu, kích thước tủ
```

Muốn chỉnh nhịp màn mở đầu thì sửa `INTRO` trong `src/lib/scene.js`.
