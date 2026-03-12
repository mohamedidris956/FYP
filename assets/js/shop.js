let products = {};
let productsList = [];

const fallbackProducts = [
  {
    name: "IPY FC Home Jersey 2025/26",
    price: 45,
    img: "assets/img/home-jersey.jpg",
    desc: "Official home kit featuring IPY green, breathable fabric, player issue badge."
  },
  {
    name: "IPY FC Away Jersey 2025/26",
    price: 45,
    img: "assets/img/away-jersey.jpg",
    desc: "Away kit with striking contrast design and lightweight match material."
  },
  {
    name: "IPY FC Training Top 2025/26",
    price: 35,
    img: "assets/img/training-jersey.jpg",
    desc: "Premium training top worn by first team during UCFL Div 3C campaign."
  }
];

function renderShopItems(list) {
  const container = document.getElementById("shopItems");
  if (!container) return;

  container.innerHTML = list.map((p, i) => `
    <div class="col-md-4">
      <div class="card product-card shadow h-100">
        <img src="${p.img}" class="card-img-top" alt="${p.name}">
        <div class="card-body text-center">
          <h5>${p.name}</h5>
          <p class="fw-bold text-success">€${Number(p.price).toFixed(2)}</p>
          <button class="btn btn-outline-success" onclick="viewProduct('${i}')">View Details</button>
          <button class="btn btn-success add-to-cart-btn" data-index="${i}">Add to Cart</button>
        </div>
      </div>
    </div>
  `).join("");
}

async function loadProducts() {
  try {
    const res = await fetch("/api/products");
    if (!res.ok) throw new Error("Failed to fetch products");

    const data = await res.json();

    // If API returns empty list, use fallback so shop is never blank
    productsList = Array.isArray(data) && data.length > 0 ? data : fallbackProducts;

    products = {};
    productsList.forEach((p, i) => { products[i] = p; });

    renderShopItems(productsList);
  } catch (err) {
    console.error("Product load failed, using fallback:", err);
    productsList = fallbackProducts;

    products = {};
    productsList.forEach((p, i) => { products[i] = p; });

    renderShopItems(productsList);
  }
}

function viewProduct(key) {
  const token = localStorage.getItem("token");
  const addBtn = document.getElementById("addToCartBtn");
  addBtn.disabled = !token;

  const p = products[key];
  document.getElementById("modalTitle").innerText = p.name;
  document.getElementById("modalImage").src = p.img;
  document.getElementById("modalDescription").innerText = p.desc || "";
  document.getElementById("modalPrice").innerText = "€" + Number(p.price).toFixed(2);

  addBtn.onclick = () => addToCart(key);
  new bootstrap.Modal(document.getElementById("productModal")).show();
}

function addToCart(key) {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("You must be logged in to add items to your cart.");
    return;
  }

  const p = products[key];
  const item = { name: p.name, price: p.price, img: p.img };
  let cart = JSON.parse(localStorage.getItem("cart") || "[]");
  cart.push(item);
  localStorage.setItem("cart", JSON.stringify(cart));
  alert(`${p.name} added to cart!`);
}

document.addEventListener("click", (e) => {
  const btn = e.target.closest(".add-to-cart-btn");
  if (!btn) return;
  addToCart(btn.dataset.index);
});

loadProducts();