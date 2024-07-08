export interface PluginOptions {
  /** jsx function name. Defaults to `jsx`, `jsxs` and `jsxDEV` */
  jsxs?: string[];
  /** regex to match property names if need to remove. Defaults to `^on[A-Z]` */
  matches?: string[];
}
/** file path of the wasm file */
export declare const wasm: string;
/** Remove specific properties from generated jsx function calls. */
declare function func(
  options?: PluginOptions | undefined
): [string, PluginOptions];
export default func;
