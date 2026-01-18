/* =========================================
   Click-to-Zoom for Lesson Images
   ========================================= */
document.addEventListener("DOMContentLoaded", () => {
  const lessonImages = document.querySelectorAll(".lesson-content img");

  // Create reusable overlay
  const overlay = document.createElement("div");
  overlay.classList.add("img-zoom-overlay");
  document.body.appendChild(overlay);

  const zoomedImg = document.createElement("img");
  overlay.appendChild(zoomedImg);

  // When user clicks an image
  lessonImages.forEach(img => {
    img.addEventListener("click", () => {
      zoomedImg.src = img.src;
      overlay.classList.add("active");
    });
  });

  // When user clicks outside image, close zoom
  overlay.addEventListener("click", () => {
    overlay.classList.remove("active");
  });
});
