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

const isMacroCall = (ast, env) => {
  return (
    ast instanceof List &&
    ast.elements[0] instanceof Symbol &&
    env.has(ast.elements[0]) &&
    env.get(ast.elements[0]) instanceof Fn &&
    env.get(ast.elements[0]).isMacro
  );
};

const macroExpand = async (ast, env) => {
  while (isMacroCall(ast, env)) {
    const macro = env.get(ast.elements[0]);
    ast = await macro.apply(null, ast.elements.slice(1));
  }

  return ast;
};

const isTryCatch = (ast) => {
  return ast instanceof List && ast.elements[0].symbol === "try*";
};

const isFalsy = (ast) => ast === false || ast instanceof Nil;

const eval_ast = async (ast, env) => {
  if (ast === undefined) {
    return new Nil();
  }

  if (ast instanceof Symbol) {
    return env.get(ast);
  }

  const evalWithEnv = async (e) => await EVAL(e, env);

  if (ast instanceof List) {
    const resolvedList = await asyncMap(ast.elements, evalWithEnv);
    return new List(resolvedList);
  }

  if (ast instanceof Vector) {
    const resolvedVector = await asyncMap(ast.elements, evalWithEnv);
    return new Vector(resolvedVector);
  }

  if (ast instanceof HashMap) {
    const resolvedKeyValues = await asyncMap(ast.toKeyValues(), evalWithEnv);
    return new HashMap(resolvedKeyValues);
  }

  return ast;
};

const READ = (str) => {
  return Reader(str);
};

const EVAL = async (ast, env) => {
  while (true) {
    ast = await macroExpand(ast, env);

    if (!(ast instanceof List)) return await eval_ast(ast, env);

    if (ast.isEmpty()) return ast;

    const firstElement = ast.elements[0].symbol;

    if (isTryCatch(ast)) {
      try {
        return await EVAL(ast.elements[1], env);
      } catch (e) {
        if (ast.count() < 3) throw e;
        const malError = e instanceof Error ? new Str(e.message) : e;
        env = new Env(env);
        env.set(ast.elements[2].elements[1], malError);
        ast = ast.elements[2].elements[2];
      }
      continue;
    }

    switch (firstElement) {
      case "def!":
        const evaluatedValue = await EVAL(ast.elements[2], env);
        env.setGlobal(ast.elements[1], evaluatedValue);
        return evaluatedValue;

      case "defmacro!":
        let macroFn = (await EVAL(ast.elements[2], env)).clone();
        macroFn.isMacro = true;
        env.setGlobal(ast.elements[1], macroFn);
        return macroFn;

      case "let*":
        const enclosedEnv = new Env(env);
        const keyValues = ast.elements[1].elements;

        for (let i = 0; i < keyValues.length; i += 2) {
          const key = keyValues[i];
          const value = keyValues[i + 1];
          enclosedEnv.set(key, await EVAL(value, enclosedEnv));
        }

        env = enclosedEnv;

        const restLetForms = ast.elements.slice(2, -1);
        await asyncForEach(restLetForms, async (e) => await EVAL(e, env));
        ast = ast.elements[ast.count() - 1];
        break;

      case "do":
        const restDoForms = ast.elements.slice(1, -1);
        await asyncForEach(restDoForms, async (e) => await EVAL(e, env));
        ast = ast.elements[ast.count() - 1];
        break;

      case "quote":
        return ast.elements[1];

      case "quasiquoteexpand":
        return quasiquote(ast.elements[1]);

      case "macroexpand":
        return await macroExpand(ast.elements[1], env);

      case "quasiquote":
        ast = quasiquote(ast.elements[1]);
        break;

      case "if":
        const cond = await EVAL(ast.elements[1], env);
        ast = isFalsy(cond) ? ast.elements[3] : ast.elements[2];
        break;

      case "fn*":
        const binds = ast.elements[1].elements;
        const fnBody = ast.elements.slice(2);

        const closedFn = async (...args) => {
          const [filteredBinds, filteredArgs] = collateParams(binds, args);
          const enclosedEnv = new Env(env, filteredBinds, filteredArgs);
          return await EVAL(prepend_symbol("do", ...fnBody), enclosedEnv);
        };

        return new Fn(fnBody, binds, env, closedFn);

      default:
        const evaluatedList = await eval_ast(ast, env);
        const fn = evaluatedList.elements[0];

        if (!(fn instanceof Fn))
          return await fn.apply(null, evaluatedList.elements.slice(1));

        env = fn.generateEnv(evaluatedList.elements.slice(1));
        const restFnForms = fn.fnBody.slice(0, -1);
        await asyncForEach(restFnForms, async (e) => await EVAL(e, env));
        ast = fn.fnBody[fn.fnBody.length - 1];
    }
  }
};

const PRINT = (ast) => {
  return pr_str(ast, true);
};

const rep = async (str) => {
  return PRINT(await EVAL(READ(str), repl_env));
};

const prn_error = (e) => {
  if (e instanceof Error) return console.log(e);

  console.log(`Error: ${pr_str(e)}`);
};

const loop = () => {
  rl.question("user> ", async (str) => {
    try {
      console.log(await rep(str));
    } catch (e) {
      prn_error(e);
    } finally {
      loop();
    }
  });
};

Function.__proto__.toString = () => "#<function>";
Function.__proto__.metaData = new Nil();

const run = async () => {
  await rep(
    '(def! load-file (fn* (f) (eval (read-string (str "(do " (slurp f) "\\nnil)")))))'
  );

  await rep(
    "(defmacro! cond (fn* (& xs) (if (> (count xs) 0) (list 'if (first xs) (if (> (count xs) 1) (nth xs 1) (throw \"odd number of forms to cond\")) (cons 'cond (rest (rest xs)))))))"
  );

  await rep(`(load-file "${__dirname}/coreDefinitions.mal")`);

  await rep(`(def! *host-language* "js | Sid")`);

  if (process.argv[2] !== undefined) {
    await rep(`(load-file "${process.argv[2]}")`);
    process.exit();
  }

  await rep('(println (str "Mal [" *host-language* "]"))');

  loop();
};

run();
