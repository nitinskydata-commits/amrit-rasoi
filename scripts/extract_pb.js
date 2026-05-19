const fs = require('fs');
const path = require('path');

const pbFile = "C:\\Users\\LENOVO\\.gemini\\antigravity\\conversations\\303ec78b-5e5d-40f5-a60e-af34fe7d1495.pb";
const buffer = fs.readFileSync(pbFile);

function search(term) {
  console.log(`Searching for term: "${term}"`);
  const utf8Bytes = Buffer.from(term, 'utf8');
  const utf16Bytes = Buffer.from(term, 'utf16le');
  
  const idxUtf8 = buffer.indexOf(utf8Bytes);
  const idxUtf16 = buffer.indexOf(utf16Bytes);
  
  console.log(`UTF-8 index: ${idxUtf8}`);
  console.log(`UTF-16 index: ${idxUtf16}`);
}

search("VendorPayouts");
search("Warehouses");
search("Finance");
search("write_to_file");
