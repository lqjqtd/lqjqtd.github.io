# 索的拼图 - 开发日志

## 2026-07-25 工作记录

### 已完成

#### 修复与优化
1. **字体大小问题修复**
   - `html { font-size: 18px; }` → `16px`，解决按钮中间提示文字变大挤走下一步按钮的问题
   - 添加 `floating-label` CSS 类强制提示文字样式（12px、不换行）

2. **应用名称变更**
   - 从"简单拼图"改为"索的拼图"
   - 更新 `index.html`、`i18n.js`、`README.md` 中的标题

3. **开关控件可见性修复**
   - 在 `tailwind.css` 中添加缺失的 Tailwind 类：`.w-10`、`.h-5`、`.w-4`、`.h-4`、`.left-0.5`
   - 修复"纵向拼接"前面的开关按钮不可见问题

4. **文本优化**
   - "点击高亮微调接缝" → "点击红线微调"（更直观描述接缝显示方式）
   - 英文同步更新："Tap seam to tune" → "Tap red line to tune"

5. **安装按钮行为优化**
   - 点击后立即隐藏按钮，避免静默失败时按钮一直显示
   - 添加 `try-catch` 捕获 `prompt()` 失败
   - 失败时显示 Toast 引导用户通过浏览器菜单手动添加到主屏幕

6. **Service Worker 版本管理**
   - 每次修改后手动递增 VERSION 常量，确保缓存更新

7. **部署文档**
   - 整理群辉 NAS Web Station 部署指南
   - 强调 HTTPS 是 PWA 功能正常工作的前提

---

### 2026-07-23 工作记录

#### 已完成

#### P0 - 安卓移动端核心优化
1. **视口与安全区适配**
   - 100vh → 100dvh（动态视口高度，兼容安卓 Chrome 地址栏收起）
   - viewport 加 `viewport-fit=cover`
   - 浮动按钮和顶部元素加 `env(safe-area-inset-*)` 适配刘海屏/手势条
   - 浮动面板宽度自适应 `min(350px, calc(100vw-2rem))`

2. **缩略图降采样 + 导出降级**
   - 用 `createImageBitmap` 生成 320px 缩略图，防止大图 OOM
   - 导出尺寸按 `navigator.deviceMemory` 降级（4GB→4096 / 8GB→8192）
   - Canvas DPR 限制 ≤2，减轻预览渲染压力
   - `imageSmoothingQuality` 'high'→'medium'
   - 顺手修复 `substr`→`slice`、`onerror` 兜底、`removeImage` 释放 thumbUrl

3. **HEIC + EXIF 方向处理**
   - 过滤 HEIC/HEIF 格式并给出友好提示
   - `createImageBitmap` 显式传 `imageOrientation: 'from-image'`
   - 删除按钮加 `role="button"` + `aria-label`

4. **安卓 Back 键**
   - History API 接管返回键：Step3→Step2→取消接缝编辑→Step1
   - `popstate` 事件模拟对应返回按钮逻辑

#### P1 - 体验优化
1. **安装按钮**（beforeinstallprompt）
   - 空状态显示"添加到桌面"按钮，点击触发 PWA 安装
   - 仅在浏览器触发 `beforeinstallprompt` 时显示

2. **脏标志渲染**
   - 无操作时 CPU 空闲，不再每帧重绘
   - 状态变更时标记 dirty 才渲染，省电不发热

3. **SW 缓存更新机制**
   - SW 层自动给 .css/.js/.svg 请求加版本号 query 做 cache-busting
   - 检测到新版本时弹 toast 提示"发现新版本，点击刷新"
   - 每小时自动检查更新

#### UI 调整
- 去掉顶部 github / 个人主页链接
- 浮动面板从 `justify-between` 改为 `gap-3` 紧凑布局
- 按钮高度固定 20px（约 1.2cm），字体 12px
- 方向/接缝提示文字与按钮文字统一 12px
- 文字强制不换行（内联样式，兼容小米浏览器）

#### 已尝试但放弃
- **Web Share API 导出**：小米/UC 等国产浏览器不支持
- **复制图片到剪贴板**：同上，Clipboard API 兼容性存疑
- **导出下拉菜单**：因分享/复制都不可用，改回单个导出按钮

---

### 待办清单

#### 🔴 P2 - 体验优化（推荐优先做）

