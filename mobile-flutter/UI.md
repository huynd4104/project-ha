# UI.md — Playful Learning Mobile Design System

> Tài liệu trích xuất từ giao diện hiện có của `mobile-flutter`. Dùng làm brief và system reference khi phân tích/thiết kế lại bất kỳ app mobile nào theo cùng phong cách. Đây là **thiết kế hướng trẻ em và phụ huynh**: ấm áp, vui tươi, dễ hiểu, ưu tiên động viên hơn áp lực hay cạnh tranh.

## 1. Tinh thần thiết kế

**Tên phong cách:** Playful Learning / Gentle Gamification.

- Tạo cảm giác an toàn, khích lệ và có bạn đồng hành. Giao diện không tối, không sắc cạnh, không dùng ngôn ngữ phán xét.
- Bố cục sạch, nhiều khoảng thở; mỗi màn chỉ có một hành động chính rõ ràng.
- Dùng màu như tín hiệu ý nghĩa: xanh lá cho tiến bộ/hoàn thành, xanh dương cho học và tương tác, vàng/cam cho phần thưởng và chuỗi ngày, hồng/đỏ san hô cho lỗi hoặc hành động cần chú ý.
- Gamification có mục đích: XP, level, streak, huy hiệu và mascot ghi nhận nỗ lực; không xếp hạng trẻ với nhau.
- Nội dung dành cho trẻ dùng hình ảnh, mascot, câu ngắn, icon lớn, trạng thái trực quan. Phần dành cho phụ huynh chuyển sang dữ liệu rõ ràng hơn nhưng vẫn chung hệ card/màu/bo góc.

### Nguyên tắc khi áp dụng cho app khác

1. Giữ “một ý chính + một CTA chính” trên mỗi viewport.
2. Ưu tiên câu xác nhận tích cực: “Con làm tốt lắm”, “Mình thử lại nhé” thay vì “Sai”, “Thất bại”.
3. Không dùng màu đơn lẻ để biểu đạt trạng thái: luôn ghép icon, nhãn hoặc nội dung.
4. Dùng bề mặt trắng trên nền xanh-trắng rất nhạt; màu đậm tập trung vào CTA, icon avatar và thanh tiến trình.
5. Một màn nhiều dữ liệu phải chia thành các card nhỏ, có hierarchy: tổng quan → hành động → chi tiết.

## 2. Design tokens

### 2.1 Màu sắc

| Vai trò | Token / mã màu | Cách dùng |
|---|---:|---|
| Primary / tiến bộ | `#58CC02` | CTA chính, hoàn thành, progress, check |
| Teal / khởi đầu, AI | `#19C7A6` | CTA onboarding, tương tác hội thoại |
| Sky / học tập | `#1CB0F6` | hoạt động học, lựa chọn đang chọn, info |
| Yellow / phần thưởng | `#FFC800` | XP, huy hiệu, sao, avatar accent |
| Orange / streak, cảnh báo | `#FF9600` | lửa streak, đề xuất, Premium accent |
| Coral / lỗi, thử lại | `#FF6B6B` | validation lỗi, đáp án sai, danger |
| Pink / mở khóa | `#FF6B9A` | thành tựu/mở khóa đặc biệt |
| Purple / khu phụ huynh | `#9B5DE5` | tab/nhóm tính năng phụ huynh |
| App background | `#F7FAF5` | nền scaffold mặc định |
| Cream / celebration | `#FFFCF2` | hero, card hoàn thành, nền ấm |
| Surface | `#FFFFFF` | card, field, nav nổi |
| Text chính | `#25323A` | tiêu đề và nội dung chính |
| Text phụ | `#6B7280` | mô tả, metadata, trạng thái phụ |
| Border / track | `#E5E7EB` | viền card/field, progress chưa hoàn thành |
| Success | `#36B96C` | đúng/hoàn tất — dùng cùng check |

**Tint trạng thái chuẩn:** màu chức năng ở nền alpha khoảng 10–14%, viền cùng màu nhưng rõ hơn. Ví dụ chọn đáp án: nền sky 12% + viền sky 2 px; đúng: success 14%; sai: coral 12%. Alert email/warning dùng `#FFFBEB`, chữ cam nâu `#B45309`; success banner dùng `#F0FDF4`, viền `#BBF7D0`; error banner dùng `#FFF1F2`, viền `#FECACA`.

### 2.2 Typography

Font duy nhất là **Nunito** (Google Fonts), để nét chữ tròn, thân thiện và dễ đọc. Fallback: `Nunito, system-ui, sans-serif`.

