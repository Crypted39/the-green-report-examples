export function fetchData(url) {
  console.log("Fetching data from:", url);
  // Simulate fetching data
  return new Promise((resolve) => resolve({ data: "Mocked data" }));
}

export function doSomethingElse() {
  console.log("Doing something else...");
}
