const generateBtn = document.getElementById("get-tv-shows-button");

generateBtn.addEventListener("click", async () => {
  try {
    const tvShowsUrl = `https://api.tvmaze.com/shows/39`;
    const tvShowsResponse = await fetch(tvShowsUrl);
    const tvShowsData = await tvShowsResponse.json();

    if (tvShowsData.name) {
      document.getElementById("show-name").textContent = tvShowsData.name;
    } else {
      document.getElementById("show-name").textContent = "No data available.";
    }
  } catch (error) {
    console.error(error);
    document.getElementById("show-name").textContent =
      "Error fetching TV Shows data.";
  }
});
