class List {
  constructor(list) {
    this.list = list;
  }

  isEmpty() {
    return this.list.length === 0;
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

  toString() {
    return `[${this.vector.map((element) => element.toString()).join(" ")}]`;
  }
}

class HashMap {
  constructor(hashMap) {
    this.hashMap = hashMap;
  }

  toString() {
    return `{${this.hashMap.map((element) => element.toString()).join(" ")}}`;
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

module.exports = { Str, List, Vector, HashMap, Symbol, Keyword, Nil };
