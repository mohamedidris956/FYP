function loadCart() {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Log in first to view your cart!");
    window.location.href = "login.html";
    return;
  }

  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  let cartTable = document.querySelector("#cartTable tbody");
  let total = 0;

  cartTable.innerHTML = "";

  cart.forEach((item, index) => {
    total += parseFloat(item.price);

    cartTable.innerHTML += `
      <tr>
        <td>${item.name}</td>
        <td>€${item.price}</td>
        <td><button class="btn btn-danger btn-sm" onclick="removeItem(${index})">X</button></td>
      </tr>
    `;
  });

  document.getElementById("cartTotal").innerText = total.toFixed(2);
}

function removeItem(index) {
  let cart = JSON.parse(localStorage.getItem("cart"));
  cart.splice(index, 1);
  localStorage.setItem("cart", JSON.stringify(cart));
  loadCart();
}

loadCart();

async function checkout() {
  const token = localStorage.getItem('token');
  const cart = JSON.parse(localStorage.getItem('cart')) || [];

  if (!token || cart.length === 0) {
    alert('You must be logged in with items in your cart.');
    return;
  }

  try {
    const res = await fetch('/api/checkout/create-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ cartItems: cart })
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || 'Checkout failed');
    }

    const data = await res.json();

    if (data.url) {
      window.location.href = data.url;
    } else {
      throw new Error('No checkout URL returned');
    }

  } catch (err) {
    console.error('❌ Checkout error:', err);
    alert(err.message);
  }
}
