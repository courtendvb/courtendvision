/**
 * electron-packager でアプリをパッケージングする。
 * Windows / macOS を自動検出してビルドする。
 * electron-builder の winCodeSign 問題を回避し、不要ロケールを除外する。
 */
const { packager } = require('@electron/packager');
const path = require('path');
const fs   = require('fs');

const pkg      = require('../package.json');
const APP_NAME = pkg.productName || pkg.name;

const IS_MAC   = process.platform === 'darwin';
const PLATFORM = IS_MAC ? 'darwin' : 'win32';
const ARCH     = IS_MAC ? process.arch : 'x64';  // Apple Silicon: arm64 / Intel: x64

const ROOT      = path.join(__dirname, '..');
const OUT_DIR   = path.join(ROOT, 'release');
const UNPACKED  = path.join(OUT_DIR, IS_MAC ? 'mac-unpacked' : 'win-unpacked');
const ICON_FILE = IS_MAC ? 'icon.icns' : 'icon.ico';

// 残すロケール
const KEEP_LOCALES = new Set(['ja.pak', 'en-US.pak']);

if (fs.existsSync(UNPACKED)) fs.rmSync(UNPACKED, { recursive: true, force: true });

(async () => {
  console.log(`パッケージング中... (${PLATFORM}/${ARCH})`);

  const appPaths = await packager({
    dir:      ROOT,
    name:     APP_NAME,
    platform: PLATFORM,
    arch:     ARCH,
    out:      OUT_DIR,
    icon:     path.join(ROOT, `assets/${ICON_FILE}`),
    overwrite: true,
    asar:     true,

    ignore: [
      /^\/src\//,
      /^\/scripts\//,
      /^\/\.git\//,
      /^\/node_modules\//,   // asar 外の node_modules は不要
      /^\/release\//,
      /\.map$/,
    ],

    electronVersion: '29.4.6',
  });

  // 出力先フォルダをリネーム
  fs.renameSync(appPaths[0], UNPACKED);

  // マニュアルをコピー
  // Windows: exe と同階層 / macOS: .app バンドルと同階層
  for (const manual of ['MANUAL_EN.txt', 'MANUAL_JA.txt']) {
    const src = path.join(ROOT, manual);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(UNPACKED, manual));
      console.log(`✓ ${manual} をコピーしました`);
    }
  }

  // 不要ロケールを削除
  // Windows: release/win-unpacked/locales/
  // macOS:   release/mac-unpacked/{App}.app/Contents/Frameworks/Electron Framework.framework/Versions/A/Resources/
  const localesDir = IS_MAC
    ? path.join(UNPACKED, `${APP_NAME}.app`, 'Contents', 'Frameworks',
                'Electron Framework.framework', 'Versions', 'A', 'Resources')
    : path.join(UNPACKED, 'locales');

  if (fs.existsSync(localesDir)) {
    let removed = 0;
    for (const f of fs.readdirSync(localesDir)) {
      // macOS の Resources には .pak 以外も混在するので拡張子チェック必須
      if (f.endsWith('.pak') && !KEEP_LOCALES.has(f)) {
        fs.rmSync(path.join(localesDir, f));
        removed++;
      }
    }
    console.log(`✓ ロケール: ${removed} 件削除（${[...KEEP_LOCALES].join(', ')} のみ残存）`);
  }

  const sizeMB = dirSizeMB(UNPACKED);
  const label  = IS_MAC ? 'mac-unpacked' : 'win-unpacked';
  console.log(`✓ パッケージ完了: release/${label}  (${sizeMB} MB)`);
})().catch(err => {
  console.error(err);
  process.exit(1);
});

function dirSizeMB(dir) {
  let total = 0;
  for (const f of walkFiles(dir)) total += fs.statSync(f).size;
  return (total / 1024 / 1024).toFixed(1);
}

function* walkFiles(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) yield* walkFiles(full);
    else yield full;
  }
}
