/**
 * @typedef {Object} ExportIdent
 * @property {"ident"} type
 * @property {string} name
 */

/**
 * @typedef {Object} ExportStr
 * @property {"str"} type
 * @property {string} name
 */

/**
 * @typedef {Object} ExportDefault
 * @property {"default"} type
 */

/**
 * @typedef {ExportIdent | ExportStr | ExportDefault} Export
 */

/**
 * @param {import("@swc/core").Identifier} id
 * @returns {ExportIdent}
 */
function identifier(id) {
  return {
    type: "ident",
    name: id.value,
  };
}

/**
 * @param {import("@swc/core").Pattern} pat
 * @returns {ExportIdent[]}
 */
function pattern(pat) {
  switch (pat.type) {
    case "Identifier":
      return [{ type: "ident", name: pat.value }];
    case "ArrayPattern":
      return pat.elements.filter((x) => x != null).flatMap((x) => pattern(x));
    case "RestElement":
      return pattern(pat.argument);
    case "ObjectPattern":
      return pat.properties.flatMap((x) => {
        switch (x.type) {
          case "AssignmentPatternProperty":
            return [identifier(x.key)];
          case "KeyValuePatternProperty":
            return pattern(x.value);
          case "RestElement":
            return pattern(x.argument);
        }
      });
    case "AssignmentPattern":
      return pattern(pat.left);
    default:
      return [];
  }
}

/**
 * @param {import("@swc/core").ModuleExportName} name
 * @return {Export}
 */
function module_export_name(name) {
  switch (name.type) {
    case "Identifier":
      return name.value === "default"
        ? { type: "default" }
        : { type: "ident", name: name.value };
    case "StringLiteral":
      return { type: "str", name: name.value };
  }
}

/**
 * @param {import("@swc/core").Program} ast
 * @returns {Export[]}
 */
export function get(ast) {
  /** @type {Export[]} */
  const exports = [];

  if (ast.type === "Module") {
    for (const item of ast.body) {
      switch (item.type) {
        case "ExportDefaultDeclaration":
          if (
            item.decl.type === "ClassExpression" ||
            (item.decl.type === "FunctionExpression" && item.decl.body)
          ) {
            exports.push({ type: "default" });
          }
          break;

        case "ExportDefaultExpression":
          exports.push({ type: "default" });
          break;

        case "ExportDeclaration":
          switch (item.declaration.type) {
            // export class name {}
            case "ClassDeclaration":
              if (!item.declaration.declare) {
                exports.push(identifier(item.declaration.identifier));
              }
              break;
            // export function name() {}
            case "FunctionDeclaration":
              if (!item.declaration.declare && item.declaration.body) {
                exports.push(identifier(item.declaration.identifier));
              }
              break;
            // export const name = value;
            // export var name = value;
            // export let name = value;
            case "VariableDeclaration":
              if (!item.declaration.declare) {
                for (const decl of item.declaration.declarations) {
                  exports.push(...pattern(decl.id));
                }
              }
              break;
            // export enum name {}
            case "TsEnumDeclaration":
              if (!item.declaration.declare) {
                exports.push(identifier(item.declaration.id));
              }
              break;
            // ignore
            default:
              break;
          }
          break;

        case "ExportNamedDeclaration":
          for (const spec of item.specifiers) {
            switch (spec.type) {
              // export * as xxx from "xxx"
              case "ExportNamespaceSpecifier":
                exports.push(module_export_name(spec.name));
                break;
              // export xxx from "xxx"
              case "ExportDefaultSpecifier":
                exports.push(identifier(spec.exported));
                break;
              // export { foo } from "xxx"
              // export { foo as bar } from "xxx"
              case "ExportSpecifier":
                if (spec.exported) {
                  exports.push(module_export_name(spec.exported));
                } else {
                  exports.push(module_export_name(spec.orig));
                }
                break;
            }
          }
          break;
      }
    }
  }

  return exports;
}
