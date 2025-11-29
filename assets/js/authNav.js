function loadAuthUI() {
  const authArea = document.getElementById("authArea");
  if (!authArea) return;

  const token = localStorage.getItem("token");
  const name = localStorage.getItem("userName");

  // Logged OUT
  if (!token || !name) {
    authArea.innerHTML = `
      <div class="dropdown">
        <a class="btn btn-success dropdown-toggle" href="#" data-bs-toggle="dropdown">
          Sign In
        </a>
        <ul class="dropdown-menu dropdown-menu-end">
          <li><a class="dropdown-item" href="login.html">Login</a></li>
          <li><a class="dropdown-item" href="register.html">Create Account</a></li>
        </ul>
      </div>
    `;
    return;
  }

  // Logged IN — universal stacked layout
  let html = `
    <div class="d-flex flex-column align-items-end text-end">
      <span class="mb-1">Welcome, ${name}</span>
      <button class="btn btn-success mb-2" onclick="logoutUser()">Logout</button>
    </div>
  `;

  // Add Cart button ONLY on shop.html
  if (window.location.pathname.includes("shop.html")) {
    html = `
      <div class="d-flex flex-column align-items-end text-end">
        <span class="mb-1">Welcome, ${name}</span>
        <button class="btn btn-success mb-2" onclick="logoutUser()">Logout</button>
        <a href="cart.html" class="btn btn-outline-success mb-2">🛒 Cart</a>
      </div>
    `;
  }

  authArea.innerHTML = html;
}

function logoutUser() {
  localStorage.removeItem("token");
  localStorage.removeItem("userName");
  localStorage.removeItem("userRole");
  window.location.reload();
}

loadAuthUI();
