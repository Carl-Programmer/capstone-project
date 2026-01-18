// /public/js/help.js
document.addEventListener("DOMContentLoaded", () => {
  const feedbackBtn = document.querySelector("#feedbackBtn");
  const textarea = document.querySelector("textarea");

  feedbackBtn.addEventListener("click", async () => {
    const message = textarea.value.trim();

    if (!message) {
      alert("⚠️ Please type your message before submitting!");
      return;
    }

    try {
      // Disable the button while sending (optional UX)
      feedbackBtn.disabled = true;
      feedbackBtn.textContent = "Sending...";

      const response = await fetch("/help/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      const data = await response.json();

      if (data.success) {
        alert("✅ Thank you for your feedback!");
        textarea.value = "";
      } else {
        alert("❌ " + (data.error || "Something went wrong."));
      }
    } catch (error) {
      console.error("Error sending feedback:", error);
      alert("⚠️ Unable to send feedback right now.");
    } finally {
      // Re-enable button
      feedbackBtn.disabled = false;
      feedbackBtn.textContent = "Submit";
    }
  });
});
