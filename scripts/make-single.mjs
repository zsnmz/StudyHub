/* 把静态 SPA 打包成可单独打开 / 上传的单个 HTML。
 * 用法：
 *   node scripts/make-single.mjs                 # 默认去掉 sync.js，适合 html.cafe 等纯静态托管
 *   node scripts/make-single.mjs --keep-sync     # 保留 sync.js（同源部署时可用）
 *   node scripts/make-single.mjs --out 文件名.html
 * 说明：CSS 与所有 <script src> 都会内联；音频已经是 data URI，无需额外处理。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const keepSync = args.includes('--keep-sync');
const outIndex = args.indexOf('--out');
const outFile = path.resolve(root, outIndex >= 0 && args[outIndex + 1] ? args[outIndex + 1] : 'studyhub-single.html');

let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const cssPath = path.join(root, 'assets/css/app.css');
const css = fs.readFileSync(cssPath, 'utf8');
html = html.replace(
  '<link rel="stylesheet" href="assets/css/app.css">',
  '<style>\n' + css + '\n</style>'
);

if (!keepSync) {
  html = html.replace(/\s*<script[^>]*src="assets\/js\/sync\.js"[^>]*><\/script>/, '');
  html = html.replace(
    '本地优先 · 云端同步可选 · 数据保存在本机与服务端 SQLite · 解析不联网',
    '单文件版 · 数据保存在本机浏览器 · 可导出 JSON 备份'
  );
}

let count = 0;
html = html.replace(/<script[^>]*src="([^"]+)"[^>]*><\/script>/g, function (match, src) {
  const file = path.join(root, src.replace(/\//g, path.sep));
  if (!fs.existsSync(file)) throw new Error('找不到脚本：' + src);
  count++;
  return '<script>\n' + fs.readFileSync(file, 'utf8') + '\n</script>';
});

if (/<script[^>]+src=/.test(html)) throw new Error('仍有未内联的 script src');
if (/<link[^>]+href="assets\//.test(html)) throw new Error('仍有未内联的样式引用');

fs.writeFileSync(outFile, html, 'utf8');
console.log('已生成：' + outFile);
console.log('大小：' + (Buffer.byteLength(html) / 1024).toFixed(1) + ' KB；内联脚本 ' + count + ' 个；sync.js ' + (keepSync ? '保留' : '已移除'));