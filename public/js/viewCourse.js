document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.getElementById("toggleLessonSidebar");
  const sidebar = document.getElementById("lessonSidebar");
  const closeBtn = document.getElementById("closeLessonSidebar");
  const overlay = document.getElementById("lessonOverlay");
  const main = document.querySelector(".main");

  function openSidebar() {
    sidebar.classList.add("active");
    overlay.classList.remove("hidden");
    toggleBtn.classList.add("hidden");
    main.classList.add("shifted");
  }

  function closeSidebar() {
    sidebar.classList.remove("active");
    overlay.classList.add("hidden");
    toggleBtn.classList.remove("hidden");
    main.classList.remove("shifted");
  }

  toggleBtn?.addEventListener("click", () => {
    const isActive = sidebar.classList.contains("active");
    isActive ? closeSidebar() : openSidebar();
  });

  closeBtn?.addEventListener("click", closeSidebar);
  overlay?.addEventListener("click", closeSidebar);
});