| Cấp chữ | Size / weight | Dùng cho |
|---|---:|---|
| Display | 34 / 900 | hero hiếm dùng |
| Headline | 30 / 900 | tiêu đề màn chính |
| Title | 22 / 900 | tiêu đề section/card |
| Subtitle | 18 / 800 | tiêu đề card, mascot bubble |
| Body | 16 / 400, line 1.35 | nội dung đọc chính |
| Muted | 14 / 400, line 1.35 | mô tả, thông tin phụ |
| Caption | 12 / 400–700, line 1.3 | metadata, label progress |

Quy tắc: tiêu đề luôn đậm `800–900`, body tối thiểu 14 px, line-height 1.35–1.5; không dùng all caps. Emoji chỉ là điểm nhấn trong tiêu đề/thành tựu, không thay thế ý nghĩa icon.

### 2.3 Spacing, bo góc, elevation

| Token | px | Dùng cho |
|---|---:|---|
| `xxs / xs / sm` | 4 / 6 / 10 | khoảng cách nhỏ, icon–text |
| `md / lg / xl / xxl` | 16 / 24 / 32 / 40 | card, section, hero |
| `radius xs / sm / md` | 8 / 10 / 16 | chip, field, button |
| `radius lg / xl / pill` | 24 / 32 / 99 | card, node, avatar/chip |

- Content screen chuẩn: `padding horizontal 18–24`, `top 56` khi không có AppBar; khoảng cách card 12–18.
- Card chuẩn: padding 18, radius 24, viền 1 px `#E5E7EB`, bóng mềm `rgba(37,50,58,.12)` blur 18 / y 8.
- Nút primary có bóng đáy phẳng `rgba(37,50,58,.15)` offset y 4, không dùng gradient đại trà.
- Tappable control: tối thiểu 48×48; CTA chính cao 58, CTA secondary 52–54.

## 3. Thành phần giao diện chuẩn

### Nút bấm

`AppButton` là CTA chính: full width mặc định, cao 58 px, radius 16, label 16 px/900, icon Material bo tròn ở bên trái (mặc định mũi tên phải). Khi nhấn, scale xuống `0.98` trong 90 ms và phát âm thanh tap; khi loading, thay icon bằng spinner 18 px và khóa thao tác.

| Variant | Nền | Chữ | Mục đích |
|---|---|---|---|
| Primary | green | trắng | tiếp tục, lưu, bắt đầu |
| Secondary | sky | trắng | nghe lại, thao tác học phụ |
| Reward | yellow | text đậm | nhận thưởng |
| Danger | coral | trắng | hành động rủi ro |
| Ghost | trắng | text | hủy/ít ưu tiên |

- Nút outline: nền trắng, viền `#E5E7EB` 1.5 px, cao 52–54; dùng cho đăng nhập, hành động thay thế.
- Không đặt 2 primary CTA cạnh tranh. Trong dialog, primary “ở lại/tiếp tục” ở trái và ghost/hủy ở phải theo implementation hiện có.
- Icon button: ô 48×48, nền trắng, radius 16, viền border; dùng back, close, settings, audio. Có tooltip và tap sound.
- Mic action là ngoại lệ: hình tròn 112×112, sky khi sẵn sàng, coral khi đang ghi, glow cùng màu.

### Card, list, pill và icon

- `AppCard`: surface trắng, radius 24, padding 18, border + soft shadow. Nếu bấm được, toàn card là hit area và có chevron ở cuối khi phù hợp.
- Card theo trạng thái: thêm tint nhẹ + border màu ngữ nghĩa; tránh tô màu đậm cả card trừ hero/celebration.
- Avatar/icon tròn là điểm neo thị giác: 40–60 px trong card, màu nền semantic, icon trắng. Avatar profile có accent yellow.
- Pill: radius 99, padding ngang 12/dọc 8, nền màu 14% opacity, icon + nhãn 900. Dùng cho streak, thời lượng, level, metadata.
- Material rounded icons là bộ icon chính: rõ nghĩa, khoảng 18–26 px; icon node/hành động lớn 28–48 px.

### Form xác thực

- Nền `#F7FAF5`; `SafeArea + ListView`, padding ngang 24, back chip ở đầu, header cách 28 px.
- Header 30 px/900, subtitle 14 px/400 line-height 1.5.
- Field nền trắng, padding ngang/dọc 18, radius 16, viền border 1.4 px; focus viền green 2 px. Label nổi và prefix icon; khoảng cách field 14 px.
- Validation hướng dẫn ngay tại chỗ (ví dụ checklist password) chuyển muted → green/check khi đạt.
- Error/success banner: icon 16 px + text 13/600 trong khung radius 12; đặt sát vùng gây lỗi trước CTA.
- Link text 14 px muted, phần có thể bấm green/700, căn giữa hoặc cuối hàng; không dùng button cho link phụ.

