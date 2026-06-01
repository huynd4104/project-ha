#!/bin/bash

# Thống báo lỗi và dừng script nếu có lệnh thất bại
set -e

echo "=== BẮT ĐẦU CÀI ĐẶT FLUTTER SDK ==="

# Clone Flutter SDK phiên bản stable với độ sâu là 1 (depth=1) để tối ưu thời gian tải
if [ ! -d "flutter-sdk" ]; then
  git clone https://github.com/flutter/flutter.git -b stable --depth 1 flutter-sdk
else
  echo "Thư mục Flutter SDK đã tồn tại, bỏ qua bước clone."
fi

# Thêm Flutter vào PATH của phiên build hiện tại
export PATH="$PATH:$(pwd)/flutter-sdk/bin"

# Xác thực cài đặt Flutter
flutter --version

# Tắt gửi dữ liệu thống kê để tối ưu hóa tốc độ build
flutter config --no-analytics

# Bật tính năng hỗ trợ build Web
flutter config --enable-web

echo "=== TẢI CÁC THƯ VIỆN DEPENDENCIES ==="
flutter pub get

echo "=== BIÊN DỊCH FLUTTER WEB (RELEASE) ==="
# Lấy API_BASE_URL từ biến môi trường Vercel, nếu không có sẽ mặc định là URL backend đã deploy trên Render
API_URL=${API_BASE_URL:-"https://project-ha-backend.onrender.com"}
echo "Sử dụng API_BASE_URL: $API_URL"
flutter build web --release --dart-define=API_BASE_URL=$API_URL

echo "=== THIẾT LẬP CẤU HÌNH VERCEL ==="
# Copy file vercel.json vào thư mục build đầu ra
cp vercel.json build/web/vercel.json

echo "=== QUY TRÌNH BUILD HOÀN TẤT THÀNH CÔNG ==="
