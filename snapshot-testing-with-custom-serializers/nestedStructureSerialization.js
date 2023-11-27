test("Custom Serialization for Complex Nested Structures", () => {
  const complexNestedObject = {
    details: {
      key: "value",
      nestedArray: [
        { id: 1, name: "Item 1" },
        { id: 2, name: "Item 2" },
      ],
    },
    date: new Date(),
  };

  expect(complexNestedObject).toMatchSnapshot();
});
