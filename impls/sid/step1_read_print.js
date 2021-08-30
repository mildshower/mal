const readline = require("readline");
const { read_str: Reader } = require("./reader");
const { pr_str } = require("./printer");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const READ = (str) => {
  return Reader(str);
};

const EVAL = (ast) => {
  return ast;
};

const PRINT = (ast) => {
  return pr_str(ast, true);
};

const rep = (str) => {
  return PRINT(EVAL(READ(str)));
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
