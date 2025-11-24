function getCookie(name) {
  const v = document.cookie
    .split("; ")
    .find((r) => r.trim().startsWith(name + "="));
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
const createBtn = document.getElementById("createBtn");

const themeToggle = document.getElementById("themeToggle");

// item form elements
const itemForm = document.getElementById("itemForm");
const invoiceIdInput = document.getElementById("invoiceId");
const itemNameInput = document.getElementById("itemName");
const priceInput = document.getElementById("price");
const qtyInput = document.getElementById("qty");
const taxInput = document.getElementById("tax");
const discountInput = document.getElementById("discount");
const itemMsg = document.getElementById("itemMsg");
const addItemBtn = document.getElementById("addItemBtn");
const clearItemBtn = document.getElementById("clearItemBtn");

// Modal
const editModal = document.getElementById("editModal");
const editCustomer = document.getElementById("editCustomer");
const editDate = document.getElementById("editDate");
const updateBtn = document.getElementById("updateBtn");
const modalClose = document.getElementById("modalClose");
const modalMsg = document.getElementById("modalMsg");

// details modal
const detailsModal = document.getElementById("detailsModal");
const detailsBody = document.getElementById("detailsBody");
const detailsClose = document.getElementById("detailsClose");
const pdfBtn = document.getElementById("pdfBtn");

let currentDetailsInvoiceId = null;
let editId = null;

// utilities
function showMessage(el, text = "", kind = "") {
  if (!el) return;
  el.textContent = text;
  el.className = kind ? `msg ${kind}` : "msg";
  el.hidden = !text;
}

function disableElem(el, state = true) {
  if (!el) return;
  el.disabled = state;
  el.setAttribute("aria-disabled", state ? "true" : "false");
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
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    }
  } catch (_) {}
  return String(s).slice(0, 10);
}

// dark mode
themeToggle.addEventListener("click", () => {
  const isDark = document.body.classList.toggle("dark");
  themeToggle.textContent = isDark ? "☀️ Light" : "🌙 Dark";
});

// date pickers
if (dateInput?.showPicker) dateInput.addEventListener("click", () => dateInput.showPicker());
if (editDate?.showPicker) editDate.addEventListener("click", () => editDate.showPicker());

// events
loadBtn.addEventListener("click", loadInvoices);
clearBtn.addEventListener("click", () => (invoiceTableBody.innerHTML = ""));
createClear.addEventListener("click", () => {
  customerInput.value = "";
  dateInput.value = "";
  showMessage(formMsg, "", "");
});

invoiceForm.addEventListener("submit", (e) => { e.preventDefault(); createInvoice(); });
itemForm.addEventListener("submit", (e) => { e.preventDefault(); addItem(); });

modalClose.addEventListener("click", closeModal);
updateBtn.addEventListener("click", updateInvoice);
detailsClose.addEventListener("click", () => detailsModal.classList.add("hidden"));

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (!editModal.classList.contains("hidden")) closeModal();
    if (!detailsModal.classList.contains("hidden")) detailsModal.classList.add("hidden");
  }
});

// autofill invoice id: last invoice on list
function autoFillLatestInvoiceID(list) {
  if (!list || list.length === 0) return;
  const latest = list[list.length - 1].id;
  invoiceIdInput.value = latest;
}

// append invoice row
function appendInvoiceRow(inv) {
  const id = inv.id ?? inv.pk ?? "";
  const customer = inv.customer ?? "";
  const date = inv.date ?? "";

  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td>${id}</td>
    <td>${escapeHtml(customer)}</td>
    <td>${escapeHtml(formatDateShort(date))}</td>
    <td>
      <button class="action-btn" data-action="details">Details</button>
      <button class="action-btn" data-action="edit">Edit</button>
      <button class="action-btn" data-action="delete">Delete</button>
    </td>
  `;

  tr.querySelector('[data-action="details"]').onclick = () => loadInvoiceDetails(id);
  tr.querySelector('[data-action="edit"]').onclick = () => openEdit(inv);
  tr.querySelector('[data-action="delete"]').onclick = () => deleteInvoice(id);

  invoiceTableBody.appendChild(tr);
}

// load invoices
async function loadInvoices() {
  invoiceTableBody.innerHTML = "";
  showMessage(listMsg, "", "");

  disableElem(loadBtn);

  try {
    const res = await fetch("/invoice/");
    if (!res.ok) throw new Error("Failed to load invoices");

    const data = await res.json();
    if (data.length === 0) {
      showMessage(listMsg, "No invoices found.");
      return;
    }

    data.forEach(appendInvoiceRow);
    autoFillLatestInvoiceID(data);
  } catch (err) {
    showMessage(listMsg, err.message, "error");
  }

  disableElem(loadBtn, false);
}

// create invoice
async function createInvoice() {
  showMessage(formMsg, "", "");

  const customer = customerInput.value.trim();
  const date = dateInput.value;

  if (!customer || !date) {
    showMessage(formMsg, "Please fill customer and date.", "error");
    return;
  }

  const payload = { customer, date };
  disableElem(createBtn);

  try {
    const res = await fetch("/invoice/", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-CSRFToken": csrftoken },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));

    if (res.ok) {
      showMessage(formMsg, "Invoice created!", "success");
      customerInput.value = "";
      dateInput.value = "";
      await loadInvoices();
      autoFillLatestInvoiceID([{ id: data.id }]);
    } else {
      showMessage(formMsg, data.detail || "Create failed.", "error");
    }
  } catch (err) {
    showMessage(formMsg, err.message, "error");
  }

  disableElem(createBtn, false);
}

// delete invoice
async function deleteInvoice(id) {
  if (!confirm(`Delete invoice #${id}?`)) return;

  try {
    const res = await fetch(`/invoice/${id}/`, {
      method: "DELETE",
      headers: { "X-CSRFToken": csrftoken },
    });

    if (res.ok) await loadInvoices();
    else alert("Delete failed");
  } catch (err) {
    alert("Error: " + err.message);
  }
}

