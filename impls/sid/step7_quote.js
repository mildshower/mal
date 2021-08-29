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
  collateParams,
  Sequence,
} = require("./types");
const { Env } = require("./env");
const core = require("./core");
const { asyncMap, asyncForEach } = require("./asyncHelpers");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const repl_env = new Env(null);

Object.entries(core).forEach(([k, v]) => repl_env.set(new Symbol(k), v));

repl_env.set(new Symbol("eval"), async (ast) => await EVAL(ast, repl_env));

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

  ast.elements
    .slice()
    .reverse()
    .forEach((elt) => {
      if (isSpliceUnquote(elt))
        result = new List([new Symbol("concat"), elt.elements[1], result]);
      else result = new List([new Symbol("cons"), quasiquote(elt), result]);
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

const eval_ast = async (ast, env) => {
  if (ast === undefined) {
    return new Nil();
  }

  if (ast instanceof Symbol) {
    return env.get(ast);
  }

  const evaluate = async (e) => await EVAL(e, env);

  if (ast instanceof List) {
    const resolvedList = await asyncMap(ast.elements, evaluate);
    return new List(resolvedList);
  }

  if (ast instanceof Vector) {
    const resolvedVector = await asyncMap(ast.elements, evaluate);
    return new Vector(resolvedVector);
  }

  if (ast instanceof HashMap) {
    const resolvedKeyValues = await asyncMap(ast.toKeyValues(), evaluate);
    return new HashMap(resolvedKeyValues);
  }

  return ast;
};

const READ = (str) => {
  return Reader(str);
};

const EVAL = async (ast, env) => {
  while (true) {
    if (!(ast instanceof List)) return await eval_ast(ast, env);

    if (ast.isEmpty()) return ast;

    const firstElement = ast.elements[0].symbol;
    let evaluate = async (e) => await EVAL(e, env);

    switch (firstElement) {
      case "def!":
        const evaluatedValue = await EVAL(ast.elements[2], env);
        env.setGlobal(ast.elements[1], evaluatedValue);
        return evaluatedValue;

      case "let*":
        const enclosedEnv = new Env(env);
        const keyValues = ast.elements[1].elements;

        for (let i = 0; i < keyValues.length; i += 2) {
          enclosedEnv.set(
            keyValues[i],
            await EVAL(keyValues[i + 1], enclosedEnv)
          );
        }

        env = enclosedEnv;
        evaluate = async (e) => await EVAL(e, env);
        await asyncForEach(ast.elements.slice(2, -1), evaluate);
        ast = ast.elements[ast.count() - 1];
        break;

      case "do":
        await asyncForEach(ast.elements.slice(1, -1), evaluate);
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
        const evaluatedCondition = await EVAL(ast.elements[1], env);
        ast =
          evaluatedCondition === false || evaluatedCondition instanceof Nil
            ? ast.elements[3]
            : ast.elements[2];
        break;

      case "fn*":
        const binds = ast.elements[1].elements;
        const fnBody = ast.elements.slice(2);

        const closedFn = async (...args) => {
          const [filteredBinds, filteredArgs] = collateParams(binds, args);
          const enclosedEnv = new Env(env, filteredBinds, filteredArgs);
          const doExp = new List([new Symbol("do"), ...fnBody]);
          return await EVAL(doExp, enclosedEnv);
        };

        return new Fn(fnBody, binds, env, closedFn);

      default:
        const evaluatedList = await eval_ast(ast, env);
        const fn = evaluatedList.elements[0];

        if (!(fn instanceof Fn))
          return await fn.apply(null, evaluatedList.elements.slice(1));

        env = fn.generateEnv(evaluatedList.elements.slice(1));
        evaluate = async (e) => await EVAL(e, env);
        const fnElements = fn.fnBody.slice(0, -1);
        asyncForEach(fnElements, evaluate);
        ast = fn.fnBody[fn.fnBody.length - 1];
        break;
    }
  }
};

const PRINT = (ast) => {
  return pr_str(ast, true);
};

const rep = async (str) => {
  return PRINT(await EVAL(READ(str), repl_env));
};

const loop = () => {
  rl.question("user> ", async (str) => {
    try {
      console.log(await rep(str));
    } catch (e) {
      console.log(e);
    } finally {
      loop();
    }
  });
};

Function.__proto__.toString = () => "#<function>";

const run = async () => {
  await rep("(def! not (fn* [a] (if a false true)))");

  await rep(
    '(def! load-file (fn* (f) (eval (read-string (str "(do " (slurp f) "\\nnil)")))))'
  );

  await rep("(def! zero? (fn* [a] (= a 0)))");

  if (process.argv[2] !== undefined) {
    await rep(`(load-file "${process.argv[2]}")`);
    process.exit(0);
  }

  loop();
};

run();
