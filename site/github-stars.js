document.querySelectorAll('[data-github-star-count]').forEach((badge) => {
  const count = badge.querySelector('[data-star-count-value]');
  const cacheKey = 'whale-girl-github-stars';
  const showCount = (value) => {
    count.textContent = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
    badge.hidden = false;
  };
  badge.hidden = true;
  try {
    const cached = JSON.parse(localStorage.getItem(cacheKey));
    if (Number.isInteger(cached?.value) && cached.value >= 0 && Date.now() - cached.saved < 3600000) showCount(cached.value);
  } catch { /* Private browsing may disallow storage. */ }

  fetch('https://api.github.com/repos/TreapGoGo/deepseek-whale-girl')
    .then((response) => response.ok ? response.json() : null)
    .then((repository) => {
      if (Number.isInteger(repository?.stargazers_count)) {
        showCount(repository.stargazers_count);
        try { localStorage.setItem(cacheKey, JSON.stringify({ value: repository.stargazers_count, saved: Date.now() })); } catch { /* Count still works without storage. */ }
      }
    })
    .catch(() => {});
});