### Progress, feedback và loading

- Progress bar dạng pill, nền border, value green mặc định; cao 12, riêng lesson/XP 14. Luôn có text tiến độ gần đó (`x/y`, XP, %), không chỉ thanh màu.
- Đáp án: card radius 16, padding 16, viền 2 px, avatar icon tròn 44 px. Normal trắng/border; selected sky; correct success/check; wrong coral/refresh; disabled xám/lock. Chuyển màu 160 ms, nhấn scale 0.98.
- Sau câu trả lời, hiển thị feedback panel bám đáy: nền semantic 10%, chỉ bo hai góc trên 24, mascot 88 px, title màu semantic, 1 CTA. “Sai” gọi là “Thử lại nhé!”.
- Loading cơ bản: spinner green + “Đang tải...” 800. Khi chuẩn bị bài học: mascot 130 px fade + elastic scale 700 ms và message trễ 300 ms.
- Error: icon coral 50 px, message căn giữa, outline retry. Empty state: mascot 140 px hoặc icon sky 58 px, title 20/900 + mô tả muted.

### Modal, dialog, toast

- Confirmation dialog: background app background, radius 24, padding 24; title 24/900; message body; hai CTA ngang nhau.
- Reward bottom sheet: icon trophy yellow 76 px, title 24/900, message căn giữa, CTA green full width. Dùng sau một hành động tích cực, không dùng cho lỗi.
- SnackBar chỉ cho phản hồi tác vụ ngắn (lưu/tải/đồng bộ); thông báo cần hành động hay giải thích dùng banner/card/dialog.
- Premium gate: dialog mô tả thân thiện, hai chọn lựa “Để sau” và “Dành cho Bố Mẹ”; không dẫn trẻ đi thẳng đến thanh toán.

## 4. Bố cục và navigation

### Khung màn hình

- Màn scroll: `ListView`, background `#F7FAF5`, không gian top 56, bottom 24. Không nhét tất cả vào một surface lớn.
- AppBar: trong suốt, không elevation, chữ 20/900, foreground text; leading là icon button vuông bo tròn thay vì mũi tên trần.
- Safe area luôn được tôn trọng; vùng bottom sheet/lesson panel thêm SafeArea đáy.

### Bottom navigation nổi

Thanh nav gồm 5 tab: Home (green), Lộ trình (sky), AI (teal), Thưởng (orange), Phụ huynh (purple).

- Container trắng nổi, cao 66, margin `16, 0, 16, 12`, radius 24, border 2 px, bóng nhẹ.
- Mỗi tab chỉ hiển thị icon trong implementation hiện tại (dù có label data); selected icon tăng 1.15, dịch lên 4 px, easing `easeOutBack` 250 ms và có indicator 12×3 px màu tab.
- Tab phải mang đúng màu feature để tạo điểm nhớ, inactive dùng muted. Không dùng badge/red dot nếu không thực sự cấp thiết.

## 5. Công thức cho các nhóm màn hình

### Home chính

Trình tự: tiêu đề “Học cùng …” + settings → banner tình trạng nếu cần → card profile/level (avatar, level/XP, streak pill, progress) → bubble của mascot → card “Hoạt động hôm nay” với bài tiếp theo và CTA → nhiệm vụ ngày → nhóm quick actions.

- Home có pull-to-refresh.
- Dữ liệu chưa đủ (chưa chọn chương trình, chưa đặt mục tiêu) biến thành card hướng dẫn có icon màu semantic + CTA, không để khoảng trống khó hiểu.
- Hero/profile dùng cream, viền green alpha. Thẻ bài học dùng sky. Gợi ý chương trình dùng orange.

### Welcome, login, register

- Welcome là màn hình giàu cảm xúc: ảnh background full screen, gradient từ trong suốt phía trên sang cream gần đục phía dưới, mascot lớn 180–240 px ở hero, bottom panel trắng 88% opacity/radius 28.
- Trong panel: title căn giữa 26–32/900, subtitle, safety notice vàng nhạt, CTA teal “Bắt đầu”, outline “Đăng nhập”. Phần tử entrance fade/stagger nhẹ.
- Login/register là chức năng thuần: background dịu, header trái, form tuần tự, CTA green. Register có checklist password và disclaimer checkbox ở card trắng; khi chọn chuyển nền green tint + viền green.

### Lộ trình / chặng học

