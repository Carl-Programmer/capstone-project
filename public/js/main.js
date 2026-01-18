/* =========================================
   Sidebar Active Link Highlighting
   ========================================= */
document.addEventListener("DOMContentLoaded", () => {
  const navLinks = document.querySelectorAll(".nav a");
  const currentPath = window.location.pathname;

  navLinks.forEach(link => {
    // Compare current URL path with link href
    if (link.getAttribute("href") === currentPath) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });
});

/* =========================================
   Logout Modal Functionality
   ========================================= */

    document.addEventListener("DOMContentLoaded", () => {
      const overlay = document.getElementById('logoutModal');
      const logoutBtn = document.getElementById('logoutBtn');
      const closeBtn  = document.getElementById('closeModal');
      const noBtn     = document.getElementById('noBtn');
      const yesBtn    = document.getElementById('yesBtn');

      function openModal(){
        overlay.classList.add('show');
        overlay.setAttribute('aria-hidden','false');
      }
      function closeModal(){
        overlay.classList.remove('show');
        overlay.setAttribute('aria-hidden','true');
      }

      // ✅ Single click works instantly
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openModal();
      });

      closeBtn.addEventListener('click', closeModal);
      noBtn.addEventListener('click', closeModal);
      overlay.addEventListener('click', (e)=>{ if(e.target === overlay) closeModal(); });
      document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape') closeModal(); });

      yesBtn.addEventListener('click', () => {
        window.location.href = "/logout";
      });
    });
    
/* =========================================
   Sidebar Toggle Functionality (Responsive + Safe)
   ========================================= */
document.addEventListener("DOMContentLoaded", () => {
  const sidebar = document.querySelector(".sidebar"); // main sidebar
  const toggleBtn = document.getElementById("toggleSidebar"); // main hamburger
  const main = document.querySelector(".main");

  // ✅ Only run this if the main sidebar actually exists
  if (!sidebar || !toggleBtn) {
    console.log("🟡 Skipping main sidebar script (not present on this page)");
    return;
  }

  // Create overlay if it doesn't exist yet
  let overlay = document.querySelector(".sidebar-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.classList.add("sidebar-overlay");
    document.body.appendChild(overlay);
  }

  let autoCloseTimeout;
  const isMobile = () => window.innerWidth <= 768;

  const openSidebar = () => {
    sidebar.classList.remove("hidden");
    overlay.classList.add("active");

    // Auto-close only on mobile
    if (isMobile()) {
      clearTimeout(autoCloseTimeout);
      autoCloseTimeout = setTimeout(closeSidebar, 5000);
    }
  };

  const closeSidebar = () => {
    sidebar.classList.add("hidden");
    overlay.classList.remove("active");
    clearTimeout(autoCloseTimeout);
  };

  // Toggle sidebar when clicking hamburger
  toggleBtn.addEventListener("click", () => {
    if (sidebar.classList.contains("hidden")) {
      openSidebar();
    } else {
      closeSidebar();
    }
  });

  // Close when clicking overlay
  overlay.addEventListener("click", closeSidebar);

  // ✅ Default states
  if (isMobile()) {
    sidebar.classList.add("hidden");
  } else {
    sidebar.classList.remove("hidden");
  }

  // ✅ Handle window resizing
  window.addEventListener("resize", () => {
    if (isMobile()) {
      sidebar.classList.add("hidden");
    } else {
      sidebar.classList.remove("hidden");
      overlay.classList.remove("active");
      clearTimeout(autoCloseTimeout);
    }
  });
});
