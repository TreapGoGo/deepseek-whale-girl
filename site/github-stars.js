document.querySelectorAll('[data-github-star-count]').forEach((badge) => {
  const countBadge = document.createElement('img');
  countBadge.src = 'https://img.shields.io/github/stars/TreapGoGo/deepseek-whale-girl?style=flat&label=stars';
  countBadge.alt = 'GitHub stars';
  badge.replaceChildren(countBadge);
  badge.hidden = false;
});
