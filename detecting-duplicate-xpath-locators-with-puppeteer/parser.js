import fs from "fs";
import { Parser } from "acorn";

function getLocatorsFromFile(filePath) {
  const code = fs.readFileSync(filePath, "utf-8");
  const ast = Parser.parse(code, { ecmaVersion: 2020 });

  let locators = [];

  function traverse(node, parent) {
    if (Array.isArray(node)) {
      node.forEach((child) => traverse(child, parent));
      return;
    }

    if (node && typeof node === "object") {
      if (
        node.type === "CallExpression" &&
        node.callee.type === "MemberExpression"
      ) {
        const pageObject = node.callee.object;
        if (
          pageObject.type === "MemberExpression" &&
          pageObject.object.type === "ThisExpression" &&
          pageObject.property.name === "page"
        ) {
          const argument = node.arguments[0];
          if (argument.type === "TemplateLiteral") {
            const functionName =
              parent && parent.key && parent.key.name ? parent.key.name : ""; // Get function name from parent (getter name)
            locators.push({
              name: functionName,
              value: argument.quasis
                .map((quasi) => quasi.value.cooked)
                .join(""), // Get the complete XPath value
            });
          }
        }
      }

      for (let key in node) {
        if (node[key] && typeof node[key] === "object") {
          traverse(node[key], parent);
        }
      }
    }
  }

  ast.body.forEach((node) => {
    if (node.type === "ClassDeclaration") {
      node.body.body.forEach((method) => {
        if (method.kind === "get") {
          traverse(method.value.body, method);
        }
      });
    }
  });

  return locators;
}

export { getLocatorsFromFile };
