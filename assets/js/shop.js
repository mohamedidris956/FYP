const products = {
  home: {
    name: "IPY FC Home Jersey 2025/26",
    price: 45,
    img: "assets/img/home-jersey.jpg",
    desc: "Official home kit featuring IPY green, breathable fabric, player issue badge."
  },
  away: {
    name: "IPY FC Away Jersey 2025/26",
    price: 45,
    img: "assets/img/away-jersey.jpg",
    desc: "Away kit with striking contrast design and lightweight match material."
  },
  training: {
    name: "IPY FC Training Top 2025/26",
    price: 35,
    img: "assets/img/training-jersey.jpg",
    desc: "Premium training top worn by first team during UCFL Div 3C campaign."
  }
};

function viewProduct(key) {
  const token = localStorage.getItem("token");

  const addBtn = document.getElementById("addToCartBtn");
  addBtn.disabled = !token;   // enable only if logged in

  const p = products[key];

  document.getElementById("modalTitle").innerText = p.name;
  document.getElementById("modalImage").src = p.img;
  document.getElementById("modalDescription").innerText = p.desc;
  document.getElementById("modalPrice").innerText = "€" + p.price;

  addBtn.onclick = () => addToCart(key);

  new bootstrap.Modal(document.getElementById("productModal")).show();
}



function addToCart(key) {
  const token = localStorage.getItem("token");  // NEW login system uses this only

  // Not logged in → block
  if (!token) {
    alert("You must be logged in to add items to your cart.");
    return;
  }

  // Product data
  const item = {
    name: products[key].name,
    price: products[key].price,
    img: products[key].img
  };

  // Get cart array
  let cart = JSON.parse(localStorage.getItem("cart") || "[]");

  // Add new item
  cart.push(item);

  // Save cart
  localStorage.setItem("cart", JSON.stringify(cart));

  alert(`${products[key].name} added to cart!`);
}
