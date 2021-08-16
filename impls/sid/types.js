class List {
  constructor(list) {
    this.list = list;
  }

  asString(print_readably) {
    return `(${this.list
      .map((e) => (e.asString ? e.asString(print_readably) : e.toString()))
      .join(" ")})`;
  }
}

class Str {
  constructor(value) {
    this.value = value;
  }

  asString(print_readably) {
    if (!print_readably) return `"${this.value}"`;

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
}

class HashMap {
  constructor(hashMap) {
    this.hashMap = hashMap;
  }

  asString(print_readably) {
    return `{${this.hashMap
      .map((e) => (e.asString ? e.asString(print_readably) : e.toString()))
      .join(" ")}}`;
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

module.exports = { Str, List, Vector, HashMap, Symbol, Keyword, Nil };
