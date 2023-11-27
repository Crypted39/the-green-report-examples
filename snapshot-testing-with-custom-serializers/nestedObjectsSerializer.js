test("Custom Serialization for Nested Objects", () => {
  const nestedObject = {
    date: new Date(),
    details: {
      info: "important",
      numbers: [4, 5, 6],
    },
  };

  expect(nestedObject).toMatchSnapshot();
});
