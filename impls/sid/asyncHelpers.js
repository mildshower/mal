const asyncForEach = async (list, asyncFn) => {
  for (let i = 0; i < list.length; i++) {
    await asyncFn(list[i]);
  }
};

const asyncMap = async (list, asyncMapper) => {
  const mapped = [];
  await asyncForEach(list, async (e) => mapped.push(await asyncMapper(e)));
  return mapped;
};

module.exports = { asyncForEach, asyncMap };
