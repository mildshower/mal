const asyncForEach = async (list, asyncFunc) => {
  for (let i = 0; i < list.length; i++) {
    await asyncFunc(list[i]);
  }
};

const asyncMap = async (list, asyncMapper) => {
  const mapped = [];
  await asyncForEach(list, async (e) => mapped.push(await asyncMapper(e)));
  return mapped;
};

module.exports = { asyncForEach, asyncMap };
