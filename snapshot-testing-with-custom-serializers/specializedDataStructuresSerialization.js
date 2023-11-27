test("Custom Serialization for Specialized Data Structures", () => {
  const specializedDataStructure = [new Date(), { key: "value" }, [1, 2, 3]];

  expect(specializedDataStructure).toMatchSnapshot();
});
