document.getElementById("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("regName").value;
  const email = document.getElementById("regEmail").value;
  const password = document.getElementById("regPassword").value;
  const password2 = document.getElementById("regPassword2").value;

  if (password !== password2) {
    alert("Passwords do not match!");
    return;
  }

  try {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Registration failed");
      return;
    }

    // Store full user object after registration
    localStorage.setItem("user", JSON.stringify({
      name: data.name,
      role: data.role,
      token: data.token
    }));

    // match login.js format so navbar works instantly
    localStorage.setItem("token", data.token);
    localStorage.setItem("userName", data.name);
    localStorage.setItem("userRole", data.role);

    alert("Account created! Welcome to IPY FC!");
    window.location.href = "index.html";

  } catch (error) {
    console.log(error);
    alert("Registration failed");
  }
});