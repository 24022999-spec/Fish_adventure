# 🐟 Darwin's Adventure

Game khám phá đại dương 3D được xây dựng bằng Three.js và Vite.

---

## Yêu cầu hệ thống

- [Node.js](https://nodejs.org/) phiên bản **18** trở lên
- npm (đi kèm với Node.js)

---

## Cài đặt

**1. Clone repository**

```bash
git clone https://github.com/24022999-spec/Darwin-s-adventure.git
cd Darwin-s-adventure
```

**2. Cài đặt dependencies**

```bash
npm install
```

---

## Chạy ở môi trường Development

```bash
npm run dev
```

Mở trình duyệt và truy cập: `http://localhost:5173`

---

## Build để deploy

```bash
npm run build
```

File build sẽ được xuất ra thư mục `dist/`.

**Xem trước bản build:**

```bash
npm run preview
```

---

## Deploy lên GitHub Pages

Game đã được cấu hình sẵn để deploy lên GitHub Pages tại:

```
https://24022999-spec.github.io/Darwin-s-adventure/
```

Để deploy, push code lên nhánh `main` và bật GitHub Pages trong phần **Settings → Pages → Source: GitHub Actions** (hoặc dùng nhánh `gh-pages` tuỳ cấu hình).

---

## Cấu trúc thư mục

```
finn-game/
├── public/
│   ├── assets/              # Models 3D, textures, âm thanh
│   ├── minigame1/           # Minigame "Vượt qua con đường nguy hiểm"
│   ├── minigame2/           # Minigame "Deep Sea Maze"
│   ├── Happy.png            # Ảnh Happy Ending
│   ├── Sashimi.png          # Ảnh Sashimi Ending
│   ├── wall.jpg             # Texture tường biên map
│   ├── start-screen.png     # Ảnh màn hình chờ
│   └── PixelViet.ttf        # Font chữ
├── src/
│   ├── main.js              # Entry point & màn hình Start
│   ├── Game.js              # Game loop chính
│   ├── Player.js            # Nhân vật người chơi
│   ├── CharacterManager.js  # Quản lý NPC
│   ├── QuestSystem.js       # Hệ thống quest Linh
│   ├── MainQuestPanel.js    # Bảng nhiệm vụ tổng
│   ├── MiniGameManager.js   # Quản lý iframe minigame
│   ├── CollectibleManager.js# Hệ thống thu thập donut
│   ├── EndingScreen.js      # Màn hình kết thúc
│   ├── AudioManager.js      # Quản lý âm thanh
│   └── assetUrl.js          # Helper đường dẫn asset
├── vite.config.js
└── package.json
```

---

## Điều khiển

| Phím | Hành động |
|------|-----------|
| `W A S D` | Di chuyển |
| `Chuột` | Xoay camera |
| `Scroll` | Zoom in / out |
| `E` | Nói chuyện với NPC |
| `Space` | Boost |
| `ESC` | Thoát minigame / Tạm dừng |
| `L` | Skip minigame (tính hoàn thành) |

---

## Gameplay

1. Bơi đến gặp **Khánh** để nhận nhiệm vụ tổng
2. Hoàn thành 4 nhiệm vụ phụ:
   - **SpongeBob** — Tìm Gary
   - **Linh** — Vượt qua con đường nguy hiểm (Minigame 1)
   - **Đạt** — Giúp tìm món quà (Minigame 2)
   - **Hùng** — Thu thập donut bị rơi
3. Quay lại nói chuyện với Khánh để mở **Happy Ending**
4. Tránh xa lưới câu để không dính **Sashimi Ending** 🎣