// edit modal
function openEdit(inv) {
  editId = inv.id ?? inv.pk;
  editCustomer.value = inv.customer;
  editDate.value = formatDateShort(inv.date);
  showMessage(modalMsg, "");
  editModal.classList.remove("hidden");
  setTimeout(() => editCustomer.focus(), 80);
}

function closeModal() {
  editModal.classList.add("hidden");
  showMessage(modalMsg, "");
  editId = null;
}

// update invoice
async function updateInvoice() {
  if (!editId) {
    showMessage(modalMsg, "Invalid invoice.", "error");
    return;
  }
  const customer = editCustomer.value.trim();
  const date = editDate.value;
  if (!customer || !date) {
    showMessage(modalMsg, "Please fill required fields", "error");
    return;
  }

  const payload = { customer, date };
  disableElem(updateBtn);

  try {
    const res = await fetch(`/invoice/${editId}/`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "X-CSRFToken": csrftoken },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      showMessage(modalMsg, "Updated successfully!", "success");
      await loadInvoices();
      setTimeout(closeModal, 500);
    } else {
      const err = await res.json().catch(() => ({}));
      showMessage(modalMsg, err.detail || "Update failed.", "error");
    }
  } catch (err) {
    showMessage(modalMsg, err.message, "error");
  }

  disableElem(updateBtn, false);
}

// *** UPDATE: This function blocks invalid invoice IDs when adding items ***
function isValidInvoiceId(id) {
  const ids = Array.from(document.querySelectorAll("#invoiceTable tbody tr td:first-child"))
    .map(td => td.textContent.trim());
  return ids.includes(String(id));
}

// add item (with ID check)
async function addItem() {
  showMessage(itemMsg, "", "");

  const invoiceId = Number(invoiceIdInput.value || 0);
  if (!isValidInvoiceId(invoiceId)) {
    showMessage(itemMsg, "Please use a valid Invoice ID from the list above.", "error");
    return;
  }
  const itemName = itemNameInput.value.trim();
  const unitPrice = parseFloat(priceInput.value);
  const quantity = parseInt(qtyInput.value, 10);
  const tax = parseFloat(taxInput.value || 0);
  const discount = parseFloat(discountInput.value || 0);

  if (!invoiceId || !itemName || !unitPrice || !quantity) {
    showMessage(itemMsg, "Please fill invoice id, item, price and quantity.", "error");
    return;
  }

  const payload = {
    invoice: invoiceId,
    item_name: itemName,
    unit_price: unitPrice,
    quantity: quantity,
    tax: tax,
    discount: discount
  };

  disableElem(addItemBtn);

  try {
    const res = await fetch("/invoice-details/", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-CSRFToken": csrftoken },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));

    if (res.ok) {
      showMessage(itemMsg, "Item added!", "success");
      // clear inputs
      itemNameInput.value = "";
      priceInput.value = "";
      qtyInput.value = "1";
      taxInput.value = "0";
      discountInput.value = "0";

      // if details modal currently open for same invoice, reload it
      if (currentDetailsInvoiceId === invoiceId) {
        await loadInvoiceDetails(invoiceId);
      }
    } else {
      showMessage(itemMsg, data.detail || "Add item failed.", "error");
    }
  } catch (err) {
    showMessage(itemMsg, err.message, "error");
  }

  disableElem(addItemBtn, false);
}

// load invoice details
async function loadInvoiceDetails(id) {
  detailsBody.innerHTML = "Loading...";
  detailsModal.classList.remove("hidden");
  currentDetailsInvoiceId = id;

  try {
    const res = await fetch(`/invoice-details/?invoice=${id}`);
    if (!res.ok) throw new Error("Failed to load details");

    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      detailsBody.innerHTML = "<p>No items found.</p>";
      pdfBtn.disabled = true;
      return;
    }

    let html = `
      <table class="table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Qty</th>
            <th>Unit</th>
            <th>Tax %</th>
            <th>Discount %</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
    `;

    let grandTotal = 0;

    data.forEach((it) => {
      html += `
        <tr>
          <td>${escapeHtml(it.item_name)}</td>
          <td>${it.quantity}</td>
          <td>${parseFloat(it.unit_price).toFixed(2)}</td>
          <td>${parseFloat(it.tax).toFixed(2)}</td>
          <td>${parseFloat(it.discount).toFixed(2)}</td>
          <td>${parseFloat(it.total).toFixed(2)}</td>
        </tr>
      `;
      grandTotal += parseFloat(it.total);
    });

    html += `
        </tbody>
      </table>
      <div style="margin-top:12px; text-align:right; font-weight:600;">
        Grand Total: ${grandTotal.toFixed(2)}
      </div>
    `;

    detailsBody.innerHTML = html;

    // enable PDF
    pdfBtn.disabled = false;
    pdfBtn.onclick = () => window.open(`/invoice-pdf/${id}/`, "_blank");

  } catch (err) {
    detailsBody.innerHTML = `<p class="error">${err.message}</p>`;
    pdfBtn.disabled = true;
  }
}
