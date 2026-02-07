// ================= IMPORT =================
import { saveStudents } from "./studentService.js";

// ================= DOM READY =================
document.addEventListener("DOMContentLoaded", () => {

  // ================= ELEMENTS =================
  const fileInput = document.getElementById("excelFile");
  const previewBtn = document.getElementById("previewBtn");
  const previewSection = document.getElementById("previewSection");
  const previewTable = document.getElementById("previewTable");
  const confirmBtn = document.getElementById("confirmBtn");
  const cancelBtn = document.getElementById("cancelBtn");
  const resultSection = document.getElementById("resultSection");
  const resultTable = document.getElementById("resultTable");

  // ================= STATE =================
  let parsedRows = [];
  let rowErrors = [];
  let hasErrors = false;

  const REQUIRED_COLUMNS = [
    "student_id",
    "student_name",
    "email",
    "phone",
    "parent_phone",
    "seat_type",
    "status"
  ];

  // ================= UTIL =================
  const normalizeKey = k =>
    k.toLowerCase().trim().replace(/\s+/g, "_");

  const normalizeValue = (key, val) => {
    val = String(val).trim();

    if (!val || val === "-" || val.toLowerCase() === "nil") return "";

    switch (key) {
      case "student_id":
        return val.toUpperCase();

      case "student_name":
        return val.charAt(0).toUpperCase() + val.slice(1).toLowerCase();

      case "email":
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) ? val : "";

      case "seat_type":
        return ["MERIT", "NRI", "MANAGEMENT"].includes(val.toUpperCase())
          ? val.toUpperCase()
          : "";

      case "phone":
      case "parent_phone":
        return /^\d{10}$/.test(val) ? val : "";

      case "status":
        return val.toLowerCase() === "true" ? "true" : "false";

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

    rows.forEach((row, index) => {
      const clean = {};
      const errors = [];

      REQUIRED_COLUMNS.forEach(col => {
        const originalKey = Object.keys(row).find(
          k => normalizeKey(k) === col
        );

        const raw = row[originalKey];
        const value = normalizeValue(col, raw);

        if (!value) {
          errors.push(`${col} is invalid or empty`);
        }

        clean[col] = value;
      });

      if (errors.length) {
        hasErrors = true;
        rowErrors.push({
          row: index + 2,
          errors
        });
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
      alert("Fix validation errors before saving");
      return;
    }

    confirmBtn.disabled = true;
    confirmBtn.textContent = "Saving...";

    try {
      await saveStudents(parsedRows);

      previewSection.classList.add("hidden");
      resultSection.classList.remove("hidden");

      renderResult(parsedRows);

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

  // ================= RESULT =================
  function renderResult(rows) {
    resultTable.innerHTML = "";

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
    resultTable.appendChild(table);
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
