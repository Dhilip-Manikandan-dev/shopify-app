const fs = require("fs");
const path = require("path");

const distDir = path.join(__dirname, "dist");
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Minimal valid WebAssembly module: '\0asm' version 1
const wasmHeader = Buffer.from([0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00]);
fs.writeFileSync(path.join(distDir, "function.wasm"), wasmHeader);
console.log("Built dist/function.wasm successfully");