| # | 项目 | 说明 | 预计工作量 |
|---|---|---|---|
| 1 | 撤销/重做 | 接缝微调、裁剪等操作误操作后能回退 | 中 |
| 2 | Step2 追加图片 | 拼接中途可以加图，不用退回第一步重来 | 中 |
| 3 | 图片旋转 | 单张图片可旋转 90°/180°/270° 后再拼 | 中 |
| 4 | 导出进度条 | 长图导出时显示进度，不会以为卡死了 | 小 |
| 5 | 旋转屏保留视图 | 横竖屏切换时不重置当前查看的位置 | 小 |
| 6 | 触觉反馈补全 | 接缝/裁剪/导出完成时振动一下 | 小 |

#### 🟡 P3 - 性能与代码质量

| # | 项目 | 说明 | 预计工作量 |
|---|---|---|---|
| 7 | resize 防抖 | 窗口 resize 时高频触发重绘，加 debounce | 小 |
| 8 | 拖拽滚动提速 | 手机上拖拽缩略图自动滚动太慢，提高上限 | 小 |
| 9 | 移除原生 draggable 改 Pointer Events | 安卓上原生拖拽可能触发系统菜单 | 中 |
| 10 | 缩略图全量重建优化 | 排序后 `innerHTML=''` 全量重建，改 diff 或移动 DOM | 中 |
| 11 | 接缝预览裁切相邻接缝 | `renderSeamAdjust` 不裁剪相邻 overlap，预览有多余部分 | 小 |

#### 🟢 P3 - 功能增强

| # | 项目 | 说明 | 预计工作量 |
|---|---|---|---|
| 12 | 导出格式选项 | PNG / JPEG / WebP + 质量参数 | 中 |
| 13 | 文件名自定义 | 导出时可输入文件名 | 小 |
| 14 | 裁剪框可拖动 | 拖裁剪框内部直接移动整个框（现在是移动相机） | 小 |
| 15 | 键盘快捷键 | Esc 取消、方向键微调接缝、数字键切接缝等 | 中 |
| 16 | 相机直拍入口 | `<input capture="environment">` 直接拍照拼接 | 小 |

#### ⚪ P3 - 可访问性与规范

| # | 项目 | 说明 | 预计工作量 |
|---|---|---|---|
| 17 | aria-label 补全 | 删除按钮、开关等图标控件加无障碍标签 | 小 |
| 18 | 缩略图键盘导航 | 键盘可排序、删除 | 大 |
| 19 | 去掉 user-scalable=no | 现代浏览器无视此声明，反而可能和应用内手势冲突 | 小 |
| 20 | i18n 拆分 JSON | 翻译条目多时拆成 JSON 文件异步加载 | 中 |
| 21 | ESLint + 单测 | 核心算法加单元测试 | 大 |

---

### 已知浏览器兼容性

| 功能 | Chrome | 夸克 | 小米浏览器 | UC | 华为浏览器 |
|---|---|---|---|---|---|
| Web Share API | ✅ | ✅ | ❌ | ❓ | ❓ |
| Clipboard API (图片) | ✅ | ❓ | ❓ | ❓ | ❓ |
| beforeinstallprompt | ✅ | ❌ | ❌ | ❌ | ✅（显示按钮但 prompt 可能失败） |
| importmap | ✅ | ✅ | ❌ | ❓ | ❓ |
| createImageBitmap | ✅ | ✅ | ✅ | ✅ | ✅ |
| 本地 CSS 样式 | ✅ | ✅ | ✅ | ✅ | ✅ |

---

### 部署说明

#### GitHub Pages
- 远程仓库：https://github.com/lqjqtd/lqjqtd.github.io
- 部署方式：GitHub Actions 自动将 `app/` 目录部署到 Pages
- `sw.js` 中的 `BUILD_TIME_PLACEHOLDER` 在构建时替换为时间戳

#### 群辉 NAS (Web Station)
- 部署路径：将 `app/` 目录内容复制到 Web Station 文档根目录下（如 `/volume1/web/stitcher/`）
- **必须配置 HTTPS**：PWA 功能（Service Worker、离线模式、安装提示）需要 HTTPS
- 手动更新时需修改 `sw.js` 的 `VERSION` 常量触发缓存更新
- 排除文件：不要上传 `_tmp_sw.js`