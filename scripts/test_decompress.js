const fs = require('fs');
const zlib = require('zlib');

const pbFile = "C:\\Users\\LENOVO\\.gemini\\antigravity\\conversations\\303ec78b-5e5d-40f5-a60e-af34fe7d1495.pb";
const buffer = fs.readFileSync(pbFile);

console.log("File size:", buffer.length);

function tryDecompress(name, fn) {
  try {
    const decompressed = fn(buffer);
    console.log(`Success with ${name}! Decompressed size: ${decompressed.length}`);
    fs.writeFileSync(`scratch/decompressed_${name}.bin`, decompressed);
    // Search in decompressed
    const idx = decompressed.indexOf("Warehouse");
    console.log(`Search for "Warehouse" in decompressed_${name}: index = ${idx}`);
  } catch (err) {
    console.log(`Failed with ${name}: ${err.message}`);
  }
}

tryDecompress("gunzip", zlib.gunzipSync);
tryDecompress("inflate", zlib.inflateSync);
tryDecompress("brotli", zlib.brotliDecompressSync);
tryDecompress("unzip", (buf) => zlib.unzipSync(buf));
tryDecompress("inflateRaw", zlib.inflateRawSync);
