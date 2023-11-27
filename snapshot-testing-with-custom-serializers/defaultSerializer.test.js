test("Default Serialization Example", () => {
  const complexObject = {
    date: new Date(),
    nested: {
      key: "value",
      items: [1, 2, 3],
    },
  };

  expect(complexObject).toMatchSnapshot();
});
