/**
 * 256x256 PNG と .ico ファイルを生成する（postinstall 時に自動実行）。
 * Windows では .ico が推奨される。
 */
const zlib = require('zlib');
const fs   = require('fs');
const path = require('path');

function uint32be(n) {
  const b = Buffer.alloc(4); b.writeUInt32BE(n, 0); return b;
}
function uint32le(n) {
  const b = Buffer.alloc(4); b.writeUInt32LE(n, 0); return b;
}
function uint16le(n) {
  const b = Buffer.alloc(2); b.writeUInt16LE(n, 0); return b;
}

function crc32(buf) {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[i] = c;
  }
  let crc = 0xffffffff;
  for (const b of buf) crc = t[(crc ^ b) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const t = Buffer.from(type, 'ascii');
  const l = uint32be(data.length);
  const c = uint32be(crc32(Buffer.concat([t, data])));
  return Buffer.concat([l, t, data, c]);
}

function makePng(W, H) {
  const scanlines = [];
  for (let y = 0; y < H; y++) {
    scanlines.push(0);
    for (let x = 0; x < W; x++) {
      const cx = (W - 1) / 2, cy = (H - 1) / 2;
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      const r = W / 2;
      if      (dist > r)         scanlines.push(0, 0, 0, 0);
      else if (dist > r - 3)     scanlines.push(0, 0, 0, 255);
      else if (dist < r * 0.45)  scanlines.push(255, 255, 255, 255);
      else                       scanlines.push(0, 180, 0, 255);
    }
  }
  const sig      = Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]);
  const ihdrData = Buffer.concat([uint32be(W), uint32be(H), Buffer.from([8,6,0,0,0])]);
  const idat     = zlib.deflateSync(Buffer.from(scanlines));
  return Buffer.concat([sig, pngChunk('IHDR', ihdrData), pngChunk('IDAT', idat), pngChunk('IEND', Buffer.alloc(0))]);
}

function makePngIco(pngBuf) {
  // ICO ヘッダ (1 画像)
  const header = Buffer.concat([
    uint16le(0),   // reserved
    uint16le(1),   // type: icon
    uint16le(1),   // image count
  ]);
  const dataOffset = 6 + 16; // header + 1 dir entry
  // ディレクトリエントリ (256x256 PNG)
  const dirEntry = Buffer.concat([
    Buffer.from([0, 0]),    // width=0 → 256, height=0 → 256
    Buffer.from([0, 0]),    // color count, reserved
    uint16le(1),            // planes
    uint16le(32),           // bit count
    uint32le(pngBuf.length),
    uint32le(dataOffset),
  ]);
  return Buffer.concat([header, dirEntry, pngBuf]);
}

// macOS 用 ICNS（ic08 = 256×256 PNG を 1 エントリ埋め込む）
function makeIcns(pngBuf) {
  const type = Buffer.from('ic08', 'ascii');
  const entrySize = Buffer.alloc(4);
  entrySize.writeUInt32BE(8 + pngBuf.length, 0);
  const entry = Buffer.concat([type, entrySize, pngBuf]);

  const magic     = Buffer.from('icns', 'ascii');
  const totalSize = Buffer.alloc(4);
  totalSize.writeUInt32BE(8 + entry.length, 0);
  return Buffer.concat([magic, totalSize, entry]);
}

const assetsDir = path.join(__dirname, '../assets');
if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

const png = makePng(256, 256);
fs.writeFileSync(path.join(assetsDir, 'icon.png'), png);

const ico = makePngIco(png);
fs.writeFileSync(path.join(assetsDir, 'icon.ico'), ico);

const icns = makeIcns(png);
fs.writeFileSync(path.join(assetsDir, 'icon.icns'), icns);

console.log('✓ assets/icon.png, icon.ico, icon.icns を生成しました');
