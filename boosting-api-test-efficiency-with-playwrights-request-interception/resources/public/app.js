document.addEventListener("DOMContentLoaded", () => {
  const apiContainer = document.getElementById("api-container");
  const apiErrorCodeSelectors = {
    api1: document.getElementById("api-error-code-1"),
    api2: document.getElementById("api-error-code-2"),
    api3: document.getElementById("api-error-code-3"),
  };

  const apiStatus = {
    api1: 200,
    api2: 200,
    api3: 200,
  };

  const updateAPIStatus = () => {
    apiStatus.api1 = parseInt(apiErrorCodeSelectors.api1.value);
    apiStatus.api2 = parseInt(apiErrorCodeSelectors.api2.value);
    apiStatus.api3 = parseInt(apiErrorCodeSelectors.api3.value);

    fetch("/api/update-status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(apiStatus),
    })
      .then((response) => response.json())
      .then((data) => console.log(data))
      .catch((err) => console.error(err));
  };

  document
    .getElementById("apply-error-code")
    .addEventListener("click", updateAPIStatus);

  document.getElementById("button-1").addEventListener("click", async () => {
    apiContainer.innerHTML = "";

    // Fetch data from API 1
    try {
      const response1 = await fetch("/api/data1");
      if (!response1.ok) {
        const errorText1 = await response1.text(); // Get the error message
        apiContainer.innerHTML += `<div id="firstApiResponse" class="api-error">${errorText1}</div>`;
      } else {
        const data1 = await response1.json(); // Parse JSON only if response is OK
        apiContainer.innerHTML += `<div id="firstApiResponse" class="response-container">API 1 Response: ${data1.message}</div>`;
      }
    } catch (err) {
      apiContainer.innerHTML += `<div id="firstApiResponse" class="api-error">${err.message}</div>`;
    }

    // Fetch data from API 2
    try {
      const response2 = await fetch("/api/data2");
      if (!response2.ok) {
        const errorText2 = await response2.text(); // Get the error message
        apiContainer.innerHTML += `<div id="secondApiResponse" class="api-error">${errorText2}</div>`;
      } else {
        const data2 = await response2.json(); // Parse JSON only if response is OK
        apiContainer.innerHTML += `<div id="secondApiResponse" class="response-container">API 2 Response: ${data2.message}</div>`;
      }
    } catch (err) {
      apiContainer.innerHTML += `<div id="secondApiResponse" class="api-error">${err.message}</div>`;
    }
  });

  document.getElementById("button-2").addEventListener("click", async () => {
    apiContainer.innerHTML = "";

    // Fetch data from API 3
    try {
      const response3 = await fetch("/api/data3");
      if (!response3.ok) {
        const errorText3 = await response3.text(); // Get the error message
        apiContainer.innerHTML = `<div id="thirdApiResponse" class="api-error">${errorText3}</div>`;
      } else {
        const data3 = await response3.json(); // Parse JSON only if response is OK
        apiContainer.innerHTML = `<div id="thirdApiResponse" class="response-container">API 3 Response: ${data3.message}</div>`;
      }
    } catch (err) {
      apiContainer.innerHTML = `<div id="thirdApiResponse" class="api-error">${err.message}</div>`;
    }
  });
});
