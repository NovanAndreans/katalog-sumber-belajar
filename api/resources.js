export default async function handler(req, res) {
  const scriptUrl = process.env.GOOGLE_APPS_SCRIPT_URL;

  if (!scriptUrl) {
    return res.status(500).json({
      status: 'error',
      message: 'Konfigurasi server belum lengkap: GOOGLE_APPS_SCRIPT_URL tidak ditemukan.'
    });
  }

  // Helper fungsi validasi payload data
  function validatePayload(data) {
    const cleanTitle = (data.Title || '').trim();
    const cleanTopic = (data.Topic || '').trim();
    const cleanGrade = (data.Grade || '').trim();
    const cleanURL = (data.URL || '').trim();
    const cleanDescription = (data.Description || '').trim();

    if (!cleanTitle || cleanTitle.length < 3 || cleanTitle.length > 100) {
      return 'Judul (Title) harus terdiri dari 3 hingga 100 karakter.';
    }
    if (!cleanTopic) {
      return 'Topik (Topic) wajib dipilih/diisi.';
    }
    const allowedGrades = ['VII', 'VIII', 'IX'];
    if (!allowedGrades.includes(cleanGrade)) {
      return 'Kelas (Grade) hanya boleh bernilai VII, VIII, atau IX.';
    }
    const urlPattern = /^https?:\/\/.+/i;
    if (!cleanURL || !urlPattern.test(cleanURL)) {
      return 'URL tidak valid. Wajib diawali dengan http:// atau https://';
    }
    if (!cleanDescription || cleanDescription.length < 10 || cleanDescription.length > 500) {
      return 'Deskripsi (Description) harus terdiri dari 10 hingga 500 karakter.';
    }

    return {
      Title: cleanTitle,
      Topic: cleanTopic,
      Grade: cleanGrade,
      URL: cleanURL,
      Description: cleanDescription
    };
  }

  // -------------------------------------------------------------
  // 1. GET (READ)
  // -------------------------------------------------------------
  if (req.method === 'GET') {
    try {
      const response = await fetch(scriptUrl, { method: 'GET', headers: { 'Accept': 'application/json' } });
      if (!response.ok) throw new Error(`Google Apps Script error status ${response.status}`);
      const data = await response.json();
      return res.status(200).json(data);
    } catch (error) {
      return res.status(500).json({ status: 'error', message: 'Gagal mengambil data.', detail: error.message });
    }
  }

  // -------------------------------------------------------------
  // 2. POST (CREATE)
  // -------------------------------------------------------------
  else if (req.method === 'POST') {
    try {
      const validated = validatePayload(req.body || {});
      if (typeof validated === 'string') {
        return res.status(400).json({ status: 'error', message: validated });
      }

      const payload = {
        action: 'CREATE',
        ID: 'RES-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        CreatedAt: new Date().toISOString(),
        ...validated
      };

      const response = await fetch(scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      return res.status(201).json(result);
    } catch (error) {
      return res.status(500).json({ status: 'error', message: 'Gagal menambah data.', detail: error.message });
    }
  }

  // -------------------------------------------------------------
  // 3. PUT (UPDATE)
  // -------------------------------------------------------------
  else if (req.method === 'PUT') {
    try {
      const { ID } = req.body || {};
      const cleanID = (ID || '').trim();

      if (!cleanID) {
        return res.status(400).json({ status: 'error', message: 'ID unik wajib disertakan untuk memperbarui data.' });
      }

      const validated = validatePayload(req.body || {});
      if (typeof validated === 'string') {
        return res.status(400).json({ status: 'error', message: validated });
      }

      const payload = {
        action: 'UPDATE',
        ID: cleanID,
        ...validated
      };

      const response = await fetch(scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({ status: 'error', message: 'Gagal memperbarui data.', detail: error.message });
    }
  }

  // -------------------------------------------------------------
  // 4. DELETE (DELETE)
  // -------------------------------------------------------------
  else if (req.method === 'DELETE') {
    try {
      const { ID } = req.body || {};
      const cleanID = (ID || '').trim();

      if (!cleanID) {
        return res.status(400).json({ status: 'error', message: 'ID unik wajib disertakan untuk menghapus data.' });
      }

      const payload = {
        action: 'DELETE',
        ID: cleanID
      };

      const response = await fetch(scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({ status: 'error', message: 'Gagal menghapus data.', detail: error.message });
    }
  }

  else {
    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    return res.status(405).json({ status: 'error', message: `Metode ${req.method} tidak diizinkan` });
  }
}