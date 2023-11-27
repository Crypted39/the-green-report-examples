test("Custom Serialization for Circular References", () => {
  const circularReferenceObject = { prop: "I am a circular reference" };
  circularReferenceObject.self = circularReferenceObject;

  expect(circularReferenceObject).toMatchSnapshot();
});