- Không trình bày lesson như danh sách settings. Dùng “bản đồ” zig-zag trái–phải để biến tiến độ thành hành trình.
- Section header là chip sky tint nằm giữa hai divider: “Bước 1…”. Connector cong cao 62 px, 5 px, green nếu đoạn đã hoàn thành, border nếu chưa.
- Lesson node: card 108 px (current 122 px), radius 32, viền 3 px + glow cùng màu, circle icon 56 px. Có title và metadata ngoài node (tối đa khoảng 190 px).

| Trạng thái node | Màu / icon | Hành vi |
|---|---|---|
| Completed | green + check | có thể xem lại |
| Current | sky + icon bài | pulse scale 1 → 1.06, CTA “Tiếp tục” |
| Available | yellow + icon bài | mở và sẵn sàng |
| Locked | gray + lock | không phản hồi điều hướng |
| Premium | amber `#F59E0B` + crown | hiện parent gate |

### Bài học / hoạt động

- Header lesson cố định ở trên: close 48 px, nhãn hoạt động, progress 14 px, audio help 48 px.
- Một câu hỏi tại một thời điểm; ưu tiên nội dung lớn và lựa chọn rộng. Các image option đặt grid/card trắng radius 18, viền 2 px.
- Kết quả/hoàn thành: hero card cream + yellow border (mở khóa dùng pink) có mascot 150 px; card tiếp theo gom điểm, XP, streak thành các badge tròn; CTA tiếp tục trước, xem thưởng/home là outline sau.

### Phần thưởng

- Header giải thích “ghi nhận nỗ lực, không so sánh hay xếp hạng”.
- Level card → nhiệm vụ ngày → grid 2 cột huy hiệu. Huy hiệu earned: nền trắng, viền yellow, opacity 1; locked: nền `#F3F4F6`, border xám, opacity icon .4, lock.
- Nhiệm vụ có progress + XP chip. Nhiệm vụ đã đạt nhưng chưa nhận thưởng: card vàng nhạt, viền yellow, shimmer và scale thở `1 → 1.02` trong 1.2 s để mời người dùng nhận.

### Bảng phụ huynh

- Giữ cùng hệ card nhưng giảm mascot/animation, tăng khả năng quét dữ liệu.
- Thứ tự: subscription banner → link tiến độ AI → tóm tắt hôm nay → 2×2 metric cards (completed/level/XP/streak; mỗi ô một semantic color) → weekly progress → kỹ năng/progress → khuyến nghị → hoạt động gần đây.
- Nội dung trống phải giải thích dữ liệu nào còn thiếu và cần làm gì tiếp theo; không chỉ viết “No data”.
- Khuyến nghị nhẹ nhàng, không mang tính chẩn đoán/điều trị. Premium upsell đặt trong card subscription, CTA orange 44 px.

### Profile/cài đặt

- AppBar trong suốt + back chip. Top hero thông tin cá nhân có gradient nhẹ, avatar nổi, cấp độ/tóm tắt.
- Chia section bằng label 12–14/900 uppercase vừa phải (nếu dùng), nhóm option thành action tile: icon sắc màu trong ô/round accent, title, chevron. Switch row dùng green khi bật.
- Logout/destructive tách khỏi các setting khác, coral icon/text, yêu cầu confirmation dialog.

## 6. Motion, âm thanh, accessibility

### Motion và âm thanh

- Motion phải ngắn và có mục đích: press 90 ms, state color 160–200 ms, nav 200–250 ms, entrance 300–700 ms.
- Dùng `easeOutBack`/`elasticOut` cho mascot hoặc thành tựu; dùng ease-out đơn giản cho UI chức năng. Không để animation lặp ngoài node hiện tại và CTA nhận thưởng.
- Tap và lựa chọn có âm thanh phản hồi; không phát âm thanh chỉ vì widget xuất hiện.
- Có setting `reducedAnimation`: tắt pulse loop và tôn trọng `MediaQuery.disableAnimations`.

### Accessibility

- Chạm tối thiểu 48 px; icon button có tooltip; ảnh mascot trang trí bỏ semantics, ảnh mang thông tin có semantic label.
- Text chính luôn contrast cao (`#25323A` trên nền sáng); không đặt text nhỏ màu muted trên màu semantic đậm.
- Trạng thái đáp án, progress, lock, premium đều có text/icon ngoài màu. Nội dung hướng dẫn dùng câu ngắn, dễ đọc.
- Tránh chỉ dựa vào hover: link/auth có hover underline trên web nhưng vẫn bấm được trên mobile.

## 7. Prompt mẫu để tái sử dụng

