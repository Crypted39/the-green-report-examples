test("Snapshot Test with Custom Serializer", () => {
  const dataWithDates = {
    date: new Date(),
    info: "Snapshot Test",
  };

  expect(dataWithDates).toMatchSnapshot();
});
