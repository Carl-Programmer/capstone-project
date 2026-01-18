// Select all progress rings on the page
document.querySelectorAll('.ring').forEach(ring => {
  // Read the --pct value that EJS already set inline
  const style = getComputedStyle(ring);
  const pct = parseInt(style.getPropertyValue('--pct')) || 0;

  // Animate or update text dynamically
  ring.textContent = `${pct}%`;
});
