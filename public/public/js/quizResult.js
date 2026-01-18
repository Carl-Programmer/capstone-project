
document.addEventListener("DOMContentLoaded", async () => {
  if (!courseId) return;

  // Wait 1 second for UI to show
  setTimeout(async () => {
    const res = await fetch(`/api/course-progress/${courseId}`);
    const data = await res.json();

    if (data.success) {
      console.log("Progress updated:", data.progress);

      // EXAMPLE: Show updated progress message on quiz screen
      const extraInfo = document.createElement("p");
      extraInfo.className = "mt-3 text-sm text-green-600";
      extraInfo.innerText = `Your course progress is now ${data.progress}%`;
      document.body.appendChild(extraInfo);
    }
  }, 1000);
});

