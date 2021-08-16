const pr_str = (ast, print_readably) => {
  return ast.asString ? ast.asString(print_readably) : ast.toString();
};

module.exports = { pr_str };