```text
Phân tích và thiết kế lại UI/UX cho [TÊN APP / các màn hình] theo phong cách
Playful Learning trong UI.md. Giữ Nunito, nền #F7FAF5, card trắng bo 24 px,
CTA cao 58 px radius 16, semantic palette (green #58CC02, sky #1CB0F6,
yellow #FFC800, orange #FF9600, coral #FF6B6B). Hãy đề xuất hierarchy,
layout từng màn, component states, loading/error/empty/success, navigation,
microcopy tích cực và accessibility. Chuyển ngữ cảnh trẻ em/phụ huynh thành
[ĐỐI TƯỢNG APP MỚI] nhưng vẫn giữ tính thân thiện, rõ ràng, không gây áp lực.
```

## 8. Checklist trước khi bàn giao thiết kế

- [ ] Có một CTA chính, đầy đủ normal/pressed/loading/disabled state.
- [ ] Mọi loading, empty, error và success đều có thiết kế/copy rõ ràng.
- [ ] Card, radius, spacing, font và semantic color dùng đúng token.
- [ ] Màu có icon/label đi kèm; target chạm tối thiểu 48 px.
- [ ] Animation ngắn, tắt được qua reduced motion; không cản trở thao tác.
- [ ] Luồng Premium/rủi ro xác nhận bằng parent gate/confirmation, không gây áp lực.
- [ ] App mới có điều chỉnh ngôn ngữ/mascot/illustration theo đối tượng, nhưng không phá hierarchy của hệ này.

## Nguồn triển khai trong repo

Các token nằm trong `lib/core/theme/`; component lõi nằm trong `lib/core/widgets/`; các ví dụ chuẩn là `features/home`, `features/auth`, `features/learning_path`, `features/lessons`, `features/gamification`, `features/parent_dashboard` và `features/profile`.

---

## Phụ lục A — Bản đặc tả triển khai (chi tiết)

### A.1 Mật độ, breakpoint và khung responsive

Thiết kế là mobile-first. Luôn thiết kế theo khổ 360–430 dp trước, sau đó mới nới layout cho tablet; không cố làm desktop UI thu nhỏ.

| Vùng | Mobile nhỏ `<380` | Mobile chuẩn `380–599` | Tablet `≥600` |
|---|---|---|---|
| Padding nội dung | 18–22 | 18–24 | max-width 640, căn giữa, padding 24–32 |
| Mascot welcome | 180 px | 200–240 px | tối đa 280 px |
| Hero title welcome | 26 px | 32 px | 34 px |
| Grid huy hiệu / option ảnh | 2 cột | 2 cột | 3–4 cột nếu vẫn giữ tile ≥140 px |
| Metric dashboard | 2 cột | 2 cột | 4 cột hoặc 2×2 tùy độ rộng |

- Màn cao dưới 720 px: giảm khoảng đứng của hero/welcome và giảm padding đáy từ 64 xuống 28, **không** giảm CTA dưới 48 px.
- Không đặt CTA cố định che content khi form/keyboard mở. Nếu lesson có panel đáy, phần body phải chừa đủ khoảng bottom.
- Dải text: title tối đa 2 dòng; mô tả card tối đa 2–3 dòng; nội dung dài chuyển sang màn chi tiết hoặc scroll. Luôn thử với tiếng Việt dài và font scale 1.3×.

### A.2 Bản đồ component và contract trạng thái

| Component | Normal | Tương tác | Đang xử lý | Không khả dụng / lỗi |
|---|---|---|---|---|
| Primary CTA | green, chữ trắng | scale .98/90 ms + sound | spinner 18 px, khóa tap | bg border, chữ muted |
| Outline CTA | trắng + border 1.5 px | ink/tap | chỉ dùng khi action async có trạng thái rõ | border/text muted |
| Icon button | 48×48, trắng + border | ink + tap sound + tooltip | không áp dụng hoặc thay bằng spinner | opacity/disabled theo Theme |
| App card tap | surface, shadow mềm | toàn vùng bấm, chevron nếu navigation | skeleton hoặc LoadingView ở cấp màn | card message/Retry |
| Text field | viền `#E5E7EB` 1.4 px | focused green 2 px | không tự loading | validation message/banner coral |
| Answer card | trắng + border | selected sky tint | khóa khi đã submit | correct success / wrong coral / disabled gray |
| Lesson node | tùy state map | current pulse nếu cho phép animation | không áp dụng | locked không điều hướng; premium mở parent gate |
| Progress | track border + value semantic | animate value ngắn nếu data đổi | có thể skeleton | phải luôn kèm nhãn số/text |

**Điều bắt buộc:** một hành động async không được vừa để CTA còn active, vừa cho phép bấm lặp. Bật `loading`, vô hiệu hóa callback và chỉ hiển thị một nguồn phản hồi (spinner trong button *hoặc* loading screen) tại một thời điểm.

