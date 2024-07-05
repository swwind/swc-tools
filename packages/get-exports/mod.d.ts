import type { Program } from "@swc/core";

type ExportIdent = { type: "ident"; name: string };
type ExportStr = { type: "str"; name: string };
type ExportDefault = { type: "default" };

export type Export = ExportIdent | ExportStr | ExportDefault;

export declare function get(ast: Program): Export[];
