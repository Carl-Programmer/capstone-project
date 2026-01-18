document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.getElementById("adminLogoutBtn");

  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      // optional confirmation
      if (confirm("Are you sure you want to log out?")) {
        window.location.href = "/logout";
      }
    });
  }
});
