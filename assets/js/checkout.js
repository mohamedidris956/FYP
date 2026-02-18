document.getElementById('checkoutForm').addEventListener('submit', async function(e) {
  e.preventDefault();

  const token = localStorage.getItem('token');
  const cart = JSON.parse(localStorage.getItem('cart')) || [];

  if (!token || cart.length === 0) {
    alert('Cart is empty or user not logged in.');
    window.location.href = 'cart.html';
    return;
  }

  // Collect user details (optional to store later)
  const userDetails = {
    name: document.getElementById('fullName').value,
    email: document.getElementById('email').value,
    address: document.getElementById('address').value,
    city: document.getElementById('city').value,
    postcode: document.getElementById('postcode').value
  };

  localStorage.setItem('checkoutDetails', JSON.stringify(userDetails));

  try {
    const res = await fetch('/api/checkout/create-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ cartItems: cart })
    });

    const data = await res.json();

    if (data.url) {
      window.location.href = data.url;
    } else {
      alert('Checkout failed');
    }

  } catch (err) {
    console.error(err);
    alert('Payment error');
  }

});
