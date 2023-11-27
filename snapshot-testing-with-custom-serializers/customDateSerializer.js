const customDateSerializer = (value) => {
  if (value instanceof Date) {
    return `Date: ${value.toISOString()}`;
  } else {
    return value;
  }
};

module.exports = customDateSerializer;
