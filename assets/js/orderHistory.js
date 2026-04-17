function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatCurrency(value) {
  const amount = Number(value || 0);
  return `€${amount.toFixed(2)}`;
}

function setStatus(message, type = "muted") {
  const el = document.getElementById("ordersStatus");
  if (!el) return;

  el.className = "text-center mb-3";

  if (type === "error") el.classList.add("text-danger");
  else if (type === "success") el.classList.add("text-success");
  else el.classList.add("text-muted");

  el.textContent = message;
}

function renderOrders(orders) {
  const container = document.getElementById("ordersContainer");
  if (!container) return;

  if (!Array.isArray(orders) || orders.length === 0) {
    container.innerHTML = `
      <div class="col-12">
        <div class="alert alert-info text-center mb-0">
          No previous purchases found yet.
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = orders.map((order) => {
    const items = Array.isArray(order.items) ? order.items : [];
    const itemsHtml = items.map((item) => `
      <li class="list-group-item d-flex justify-content-between align-items-center">
        <span>${escapeHtml(item.name || "Item")}</span>
        <span class="fw-semibold">${formatCurrency(item.price)}</span>
      </li>
    `).join("");

    const paymentStatus = escapeHtml(order.paymentStatus || "unknown");
    const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleString() : "-";
    const orderId = escapeHtml(order._id || "-");

    return `
      <div class="col-12">
        <div class="card shadow-sm">
          <div class="card-body">
            <div class="d-flex flex-wrap justify-content-between gap-2 mb-2">
              <h5 class="mb-0">Order #${orderId}</h5>
              <span class="badge ${paymentStatus === "paid" ? "bg-success" : "bg-secondary"}">
                ${paymentStatus.toUpperCase()}
              </span>
            </div>
            <p class="text-muted mb-3"><strong>Date:</strong> ${orderDate}</p>
            <ul class="list-group mb-3">${itemsHtml}</ul>
            <div class="text-end fw-bold">Total: ${formatCurrency(order.totalAmount)}</div>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

async function loadOrderHistory() {
  const token = localStorage.getItem("token");
  if (!token) {
    setStatus("Please log in to view your payment history.", "error");
    return;
  }

  try {
    const res = await fetch("/api/checkout/history", {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to fetch order history");

    setStatus(`Loaded ${data.length} order(s).`, "success");
    renderOrders(data);
  } catch (err) {
    console.error("Order history error:", err);
    setStatus(err.message || "Could not load payment history.", "error");
  }
}

loadOrderHistory();