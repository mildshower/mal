const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const READ = (str) => {
  return str;
};

const EVAL = (str) => {
  return str;
};

const PRINT = (str) => {
  return str;
};

const rep = (str) => {
  return PRINT(EVAL(READ(str)));
};

const loop = () => {
  rl.question("user> ", (str) => {
    console.log(rep(str));
    loop();
  });
};

loop();
