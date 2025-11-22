function getCookie(name) {
  const v = document.cookie.split("; ").find(r => r.trim().startsWith(name + "="));
  return v ? decodeURIComponent(v.split("=")[1]) : null;
}
const csrftoken = getCookie("csrftoken");


// Elements
const invoiceTableBody = document.querySelector("#invoiceTable tbody");
const invoiceForm = document.getElementById("invoiceForm");
const customerInput = document.getElementById("customer");
const dateInput = document.getElementById("date");
const formMsg = document.getElementById("formMsg");
const listMsg = document.getElementById("listMsg");

const loadBtn = document.getElementById("loadBtn");
const clearBtn = document.getElementById("clearBtn");
const createClear = document.getElementById("createClear");

const themeToggle = document.getElementById("themeToggle");

// Modal elements
const editModal = document.getElementById("editModal");
const editCustomer = document.getElementById("editCustomer");
const editDate = document.getElementById("editDate");
const updateBtn = document.getElementById("updateBtn");
const modalClose = document.getElementById("modalClose");
const modalMsg = document.getElementById("modalMsg");

let editId = null;


function showMessage(el, text = "", kind = "") {
  if (!el) return;
  el.textContent = text;
  el.className = kind ? `msg ${kind}` : "msg";
  el.hidden = !text;
}

function disableElem(elem, state = true) {
  if (!elem) return;
  elem.disabled = state;
  elem.setAttribute("aria-disabled", state ? "true" : "false");
}

// Toggle dark mode and update button label
themeToggle.addEventListener("click", () => {
  const on = document.body.classList.toggle("dark");
  themeToggle.textContent = on ? "☀️ Light" : "🌙 Dark";
});


// Ensure date picker opens when input clicked (where supported)
if (dateInput && typeof dateInput.showPicker === "function") {
  dateInput.addEventListener("click", () => dateInput.showPicker());
}
if (editDate && typeof editDate.showPicker === "function") {
  editDate.addEventListener("click", () => editDate.showPicker());
}


// Event wiring (buttons & form)
loadBtn.addEventListener("click", loadInvoices);
clearBtn.addEventListener("click", () => {
  invoiceTableBody.innerHTML = "";
  showMessage(listMsg, "", "");
});
createClear.addEventListener("click", () => {
  customerInput.value = "";
  dateInput.value = "";
  showMessage(formMsg, "", "");
});

invoiceForm.addEventListener("submit", (e) => {
  e.preventDefault();
  createInvoice();
});

// Modal: close, update
modalClose.addEventListener("click", closeModal);
updateBtn.addEventListener("click", updateInvoice);

// Close modal with Escape key and trap basic focus
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !editModal.classList.contains("hidden")) {
    closeModal();
  }
});