### A.3 Thứ bậc màu và quy tắc phối

1. Một viewport có **một màu hành động chính**; thông thường là green. Sky/teal/orange chỉ thay green nếu đó là CTA mang ý nghĩa feature (ví dụ bắt đầu hội thoại AI dùng teal).
2. Mỗi card chỉ có một accent semantic lớn: hoặc avatar/icon circle, hoặc border/tint, không dùng cả gradient mạnh, icon màu và button màu khác nhau trong một card.
3. Yellow là phần thưởng/điểm sáng, không dùng làm body text trên nền trắng. Text trên yellow phải là `#25323A`.
4. Coral là lỗi hoặc retry, không dùng để gây áp lực trong copy. Với sai đáp án, nền chỉ coral 10–12%, lời nhắn vẫn trung tính/khích lệ.
5. Purple dành riêng cho parent/nav identity; không lạm dụng trong flow học chính của trẻ.

### A.4 Thư viện microcopy

| Tình huống | Mẫu phù hợp | Tránh |
|---|---|---|
| Bắt đầu | “Mình bắt đầu nhé!”, “Bắt đầu học” | “Submit”, “Proceed” |
| Đúng | “Đúng rồi!”, “Con làm tốt lắm!” | “Correct: 1 point” |
| Chưa đúng | “Thử lại nhé!”, “Mình xem lại một chút nha.” | “Sai rồi”, “Bạn thất bại” |
| Không có dữ liệu | “Chưa đủ dữ liệu phân tích” + cách tạo dữ liệu | “No data” |
| Loading | “Đang chuẩn bị bài học…”, “Đang tổng kết…” | spinner không nhãn |
| Network error | “Chưa tải được dữ liệu. Mình thử lại nhé?” | mã lỗi kỹ thuật trực tiếp |
| Premium | “Bé hãy nhờ bố mẹ mở khóa giúp nhé!” | “Pay now”, “Upgrade required” |
| An toàn | “Ứng dụng hỗ trợ… không thay thế chuyên gia.” | claim chẩn đoán/điều trị |

## Phụ lục B — Ma trận màn hình và luồng hiển thị

### B.1 Onboarding và authentication

| Màn | Mục tiêu | Thành phần theo thứ tự | Điều kiện / state |
|---|---|---|---|
| Welcome | tạo tin cậy, đưa vào auth | background minh họa → cream overlay → mascot hero → translucent panel → title/subtitle → safety alert → teal primary → outline login | fade stagger; mascot scale elastic; responsive theo chiều cao |
| Login | vào lại nhanh | back chip → headline 2 dòng → subtitle → email → password → forgot link → error banner → green CTA → register link | validate trước submit; loading nằm trong CTA |
| Register | tạo tài khoản có informed consent | back → title → fields → password hints sống → confirm → disclaimer card → error banner → CTA → login link | chưa tick disclaimer thì chặn submit và nêu rõ lý do |
| Forgot / change password | phục hồi an toàn | cùng layout form; title rõ hành động, một field/CTA chính | success banner/điều hướng rõ ràng |
| Verify email | giải thích + resend | app bar/back → icon lớn → title/body → status block → resend CTA / logout | tránh timer mơ hồ; thông báo gửi lại phải có state |

### B.2 Home, profile và child profile

| Màn | Hero / điểm neo | Nội dung chính | Hành động chính |
|---|---|---|---|
| Home | “Học cùng Minty!” + settings; card child cream | level/XP/streak → mascot bubble → next lesson/program suggestion → daily mission → quick actions | Bắt đầu học / Chọn chương trình |
| Profile | avatar + gradient nhẹ | account tile, preferences, reduced motion switch, các setting nhóm section | cập nhật profile; logout riêng ở cuối |
| Child profile | avatar của bé và form hồ sơ | mục tiêu, đặc điểm/nhu cầu, upload ảnh qua bottom sheet chọn nguồn | Lưu hồ sơ; Snackbar thành công/lỗi |
| NPC collection/detail | collection grid hoặc empty mascot | trạng thái unlocked/locked, avatar lớn, mô tả và lời thoại | chọn bạn đồng hành / xem detail |

Home có `RefreshIndicator`. Nếu chưa có child/program/goal, thay content phụ thuộc bằng **instructional card**: icon, title, lý do ngắn, một CTA. Không hiển thị FutureBuilder trống kéo dài.

### B.3 Chương trình, chặng học và lesson detail

