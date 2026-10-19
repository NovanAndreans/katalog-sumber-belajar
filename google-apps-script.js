function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("Resources");

    if (!sheet) {
      return responseJSON({ status: "error", message: "Tab 'Resources' tidak ditemukan." }, 404);
    }

    const data = sheet.getDataRange().getValues();

    if (data.length <= 1) {
      return responseJSON({ status: "success", data: [] });
    }

    const rows = data.slice(1);
    const resources = rows.map(row => {
      return {
        ID: String(row[0] || ""),
        Title: String(row[1] || ""),
        Topic: String(row[2] || ""),
        Grade: String(row[3] || ""),
        URL: String(row[4] || ""),
        Description: String(row[5] || ""),
        CreatedAt: row[6] ? new Date(row[6]).toISOString() : ""
      };
    });

    return responseJSON({ status: "success", data: resources });
  } catch (error) {
    return responseJSON({ status: "error", message: error.toString() }, 500);
  }
}

function doPost(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("Resources");

    if (!sheet) {
      return responseJSON({ status: "error", message: "Tab 'Resources' tidak ditemukan." }, 404);
    }

    const body = JSON.parse(e.postData.contents);
    const action = body.action || "CREATE"; // CREATE, UPDATE, DELETE

    // 1. AKSI CREATE
    if (action === "CREATE") {
      sheet.appendRow([
        body.ID,
        body.Title,
        body.Topic,
        body.Grade,
        body.URL,
        body.Description,
        body.CreatedAt
      ]);
      return responseJSON({ status: "success", message: "Data berhasil disimpan." });
    }

    // 2. AKSI UPDATE
    if (action === "UPDATE") {
      const targetId = String(body.ID);
      const data = sheet.getDataRange().getValues();
      let rowIndex = -1;

      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]) === targetId) {
          rowIndex = i + 1; // 1-based index di Google Sheets
          break;
        }
      }

      if (rowIndex === -1) {
        return responseJSON({ status: "error", message: "Data dengan ID tersebut tidak ditemukan." }, 404);
      }

      // Perbarui kolom B sampai F (Title, Topic, Grade, URL, Description)
      sheet.getRange(rowIndex, 2, 1, 5).setValues([[
        body.Title,
        body.Topic,
        body.Grade,
        body.URL,
        body.Description
      ]]);

      return responseJSON({ status: "success", message: "Data berhasil diperbarui." });
    }

    // 3. AKSI DELETE
    if (action === "DELETE") {
      const targetId = String(body.ID);
      const data = sheet.getDataRange().getValues();
      let rowIndex = -1;

      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]) === targetId) {
          rowIndex = i + 1;
          break;
        }
      }

      if (rowIndex === -1) {
        return responseJSON({ status: "error", message: "Data dengan ID tersebut tidak ditemukan." }, 404);
      }

      sheet.deleteRow(rowIndex);
      return responseJSON({ status: "success", message: "Data berhasil dihapus." });
    }

    return responseJSON({ status: "error", message: "Aksi tidak dikenal." }, 400);

  } catch (error) {
    return responseJSON({ status: "error", message: "Gagal memproses ke Google Sheets: " + error.toString() }, 500);
  }
}

function responseJSON(payload, statusCode) {
  const output = ContentService.createTextOutput(JSON.stringify(payload));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}