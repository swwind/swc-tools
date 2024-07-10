const path = require("node:path");
const wasmPath = path.join(__dirname, "./treeshake_events.wasm");
module.exports = {
  wasm: wasmPath,
  default: function (options) {
    return [wasmPath, options || {}];
  },
};
