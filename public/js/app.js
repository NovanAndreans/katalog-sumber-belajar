document.addEventListener('DOMContentLoaded', () => {
  // Elemen-elemen DOM Fitur READ
  const loadingState = document.getElementById('loadingState');
  const emptyState = document.getElementById('emptyState');
  const errorState = document.getElementById('errorState');
  const errorMessage = document.getElementById('errorMessage');
  const resourceGrid = document.getElementById('resourceGrid');
  const retryBtn = document.getElementById('retryBtn');

  // Elemen-elemen Modal & Form (CREATE)
  const openModalBtn = document.getElementById('openModalBtn');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const cancelBtn = document.getElementById('cancelBtn');
  const modalOverlay = document.getElementById('modalOverlay');
  const addResourceForm = document.getElementById('addResourceForm');
  const formAlert = document.getElementById('formAlert');
  const submitBtn = document.getElementById('submitBtn');
  const submitBtnText = document.getElementById('submitBtnText');
  const submitSpinner = document.getElementById('submitSpinner');

  // Input Fields
  const inputTitle = document.getElementById('inputTitle');
  const inputTopic = document.getElementById('inputTopic');
  const inputGrade = document.getElementById('inputGrade');
  const inputURL = document.getElementById('inputURL');
  const inputDescription = document.getElementById('inputDescription');

  // Error Text Elements
  const errorTitle = document.getElementById('errorTitle');
  const errorTopic = document.getElementById('errorTopic');
  const errorGrade = document.getElementById('errorGrade');
  const errorURL = document.getElementById('errorURL');
  const errorDescription = document.getElementById('errorDescription');

  const API_ENDPOINT = '/api/resources';

  // -------------------------------------------------------------
  // 1. LOGIKA FETCH DATA (READ)
  // -------------------------------------------------------------
  async function fetchResources() {
    showLoading();

    try {
      const response = await fetch(API_ENDPOINT);
      const result = await response.json();

      if (!response.ok || result.status === 'error') {
        throw new Error(result.message || 'Terjadi kesalahan pada server.');
      }

      const resources = result.data || [];

      if (resources.length === 0) {
        showEmpty();
      } else {
        renderResources(resources);
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
        </div>
        <div>
          <a href="${url}" target="_blank" rel="noopener noreferrer" class="card-link">
            Buka Sumber Belajar &rarr;
          </a>
        </div>
      `;

      resourceGrid.appendChild(card);
    });

    resourceGrid.classList.remove('hidden');
  }

  function showLoading() {
    hideAllStates();
    loadingState.classList.remove('hidden');
  }

  function showEmpty() {
    hideAllStates();
    emptyState.classList.remove('hidden');
  }

  function showError(msg) {
    hideAllStates();
    errorMessage.textContent = msg;
    errorState.classList.remove('hidden');
  }

  function hideAllStates() {
    loadingState.classList.add('hidden');
    emptyState.classList.add('hidden');
    errorState.classList.add('hidden');
    resourceGrid.classList.add('hidden');
  }

  // -------------------------------------------------------------
  // 2. LOGIKA VALIDASI CLIENT-SIDE & FORM SUBMISSION (CREATE)
  // -------------------------------------------------------------
  function clearFormErrors() {
    formAlert.classList.add('hidden');
    formAlert.textContent = '';

    const errorFields = [errorTitle, errorTopic, errorGrade, errorURL, errorDescription];
    errorFields.forEach(el => el.textContent = '');

    const inputs = [inputTitle, inputTopic, inputGrade, inputURL, inputDescription];
    inputs.forEach(el => el.classList.remove('input-error'));
  }

  function validateForm() {
    clearFormErrors();
    let isValid = true;

    // Trimming input
    const titleVal = inputTitle.value.trim();
    const topicVal = inputTopic.value.trim();
    const gradeVal = inputGrade.value.trim();
    const urlVal = inputURL.value.trim();
    const descVal = inputDescription.value.trim();

    // 1. Validasi Title
    if (!titleVal) {
      setError(inputTitle, errorTitle, 'Judul wajib diisi.');
      isValid = false;
    } else if (titleVal.length < 3 || titleVal.length > 100) {
      setError(inputTitle, errorTitle, 'Judul harus antara 3 hingga 100 karakter.');
      isValid = false;
    }

    // 2. Validasi Topic
    if (!topicVal) {
      setError(inputTopic, errorTopic, 'Silakan pilih topik.');
      isValid = false;
    }

    // 3. Validasi Grade (Harus VII, VIII, atau IX)
    const validGrades = ['VII', 'VIII', 'IX'];
    if (!gradeVal || !validGrades.includes(gradeVal)) {
      setError(inputGrade, errorGrade, 'Pilih kelas yang valid (VII, VIII, atau IX).');
      isValid = false;
    }

    // 4. Validasi URL (Wajib http:// atau https://)
    const urlRegex = /^https?:\/\/.+/i;
    if (!urlVal) {
      setError(inputURL, errorURL, 'URL wajib diisi.');
      isValid = false;
    } else if (!urlRegex.test(urlVal)) {
      setError(inputURL, errorURL, 'URL harus diawali dengan http:// atau https://');
      isValid = false;
    }

    // 5. Validasi Description
    if (!descVal) {
      setError(inputDescription, errorDescription, 'Deskripsi wajib diisi.');
      isValid = false;
    } else if (descVal.length < 10 || descVal.length > 500) {
      setError(inputDescription, errorDescription, 'Deskripsi harus antara 10 hingga 500 karakter.');
      isValid = false;
    }

    return {
      isValid,
      data: {
        Title: titleVal,
        Topic: topicVal,
        Grade: gradeVal,
        URL: urlVal,
        Description: descVal
      }
    };
  }

  function setError(inputElement, errorElement, message) {
    inputElement.classList.add('input-error');
    errorElement.textContent = message;
  }

  async function handleFormSubmit(e) {
    e.preventDefault();

    const validation = validateForm();

    // JIKA VALIDASI GAGAL: Hentikan pengiriman data!
    if (!validation.isValid) {
      return;
    }

    setSubmittingState(true);

    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(validation.data)
      });

      const result = await response.json();

      if (!response.ok || result.status === 'error') {
        throw new Error(result.message || 'Gagal menyimpan data.');
      }

      // Berhasil: Tutup modal, reset form, dan refresh daftar katalog
      closeModal();
      addResourceForm.reset();
      await fetchResources();

    } catch (err) {
      formAlert.textContent = err.message;
      formAlert.classList.remove('hidden');
    } finally {
      setSubmittingState(false);
    }
  }

  function setSubmittingState(isSubmitting) {
    if (isSubmitting) {
      submitBtn.disabled = true;
      submitBtnText.textContent = 'Menyimpan...';
      submitSpinner.classList.remove('hidden');
    } else {
      submitBtn.disabled = false;
      submitBtnText.textContent = 'Simpan';
      submitSpinner.classList.add('hidden');
    }
  }

  // Modal Control Functions
  function openModal() {
    clearFormErrors();
    addResourceForm.reset();
    modalOverlay.classList.remove('hidden');
  }

  function closeModal() {
    modalOverlay.classList.add('hidden');
  }

  function escapeHTML(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Event Listeners
  retryBtn.addEventListener('click', fetchResources);
  openModalBtn.addEventListener('click', openModal);
  closeModalBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);
  addResourceForm.addEventListener('submit', handleFormSubmit);

  // Jalankan fetch saat awal memuat
  fetchResources();
});