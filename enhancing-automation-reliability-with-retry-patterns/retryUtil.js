async function dynamicRetry(actions, maxRetries) {
  let retryCount = 0;

  async function retryAction() {
    try {
      return await actions();
    } catch (error) {
      if (retryCount < maxRetries) {
        retryCount++;
        return retryAction();
      } else {
        throw error;
      }
    }
  }
  return await retryAction();
}

async function pollRetry(actions, timeout, pollInterval) {
  const startTime = Date.now();
  let lastError;

  while (Date.now() - startTime < timeout) {
    try {
      await actions();
      return;
    } catch (error) {
      lastError = error;
      await sleep(pollInterval);
    }
  }

  throw lastError;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function errorHandlingRetry(actions) {
  return new Promise(async (resolve, reject) => {
    try {
      await actions();
      resolve();
    } catch (error) {
      if (error.message.includes("no such element")) {
        console.error("Element not found:", error.message);
        await sleep(1000);
        await actions();
      } else if (error.message.includes("Timeout")) {
        console.error("Timeout occurred:", error.message);
        await sleep(1000);
        await actions();
      } else {
        console.error("An error occurred:", error);
      }
      reject(error);
    }
  });
}

async function retryWithExponentialBackoff(actions, maxRetries, initialDelay) {
  let retryCount = 0;
  let delay = initialDelay;

  while (retryCount < maxRetries) {
    try {
      await actions();
      return;
    } catch (error) {
      console.error("Error:", error);
    }
    await sleep(delay);
    delay *= 2;
    retryCount++;
  }
  throw new Error(
    "Retry limit exceeded: Actions did not complete successfully."
  );
}

async function retryWithRandomizedInterval(
  actions,
  maxRetries,
  minDelay,
  maxDelay
) {
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      await actions();
      return;
    } catch (error) {
      console.error("Error:", error);
    }
    const delay = Math.floor(
      Math.random() * (maxDelay - minDelay + 1) + minDelay
    );
    await sleep(delay);
    retryCount++;
  }
  throw new Error(
    "Retry limit exceeded: Actions did not complete successfully."
  );
}

module.exports = {
  dynamicRetry,
  pollRetry,
  errorHandlingRetry,
  retryWithExponentialBackoff,
  retryWithRandomizedInterval,
};
