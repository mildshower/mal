const readline = require("readline");
const { read_str: Reader } = require("./reader");
const { pr_str } = require("./printer");
const { List, Str, Symbol, Vector, HashMap, Keyword, Nil } = require("./types");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const repl_env = {
  "+": (...numbers) => numbers.reduce((total, num) => total + num, 0),
  "-": (...numbers) =>
    numbers.slice(1).reduce((sub, num) => sub - num, numbers[0]),
  "*": (...numbers) => numbers.reduce((total, num) => total * num, 1),
  "/": (...numbers) =>
    numbers.slice(1).reduce((div, num) => div / num, numbers[0]),
  pi: Math.PI,
};

const eval_ast = (ast, env) => {
  if (ast instanceof Symbol) {
    const value = env[ast.symbol];
    if (value === undefined) throw new Error("Not defined");
    return value;
  }

  if (ast instanceof List) {
    const resolvedList = ast.list.map((e) => EVAL(e, env));
    return new List(resolvedList);
  }

  if (ast instanceof Vector) {
    const resolvedVector = ast.vector.map((e) => EVAL(e, env));
    return new Vector(resolvedVector);
  }

  if (ast instanceof HashMap) {
    const resolvedHashMap = ast.toKeyValues().map((e) => EVAL(e, env));
    return new HashMap(resolvedHashMap);
  }

  return ast;
};

const READ = (str) => {
  return Reader(str);
};

const EVAL = (ast, env) => {
  if (!(ast instanceof List)) return eval_ast(ast, env);

  if (ast.isEmpty()) return ast;

  const resolvedList = eval_ast(ast, env);
  const firstElement = resolvedList.list[0];
  return firstElement.apply(null, resolvedList.list.slice(1));
};

const PRINT = (ast) => {
  return pr_str(ast, true);
};

const rep = (str) => {
  return PRINT(EVAL(READ(str), repl_env));
};

const loop = () => {
  rl.question("user> ", (str) => {
    try {
      console.log(rep(str));
    } catch (e) {
      console.log(e.message);
    } finally {
      loop();
    }
  });
};

loop();
