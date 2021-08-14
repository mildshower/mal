class Env {
  constructor(outer) {
    this.data = {};
    this.outer = outer;
  }

  set(key, value) {
    this.data[key.symbol] = value;
    return value;
  }

  get(key) {
    const value = this.data[key.symbol];

    if (value !== undefined) return value;

    if (!this.outer) throw new Error(`'${key.symbol}' not found.`);

    return this.outer.get(key);
  }

  // find(key.symbol) {
  //   const
  // }
}

module.exports = { Env };
