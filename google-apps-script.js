function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("Resources");

    if (!sheet) {
      return responseJSON({
        status: "error",
        message: "Tab 'Resources' tidak ditemukan pada Google Sheet."
      }, 404);
    }

    const data = sheet.getDataRange().getValues();

    if (data.length <= 1) {
      return responseJSON({
        status: "success",
        data: []
      });
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

    return responseJSON({
      status: "success",
      data: resources
    });

  } catch (error) {
    return responseJSON({
      status: "error",
      message: error.toString()
    }, 500);
  }
}

function doPost(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("Resources");

    if (!sheet) {
      return responseJSON({
        status: "error",
        message: "Tab 'Resources' tidak ditemukan pada Google Sheet."
      }, 404);
    }

    const body = JSON.parse(e.postData.contents);

    // Ambil data payload
    const id = body.ID;
    const title = body.Title;
    const topic = body.Topic;
    const grade = body.Grade;
    const url = body.URL;
    const description = body.Description;
    const createdAt = body.CreatedAt;

    // Menambahkan baris baru sesuai urutan kolom:
    // ID, Title, Topic, Grade, URL, Description, CreatedAt
    sheet.appendRow([id, title, topic, grade, url, description, createdAt]);

    return responseJSON({
      status: "success",
      message: "Data berhasil disimpan.",
      data: {
        ID: id,
        Title: title,
        Topic: topic,
        Grade: grade,
        URL: url,
        Description: description,
        CreatedAt: createdAt
      }
    });

  } catch (error) {
    return responseJSON({
      status: "error",
      message: "Gagal menyimpan data ke Google Sheets: " + error.toString()
    }, 500);
  }
}

function responseJSON(payload, statusCode) {
  const output = ContentService.createTextOutput(JSON.stringify(payload));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}