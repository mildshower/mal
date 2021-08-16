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
const { pr_str } = require("./printer");

const sequenceEqual = (a, b) => {
  if (a.length !== b.length) return false;

  return a.every((element, index) => deepEqual(element, b[index]));
};

const deepEqual = (a, b) => {
  if (a === b || (a instanceof Nil && b instanceof Nil)) return true;

  if (
    (a instanceof Vector || a instanceof List) &&
    (b instanceof Vector || b instanceof List)
  )
    return sequenceEqual(a.vector || a.list, b.vector || b.list);

  if (a instanceof Keyword && b instanceof Keyword)
    return a.keyword === b.keyword;

  if (a instanceof Str && b instanceof Str) return a.value === b.value;

  return false;
};

const core = {
  "+": new Fn((...numbers) => numbers.reduce((total, num) => total + num, 0)),

  "-": new Fn((...numbers) =>
    numbers.slice(1).reduce((sub, num) => sub - num, numbers[0])
  ),

  "*": new Fn((...numbers) => numbers.reduce((total, num) => total * num, 1)),

  "/": new Fn((...numbers) =>
    numbers.slice(1).reduce((div, num) => div / num, numbers[0])
  ),

  list: new Fn((...elements) => new List(elements)),

  "list?": new Fn((exp) => exp instanceof List),

  "empty?": new Fn((exp) => exp.isEmpty()),

  count: new Fn((exp) => {
    if (exp instanceof Nil) return 0;
    return exp.count();
  }),

  prn: new Fn((...exp) => {
    console.log(exp.map(pr_str).join(" "));
    return new Nil();
  }),

  println: new Fn((...exp) => {
    console.log(exp.map(pr_str).join(" "));
    return new Nil();
  }),

  "prn-str": new Fn((...exps) => {
    return exps.map(pr_str).join(" ");
  }),

  str: new Fn((...exps) => {
    return exps.map(pr_str).join("");
  }),

  "=": new Fn(deepEqual),

  "<": new Fn((a, b) => a < b),

  "<=": new Fn((a, b) => a <= b),

  ">": new Fn((a, b) => a > b),

  ">=": new Fn((a, b) => a >= b),
};

module.exports = core;
