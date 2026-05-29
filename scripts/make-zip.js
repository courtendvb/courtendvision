/**
 * win-unpacked / mac-unpacked を ZIP にまとめて配布パッケージを生成する。
 * Windows: PowerShell Compress-Archive / macOS: zip コマンドを使用。
 */
const { execSync } = require('child_process');
const path = require('path');
const fs   = require('fs');

const pkg      = require('../package.json');
const version  = pkg.version;
const name     = pkg.productName || pkg.name;

const IS_MAC      = process.platform === 'darwin';
const unpackedDir = IS_MAC ? 'mac-unpacked' : 'win-unpacked';
const platformTag = IS_MAC ? `mac-${process.arch}` : 'win64';

const releaseDir  = path.join(__dirname, '../release');
const src         = path.join(releaseDir, unpackedDir);
const dst         = path.join(releaseDir, `${name.replace(/ /g, '-')}-${version}-${platformTag}.zip`);

if (!fs.existsSync(src)) {
  console.error(`ERROR: release/${unpackedDir} が見つかりません。npm run pack を先に実行してください。`);
  process.exit(1);
}

if (fs.existsSync(dst)) fs.unlinkSync(dst);

// unpacked フォルダを製品名フォルダに一時リネームしてから ZIP にする
// → 展開すると "CourtEnd Vision/" 1 フォルダにまとまる
const folderName  = name;                    // "CourtEnd Vision"
const namedFolder = path.join(releaseDir, folderName);

if (fs.existsSync(namedFolder)) fs.rmSync(namedFolder, { recursive: true, force: true });
fs.renameSync(src, namedFolder);

// macOS: アプリに ad-hoc 署名を付与（"壊れている"エラーを回避）
if (IS_MAC) {
  const appPath = path.join(namedFolder, `${name}.app`);
  if (fs.existsSync(appPath)) {
    console.log('署名中 (ad-hoc)...');
    execSync(`codesign --deep --force --sign - '${appPath}'`, { stdio: 'inherit' });
  }
}

// フォルダごと圧縮（プラットフォーム別コマンド）
console.log('ZIP を作成中...');
if (IS_MAC) {
  // ditto: シンボリックリンク・パーミッション・拡張属性をすべて保持
  execSync(`ditto -c -k --sequesterRsrc --keepParent '${namedFolder}' '${dst}'`, { stdio: 'inherit' });
} else {
  // Windows: PowerShell Compress-Archive
  const cmd = `powershell -Command "Compress-Archive -Path '${namedFolder}' -DestinationPath '${dst}'"`;
  execSync(cmd, { stdio: 'inherit' });
}

// 元のフォルダ名に戻す（後続の npm run pack が上書きできるよう）
fs.renameSync(namedFolder, src);

const size = (fs.statSync(dst).size / 1024 / 1024).toFixed(1);
console.log(`✓ 配布パッケージ: release/${path.basename(dst)} (${size} MB)`);
