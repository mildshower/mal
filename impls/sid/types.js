const { Env } = require("./env");

const getFilteredBindsAndArgs = (rawBinds, rawFnArgs) => {
  let args = rawFnArgs;
  let binds = rawBinds;
  const ampersandPosition = rawBinds.findIndex((e) => e.symbol === "&");
  if (ampersandPosition >= 0) {
    args = [
      ...args.slice(0, ampersandPosition),
      new List(args.slice([ampersandPosition])),
    ];
    binds = [
      ...rawBinds.slice(0, ampersandPosition),
      rawBinds[ampersandPosition + 1],
    ];
  }
  return [binds, args];
};

class MalValue {
  isEqual(other) {
    return this === other;
  }
}

class Sequence extends MalValue {
  constructor(elements) {
    super();
    this.elements = elements;
  }

  isEmpty() {
    return this.elements.length === 0;
  }

  count() {
    return this.elements.length;
  }

  isEqual(other) {
    if (other === this) return true;

    return (
      other instanceof Sequence &&
      this.count() === other.count() &&
      this.elements.every((e, i) => {
        return e instanceof MalValue
          ? e.isEqual(other.elements[i])
          : e === other.elements[i];
      })
    );
  }

  asString(print_readably, opening, closing) {
    return `${opening}${this.elements
      .map((e) =>
        e instanceof MalValue ? e.asString(print_readably) : e.toString()
      )
      .join(" ")}${closing}`;
  }
}

class List extends Sequence {
  constructor(elements) {
    super(elements);
  }

  asString(print_readably) {
    return super.asString(print_readably, "(", ")");
  }
}

class Str extends MalValue {
  constructor(value) {
    super();
    this.value = value;
  }

  asString(print_readably) {
    if (!print_readably) return this.value;

    return `"${this.value
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"')
      .replace(/\n/g, "\\n")}"`;
  }

  isEqual(other) {
    return other instanceof Str && other.value === this.value;
  }
}

class Vector extends Sequence {
  constructor(elements) {
    super(elements);
  }

  asString(print_readably) {
    return super.asString(print_readably, "[", "]");
  }
}

class HashMap extends MalValue {
  constructor(keyValues) {
    super();
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
          `${
            k instanceof MalValue ? k.asString(print_readably) : k.toString()
          } ${
            v instanceof MalValue ? v.asString(print_readably) : v.toString()
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

class Symbol extends MalValue {
  constructor(symbol) {
    super();
    this.symbol = symbol;
  }

  asString() {
    return this.symbol;
  }

  isEqual(other) {
    return other instanceof Symbol && other.symbol === this.symbol;
  }
}

class Keyword extends MalValue {
  constructor(keyword) {
    super();
    this.keyword = keyword;
  }

  asString() {
    return `:${this.keyword}`;
  }

  isEqual(other) {
    return other instanceof Keyword && other.keyword === this.keyword;
  }
}

class Nil extends MalValue {
  asString() {
    return "nil";
  }

  isEqual(other) {
    return other instanceof Nil;
  }
}

class Fn extends MalValue {
  constructor(fnBody, binds, env) {
    super();
    this.fnBody = fnBody;
    this.binds = binds;
    this.env = env;
  }

  asString() {
    return "#<function>";
  }

  generateEnv(fnArgs) {
    const [binds, args] = getFilteredBindsAndArgs(this.binds, fnArgs);
    return new Env(this.env, binds, args);
  }
}

module.exports = {
  Str,
  List,
  Vector,
  HashMap,
  Symbol,
  Keyword,
  Nil,
  Fn,
  MalValue,
};
