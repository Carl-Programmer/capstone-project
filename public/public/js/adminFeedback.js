document.addEventListener("DOMContentLoaded", () => {
  const feedbackBoxes = document.querySelectorAll(".feedback-message");

  feedbackBoxes.forEach((box) => {
    const btn = box.nextElementSibling; // toggle button

    // Hide "Show More" if message height is short
    if (box.scrollHeight <= 210) {
      btn.style.display = "none";
    }

    btn.addEventListener("click", () => {
      box.classList.toggle("expanded");
      btn.textContent = box.classList.contains("expanded")
        ? "Show Less"
        : "Show More";
    });
  });
});

