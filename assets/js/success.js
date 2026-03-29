const API_BASE_URL = "http://localhost:5001";

function setStatus(message, type = "info") {
  const statusEl = document.getElementById("orderStatus");
  if (!statusEl) return;

  const classMap = {
    info: "text-muted",
    success: "text-success",
    error: "text-danger"
  };

  statusEl.className = `text-center mb-3 ${classMap[type] || classMap.info}`;
  statusEl.textContent = message;
}

async function loadOrder(retries = 12) {
  const token = localStorage.getItem('token');

  const urlParams = new URLSearchParams(window.location.search);
  const sessionId = urlParams.get('session_id');

  if (!sessionId) {
    setStatus("Invalid order session.", "error");
    document.getElementById('orderDetails').innerHTML =
      '<p class="text-danger text-center">Invalid order session.</p>';
    return;
  }

  setStatus("Finalizing payment and loading your order…", "info");

  try {
    const res = await fetch(`${API_BASE_URL}/api/checkout/order/${sessionId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) {
      let errorData = {};
      try {
        errorData = await res.json();
      } catch (_) {
        // ignore json parse errors
      }

      // 404 usually means webhook/sync has not finished yet
    if (res.status === 404 && retries > 0) {
    const attempt = 13 - retries;
    setStatus(`Finalizing payment… (attempt ${attempt}/12)`, "info");
    console.log('Order not ready, retrying...');
    setTimeout(() => loadOrder(retries - 1), 1500);
    return;
    }

      throw new Error(errorData.message || `Order fetch failed (${res.status})`);
    }

    const order = await res.json();

    let itemsHtml = '';
    order.items.forEach(item => {
      itemsHtml += `
        <tr>
          <td>${item.name}</td>
          <td>€${item.price}</td>
        </tr>
      `;
    });

    document.getElementById('orderDetails').innerHTML = `
      <p><strong>Order ID:</strong> ${order._id}</p>
      <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleString()}</p>

      <table class="table mt-3">
        <thead class="table-success">
          <tr>
            <th>Item</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <h5 class="text-end">Total Paid: €${order.totalAmount}</h5>
    `;

    setStatus("Payment confirmed. Order loaded successfully.", "success");

    localStorage.removeItem('cart');
    localStorage.removeItem('checkoutDetails');

  } catch (err) {
  console.error(err);
  setStatus(err.message || "Unable to load order details.", "error");
  document.getElementById('orderDetails').innerHTML =
    `<p class="text-danger text-center">${err.message || 'Unable to load order details.'}</p>`;
}
}

loadOrder();