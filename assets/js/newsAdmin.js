(() => {
const API_URL = '/api/news/admin';
const ADMIN_LIST_URL = '/api/news/admin/all';
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');

  const form = document.getElementById('newsForm');
  const tbody = document.querySelector('#newsTable tbody');
  const resetBtn = document.getElementById('newsResetBtn');
  const errorEl = document.getElementById('newsAdminError');
  const successEl = document.getElementById('newsAdminSuccess');

  const idEl = document.getElementById('newsId');
  const titleEl = document.getElementById('newsTitle');
  const summaryEl = document.getElementById('newsSummary');
  const contentEl = document.getElementById('newsContent');
  const imageUrlEl = document.getElementById('newsImageUrl');
  const publishedAtEl = document.getElementById('newsPublishedAt');

  const showError = (message) => {
    if (!errorEl) return;
    errorEl.textContent = message;
    errorEl.classList.remove('d-none');
  };

  const clearError = () => {
    if (!errorEl) return;
    errorEl.textContent = '';
    errorEl.classList.add('d-none');
  };

  const showSuccess = (message) => {
    if (!successEl) return;
    successEl.textContent = message;
    successEl.classList.remove('d-none');
  };

  const clearSuccess = () => {
    if (!successEl) return;
    successEl.textContent = '';
    successEl.classList.add('d-none');
  };

  const formatDateForInput = (isoDate) => {
    if (!isoDate) return '';
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) return '';

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const formatDateForList = (isoDate) => {
    if (!isoDate) return '—';
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString();
  };

  const escapeHtml = (value = '') =>
    String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

  const resetForm = () => {
    if (!form) return;
    form.reset();
    if (idEl) idEl.value = '';
    if (publishedAtEl) publishedAtEl.value = '';
  };

  const getPayload = () => {
    let publishedAt;
    if (publishedAtEl?.value) {
      const parsed = new Date(publishedAtEl.value);
      if (!Number.isNaN(parsed.getTime())) {
        publishedAt = parsed.toISOString();
      }
    }

    
    return {
    title: titleEl?.value?.trim() || '',
    summary: summaryEl?.value?.trim() || '',
    body: contentEl?.value?.trim() || '',
    image: imageUrlEl?.value?.trim() || '',
    category: 'club',
    published: true,
     publishedAt
    };
  };

  const authHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  });

  const fetchNews = async () => {
    clearError();
    clearSuccess();

    
    const res = await fetch(ADMIN_LIST_URL, {
    headers: authHeaders()
    });
    if (!res.ok) {
      throw new Error('Failed to load news posts.');
    }

    const items = await res.json();

    if (!tbody) return;

    tbody.innerHTML = items
      .map(
        (item) => `
      <tr>
        <td>${escapeHtml(item.title)}</td>
        <td>${escapeHtml(formatDateForList(item.publishedAt))}</td>
        <td class="news-admin-actions d-flex gap-2">
          <button class="btn btn-sm btn-outline-primary" data-action="edit" data-id="${item._id}">Edit</button>
          <button class="btn btn-sm btn-outline-danger" data-action="delete" data-id="${item._id}">Delete</button>
        </td>
      </tr>
    `
      )
      .join('');

    tbody.querySelectorAll('button[data-action="edit"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const item = items.find((post) => post._id === btn.dataset.id);
        if (!item) return;

        clearError();
        clearSuccess();

        if (idEl) idEl.value = item._id;
        if (titleEl) titleEl.value = item.title || '';
        if (summaryEl) summaryEl.value = item.summary || '';
        // (edit hydration)
        if (contentEl) contentEl.value = item.body || '';
        if (imageUrlEl) imageUrlEl.value = item.image || '';
        if (publishedAtEl) publishedAtEl.value = formatDateForInput(item.publishedAt);

        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });

    tbody.querySelectorAll('button[data-action="delete"]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm('Delete this news post?')) return;

        clearError();
        clearSuccess();

        const resDelete = await fetch(`${API_URL}/${btn.dataset.id}`, {
          method: 'DELETE',
          headers: authHeaders()
        });

        if (!resDelete.ok) {
          const err = await resDelete.json().catch(() => ({}));
          showError(err.message || 'Failed to delete news post.');
          return;
        }

        showSuccess('News post deleted.');
        await fetchNews();
      });
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    clearError();
    clearSuccess();

    const isEditing = Boolean(idEl?.value);
    const url = isEditing ? `${API_URL}/${idEl.value}` : API_URL;
    const method = isEditing ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: authHeaders(),
      body: JSON.stringify(getPayload())
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      showError(err.message || `Failed to ${isEditing ? 'update' : 'create'} news post.`);
      return;
    }

    resetForm();
    showSuccess(isEditing ? 'News post updated.' : 'News post created.');
    await fetchNews();
  };

  const init = async () => {
    if (!token || userRole !== 'admin') {
      showError('Admin access only. Please sign in with an admin account.');

      if (form) form.style.display = 'none';

      const tableWrap = document.querySelector('#newsTable')?.closest('.card');
      if (tableWrap) tableWrap.style.display = 'none';

      return;
    }

    if (form) form.addEventListener('submit', handleSubmit);
    if (resetBtn) resetBtn.addEventListener('click', resetForm);

    try {
      await fetchNews();
    } catch (error) {
      showError(error.message || 'Unable to load news admin data.');
    }
  };

  init();
})();