// Custom Serialization Example 1: Elaborate Arrays
test("Custom Serialization for Elaborate Arrays", () => {
  const elaborateArray = [new Date(), { key: "value" }, [1, 2, 3]];

  expect(elaborateArray).toMatchSnapshot();
});

// Custom Serialization Example 2: Nested Objects
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

// Custom Serialization Example 3: Specialized Instances
test("Custom Serialization for Specialized Instances", () => {
  class SpecialObject {
    constructor(name) {
      this.name = name;
    }
  }

  const specializedInstance = new SpecialObject("Custom");

  expect(specializedInstance).toMatchSnapshot();
});
