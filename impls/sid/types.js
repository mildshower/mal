const { Env } = require("./env");

const collateParams = (rawBinds, rawFnArgs) => {
  let args = rawFnArgs;
  let binds = rawBinds;
  const restPos = rawBinds.findIndex((e) => e.symbol === "&");
  if (restPos >= 0) {
    args = [...args.slice(0, restPos), new List(args.slice([restPos]))];
    binds = [...rawBinds.slice(0, restPos), rawBinds[restPos + 1]];
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
    this.elements = elements.slice();
    this.metaData = new Nil();
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

  clone() {
    return new List(this.elements);
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

  clone() {
    return new Vector(this.elements);
  }
}

// class HashMap extends MalValue {
//   constructor(keyValues) {
//     super();
//     this.hashMap = new Map();

//     for (let i = 0; i < keyValues.length; i += 2) {
//       this.hashMap.set(keyValues[i], keyValues[i + 1]);
//     }
//   }

//   toKeyValues() {
//     const keyValues = [];
//     this.hashMap.forEach((v, k) => keyValues.push(k, v));
//     return keyValues;
//   }

//   asString(print_readably) {
//     return `{${[...this.hashMap.entries()]
//       .map(
//         ([k, v]) =>
//           `${
//             k instanceof MalValue ? k.asString(print_readably) : k.toString()
//           } ${
//             v instanceof MalValue ? v.asString(print_readably) : v.toString()
//           }`
//       )
//       .join(" ")}}`;
//   }

//   isEmpty() {
//     return this.hashMap.size === 0;
//   }

//   count() {
//     return this.hashMap.size;
//   }

//   keys() {
//     return new List([...this.hashMap.keys()]);
//   }

//   vals() {
//     return new List([...this.hashMap.values()]);
//   }
// }

const ValidateKey = (key) => {
  if (!(key instanceof Str || key instanceof Keyword))
    throw new Error("Key is not string or keyword");
};

const toMalKey = (key) =>
  key.startsWith(":") ? new Keyword(key.slice(1)) : new Str(key.slice(1));

const toJsKey = (key) =>
  key instanceof Str ? `-${key.value}` : key.asString();

const isSameMapValue = (map1, map2) => {
  return Object.entries(map1).every(([k1, v1]) => {
    return v1 instanceof MalValue ? v1.isEqual(map2[k1]) : v1 === map2[k1];
  });
};

class HashMap extends MalValue {
  constructor(keyValues) {
    super();
    this.hashMap = {};
    this.metaData = new Nil();

    for (let i = 0; i < keyValues.length; i += 2) {
      ValidateKey(keyValues[i]);
      this.hashMap[toJsKey(keyValues[i])] = keyValues[i + 1];
    }
  }

  toKeyValues() {
    const keyValues = [];
    Object.entries(this.hashMap).forEach(([k, v]) =>
      keyValues.push(toMalKey(k), v)
    );
    return keyValues;
  }

  asString(print_readably) {
    return `{${Object.entries(this.hashMap)
      .map(([k, v]) => {
        k = toMalKey(k);
        return `${k.asString(print_readably)} ${
          v instanceof MalValue ? v.asString(print_readably) : v.toString()
        }`;
      })
      .join(" ")}}`;
  }

  keys() {
    return new List(Object.keys(this.hashMap).map(toMalKey));
  }

  vals() {
    return new List(Object.values(this.hashMap));
  }

  count() {
    return this.keys().elements.length;
  }

  isEmpty() {
    return this.count() === 0;
  }

  isEqual(other) {
    if (other === this) return true;

    return (
      other instanceof HashMap &&
      this.count() === other.count() &&
      isSameMapValue(this.hashMap, other.hashMap)
    );
  }

  get(key) {
    ValidateKey(key);
    const val = this.hashMap[toJsKey(key)];

    if (val === undefined) return new Nil();

    return val;
  }

  contains(key) {
    ValidateKey(key);
    const val = this.hashMap[toJsKey(key)];

    return !(val === undefined);
  }

  assoc(keyValues) {
    return new HashMap([...this.toKeyValues(), ...keyValues]);
  }

  dissoc(keys) {
    keys.forEach(ValidateKey);
    const keyValues = [];
    Object.entries(this.hashMap).forEach(([k, v]) => {
      if (keys.some((_) => toJsKey(_) === k)) return;
      keyValues.push(toMalKey(k), v);
    });
    return new HashMap(keyValues);
  }

  clone() {
    return new HashMap(this.toKeyValues());
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
  constructor(fnBody, binds, env, closedFn) {
    super();
    this.fnBody = fnBody;
    this.binds = binds;
    this.env = env;
    this.closedFn = closedFn;
    this.isMacro = false;
    this.metaData = new Nil();
  }

  asString() {
    return "#<function>";
  }

  generateEnv(fnArgs) {
    const [binds, args] = collateParams(this.binds, fnArgs);
    return new Env(this.env, binds, args);
  }

  async apply(context, exps) {
    return await this.closedFn.apply(context, exps);
  }

  clone() {
    const newFn = new Fn(this.fnBody, this.binds, this.env, this.closedFn);
    newFn.metaData = this.metaData;
    newFn.isMacro = this.isMacro;
    return newFn;
  }
}

class Atom extends MalValue {
  constructor(value) {
    super();
    this.value = value;
  }

  async swap(fn, args) {
    this.value = await fn.apply(null, [this.value, ...args]);
    return this.value;
  }

  asString(print_readably) {
    return `(atom ${
      this.value instanceof MalValue
        ? this.value.asString(print_readably)
        : this.value.toString()
    })`;
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
  Atom,
  collateParams,
  Sequence,
};
