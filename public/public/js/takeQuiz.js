document.addEventListener("DOMContentLoaded", () => {

  // ==========================
  // 0. Grab important elements
  // ==========================
  const examForm = document.getElementById('examForm');
  const finishBtn = document.querySelector('.finish');
  const finishModal = document.getElementById('finishModal');
  const cancelFinish = document.getElementById('cancelFinish');
  const confirmFinish = document.getElementById('confirmFinish');

// ==========================
// 1. BUILD NAV BUTTONS
// ==========================
const navGrid = document.getElementById('navGrid');
let manualScroll = false;
let scrollTimeout = null;

for (let i = 1; i <= totalQuestions; i++) {
  const btn = document.createElement('button');
  btn.type = "button";
  btn.className = 'nav-btn';
  btn.textContent = i;
  btn.dataset.index = i;

  btn.addEventListener('click', () => {
    manualScroll = true;
    setActive(i);

    const target = document.getElementById('q' + i);
    if (target) {
      // Center the clicked question in the viewport
      const rect = target.getBoundingClientRect();
      const scrollTop = window.scrollY + rect.top - (window.innerHeight / 2) + (rect.height / 2);
      window.scrollTo({ top: scrollTop, behavior: 'smooth' });
    }

    // Fallback timeout (in case scroll event doesn’t fire)
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => manualScroll = false, 1000);
  });

  navGrid.appendChild(btn);
}

const btns = [...document.querySelectorAll('.nav-btn')];

function setActive(n) {
  btns.forEach(b => b.classList.toggle('active', Number(b.dataset.index) === n));
}

setActive(1);

  // ==========================
  // 2. HIGHLIGHT WHEN ANSWERING
  // ==========================
  document.querySelectorAll('.q-card').forEach(card => {
    const qIndex = Number(card.id.replace('q', ''));

    card.querySelectorAll('input[type="radio"]').forEach(inp => {
      inp.addEventListener('change', () => {
        setActive(qIndex);
      });
    });
  });

  // ==========================
  // 3. NAV BUTTON: ANSWERED STATE
  // ==========================
  document.querySelectorAll('.q-card').forEach(card => {
    const qIndex = Number(card.id.replace('q', ''));

    card.querySelectorAll('input[type="radio"]').forEach(inp => {
      inp.addEventListener('change', () => {
        const navBtn = btns[qIndex - 1];
        navBtn.classList.add("answered");
      });
    });
  });


// ==========================
// 4. SCROLL SPY (observer)
// ==========================
const observer = new IntersectionObserver(entries => {
  if (manualScroll) return; // skip while auto-scrolling

  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = Number(entry.target.id.replace('q', ''));
      setActive(id);
    }
  });
}, { threshold: 0.6 }); // slightly looser, smoother detection

document.querySelectorAll('.q-card').forEach(q => observer.observe(q));

// Listen for scroll stop to re-enable observer precisely
window.addEventListener('scroll', () => {
  if (manualScroll) {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => { manualScroll = false; }, 250);
  }
});

  // ==========================
  // 5. MARK QUESTION
  // ==========================
  const markState = new Set();

  document.querySelectorAll('.mark').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();

      const n = Number(a.dataset.mark);

      if (markState.has(n)) {
        markState.delete(n);
        a.classList.remove('marked');
      } else {
        markState.add(n);
        a.classList.add('marked');
      }

      const navBtn = btns.find(x => Number(x.dataset.index) === n);
      navBtn.classList.toggle('marked', markState.has(n));
    });
  });

  // ==========================
  // 6. CLEAR ANSWER (keep highlight)
  // ==========================
  document.querySelectorAll('[data-clear]').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.dataset.clear;
      const qIndex = Number(name.replace('q', ''));

      // Uncheck all radios
      document.querySelectorAll(`input[name="${name}"]`)
        .forEach(i => i.checked = false);

      // Remove "answered" but preserve "active"
      const navBtn = btns[qIndex];
      if (navBtn) navBtn.classList.remove("answered");

      // Keep highlight on the same question
      setActive(qIndex + 1);
    });
  });

  // ==========================
  // 7. TIMER AUTO-SUBMIT handled in EJS script
  // ==========================

  // ==========================
  // 8. BACK TO TOP
  // ==========================
  const toTop = document.getElementById('toTop');
  if (toTop) {
    toTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ==========================
  // 9. FINISH ATTEMPT MODAL
  // ==========================
  if (finishBtn) {
    finishBtn.addEventListener('click', (e) => {
      e.preventDefault();
      finishModal.classList.remove('hidden');
    });
  }

  if (cancelFinish) {
    cancelFinish.addEventListener('click', () => {
      finishModal.classList.add('hidden');
    });
  }

  if (confirmFinish) {
    confirmFinish.addEventListener('click', () => {
      if (examForm) examForm.submit();
    });
  }

});
