# Darwin's Adventure

Game khám phá đại dương 3D được xây dựng bằng **Three.js** và **Vite**. Người chơi hóa thân thành chú cá Darwin, bơi lội dưới đáy biển, nói chuyện với các NPC và hoàn thành nhiệm vụ để tham dự tiệc sinh nhật của Khánh.

**Play:** https://24022999-spec.github.io/Darwin-s_adventure/

---

## Công nghệ

| | |
|---|---|
| Render | [Three.js](https://threejs.org/) r176 |
| Build tool | [Vite](https://vitejs.dev/) v8 |
| Ngôn ngữ | JavaScript (ES Modules) |
| Deploy | GitHub Pages + GitHub Actions |
| Asset lớn | Git LFS (`map.glb` 241 MB) |

---

## Cài đặt & chạy local

**Yêu cầu:** Node.js ≥ 18, npm, git-lfs

```bash
# Clone (bao gồm LFS files)
git clone https://github.com/24022999-spec/Darwin-s_adventure.git
cd Darwin-s_adventure
git lfs pull

# Cài dependencies
npm install

# Dev server
npm run dev
# → http://localhost:5173
```

```bash
# Build production
npm run build

# Xem trước bản build
npm run preview
```

---

## Deploy

Push lên nhánh `main` → GitHub Actions tự động build và deploy lên GitHub Pages.

Yêu cầu GitHub Pages phải được cấu hình: **Settings → Pages → Source: GitHub Actions**

---

## Cấu trúc dự án

```
Darwin-s_adventure/
├── public/
│   ├── assets/
│   │   ├── models/              # GLB models (player, NPC, donut, map...)
│   │   ├── sounds/              # BGM và sound effects
│   │   └── textures/            # sky.hdr, water.jpg
│   ├── minigame1/               # Minigame "Vượt qua con đường nguy hiểm"
│   │   └── src/                 # JS riêng của minigame (không qua Vite)
│   ├── minigame2/               # Minigame "Giúp Đạt tìm món quà"
│   ├── PixelViet.ttf            # Font chính của game
│   ├── start-screen.png         # Ảnh nền màn hình Start
│   ├── pop-up.png               # Ảnh Introduction popup
│   ├── Happy.png / Sashimi.png  # Ảnh màn hình kết thúc
│   └── wall.jpg                 # Texture tường biển
├── src/
│   ├── main.js                  # Entry point, màn hình Start, loading flow
│   ├── LoadingScreen.js         # Loading screen với progress bar
│   ├── Game.js                  # Game loop và khởi tạo toàn bộ hệ thống
│   ├── Player.js                # Điều khiển và model nhân vật
│   ├── ThirdPersonCamera.js     # Camera bám theo nhân vật
│   ├── InputManager.js          # Quản lý input bàn phím/chuột
│   ├── CharacterManager.js      # NPC: load model, dialogue, quest trigger
│   ├── QuestGiver.js            # NPC Linh — mở Minigame 1
│   ├── QuestSystem.js           # Hệ thống quest tổng
│   ├── MainQuestPanel.js        # Bảng theo dõi nhiệm vụ góc phải
│   ├── MiniGameManager.js       # Iframe overlay cho minigame
│   ├── CollectibleManager.js    # Spawn và thu thập donut
│   ├── SeaFloor.js              # Địa hình đáy biển (Simplex Noise)
│   ├── SeaDecorations.js        # Load map.glb, animations môi trường
│   ├── AudioManager.js          # BGM và sound effects
│   ├── ParticleSystem.js        # Hiệu ứng bong bóng
│   ├── Minimap.js               # Minimap góc phải
│   ├── UIManager.js             # HUD: score, FPS counter
│   ├── EndingScreen.js          # Màn hình Happy / Sashimi Ending
│   ├── assetUrl.js              # Helper đường dẫn asset (dev vs production)
│   ├── constants.js             # Hằng số game (speed, map size...)
│   └── utils.js                 # Tiện ích chung
├── .github/workflows/deploy.yml # CI/CD GitHub Actions
├── .gitattributes               # Git LFS tracking (map.glb)
├── vite.config.js
└── package.json
```

---

## Điều khiển

| Phím / Chuột | Hành động |
|---|---|
| `W A S D` | Di chuyển |
| Di chuyển chuột | Xoay camera |
| Scroll chuột | Zoom in / out |
| `E` | Tương tác / Nói chuyện với NPC |
| `Space` (giữ) | Boost |
| `ESC` | Thoát minigame |

---

## Gameplay

```
Bắt đầu → Gặp Khánh → Nhận 4 nhiệm vụ → Hoàn thành → Happy Ending
                                                    ↘ Dính lưới → Sashimi Ending
```

| NPC | Nhiệm vụ |
|---|---|
| **Khánh** | Nhận nhiệm vụ tổng / kích hoạt Happy Ending |
| **SpongeBob** | Tìm Gary đang bị lạc |
| **Linh** | Vượt qua con đường nguy hiểm — **Minigame 1** |
| **Đạt** | Giúp tìm món quà bị rơi — **Minigame 2** |
| **Hùng** | Thu thập lại 10 donut bị rơi |

Chạm vào **lưới câu của tàu** trước khi hoàn thành tất cả nhiệm vụ → **Sashimi Ending**.

---

## Kiến trúc nhanh

- **Asset loading:** `THREE.DefaultLoadingManager` track tất cả loader (GLTFLoader, RGBELoader, TextureLoader). `LoadingScreen` lắng nghe `onProgress` / `onLoad` để hiển thị tiến độ.
- **Asset paths:** `assetUrl.js` dùng `import.meta.env.BASE_URL` để tạo đường dẫn đúng cả khi dev (`/`) lẫn production (`/Darwin-s_adventure/`).
- **Minigame:** Mỗi minigame là một trang HTML độc lập, được nhúng qua `<iframe>` bởi `MiniGameManager`. Giao tiếp với game chính bằng `postMessage`.
- **Terrain:** `SeaFloor` dùng Simplex Noise để tạo địa hình đáy biển ngẫu nhiên. `Player` căn Y theo terrain height tại vị trí hiện tại.
- **Git LFS:** Chỉ `map.glb` (241 MB) còn trong LFS. Các GLB nhỏ hơn được commit trực tiếp vào git để tránh vấn đề bandwidth GitHub Actions.
