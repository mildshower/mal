const readline = require("readline");
const Reader = require("./reader");
const { pr_str } = require("./printer");
const {
  List,
  Str,
  Symbol,
  Vector,
  HashMap,
  Keyword,
  Nil,
  Fn,
} = require("./types");
const { Env } = require("./env");
const core = require("./core");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const repl_env = new Env(null);

Object.entries(core).forEach(([k, v]) => repl_env.set(new Symbol(k), v));

const eval_ast = (ast, env) => {
  if (ast === undefined) {
    return new Nil();
  }

  if (ast instanceof Symbol) {
    return env.get(ast);
  }

  if (ast instanceof List) {
    const resolvedList = ast.elements.map((e) => EVAL(e, env));
    return new List(resolvedList);
  }

  if (ast instanceof Vector) {
    const resolvedVector = ast.elements.map((e) => EVAL(e, env));
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
  while (true) {
    if (!(ast instanceof List)) return eval_ast(ast, env);

    if (ast.isEmpty()) return ast;

    const firstElement = ast.elements[0].symbol;

    switch (firstElement) {
      case "def!":
        const evaluatedValue = EVAL(ast.elements[2], env);
        env.setGlobal(ast.elements[1], evaluatedValue);
        return evaluatedValue;

      case "let*":
        const enclosedEnv = new Env(env);
        const keyValues = ast.elements[1].elements;

        for (let i = 0; i < keyValues.length; i += 2) {
          enclosedEnv.set(keyValues[i], EVAL(keyValues[i + 1], enclosedEnv));
        }

        env = enclosedEnv;

        ast.elements.slice(2, -1).forEach((x) => EVAL(x, env));
        ast = ast.elements[ast.count() - 1];
        break;

      case "do":
        ast.elements.slice(1, -1).forEach((x) => EVAL(x, env));
        ast = ast.elements[ast.count() - 1];
        break;

      case "if":
        const evaluatedCondition = EVAL(ast.elements[1], env);
        ast =
          evaluatedCondition === false || evaluatedCondition instanceof Nil
            ? ast.elements[3]
            : ast.elements[2];
        break;

      case "fn*":
        const binds = ast.elements[1].elements;
        const fnBody = ast.elements.slice(2);
        return new Fn(fnBody, binds, env);
      // return new Fn((...rawFnArgs) => {
      //   const [binds, fnArgs] = getFilteredBindsAndArgs(rawBinds, rawFnArgs);
      //   const enclosedEnv = new Env(env, binds, fnArgs);
      //   return EVAL(
      //     new List([new Symbol("do"), ...ast.list.slice(2)]),
      //     enclosedEnv
      //   );
      // });

      default:
        const evaluatedList = eval_ast(ast, env);
        const fn = evaluatedList.elements[0];

        if (!(fn instanceof Fn))
          return fn.apply(null, evaluatedList.elements.slice(1));

        env = fn.generateEnv(evaluatedList.elements.slice(1));
        fn.fnBody.slice(0, -1).forEach((x) => EVAL(x, env));
        ast = fn.fnBody[fn.fnBody.length - 1];
        break;
    }
  }
};

const PRINT = (ast) => {
  return pr_str(ast, true);
};

const rep = (str) => {
  return PRINT(EVAL(READ(str), repl_env));
};

rep("(def! not (fn* [a] (if a false true)))");

const loop = () => {
  rl.question("user> ", (str) => {
    try {
      console.log(rep(str));
    } catch (e) {
      console.log(e);
    } finally {
      loop();
    }
  });
};

Function.__proto__.toString = () => "#<function>";

loop();
