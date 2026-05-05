// Prefix đường dẫn asset với BASE_URL (để hoạt động cả dev lẫn GitHub Pages)
const BASE = import.meta.env.BASE_URL  // '/' khi dev, '/Darwin-s-adventure/' khi build

export const assetUrl = (path) => BASE + path.replace(/^\//, '')
