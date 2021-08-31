class Env {
  constructor(outer, binds = [], exps = []) {
    this.data = {};
    this.outer = outer;

    binds.forEach((bind, index) => (this.data[bind.symbol] = exps[index]));
  }

  set(key, value) {
    this.data[key.symbol] = value;
    return value;
  }

  setGlobal(key, value) {
    if (this.outer) return this.outer.setGlobal(key, value);
    return this.set(key, value);
  }

  get(key) {
    const value = this.data[key.symbol];

    if (value !== undefined) return value;

    if (!this.outer) throw new Error(`'${key.symbol}' not found.`);

    return this.outer.get(key);
  }

  has(key) {
    if (this.data[key.symbol] !== undefined) return true;

    return this.outer && this.outer.has(key);
  }
}

module.exports = { Env };
