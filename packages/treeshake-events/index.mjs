import { fileURLToPath } from "node:url";
export default fileURLToPath(
  new URL("./treeshake_events.wasm", import.meta.url)
);
