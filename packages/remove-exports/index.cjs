const path = require("node:path");
const wasmPath = path.join(__dirname, "./remove_exports.wasm");
module.exports = {
  wasm: wasmPath,
  default: function (options) {
    return [wasmPath, options || {}];
  },
};
