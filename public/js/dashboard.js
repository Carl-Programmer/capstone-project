// ===== Calendar =====
(function () {
  const titleEl = document.getElementById("calTitle");
  const daysEl = document.getElementById("calDays");
  const prevBtn = document.getElementById("prevMonth");
  const nextBtn = document.getElementById("nextMonth");
  const MONTHS = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const state = new Date();
  state.setDate(1);
  function render() {
    const y = state.getFullYear(),
      m = state.getMonth();
    titleEl.textContent = `${MONTHS[m]} ${y}`;
    const first = new Date(y, m, 1),
      startIdx = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(y, m + 1, 0).getDate(),
      daysInPrev = new Date(y, m, 0).getDate();
    const cells = [];
    for (let i = startIdx; i > 0; i--) {
      cells.push(`<div class="cal-cell muted">${daysInPrev - i + 1}</div>`);
    }
    const today = new Date();
    for (let d = 1; d <= daysInMonth; d++) {
      const isToday =
        d === today.getDate() &&
        m === today.getMonth() &&
        y === today.getFullYear();
      cells.push(`<div class="cal-cell${isToday ? " today" : ""}">${d}</div>`);
    }
    while (cells.length < 42) {
      cells.push(
        `<div class="cal-cell muted">${
          cells.length - (startIdx + daysInMonth) + 1
        }</div>`
      );
    }
    daysEl.innerHTML = cells.join("");
  }
  prevBtn.addEventListener("click", () => {
    state.setMonth(state.getMonth() - 1);
    render();
  });
  nextBtn.addEventListener("click", () => {
    state.setMonth(state.getMonth() + 1);
    render();
  });
  render();
})();

