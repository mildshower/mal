const { MalValue } = require("./types");

const pr_str = (ast, print_readably) => {
  return ast instanceof MalValue ? ast.asString(print_readably) : ast.toString();
};

module.exports = { pr_str };
