const token = localStorage.getItem("token");
const role = localStorage.getItem("userRole");

if (!token || role !== "admin") {
  alert("Admin access only.");
  window.location.href = "index.html";
}

const form = document.getElementById("productForm");
const tbody = document.querySelector("#productsTable tbody");
const resetBtn = document.getElementById("resetBtn");

function getPayload() {
  return {
    name: document.getElementById("name").value.trim(),
    price: Number(document.getElementById("price").value),
    img: document.getElementById("img").value.trim(),
    desc: document.getElementById("desc").value.trim(),
    isActive: document.getElementById("isActive").checked
  };
}

function resetForm() {
  document.getElementById("productId").value = "";
  form.reset();
  document.getElementById("isActive").checked = true;
}

async function loadProducts() {
  const res = await fetch("/api/products/admin/all", {
    headers: { Authorization: `Bearer ${token}` }
  });

  const products = await res.json();
  tbody.innerHTML = "";

  products.forEach((p) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.name}</td>
      <td>€${Number(p.price).toFixed(2)}</td>
      <td>${p.isActive ? "Yes" : "No"}</td>
      <td>
        <button class="btn btn-sm btn-primary me-2" data-edit="${p._id}">Edit</button>
        <button class="btn btn-sm btn-danger" data-del="${p._id}">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const id = document.getElementById("productId").value;
  const payload = getPayload();

  const url = id ? `/api/products/${id}` : "/api/products";
  const method = id ? "PUT" : "POST";

  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (!res.ok) {
    alert(data.message || "Save failed");
    return;
  }

  resetForm();
  await loadProducts();
});

tbody.addEventListener("click", async (e) => {
  const editId = e.target.dataset.edit;
  const delId = e.target.dataset.del;

  if (editId) {
    const res = await fetch("/api/products/admin/all", {
      headers: { Authorization: `Bearer ${token}` }
    });
    const products = await res.json();
    const p = products.find((x) => x._id === editId);
    if (!p) return;

    document.getElementById("productId").value = p._id;
    document.getElementById("name").value = p.name;
    document.getElementById("price").value = p.price;
    document.getElementById("img").value = p.img;
    document.getElementById("desc").value = p.desc || "";
    document.getElementById("isActive").checked = !!p.isActive;
  }

  if (delId) {
    if (!confirm("Delete this product?")) return;

    const res = await fetch(`/api/products/${delId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Delete failed");
      return;
    }

    await loadProducts();
  }
});

resetBtn.addEventListener("click", resetForm);
loadProducts();