const { List, Str, Symbol, Vector, HashMap, Keyword, Nil } = require("./types");

class Reader {
  constructor(tokens) {
    this.tokens = tokens.slice();
    this.position = 0;
  }

  peek() {
    return this.tokens[this.position];
  }

  next() {
    const currentToken = this.peek();
    this.position++;
    return currentToken;
  }
}

// const tokenize = (str) => {
//   const tokenizeRegexp =
//     /[\s,]*(~@|[\[\]{}()'`~^@]|"(?:\\.|[^\\"])*"?|;.*|[^\s\[\]{}('"`,;)]*)/g;
//   let match;
//   const tokens = [];
//   while ((match = tokenizeRegexp.exec(str)[1])) {
//     if (match[0] === ";") continue;
//     tokens.push(match);
//   }
//   return tokens;
// };

const tokenize = (str) => {
  const tokenizeRegexp =
    /[\s,]*(~@|[\[\]{}()'`~^@]|"(?:\\.|[^\\"])*"?|;.*|[^\s\[\]{}('"`,;)]+)/g;
  const matches = [...str.matchAll(tokenizeRegexp)];
  return matches.map((_) => _[1]).filter((_) => _[0] !== ";");
};

const read_atom = (token) => {
  if (/^-?[0-9]+$/.test(token)) {
    return parseInt(token);
  }

  if (/^-?[0-9]+.[0-9]+$/.test(token)) {
    return parseFloat(token);
  }

  if (token === "nil") {
    return new Nil();
  }

  if (token === "true") {
    return true;
  }

  if (token === "false") {
    return false;
  }

  if (token.startsWith(":")) {
    return new Keyword(token.slice(1));
  }

  if (token.startsWith('"')) {
    if (!/[^\\]("$|(\\\\)+")$/.test(token)) throw new Error("unbalanced");
    const escapedStr = token
      .slice(1, -1)
      .replace(/\\(.)/g, (_, c) => (c === "n" ? "\n" : c));
    return new Str(escapedStr);
  }

  return new Symbol(token);
};

const read_ast = (reader, endingToken) => {
  const ast = [];
  let token;

  while ((token = reader.peek()) !== endingToken) {
    if (!token) throw new Error("unbalanced");

    ast.push(read_form(reader));
  }
  reader.next();
  return ast;
};

const read_list = (reader) => {
  const ast = read_ast(reader, ")");
  return new List(ast);
};

const read_hash_map = (reader) => {
  const ast = read_ast(reader, "}");
  if (ast.length % 2 !== 0) throw new Error("unbalanced");
  return new HashMap(ast);
};

const read_vector = (reader) => {
  const ast = read_ast(reader, "]");
  return new Vector(ast);
};

const read_deref = (reader) => {
  return new List([new Symbol("deref"), new Symbol(reader.next())]);
};

const read_form = (reader) => {
  const token = reader.next();

  switch (token) {
    case "(":
      return read_list(reader);

    case "{":
      return read_hash_map(reader);

    case "[":
      return read_vector(reader);

    case ")":
      throw new Error("unbalanced");

    case "}":
      throw new Error("unbalanced");

    case "]":
      throw new Error("unbalanced");

    case "@":
      return read_deref(reader);

    default:
      return read_atom(token);
  }
};

const read_str = (str) => {
  const tokens = tokenize(str);
  const reader = new Reader(tokens);
  return read_form(reader);
};

module.exports = read_str;
