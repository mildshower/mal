const readline = require("readline");
const { read_str: Reader, prepend_symbol } = require("./reader");
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
  collateParams,
  Sequence,
} = require("./types");
const { Env } = require("./env");
const core = require("./core");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const repl_env = new Env(null);

Object.entries(core).forEach(([k, v]) => repl_env.set(new Symbol(k), v));

repl_env.set(new Symbol("eval"), (ast) => EVAL(ast, repl_env));

repl_env.set(
  new Symbol("*ARGV*"),
  new List(process.argv.slice(3).map((arg) => new Str(arg)))
);

const startsWithSymbol = (sym, ast) => {
  return (
    ast instanceof List &&
    ast.elements[0] instanceof Symbol &&
    ast.elements[0].symbol === sym
  );
};

const isSpliceUnquote = startsWithSymbol.bind(null, "splice-unquote");

const isUnquote = startsWithSymbol.bind(null, "unquote");

const isFnDef = startsWithSymbol.bind(null, "fn*");

//*************************Recursion Based******************************* */

// const quasiquoteList = (ast) => {
//   if (ast.isEmpty()) return new List([]);

//   const etl = ast.elements[0];
//   const processedRest = quasiquoteList(new List(ast.elements.slice(1)));

//   if (isSpliceUnquote(etl)) {
//     return new List([new Symbol("concat"), etl.elements[1], processedRest]);
//   }

//   return new List([new Symbol("cons"), quasiquote(etl), processedRest]);
// };

const quasiquoteList = (ast) => {
  let result = new List([]);

  const reverseElements = ast.elements.slice().reverse();
  reverseElements.forEach((elt) => {
    if (isSpliceUnquote(elt)) {
      result = prepend_symbol("concat", elt.elements[1], result);
    } else {
      result = prepend_symbol("cons", quasiquote(elt), result);
    }
  });

  return result;
};

const quasiquote = (ast) => {
  if (isUnquote(ast)) return ast.elements[1];

  if (ast instanceof Vector) {
    return new List([new Symbol("vec"), quasiquoteList(ast)]);
  }

  if (ast instanceof List) {
    return quasiquoteList(ast);
  }

  if (ast instanceof HashMap || ast instanceof Symbol)
    return new List([new Symbol("quote"), ast]);

  return ast;
};

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

      case "quote":
        return ast.elements[1];

      case "quasiquoteexpand":
        return quasiquote(ast.elements[1]);

      case "quasiquote":
        ast = quasiquote(ast.elements[1]);
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

        const closedFn = (...args) => {
          const [filteredBinds, filteredArgs] = collateParams(binds, args);
          const enclosedEnv = new Env(env, filteredBinds, filteredArgs);
          return EVAL(prepend_symbol("do", ...fnBody), enclosedEnv);
        };

        return new Fn(fnBody, binds, env, closedFn);

      default:
        const evaluatedList = eval_ast(ast, env);
        const fn = evaluatedList.elements[0];

        if (!(fn instanceof Fn))
          return fn.apply(null, evaluatedList.elements.slice(1));

        env = fn.generateEnv(evaluatedList.elements.slice(1));
        fn.fnBody.slice(0, -1).forEach((x) => EVAL(x, env));
        ast = fn.fnBody[fn.fnBody.length - 1];
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

rep(
  '(def! load-file (fn* (f) (eval (read-string (str "(do " (slurp f) "\\nnil)")))))'
);

rep("(def! zero? (fn* [num] (= num 0)))");

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

if (process.argv[2] !== undefined) {
  rep(`(load-file "${process.argv[2]}")`);
  process.exit();
}

loop();
