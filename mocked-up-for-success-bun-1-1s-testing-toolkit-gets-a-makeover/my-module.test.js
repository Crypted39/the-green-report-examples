import { test, expect, mock } from "bun:test";
import { fetchData, doSomethingElse } from "./my-module";

mock.module("./my-module", () => {
  // Override the fetchData function
  return {
    fetchData: (url) => {
      console.log("Mocked fetching data from:", url);
      // Return a predetermined value instead of fetching data
      return Promise.resolve({ data: "Mocked data from test" });
    },
    // Ensure other functions remain as they are
    doSomethingElse,
  };
});

test("mock.module with my-module", async () => {
  // Test fetchData function after mocking
  const data = await fetchData("http://example.com/api");

  // Ensure the mocked data is returned
  expect(data).toEqual({ data: "Mocked data from test" });

  // Test doSomethingElse function after mocking
  doSomethingElse();
  // Assert whatever behavior you expect from doSomethingElse
});
