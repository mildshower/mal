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

const getFilteredBindsAndArgs = (rawBinds, rawFnArgs) => {
  let args = rawFnArgs;
  let binds = rawBinds;
  const ampersandPosition = rawBinds.findIndex((e) => e.symbol === "&");
  if (ampersandPosition >= 0) {
    args = [
      ...args.slice(0, ampersandPosition),
      new List(args.slice([ampersandPosition])),
    ];
    binds = [
      ...rawBinds.slice(0, ampersandPosition),
      rawBinds[ampersandPosition + 1],
    ];
  }
  return [binds, args];
};

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
      env.setGlobal(ast.list[1], evaluatedValue);
      return evaluatedValue;

    case "let*":
      const enclosedEnv = new Env(env);
      const keyValues = ast.list[1].list || ast.list[1].vector;

      for (let i = 0; i < keyValues.length; i += 2) {
        enclosedEnv.set(keyValues[i], EVAL(keyValues[i + 1], enclosedEnv));
      }

      return EVAL(
        new List([new Symbol("do"), ...ast.list.slice(2)]),
        enclosedEnv
      );

    case "do":
      let resultOfEachExpression = new Nil();
      ast.list.slice(1).forEach((x) => (resultOfEachExpression = EVAL(x, env)));
      return resultOfEachExpression;

    case "if":
      const evaluatedCondition = EVAL(ast.list[1], env);
      return evaluatedCondition === false || evaluatedCondition instanceof Nil
        ? EVAL(ast.list[3], env)
        : EVAL(ast.list[2], env);

    case "fn*":
      const rawBinds = ast.list[1].vector || ast.list[1].list;
      return new Fn((...rawFnArgs) => {
        const [binds, fnArgs] = getFilteredBindsAndArgs(rawBinds, rawFnArgs);
        const enclosedEnv = new Env(env, binds, fnArgs);
        return EVAL(
          new List([new Symbol("do"), ...ast.list.slice(2)]),
          enclosedEnv
        );
      });

    default:
      const evaluatedList = eval_ast(ast, env);
      const fn = evaluatedList.list[0];
      return fn.apply(evaluatedList.list.slice(1));
  }
};

const PRINT = (ast) => {
  return pr_str(ast);
};

const rep = (str) => {
  return PRINT(EVAL(READ(str), repl_env));
};

rep("(def! not (fn* [a] (if a false true)))")

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