| Màn | Cấu trúc / visual | Logic hiển thị |
|---|---|---|
| Program selection | AppBar, profile child context, list card chương trình có tags/chip, recommendation highlight, bottom sheet xác nhận đổi chương trình | loading/error riêng; update thành công dùng Snackbar; CTA phải cho thấy chương trình sắp chọn |
| Program paths map | Sliver hero có mây/mặt trời, intro card, danh sách path item/node + connector | chưa có child/program: giải thích + CTA; loading/error theo chuẩn |
| Learning path | header chặng + thông tin progress, sau đó LearningMap zig-zag | completed/current/available/locked/premium tính theo prerequisite và subscription |
| Lesson detail | card hero icon type + duration/metadata pill; mục tiêu/bài mô tả; CTA bắt đầu cuối màn | CTA bị premium gate nếu cần; icon type nhất quán flashcard/abc/music/psychology/calculate |

### B.4 Hoạt động học và game tương tác

**Lesson shell:** `LessonHeader` luôn cho phép dừng, cho biết nhãn hoạt động + tiến độ và cho nghe lại hướng dẫn. Mỗi màn hoạt động cần trả lời ba câu hỏi trực quan: “Con đang làm gì?”, “Cần làm gì tiếp?”, “Con sẽ biết kết quả ở đâu?”.

| Biến thể | Bố cục khuyến nghị | Phản hồi |
|---|---|---|
| Flashcard | minh họa/thẻ lớn → từ/câu ngắn → audio CTA → tiếp tục | nghe lại không làm mất tiến độ |
| Math / choice | prompt lớn + lựa chọn đáp án full width | AnswerOption state → feedback bottom panel |
| Image choice | prompt → 2 cột image cards, label dưới ảnh | selected viền sky, sau submit correct/wrong |
| Speaking / AI | mascot/question bubble → timer/progress → mic trung tâm → transcript/feedback | mic listening có pulse/glow; lỗi permission giải thích và cho retry |
| NFC / physical activity | prompt + hình minh họa + status NFC ở AppBar/card | snackbar cho sự kiện scan; có fallback khi ảnh/data thiếu |

### B.5 AI conversation — biến thể thiết kế riêng

- **Topic screen:** title/headline + mô tả ngắn, danh sách `AiTopicCard` bề mặt `#F8FAFC`, icon tròn radius 30 với sky; title 22/900, description muted, chevron. Đây là pattern navigation card, không phải button.
- **Intro:** card mascot vàng nhạt `#FFFBEB`, mascot 68 px, hướng dẫn đủ ngắn trước CTA bắt đầu.
- **Live conversation:** question bubble trắng, padding 18, border sky 28% + bóng rất nhẹ; timer track nền border/value teal và text `m:ss`; progress copy rõ “câu x/y”. Mic 96×96, teal/sẵn sàng hoặc orange trong active listening, halo opacity .4 được animate. Người dùng phải biết mic đang nghe hay đã dừng mà không chỉ dựa vào animation.
- **Feedback bubble:** nền `#F0FDF4`, border teal alpha 25%, text xanh đậm `#166534`; là khích lệ sau lượt nói, không dùng như error.
- **Summary:** dùng structure hero completion → số liệu/badge → gợi ý luyện tập → CTA về topics/home.
- **AI parent dashboard:** overview card `#F8FAFC`; statistic cards icon trên tint semantic; topic progress có % text + progress teal, chuyển orange nếu `needsPractice`; daily chart là cột sky alpha .75; recommendation card vàng nhạt với bóng đèn orange; history card có voice icon sky + chevron.

### B.6 Công nghệ học tập / PECS / NFC

Nhóm này có nguồn UI cũ hơn và dùng nhiều gradient/card local hơn. Khi tái thiết kế theo UI.md, giữ chức năng nhưng chuẩn hóa về token/card/button của hệ.

| Feature | Dấu hiệu visual cần giữ | Cần chuẩn hóa khi tái dùng |
|---|---|---|
| Technology selection | section “Bộ số”, “Bộ hình”, “PECS”; card icon tròn + chevron | thay local padding/màu bằng AppCard và semantic palette |
| Number/shape recognition | prompt lớn, grid lựa chọn, NFC status icon | answer state dùng chung AnswerOption/ImageOption; loading dùng LoadingView thay spinner trần |
| PECS selection | hero gradient pastel, 3 lựa chọn tính năng, icon lớn | gradient chỉ ở hero, card lựa chọn theo AppCard/radius 24 |
| PECS emotion/daily/needs | chủ đề semantic riêng (cam/xanh/teal), hình minh họa lớn, nút phát âm | giữ theme theo chủ đề nhưng CTA, text scale, snackbar và error state theo chuẩn |
| NFC result | nền gradient + card kết quả, thông điệp scan | kết quả thành công phải có icon/text + next CTA; lỗi scan cần hướng dẫn thao tác vật lý |

