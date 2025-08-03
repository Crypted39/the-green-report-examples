const stars = document.querySelectorAll(".star");
const response = document.getElementById("response");

stars.forEach((star) => {
  star.addEventListener("click", async () => {
    const rating = Number(star.dataset.rating);

    stars.forEach((s) => {
      s.classList.toggle("filled", Number(s.dataset.rating) <= rating);
    });

    try {
      const res = await fetch("/rating", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating }),
      });

      const data = await res.json();
      response.textContent = data.message || "Thanks for rating!";
    } catch (err) {
      response.textContent = "Error sending rating.";
    }
  });
});
