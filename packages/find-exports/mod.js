/**
 * @typedef {Object} Found
 * @property {string} callee
 * @property {string} name
 */

/**
 * @param {import("@swc/core").Program} ast
 * @param {string[]} funcs
 * @returns {Found[]}
 */
export function find(ast, funcs) {
  /** @type {Found[]} */
  const found = [];

  if (ast.type === "Module") {
    for (const item of ast.body) {
      if (
        item.type === "ExportDeclaration" &&
        item.declaration.type === "VariableDeclaration"
      ) {
        for (const decl of item.declaration.declarations) {
          if (decl.id.type === "Identifier") {
            const name = decl.id.value;
            if (
              decl.init &&
              decl.init.type === "CallExpression" &&
              decl.init.callee.type === "Identifier" &&
              funcs.includes(decl.init.callee.value)
            ) {
              found.push({ callee: decl.init.callee.value, name });
            }
          }
        }
      }
    }
  }

  return found;
}
