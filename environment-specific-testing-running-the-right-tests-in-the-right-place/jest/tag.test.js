require("dotenv").config();

const ENV = process.env.TEST_ENV || "default";

const testCases = [
  { name: "Feature X test", envs: ["env1", "env2"] },
  { name: "Feature Y test", envs: ["env1", "env3"] },
];

testCases.forEach(({ name, envs }) => {
  const shouldRun = envs.includes(ENV);
  (shouldRun ? test : test.skip)(name, () => {
    // Your test logic here
  });
});
