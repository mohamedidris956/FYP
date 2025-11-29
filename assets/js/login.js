document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  try {
    const res = await fetch("http://localhost:5001/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, password })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Login failed");
      return;
    }

    // ✅ STORE ALL AUTH KEYS SEPARATELY
    localStorage.setItem("token", data.token);      // for protected pages
    localStorage.setItem("userName", data.name);    // navbar greeting
    localStorage.setItem("userRole", data.role);    // admin features

    alert(`Welcome back, ${data.name}!`);
    window.location.href = "index.html";

  } catch (err) {
    console.error(err);
    alert("Server error");
  }
});
