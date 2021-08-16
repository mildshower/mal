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

  prn: new Fn((...exps) => {
    console.log(exps.map((e) => pr_str(e, true)).join(" "));
    return new Nil();
  }),

  println: new Fn((...exps) => {
    console.log(exps.map((e) => pr_str(e, false)).join(" "));
    return new Nil();
  }),

  "pr-str": new Fn((...exps) => {
    const str = exps.map((e) => pr_str(e, true)).join(" ");
    return new Str(str);
  }),

  str: new Fn((...exps) => {
    const str = exps.map((e) => pr_str(e, false)).join("");
    return new Str(str);
  }),

  "=": new Fn(deepEqual),

  "<": new Fn((a, b) => a < b),

  "<=": new Fn((a, b) => a <= b),

  ">": new Fn((a, b) => a > b),

  ">=": new Fn((a, b) => a >= b),
};

module.exports = core;
