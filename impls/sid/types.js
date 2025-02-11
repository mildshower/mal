class List {
  constructor(list) {
    this.list = list;
  }

  isEmpty() {
    return this.list.length === 0;
  }

  count() {
    return this.list.length;
  }

  toString() {
    return `(${this.list.map((element) => element.toString()).join(" ")})`;
  }
}

class Str {
  constructor(value) {
    this.value = value;
  }

  toString() {
    return `"${this.value}"`;
  }
}

class Vector {
  constructor(vector) {
    this.vector = vector;
  }

  isEmpty() {
    return this.vector.length === 0;
  }

  count() {
    return this.vector.length;
  }

  toString() {
    return `[${this.vector.map((element) => element.toString()).join(" ")}]`;
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

  isEmpty() {
    return this.hashMap.size === 0;
  }

  count() {
    return this.hashMap.size;
  }

  toString() {
    return `{${[...this.hashMap.entries()]
      .map(([k, v]) => `${k.toString()} ${v.toString()}`)
      .join(" ")}}`;
  }
}

class Symbol {
  constructor(symbol) {
    this.symbol = symbol;
  }

  toString() {
    return this.symbol;
  }
}

class Keyword {
  constructor(keyword) {
    this.keyword = keyword;
  }

  toString() {
    return `:${this.keyword}`;
  }
}

class Nil {
  toString() {
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
