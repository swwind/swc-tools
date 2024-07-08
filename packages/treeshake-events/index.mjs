import { fileURLToPath } from "node:url";
export const wasm = fileURLToPath(
  new URL("./treeshake_events.wasm", import.meta.url)
);
export default function (options) {
  return [wasm, options ?? {}];
}
