test("Custom Serialization for Unique Object Instances", () => {
  class SpecialObject {
    constructor(name) {
      this.name = name;
    }
  }

  const specializedInstance = new SpecialObject("Custom");

  expect(specializedInstance).toMatchSnapshot();
});
