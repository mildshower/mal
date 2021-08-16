const readline = require("readline");
const Reader = require("./reader");
const { pr_str } = require("./printer");
const { List, Str, Symbol, Vector, HashMap, Keyword, Nil } = require("./types");
const { Env } = require("./env");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const repl_env = new Env(null);

repl_env.set(new Symbol("+"), (...numbers) =>
  numbers.reduce((total, num) => total + num, 0)
);
repl_env.set(new Symbol("-"), (...numbers) =>
  numbers.slice(1).reduce((sub, num) => sub - num, numbers[0])
);
repl_env.set(new Symbol("*"), (...numbers) =>
  numbers.reduce((total, num) => total * num, 1)
);
repl_env.set(new Symbol("/"), (...numbers) =>
  numbers.slice(1).reduce((div, num) => div / num, numbers[0])
);
repl_env.set(new Symbol("pi"), Math.PI);

const eval_ast = (ast, env) => {
  if (ast instanceof Symbol) {
    return env.get(ast);
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

  const firstElement = ast.list[0].symbol;

  switch (firstElement) {
    case "def!":
      const evaluatedValue = EVAL(ast.list[2], env);
      env.set(ast.list[1], evaluatedValue);
      return evaluatedValue;

    case "let*":
      const enclosedEnv = new Env(env);
      const keyValues = ast.list[1].list || ast.list[1].vector;

      for (let i = 0; i < keyValues.length; i += 2) {
        enclosedEnv.set(keyValues[i], EVAL(keyValues[i + 1], enclosedEnv));
      }

      let result = new Nil();
      ast.list.slice(2).forEach((x) => (result = EVAL(x, enclosedEnv)));

      return result;

    default:
      const evaluatedList = eval_ast(ast, env);
      const fn = evaluatedList.list[0];
      return fn.apply(null, evaluatedList.list.slice(1));
  }
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