// Core functions
function appendInvoiceRow(inv) {
  const id = inv.id ?? inv.pk ?? "";
  const customer = inv.customer ?? inv.customer_name
    ?? (typeof inv.customer === "object" && (inv.customer.name ?? inv.customer.customer_name))
    ?? "";
  const date = inv.date ?? inv.invoice_date ?? inv.created_at ?? "";

  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td>${id}</td>
    <td>${escapeHtml(customer)}</td>
    <td>${escapeHtml(formatDateShort(date))}</td>
    <td>
      <button class="action-btn edit-btn" data-id="${id}" aria-label="Edit invoice ${id}">Edit</button>
      <button class="action-btn delete-btn" data-id="${id}" aria-label="Delete invoice ${id}">Delete</button>
    </td>
  `;

  tr.querySelector(".edit-btn").addEventListener("click", () => openEdit(inv));
  tr.querySelector(".delete-btn").addEventListener("click", () => deleteInvoice(id));

  invoiceTableBody.appendChild(tr);
}

function escapeHtml(s) {
  if (s == null) return "";
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function formatDateShort(s) {
  if (!s) return "";
  try {
    const d = new Date(s);
    if (!isNaN(d)) {
      // keep local yyyy-mm-dd
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    }
  } catch (e) { /* ignore */ }
  // fallback: first 10 chars
  return String(s).slice(0, 10);
}


// Load
async function loadInvoices() {
  invoiceTableBody.innerHTML = "";
  showMessage(listMsg, "", "");

  disableElem(loadBtn, true);
  try {
    const res = await fetch("/invoice/", {
      method: "GET",
      headers: { "Accept": "application/json" }
    });

    if (!res.ok) throw new Error(`Failed to load invoices (${res.status})`);
    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      showMessage(listMsg, "No invoices found.", "");
      return;
    }
    data.forEach(inv => appendInvoiceRow(inv));
  } catch (err) {
    showMessage(listMsg, err.message || "Failed to load invoices.", "error");
  } finally {
    disableElem(loadBtn, false);
  }
}


// Create
async function createInvoice() {
  showMessage(formMsg, "", "");
  const customer = customerInput.value.trim();
  const date = dateInput.value;

  if (!customer || !date) {
    showMessage(formMsg, "Please fill customer and date.", "error");
    return;
  }

  const payload = { customer, date };

  disableElem(createBtn, true);
  try {
    const res = await fetch("/invoice/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrftoken ?? ""
      },
      body: JSON.stringify(payload)
    });

    if (res.status === 201 || res.ok) {
      showMessage(formMsg, "Invoice created!", "success");
      customerInput.value = "";
      dateInput.value = "";
      await loadInvoices();
    } else {
      let err = { detail: `Status ${res.status}` };
      try { err = await res.json(); } catch (e) { /* ignore */ }
      showMessage(formMsg, `Create failed: ${err.detail ?? JSON.stringify(err)}`, "error");
    }
  } catch (err) {
    showMessage(formMsg, err.message || "Create error", "error");
  } finally {
    disableElem(createBtn, false);
  }
}


// Delete
async function deleteInvoice(id) {
  if (!id) return;
  if (!confirm(`Delete invoice #${id}?`)) return;

  try {
    const res = await fetch(`/invoice/${id}/`, {
      method: "DELETE",
      headers: { "X-CSRFToken": csrftoken ?? "" }
    });

    if (res.status === 204 || res.ok) {
      await loadInvoices();
    } else {
      alert(`Delete failed: ${res.status}`);
    }
  } catch (err) {
    alert(`Delete error: ${err.message}`);
  }
}


// Edit modal flow
function openEdit(inv) {
  editId = inv.id ?? inv.pk ?? null;

  // populate fields (defensive)
  editCustomer.value = inv.customer ?? inv.customer_name ?? "";
  editDate.value = formatDateShort(inv.date ?? inv.invoice_date ?? inv.created_at ?? "");

  showMessage(modalMsg, "", "");
  editModal.classList.remove("hidden");
  editModal.setAttribute("aria-hidden", "false");

  // focus first control and allow opening date picker on focus
  setTimeout(() => {
    editCustomer.focus();
  }, 80);
}

function closeModal() {
  editModal.classList.add("hidden");
  editModal.setAttribute("aria-hidden", "true");
  editId = null;
  showMessage(modalMsg, "", "");
}

// Update invoice via PUT
async function updateInvoice() {
  if (!editId) {
    showMessage(modalMsg, "No invoice selected.", "error");
    return;
  }

  const payload = {
    customer: editCustomer.value.trim(),
    date: editDate.value
  };

  if (!payload.customer || !payload.date) {
    showMessage(modalMsg, "Please fill customer and date.", "error");
    return;
  }

  disableElem(updateBtn, true);
  try {
    const res = await fetch(`/invoice/${editId}/`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrftoken ?? ""
      },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      showMessage(modalMsg, "Invoice updated.", "success");
      await loadInvoices();
      setTimeout(() => closeModal(), 650);
    } else {
      let err = { detail: `Status ${res.status}` };
      try { err = await res.json(); } catch (_) {}
      showMessage(modalMsg, `Update failed: ${err.detail ?? JSON.stringify(err)}`, "error");
    }
  } catch (err) {
    showMessage(modalMsg, err.message || "Update error", "error");
  } finally {
    disableElem(updateBtn, false);
  }
}

// Ensure createBtn exists for disabling
const createBtn = document.getElementById("createBtn");

// accessibility: close modal if user clicks outside content
editModal.addEventListener("click", (e) => {
  if (e.target === editModal) closeModal();
});