### B.7 Rewards, parent dashboard, paywall

| Màn | Nội dung / visual | Logic |
|---|---|---|
| Rewards | header không cạnh tranh → level card → mission list → badge grid 2 cột | mission claimable shimmer; claimed ẩn khỏi danh sách chưa nhận; badge locked giảm opacity |
| Parent dashboard | subscription → AI link → today card → metric 2×2 → weekly visual → skills → recommendations → history | skill color quay vòng green/sky/pink/teal/orange; data thiếu có explanation card |
| Paywall | AppBar/hero gradient premium, lợi ích, warning/demo state, CTA activate | chỉ vào sau parent gate; loading trong CTA; success/error dialog rõ next step |

## Phụ lục C — Specification UI states

### C.1 Quy tắc tải dữ liệu

| Cấp dữ liệu | UI đúng | UI không nên dùng |
|---|---|---|
| Toàn màn hình | `LoadingView`/mascot loading căn giữa | chỉ một CircularProgressIndicator không nhãn |
| Một card tương đối độc lập | placeholder card giữ layout, hoặc spinner trong card | chặn toàn app khi content khác dùng được |
| CTA submit | spinner trong CTA + disabled | spinner toàn màn làm người dùng không biết tác vụ nào đang chạy |
| Chuyển lesson | mascot loading “Đang chuẩn bị bài học…” | màn hình trắng đột ngột |

### C.2 Error taxonomy

- **Validation local:** message cạnh field khi framework hỗ trợ; error banner cho lỗi form/submit tổng quát.
- **Recoverable request error:** `ErrorView` với retry nếu không có data; Snackbar nếu chỉ là tác vụ phụ và context vẫn còn.
- **Permission (mic/camera/NFC):** nói rõ quyền nào, tại sao cần, cách bật; CTA mở settings/chọn cách tiếp tục nếu có.
- **Empty:** không phải error. Dùng illustration/mascot, title, explanation và action nếu có.
- **Access/Premium:** không đánh dấu “lỗi”; giữ content bị khóa và mở parent gate.

### C.3 Focus, accessibility và test states bắt buộc

Mỗi component interactive phải được kiểm tra: default, pressed, focused (keyboard/web), disabled, loading, long text, text scale 1.3×, dark avatar/image missing, offline/error và reduced motion. Các màn có content của trẻ phải kiểm tra với thao tác một tay và screen reader.

## Phụ lục D — Quy tắc không phá phong cách

- Không dùng glassmorphism, neon, nền tối, gradient rainbow hoặc chart phức tạp trừ hero feature cụ thể.
- Không dùng red cho CTA chính, không dùng badge notification để tạo FOMO, không dùng leaderboard/ranking cho trẻ.
- Không dùng text link màu primary làm CTA duy nhất cho hành động quan trọng.
- Không tạo card lồng quá hai lớp; một màn không quá 3 màu accent nổi bật cùng lúc.
- Không dùng mascot trong mọi card: mascot là “người đồng hành” cho khởi đầu, loading, feedback, thành tựu và empty state — không phải decoration mặc định.
- Không đặt label chỉ trong icon nếu đó là hành động rủi ro hoặc khó đoán.

## Phụ lục E — Handoff cho designer / developer

Khi yêu cầu triển khai một màn mới, giao kèm danh sách dưới đây để tránh chỉ nhận một mockup tĩnh:

1. Mục tiêu user và primary CTA.
2. Wire order mobile, empty/loading/error/success/premium state.
3. Token chính: background, accent semantic, icon, spacing/radius, typography.
4. Quy tắc điều hướng back, close, retry, cancel và confirm.
5. Motion/sound nếu có và behavior khi reduced motion.
6. Copy cho normal, validation, success và failure.
7. Acceptance criteria theo bảng sau.

| Hạng mục | Acceptance criteria |
|---|---|
| Visual | Nunito, token màu chuẩn, card radius 24 và CTA radius 16/cao 58 khi dùng component tiêu chuẩn |
| Hierarchy | nhìn thấy title, nội dung chính và một CTA mà không cần đọc toàn màn |
| Interaction | tap target ≥48 px; async không bấm lặp; có pressed/loading/disabled state |
| State | có thiết kế riêng cho loading, error, empty và quyền/access nếu feature cần |
| Accessibility | contrast, icon+text trạng thái, semantic label ảnh cần thiết, text scale không vỡ |
| Tone | copy tích cực, không chẩn đoán, không cạnh tranh, hợp đối tượng app mới |
