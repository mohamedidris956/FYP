// Handle Add to Cart
document.querySelectorAll(".add-to-cart").forEach(button => {
  button.addEventListener("click", () => {
    
    // Check if logged in
    const token = localStorage.getItem("token");
    if (!token) {
      alert("You must be logged in to add items to your cart!");
      window.location.href = "login.html";
      return;
    }

    // Get product details
    const product = {
      name: button.dataset.name,
      price: button.dataset.price,
      img: button.dataset.img
    };

    // Save to localStorage
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    cart.push(product);
    localStorage.setItem("cart", JSON.stringify(cart));

    alert("Item added to cart!");
  });
});
