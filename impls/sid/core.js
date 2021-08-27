const {
  List,
  Str,
  Symbol,
  Vector,
  HashMap,
  Keyword,
  Nil,
  Fn,
  MalValue,
  Atom,
} = require("./types");
const { pr_str } = require("./printer");
const read_str = require("./reader");
const { readFileSync } = require("fs");

const core = {
  "+": (...numbers) => numbers.reduce((total, num) => total + num, 0),

  "-": (...numbers) =>
    numbers.slice(1).reduce((sub, num) => sub - num, numbers[0]),
  "*": (...numbers) => numbers.reduce((total, num) => total * num, 1),

  "/": (...numbers) =>
    numbers.slice(1).reduce((div, num) => div / num, numbers[0]),
  list: (...elements) => new List(elements),

  "list?": (exp) => exp instanceof List,

  "empty?": (exp) => exp.isEmpty(),

  count: (exp) => {
    if (exp instanceof Nil) return 0;
    return exp.count();
  },

  prn: (...exps) => {
    console.log(exps.map((e) => pr_str(e, true)).join(" "));
    return new Nil();
  },

  println: (...exps) => {
    console.log(exps.map((e) => pr_str(e, false)).join(" "));
    return new Nil();
  },

  "pr-str": (...exps) => {
    const str = exps.map((e) => pr_str(e, true)).join(" ");
    return new Str(str);
  },

  str: (...exps) => {
    const str = exps.map((e) => pr_str(e, false)).join("");
    return new Str(str);
  },

  "=": (a, b) => {
    return a instanceof MalValue ? a.isEqual(b) : a === b;
  },

  "<": (a, b) => a < b,

  "<=": (a, b) => a <= b,

  ">": (a, b) => a > b,

  ">=": (a, b) => a >= b,

  "read-string": (str) => read_str(str.value),

  slurp: (fileName) => new Str(readFileSync(fileName.value, "utf-8")),

  atom: (value) => new Atom(value),

  "atom?": (exp) => exp instanceof Atom,

  deref: (atom) => atom.value,

  "reset!": (atom, value) => {
    atom.value = value;
    return value;
  },

  "swap!": (atom, fn, ...args) => atom.swap(fn, args),

  cons: (element, list) => new List([element, ...list.elements]),

  concat: (...lists) => new List(lists.flatMap((_) => _.elements)),

  vec: (sequence) => new Vector(sequence.elements),
};

module.exports = core;
