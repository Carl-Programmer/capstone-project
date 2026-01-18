// GLOBAL PASSWORD TOGGLE SCRIPT
document.addEventListener("DOMContentLoaded", () => {
  const toggles = document.querySelectorAll("#togglePassword, .toggle-password");

  toggles.forEach((icon) => {
    icon.addEventListener("click", () => {
      // Find the related input (previousElementSibling or nearest input)
      const input = icon.previousElementSibling;

      if (!input) return; // safety check

      // Toggle input type
      const isPassword = input.getAttribute("type") === "password";
      input.setAttribute("type", isPassword ? "text" : "password");

      // Toggle icon style
      icon.classList.toggle("fa-eye");
      icon.classList.toggle("fa-eye-slash");
    });
  });
});

