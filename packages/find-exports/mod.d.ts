import type { Program } from "@swc/core";

export type Found = {
  callee: string;
  name: string;
};

export declare function find(ast: Program, funcs: string[]): Found[];
