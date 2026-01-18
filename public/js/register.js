
document.addEventListener("DOMContentLoaded", () => {
  // ===============================
  // Calendar icon click behavior
  // ===============================
  const dateInput = document.getElementById("dob");
  const dobContainer = document.getElementById("dobContainer");

  if (dobContainer && dateInput) {
    dobContainer.addEventListener("click", () => {
      dateInput.showPicker?.(); // modern browsers
      dateInput.focus();        // Safari/Firefox fallback
    });
  }
});

// ===============================
// Password confirmation validation
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");
  const password = document.querySelector('input[name="password"]');
  const confirm = document.querySelector('input[name="confirmPassword"]');

  form.addEventListener("submit", (e) => {
    if (password.value !== confirm.value) {
      e.preventDefault();
      alert("❌ Passwords do not match!");
    }
  });
});

// ===============================
// Password strength indicator + smart hint + top toast
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  const passwordInput = document.querySelector('input[name="password"]');
  const container = passwordInput.closest(".relative");
  const submitBtn = document.querySelector('button[type="submit"]');

  // ===============================
  // Create strength + hint container
  // ===============================
  const infoContainer = document.createElement("div");
  infoContainer.style.position = "absolute";
  infoContainer.style.left = "16px";

  infoContainer.style.display = "flex";
  infoContainer.style.alignItems = "center";
  infoContainer.style.gap = "8px";
  infoContainer.style.fontSize = "0.75rem";
  infoContainer.style.fontWeight = "500";
  infoContainer.style.transition = "all 0.3s ease";
  infoContainer.style.pointerEvents = "none";
  container.appendChild(infoContainer);

  const strengthText = document.createElement("span");
  const hintText = document.createElement("span");
  hintText.style.opacity = "0.8";
  hintText.style.whiteSpace = "normal";
  hintText.style.maxWidth = "90%";
  hintText.style.lineHeight = "1.2";
  hintText.style.display = "block";

  infoContainer.append(strengthText, hintText);

  // ===============================
  // Strength check + hint helpers
  // ===============================
  const getStrengthInfo = (val) => {
    const reqs = {
      length: val.length >= 8,
      upper: /[A-Z]/.test(val),
      lower: /[a-z]/.test(val),
      digit: /[0-9]/.test(val),
      symbol: /[^A-Za-z0-9]/.test(val),
    };

    const strength = Object.values(reqs).reduce((a, ok) => a + (ok ? 1 : 0), 0);
    const missing = Object.entries(reqs)
      .filter(([, ok]) => !ok)
      .map(([k]) => k);

    return { strength, missing };
  };

  const labelMap = {
    length: "8+ characters",
    upper: "an uppercase letter",
    lower: "a lowercase letter",
    digit: "a number",
    symbol: "a symbol",
  };

  const buildHint = (missing) => {
    if (!missing.length) return "Perfect! Secure password.";
    const parts = missing.map((k) => labelMap[k]);
    const niceList =
      parts.length > 1
        ? parts.slice(0, -1).join(", ") + " and " + parts.slice(-1)
        : parts[0];
    return `Add ${niceList}.`;
  };

  // ===============================
  // Toast (top-center)
  // ===============================
  const showToast = (message, color = "#ef4444") => {
    let toast = document.querySelector(".toast-message");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "toast-message";
      document.body.appendChild(toast);

      toast.style.position = "fixed";
      toast.style.top = "-60px";
      toast.style.left = "50%";
      toast.style.transform = "translateX(-50%)";
      toast.style.background = color;
      toast.style.color = "white";
      toast.style.padding = "12px 20px";
      toast.style.borderRadius = "8px";
      toast.style.fontSize = "0.9rem";
      toast.style.fontWeight = "500";
      toast.style.boxShadow = "0 4px 10px rgba(0,0,0,0.2)";
      toast.style.zIndex = "9999";
      toast.style.opacity = "0";
      toast.style.transition = "all 0.4s ease";
    }

    toast.textContent = message;
    toast.style.background = color;
    toast.style.opacity = "1";
    toast.style.top = "60px";

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.top = "-80px";
    }, 2000);
  };

  // ===============================
  // Initial button state
  // ===============================
  submitBtn.dataset.allowed = "false";
  submitBtn.style.opacity = "0.6";
  submitBtn.style.cursor = "not-allowed";

  // ===============================
  // Input listener
  // ===============================
  passwordInput.addEventListener("input", () => {
    const val = passwordInput.value;
    const { strength, missing } = getStrengthInfo(val);

    if (!val) {
      strengthText.textContent = "";
      hintText.textContent = "";
      submitBtn.style.opacity = "0.6";
      submitBtn.dataset.allowed = "false";
      submitBtn.style.cursor = "not-allowed";
      return;
    }

    if (strength <= 2) {
      strengthText.textContent = "Weak - ";
      strengthText.style.color = "#ef4444";
      hintText.textContent = buildHint(missing);
      hintText.style.color = "#ef4444";

      submitBtn.style.opacity = "0.6";
      submitBtn.dataset.allowed = "false";
      submitBtn.style.cursor = "not-allowed";
    } else if (strength <= 4) {
      strengthText.textContent = "Medium - ";
      strengthText.style.color = "#cfb129ff";
      hintText.textContent = buildHint(missing);
      hintText.style.color = "#cfb129ff";

      submitBtn.style.opacity = "0.6";
      submitBtn.dataset.allowed = "false";
      submitBtn.style.cursor = "not-allowed";
    } else {
      strengthText.textContent = "Strong - ";
      strengthText.style.color = "#22c55e";
      hintText.textContent = "Perfect! Secure password.";
      hintText.style.color = "#22c55e";

      submitBtn.style.opacity = "1";
      submitBtn.dataset.allowed = "true";
      submitBtn.style.cursor = "pointer";
    }
  });

  // ===============================
  // Click handler (toast for weak/medium)
  // ===============================
  submitBtn.addEventListener("click", (e) => {
    const val = passwordInput.value;
    const { strength, missing } = getStrengthInfo(val);
    const allowed = submitBtn.dataset.allowed === "true";

    if (!allowed) {
      e.preventDefault();
      showToast(buildHint(missing), strength <= 2 ? "#ef4444" : "#facc15");
    }
  });
});