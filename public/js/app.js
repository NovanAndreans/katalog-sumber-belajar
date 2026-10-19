document.addEventListener('DOMContentLoaded', () => {
  // Read Elements
  const loadingState = document.getElementById('loadingState');
  const emptyState = document.getElementById('emptyState');
  const errorState = document.getElementById('errorState');
  const errorMessage = document.getElementById('errorMessage');
  const resourceGrid = document.getElementById('resourceGrid');
  const retryBtn = document.getElementById('retryBtn');
  const toastNotification = document.getElementById('toastNotification');

  // Form Modal Elements (Create & Update)
  const openModalBtn = document.getElementById('openModalBtn');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const cancelBtn = document.getElementById('cancelBtn');
  const modalOverlay = document.getElementById('modalOverlay');
  const modalTitle = document.getElementById('modalTitle');
  const addResourceForm = document.getElementById('addResourceForm');
  const formAlert = document.getElementById('formAlert');
  const submitBtn = document.getElementById('submitBtn');
  const submitBtnText = document.getElementById('submitBtnText');
  const submitSpinner = document.getElementById('submitSpinner');

  const resourceId = document.getElementById('resourceId');
  const inputTitle = document.getElementById('inputTitle');
  const inputTopic = document.getElementById('inputTopic');
  const inputGrade = document.getElementById('inputGrade');
  const inputURL = document.getElementById('inputURL');
  const inputDescription = document.getElementById('inputDescription');

  const errorTitle = document.getElementById('errorTitle');
  const errorTopic = document.getElementById('errorTopic');
  const errorGrade = document.getElementById('errorGrade');
  const errorURL = document.getElementById('errorURL');
  const errorDescription = document.getElementById('errorDescription');

  // Delete Modal Elements
  const deleteModalOverlay = document.getElementById('deleteModalOverlay');
  const closeDeleteModalBtn = document.getElementById('closeDeleteModalBtn');
  const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
  const deleteTargetTitle = document.getElementById('deleteTargetTitle');
  const deleteBtnText = document.getElementById('deleteBtnText');
  const deleteSpinner = document.getElementById('deleteSpinner');

  const API_ENDPOINT = '/api/resources';
  let currentResources = [];
  let deleteTargetId = null;

  // -------------------------------------------------------------
  // 1. FETCH & RENDER (READ)
  // -------------------------------------------------------------
  async function fetchResources() {
    showLoading();
    try {
      const response = await fetch(API_ENDPOINT);
      const result = await response.json();

      if (!response.ok || result.status === 'error') {
        throw new Error(result.message || 'Terjadi kesalahan pada server.');
      }

      currentResources = result.data || [];

      if (currentResources.length === 0) {
        showEmpty();
      } else {
        renderResources(currentResources);
      }
    } catch (err) {
      showError(err.message);
    }
  }

  function renderResources(items) {
    hideAllStates();
    resourceGrid.innerHTML = '';

    items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'card';

      const title = escapeHTML(item.Title);
      const topic = escapeHTML(item.Topic);
      const grade = escapeHTML(item.Grade);
      const desc = escapeHTML(item.Description);
      const url = escapeHTML(item.URL);

      card.innerHTML = `
        <div>
          <div class="card-header">
            <span class="badge badge-grade">Kelas ${grade}</span>
            <span class="badge badge-topic">${topic}</span>
          </div>
          <h3 class="card-title">${title}</h3>
          <p class="card-desc">${desc}</p>
          <a href="${url}" target="_blank" rel="noopener noreferrer" class="card-link">
            Buka Sumber Belajar &rarr;
          </a>
        </div>
        <div class="card-actions">
          <button class="btn btn-sm btn-outline-primary edit-btn" data-id="${item.ID}">Edit</button>
          <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${item.ID}">Hapus</button>
        </div>
      `;

      resourceGrid.appendChild(card);
    });

    // Event listener tombol Edit & Delete pada kartu
    document.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', (e) => openEditModal(e.target.dataset.id));
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => openDeleteModal(e.target.dataset.id));
    });

    resourceGrid.classList.remove('hidden');
  }

  // -------------------------------------------------------------
  // 2. LOGIKA EDIT (UPDATE) & FORM
  // -------------------------------------------------------------
  function openEditModal(id) {
    const item = currentResources.find(r => r.ID === id);
    if (!item) return;

    clearFormErrors();
    resourceId.value = item.ID;
    inputTitle.value = item.Title;
    inputTopic.value = item.Topic;
    inputGrade.value = item.Grade;
    inputURL.value = item.URL;
    inputDescription.value = item.Description;

    modalTitle.textContent = 'Edit Sumber Belajar';
    modalOverlay.classList.remove('hidden');
  }

  function openCreateModal() {
    clearFormErrors();
    addResourceForm.reset();
    resourceId.value = '';
    modalTitle.textContent = 'Tambah Sumber Belajar Baru';
    modalOverlay.classList.remove('hidden');
  }

  async function handleFormSubmit(e) {
    e.preventDefault();
    const validation = validateForm();
    if (!validation.isValid) return;

    setSubmittingState(true);
    const isEdit = Boolean(resourceId.value);
    const method = isEdit ? 'PUT' : 'POST';
    const payload = isEdit ? { ID: resourceId.value, ...validation.data } : validation.data;

    try {
      const response = await fetch(API_ENDPOINT, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (!response.ok || result.status === 'error') {
        throw new Error(result.message || 'Gagal menyimpan data.');
      }

      closeModal();
      showToast(isEdit ? 'Data berhasil diperbarui!' : 'Data berhasil ditambahkan!');
      await fetchResources();
    } catch (err) {
      formAlert.textContent = err.message;
      formAlert.classList.remove('hidden');
    } finally {
      setSubmittingState(false);
    }
  }

  // -------------------------------------------------------------
  // 3. LOGIKA HAPUS (DELETE)
  // -------------------------------------------------------------
  function openDeleteModal(id) {
    const item = currentResources.find(r => r.ID === id);
    if (!item) return;

    deleteTargetId = id;
    deleteTargetTitle.textContent = `"${item.Title}"`;
    deleteModalOverlay.classList.remove('hidden');
  }

  async function handleConfirmDelete() {
    if (!deleteTargetId) return;

    setDeleteSubmittingState(true);

    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ID: deleteTargetId })
      });

      const result = await response.json();
      if (!response.ok || result.status === 'error') {
        throw new Error(result.message || 'Gagal menghapus data.');
      }

      closeDeleteModal();
      showToast('Data berhasil dihapus!');
      await fetchResources();
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleteSubmittingState(false);
    }
  }

  function closeDeleteModal() {
    deleteModalOverlay.classList.add('hidden');
    deleteTargetId = null;
  }

  // Helper Toast Notification
  function showToast(msg) {
    toastNotification.textContent = msg;
    toastNotification.classList.remove('hidden');
    setTimeout(() => {
      toastNotification.classList.add('hidden');
    }, 3000);
  }

  // UI State Helpers
  function setSubmittingState(isSubmitting) {
    submitBtn.disabled = isSubmitting;
    submitBtnText.textContent = isSubmitting ? 'Menyimpan...' : 'Simpan';
    submitSpinner.classList.toggle('hidden', !isSubmitting);
  }

  function setDeleteSubmittingState(isSubmitting) {
    confirmDeleteBtn.disabled = isSubmitting;
    deleteBtnText.textContent = isSubmitting ? 'Menghapus...' : 'Hapus';
    deleteSpinner.classList.toggle('hidden', !isSubmitting);
  }

  function validateForm() {
    clearFormErrors();
    let isValid = true;

    const titleVal = inputTitle.value.trim();
    const topicVal = inputTopic.value.trim();
    const gradeVal = inputGrade.value.trim();
    const urlVal = inputURL.value.trim();
    const descVal = inputDescription.value.trim();

    if (!titleVal || titleVal.length < 3 || titleVal.length > 100) {
      setError(inputTitle, errorTitle, 'Judul harus antara 3 hingga 100 karakter.');
      isValid = false;
    }
    if (!topicVal) {
      setError(inputTopic, errorTopic, 'Silakan pilih topik.');
      isValid = false;
    }
    if (!['VII', 'VIII', 'IX'].includes(gradeVal)) {
      setError(inputGrade, errorGrade, 'Pilih kelas yang valid (VII, VIII, atau IX).');
      isValid = false;
    }
    const urlRegex = /^https?:\/\/.+/i;
    if (!urlVal || !urlRegex.test(urlVal)) {
      setError(inputURL, errorURL, 'URL harus diawali dengan http:// atau https://');
      isValid = false;
    }
    if (!descVal || descVal.length < 10 || descVal.length > 500) {
      setError(inputDescription, errorDescription, 'Deskripsi harus antara 10 hingga 500 karakter.');
      isValid = false;
    }

    return { isValid, data: { Title: titleVal, Topic: topicVal, Grade: gradeVal, URL: urlVal, Description: descVal } };
  }

  function setError(inputElement, errorElement, message) {
    inputElement.classList.add('input-error');
    errorElement.textContent = message;
  }

  function clearFormErrors() {
    formAlert.classList.add('hidden');
    [errorTitle, errorTopic, errorGrade, errorURL, errorDescription].forEach(el => el.textContent = '');
    [inputTitle, inputTopic, inputGrade, inputURL, inputDescription].forEach(el => el.classList.remove('input-error'));
  }

  function showLoading() { hideAllStates(); loadingState.classList.remove('hidden'); }
  function showEmpty() { hideAllStates(); emptyState.classList.remove('hidden'); }
  function showError(msg) { hideAllStates(); errorMessage.textContent = msg; errorState.classList.remove('hidden'); }
  function hideAllStates() {
    loadingState.classList.add('hidden');
    emptyState.classList.add('hidden');
    errorState.classList.add('hidden');
    resourceGrid.classList.add('hidden');
  }

  function closeModal() { modalOverlay.classList.add('hidden'); }
  function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  // Event Listeners
  retryBtn.addEventListener('click', fetchResources);
  openModalBtn.addEventListener('click', openCreateModal);
  closeModalBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);
  addResourceForm.addEventListener('submit', handleFormSubmit);

  closeDeleteModalBtn.addEventListener('click', closeDeleteModal);
  cancelDeleteBtn.addEventListener('click', closeDeleteModal);
  confirmDeleteBtn.addEventListener('click', handleConfirmDelete);

  fetchResources();
});