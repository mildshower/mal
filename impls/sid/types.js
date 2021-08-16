class List {
  constructor(list) {
    this.list = list;
  }

  asString(print_readably) {
    return `(${this.list
      .map((e) => (e.asString ? e.asString(print_readably) : e.toString()))
      .join(" ")})`;
  }

  isEmpty() {
    return this.list.length === 0;
  }

  count() {
    return this.list.length;
  }
}

class Str {
  constructor(value) {
    this.value = value;
  }

  asString(print_readably) {
    if (!print_readably) return this.value;

    return `"${this.value.replace(/\n|\\|"/g, (m) => {
      switch (m) {
        case "\n":
          return "\\n";
        case "\\":
          return "\\\\";
        case '"':
          return '\\"';
        default:
          return m;
      }
    })}"`;
  }
}

class Vector {
  constructor(vector) {
    this.vector = vector;
  }

  asString(print_readably) {
    return `[${this.vector
      .map((e) => (e.asString ? e.asString(print_readably) : e.toString()))
      .join(" ")}]`;
  }

  isEmpty() {
    return this.vector.length === 0;
  }

  count() {
    return this.vector.length;
  }
}

class HashMap {
  constructor(keyValues) {
    this.hashMap = new Map();

    for (let i = 0; i < keyValues.length; i += 2) {
      this.hashMap.set(keyValues[i], keyValues[i + 1]);
    }
  }

  toKeyValues() {
    const keyValues = [];
    this.hashMap.forEach((v, k) => keyValues.push(k, v));
    return keyValues;
  }

  asString(print_readably) {
    return `{${[...this.hashMap.entries()]
      .map(
        ([k, v]) =>
          `${k.asString ? k.asString(print_readably) : k.toString()} ${
            v.asString ? v.asString(print_readably) : v.toString()
          }`
      )
      .join(" ")}}`;
  }

  isEmpty() {
    return this.hashMap.size === 0;
  }

  count() {
    return this.hashMap.size;
  }
}

class Symbol {
  constructor(symbol) {
    this.symbol = symbol;
  }

  asString() {
    return this.symbol;
  }
}

class Keyword {
  constructor(keyword) {
    this.keyword = keyword;
  }

  asString() {
    return `:${this.keyword}`;
  }
}

class Nil {
  asString() {
    return "nil";
  }
}

class Fn {
  constructor(fn) {
    this.fn = fn;
  }

  apply(args) {
    return this.fn.apply(null, args);
  }

  toString() {
    return "#<function>";
  }
}

module.exports = { Str, List, Vector, HashMap, Symbol, Keyword, Nil, Fn };
