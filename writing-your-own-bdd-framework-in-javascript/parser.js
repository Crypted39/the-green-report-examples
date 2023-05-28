const stepDefinitions = require("./stepDefinitions.js");

async function parseCapability(text) {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "");
  const capabilityCount = lines.reduce((count, line) => {
    if (line.startsWith("Capability:")) {
      return count + 1;
    }
    return count;
  }, 0);

  if (capabilityCount > 1) {
    console.error("Error: Multiple capabilities found in a single BDD file!");
  } else {
    const tasks = [];
    let currentTask = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith("Task")) {
        if (currentTask.length > 0) {
          tasks.push(currentTask);
        }
        currentTask = [];
      }
      currentTask.push(line);
    }

    if (currentTask.length > 0) {
      tasks.push(currentTask);
    }

    for (let i = 0; i < tasks.length; i++) {
      console.log(`Executing task: ${tasks[i][0].replace("Task: ", "")}`);
      await executeTask(tasks[i]);
      console.log("Task execution completed.\n");
    }
  }
}

async function executeTask(task) {
  for (let i = 1; i < task.length; i++) {
    const step = task[i].split(" ");
    const stepKeyword = step[0];
    const stepDescription = step.slice(1).join(" ");
    if (
      stepDefinitions[stepKeyword] &&
      stepDefinitions[stepKeyword][stepDescription]
    ) {
      console.log(`Step ${i}: ${task[i]}`);
      await stepDefinitions[stepKeyword][stepDescription](); // Await the execution of the step
    } else {
      console.log(`Step ${i}: No implementation found for ${task[i]}`);
    }
  }
}

module.exports = { parseCapability };
