// ================= IMPORT =================
import { saveHODs } from "./service.js";

document.addEventListener("DOMContentLoaded", () => {

  // ================= ELEMENTS =================
  const fileInput = document.getElementById("excelFile");
  const previewBtn = document.getElementById("previewBtn");
  const previewSection = document.getElementById("previewSection");
  const previewTable = document.getElementById("previewTable");
  const confirmBtn = document.getElementById("confirmBtn");
  const cancelBtn = document.getElementById("cancelBtn");
  const resultSection = document.getElementById("resultSection");

  // ================= STATE =================
  let parsedRows = [];
  let rowErrors = [];
  let hasErrors = false;

  const REQUIRED_COLUMNS = [
    "department_name",
    "semester",
    "subject_code",
    "subject_name",
    "credits",
    "status"
  ];

  // ================= UTIL =================
  const normalizeKey = k =>
    k.toLowerCase().trim().replace(/\s+/g, "_");

  const normalizeSemester = val => {
    val = String(val).toUpperCase().replace(/\s+/g, "").replace("SEM", "");
    if (/^[1-8]$/.test(val)) return "SEM" + val;
    return null;
  };

  const normalizeValue = (key, val) => {
    val = String(val).trim();

    if (!val || val.toLowerCase() === "nil" || val === "-") return "";

    switch (key) {
      case "department_name":
      case "subject_code":
        return val.toUpperCase();

      case "subject_name":
        return val.charAt(0).toUpperCase() + val.slice(1).toLowerCase();

      case "status":
        return val.toLowerCase() === "true" ? "true" : "false";

      case "semester":
        return normalizeSemester(val);

      case "credits":
        return /^\d+$/.test(val) ? val : "";

      default:
        return val;
    }
  };

  // ================= PREVIEW =================
  previewBtn.addEventListener("click", () => {
    const file = fileInput.files[0];
    if (!file) {
      alert("Please select an Excel file");
      return;
    }

    const reader = new FileReader();
    reader.onload = e => {
      const workbook = XLSX.read(
        new Uint8Array(e.target.result),
        { type: "array" }
      );
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
      validate(rows);
    };
    reader.readAsArrayBuffer(file);
  });

  // ================= VALIDATION =================
  function validate(rows) {
    parsedRows = [];
    rowErrors = [];
    hasErrors = false;

    if (!rows.length) {
      alert("Excel file is empty");
      return;
    }

    const excelHeaders = Object.keys(rows[0]).map(normalizeKey);
    const missingCols = REQUIRED_COLUMNS.filter(
      col => !excelHeaders.includes(col)
    );

    if (missingCols.length) {
      alert("Missing columns: " + missingCols.join(", "));
      return;
    }

    rows.forEach((row, i) => {
      const clean = {};
      const errors = [];

      REQUIRED_COLUMNS.forEach(col => {
        const originalKey = Object.keys(row).find(
          k => normalizeKey(k) === col
        );

        const rawValue = row[originalKey];
        const value = normalizeValue(col, rawValue);

        if (!value) {
          errors.push(`${col} is invalid or empty`);
        }

        clean[col] = value;
      });

      if (errors.length) {
        rowErrors.push({
          row: i + 2,
          errors
        });
        hasErrors = true;
      }

      parsedRows.push(clean);
    });

    renderPreview();
  }

  // ================= PREVIEW TABLE =================
  function renderPreview() {
    previewSection.classList.remove("hidden");

    const thead = previewTable.querySelector("thead");
    const tbody = previewTable.querySelector("tbody");
    thead.innerHTML = "";
    tbody.innerHTML = "";

    const headerRow = document.createElement("tr");
    REQUIRED_COLUMNS.forEach(col => {
      const th = document.createElement("th");
      th.textContent = col;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);

    parsedRows.forEach((row, idx) => {
      const tr = document.createElement("tr");

      if (rowErrors.find(e => e.row === idx + 2)) {
        tr.style.background = "#fee2e2";
      }

      REQUIRED_COLUMNS.forEach(col => {
        const td = document.createElement("td");
        td.textContent = row[col];
        tr.appendChild(td);
      });

      tbody.appendChild(tr);
    });

    confirmBtn.disabled = hasErrors;
    confirmBtn.style.opacity = hasErrors ? "0.6" : "1";
    confirmBtn.style.cursor = hasErrors ? "not-allowed" : "pointer";

    if (hasErrors) {
      alert(
        "Fix the following errors before saving:\n\n" +
        rowErrors
          .map(e => `Row ${e.row}: ${e.errors.join(", ")}`)
          .join("\n")
      );
    }
  }

  // ================= SAVE =================
  confirmBtn.addEventListener("click", async () => {
    if (hasErrors) {
      alert("Fix all validation errors before saving.");
      return;
    }

    confirmBtn.disabled = true;
    confirmBtn.textContent = "Saving...";

    try {
      await saveHODs(parsedRows);

      previewSection.classList.add("hidden");
      resultSection.classList.remove("hidden");

      renderResultTable(parsedRows);

      // reset
      fileInput.value = "";
      parsedRows = [];
      rowErrors = [];
      hasErrors = false;

      confirmBtn.textContent = "Confirm & Save";
      confirmBtn.disabled = true;

    } catch (err) {
      console.error(err);
      alert("Save failed. Check console.");
      confirmBtn.textContent = "Confirm & Save";
      confirmBtn.disabled = false;
    }
  });

  // ================= RESULT TABLE =================
  function renderResultTable(rows) {
    resultSection.innerHTML = "";

    const title = document.createElement("h3");
    title.textContent = "Upload Result";
    resultSection.appendChild(title);

    const msg = document.createElement("p");
    msg.innerHTML = `✅ Successfully saved <b>${rows.length}</b> record(s)`;
    msg.style.color = "#16a34a";
    resultSection.appendChild(msg);

    const wrap = document.createElement("div");
    wrap.style.overflowX = "auto";

    const table = document.createElement("table");

    const thead = document.createElement("thead");
    const trh = document.createElement("tr");
    REQUIRED_COLUMNS.forEach(col => {
      const th = document.createElement("th");
      th.textContent = col;
      trh.appendChild(th);
    });
    thead.appendChild(trh);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    rows.forEach(row => {
      const tr = document.createElement("tr");
      REQUIRED_COLUMNS.forEach(col => {
        const td = document.createElement("td");
        td.textContent = row[col];
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    wrap.appendChild(table);
    resultSection.appendChild(wrap);
  }

  // ================= CANCEL =================
  cancelBtn.addEventListener("click", () => {
    previewSection.classList.add("hidden");
    parsedRows = [];
    rowErrors = [];
    hasErrors = false;
    confirmBtn.disabled = true;
    confirmBtn.textContent = "Confirm & Save";
  });
});
