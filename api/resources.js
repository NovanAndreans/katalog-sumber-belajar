export default async function handler(req, res) {
  const scriptUrl = process.env.GOOGLE_APPS_SCRIPT_URL;

  if (!scriptUrl) {
    return res.status(500).json({
      status: 'error',
      message: 'Konfigurasi server belum lengkap: GOOGLE_APPS_SCRIPT_URL tidak ditemukan.'
    });
  }

  // -------------------------------------------------------------
  // FITUR READ (GET)
  // -------------------------------------------------------------
  if (req.method === 'GET') {
    try {
      const response = await fetch(scriptUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`Google Apps Script merespons dengan status ${response.status}`);
      }

      const data = await response.json();
      return res.status(200).json(data);

    } catch (error) {
      return res.status(500).json({
        status: 'error',
        message: 'Gagal mengambil data dari Google Sheets',
        detail: error.message
      });
    }
  }

  // -------------------------------------------------------------
  // FITUR CREATE (POST)
  // -------------------------------------------------------------
  else if (req.method === 'POST') {
    try {
      const { Title, Topic, Grade, URL, Description } = req.body || {};

      // Cleaning / Trimming
      const cleanTitle = (Title || '').trim();
      const cleanTopic = (Topic || '').trim();
      const cleanGrade = (Grade || '').trim();
      const cleanURL = (URL || '').trim();
      const cleanDescription = (Description || '').trim();

      // --- VALIDASI SERVER-SIDE ---
      // 1. Validasi Title
      if (!cleanTitle) {
        return res.status(400).json({
          status: 'error',
          message: 'Judul (Title) wajib diisi.'
        });
      }
      if (cleanTitle.length < 3 || cleanTitle.length > 100) {
        return res.status(400).json({
          status: 'error',
          message: 'Judul harus terdiri dari 3 hingga 100 karakter.'
        });
      }

      // 2. Validasi Topic
      if (!cleanTopic) {
        return res.status(400).json({
          status: 'error',
          message: 'Topik (Topic) wajib dipilih/diisi.'
        });
      }

      // 3. Validasi Grade (Hanya boleh VII, VIII, atau IX)
      const allowedGrades = ['VII', 'VIII', 'IX'];
      if (!allowedGrades.includes(cleanGrade)) {
        return res.status(400).json({
          status: 'error',
          message: 'Kelas (Grade) hanya boleh bernilai VII, VIII, atau IX.'
        });
      }

      // 4. Validasi URL (Wajib protokol http atau https)
      const urlPattern = /^https?:\/\/.+/i;
      if (!cleanURL || !urlPattern.test(cleanURL)) {
        return res.status(400).json({
          status: 'error',
          message: 'URL tidak valid. URL wajib diawali dengan http:// atau https://'
        });
      }

      // 5. Validasi Description
      if (!cleanDescription) {
        return res.status(400).json({
          status: 'error',
          message: 'Deskripsi (Description) wajib diisi.'
        });
      }
      if (cleanDescription.length < 10 || cleanDescription.length > 500) {
        return res.status(400).json({
          status: 'error',
          message: 'Deskripsi harus terdiri dari 10 hingga 500 karakter.'
        });
      }

      // Generator ID unik & Timestamp
      const generatedID = 'RES-' + Date.now();
      const createdAt = new Date().toISOString();

      const newResource = {
        ID: generatedID,
        Title: cleanTitle,
        Topic: cleanTopic,
        Grade: cleanGrade,
        URL: cleanURL,
        Description: cleanDescription,
        CreatedAt: createdAt
      };

      // Kirim payload terverifikasi ke Google Apps Script
      const response = await fetch(scriptUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newResource)
      });

      if (!response.ok) {
        throw new Error(`Google Apps Script merespons dengan status ${response.status}`);
      }

      const result = await response.json();
      return res.status(201).json(result);

    } catch (error) {
      return res.status(500).json({
        status: 'error',
        message: 'Gagal menambah data ke Google Sheets',
        detail: error.message
      });
    }
  }

  // Jika method selain GET atau POST
  else {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({
      status: 'error',
      message: `Metode ${req.method} tidak diizinkan`
    });
  }
}