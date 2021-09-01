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
  Sequence,
} = require("./types");
const { pr_str } = require("./printer");
const { read_str } = require("./reader");
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

  mod: (dividend, divisor) => dividend % divisor,

  nth: (seq, index) => {
    const elt = seq.elements[index];

    if (elt === undefined) throw new Error("Index out of range");

    return elt;
  },

  first: (seq) =>
    seq instanceof Nil || seq.count() === 0 ? new Nil() : seq.elements[0],

  rest: (seq) =>
    seq instanceof Nil ? new List([]) : new List(seq.elements.slice(1)),

  throw: (e) => {
    throw e;
  },

  apply: (fn, ...args) =>
    fn.apply(null, [
      ...args.slice(0, args.length - 1),
      ...args[args.length - 1].elements,
    ]),

  "nil?": (a) => a instanceof Nil,
  "true?": (a) => a === true,
  "false?": (a) => a === false,
  "symbol?": (a) => a instanceof Symbol,
  symbol: (str) => new Symbol(str.value),
  keyword: (a) => (a instanceof Keyword ? a : new Keyword(a.value)),
  "keyword?": (a) => a instanceof Keyword,
  "vector?": (a) => a instanceof Vector,
  vector: (...elements) => new Vector(elements),
  "sequential?": (a) => a instanceof Sequence,
  "hash-map": (...keyValues) => new HashMap(keyValues),
  "map?": (a) => a instanceof HashMap,
  keys: (a) => a.keys(),
  vals: (a) => a.vals(),
  get: (map, key) => (map instanceof Nil ? new Nil() : map.get(key)),
  "contains?": (map, key) => map.contains(key),
  assoc: (map, ...keyValues) => map.assoc(keyValues),
  dissoc: (map, ...keys) => map.dissoc(keys),
};

module.exports = core;
