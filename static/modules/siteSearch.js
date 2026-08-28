const searchForm = document.querySelector('form.search[data-search-site]');

if (searchForm) {
  searchForm.addEventListener('submit', (event) => {
    const searchInput = searchForm.elements.q;
    const query = searchInput.value.trim();

    if (!query) {
      event.preventDefault();
      searchInput.focus();
      return;
    }

    event.preventDefault();

    const site = searchForm.dataset.searchSite;
    const params = new URLSearchParams({ q: `site:${site} ${query}` });
    window.location.assign(`${searchForm.action}?${params}`);
  });
}
