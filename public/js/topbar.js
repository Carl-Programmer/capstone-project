document.addEventListener("DOMContentLoaded", () => {
  const notifIcon = document.querySelector('.notif-icon');
  const dropdown = document.getElementById('notifDropdown');
  const notifDot = document.getElementById('notifDot');

  // Check unread notifications
  async function checkUnread() {
    const res = await fetch('/users/notifications');
    const data = await res.json();

    if (data.unreadCount > 0) {
      notifDot.classList.remove("hidden");
      notifIcon.classList.add("bell-shake"); // optional shake
    } else {
      notifDot.classList.add("hidden");
      notifIcon.classList.remove("bell-shake");
    }
  }

  // Run on load
  checkUnread();

  // Toggle dropdown
notifIcon.addEventListener('click', async () => {
  dropdown.classList.toggle("hidden");

  if (!dropdown.classList.contains("hidden")) {
    const res = await fetch("/users/notifications");
    const data = await res.json();

    const list = dropdown.querySelector('.notif-list');

    list.innerHTML = data.notifications.length === 0
      ? `<div class="notif-item">No notifications</div>`
      : data.notifications.map(n => `
          <div class="notif-item" data-id="${n._id}">
            <div>${n.message}</div>
            <small>${new Date(n.createdAt).toLocaleString()}</small>
            <button class="delete-btn" data-id="${n._id}">×</button>
          </div>
        `).join('');

        
      // Mark all as read
      await fetch('/users/notifications/mark-read', {
        method: 'POST'
      });

      notifDot.classList.add("hidden");
      notifIcon.classList.remove("bell-shake");
    }
  });

  // Delete a notification
  document.addEventListener("click", async (e) => {
    if (e.target.classList.contains("delete-btn")) {
      const id = e.target.dataset.id;

      await fetch(`/users/notifications/delete/${id}`, {
        method: "DELETE"
      });

      e.target.closest(".notif-item").remove();

      // Refresh unread indicator
      checkUnread();
    }
  });

  dropdown.querySelector('.view-all').addEventListener('click', () => {
  window.location.href = '/users/notifications/all'; // your notifications page
});

});

// ==============================================
// Live Search Suggestions
// ==============================================

document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.querySelector(".search input");
  if (!searchInput) return;

  const suggestionBox = document.createElement("div");
  suggestionBox.className = "search-suggestions hidden";
  searchInput.parentNode.appendChild(suggestionBox);

  let timeout = null;

  searchInput.addEventListener("input", () => {
    const query = searchInput.value.trim();
    clearTimeout(timeout);

    if (query.length === 0) {
      suggestionBox.classList.add("hidden");
      suggestionBox.innerHTML = "";
      return;
    }

    timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/users/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();

        if (!data.suggestions || data.suggestions.length === 0) {
          suggestionBox.innerHTML = `<div class="no-results">No matches found</div>`;
          suggestionBox.classList.remove("hidden");
          return;
        }

        suggestionBox.innerHTML = data.suggestions
          .map(s => `
            <div 
              class="suggestion-item" 
              data-id="${s.id}" 
              data-type="${s.type}" 
              ${s.courseId ? `data-course-id="${s.courseId}"` : ""}
            >
              <i class="fas fa-${s.type === "Lesson" ? "book-open" : "graduation-cap"}"></i>
              <span>${s.text}</span>
            </div>
          `)

          .join("");

        suggestionBox.classList.remove("hidden");

        // ✅ Handle click redirection
        document.querySelectorAll(".suggestion-item").forEach(item => {
          item.addEventListener("click", () => {
            const type = item.dataset.type;
            const id = item.dataset.id;

            if (type === "Lesson") {
              window.location.href = `/courses/${item.dataset.courseId}`;
            } else if (type === "Course") {
              window.location.href = `/courses/${id}`;
            }

            suggestionBox.classList.add("hidden");
          });
        });
      } catch (err) {
        console.error("Search error:", err);
      }
    }, 300);
  });

  // Hide dropdown if user clicks outside
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".search")) {
      suggestionBox.classList.add("hidden");
    }
  });
});

// =========================================
// Sidebar Toggle + Overlay Functionality
// =========================================
document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.getElementById("toggleSidebar");
  const sidebar = document.querySelector(".sidebar");
  const overlay = document.getElementById("overlay");

  if (toggleBtn && sidebar && overlay) {
    toggleBtn.addEventListener("click", () => {
      sidebar.classList.toggle("hidden");
      overlay.classList.toggle("hidden");
    });

    overlay.addEventListener("click", () => {
      sidebar.classList.add("hidden");
      overlay.classList.add("hidden");
    });
  }
});
