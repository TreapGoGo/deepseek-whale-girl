document.querySelectorAll('[data-github-star-count]').forEach((badge) => {
  const count = badge.querySelector('[data-star-count-value]');
  count.textContent = '0';
  badge.hidden = false;

  fetch('https://api.github.com/repos/TreapGoGo/deepseek-whale-girl')
    .then((response) => response.ok ? response.json() : null)
    .then((repository) => {
      if (Number.isInteger(repository?.stargazers_count)) {
        count.textContent = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(repository.stargazers_count);
      }
    })
    .catch(() => {});
});
