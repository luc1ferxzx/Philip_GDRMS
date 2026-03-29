// Wrap everything to avoid global scope pollution and ensure DOM is ready
document.addEventListener("DOMContentLoaded", () => {
    const statusMessage = document.getElementById("statusMessage");
    const signupTab = document.getElementById("signupTab");
    const loginTab = document.getElementById("loginTab");
    const nameFields = document.getElementById("nameFields");
    const phoneInput = document.getElementById("phone"); // Define it once here
    const formTitle = document.getElementById("formTitle");
    const submitBtn = document.getElementById("submitBtn");
    const authForm = document.getElementById("authForm");

    let isLogin = false; 

    // UI Toggle Logic: SIGN UP
    signupTab.onclick = () => {
        isLogin = false;
        nameFields.style.display = "flex";   // Show First/Last
        phoneInput.style.display = "block";  // Show Phone
        formTitle.innerText = "Create an account";
        submitBtn.innerText = "Create an account";
        signupTab.classList.add("active");
        loginTab.classList.remove("active");
    };

    // UI Toggle Logic: SIGN IN
    loginTab.onclick = () => {
        isLogin = true;
        nameFields.style.display = "none";   // Hide First/Last
        phoneInput.style.display = "none";   // Hide Phone
        formTitle.innerText = "Sign in";
        submitBtn.innerText = "Sign in";
        loginTab.classList.add("active");
        signupTab.classList.remove("active");
    };

    function showStatus(text, type) {
        statusMessage.innerText = text;
        statusMessage.className = `status-msg ${type}`;
        statusMessage.style.display = "block";
    }

    function getFriendlyError(rawError) {
        if (!rawError) return "Something went wrong.";
        const msg = rawError.toLowerCase();
        if (msg.includes("users_email_key")) return "That email is already registered.";
        if (msg.includes("users_phone_key")) return "This phone number is already in use.";
        return rawError;
    }

    authForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        statusMessage.style.display = "none";

        const data = {
            first_name: document.getElementById("first_name").value,
            last_name: document.getElementById("last_name").value,
            email: document.getElementById("email").value,
            phone_number: document.getElementById("phone").value,
            password: document.getElementById("password").value
        };

        const url = isLogin 
            ? "http://localhost:3000/api/auth/login" 
            : "http://localhost:3000/api/auth/register";

        try {
            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });

            const result = await res.json();

            if (res.ok) {
                if (result.token) {
                    localStorage.setItem("token", result.token);
                    showStatus("Login successful! Teleporting...", "success");
                    setTimeout(() => { window.location.href = "dashboard.html"; }, 1500);
                } else {
                    showStatus("Registered successfully!", "success");
                    setTimeout(() => loginTab.click(), 1500);
                }
            } else {
                showStatus(getFriendlyError(result.error), "error");
            }
        } catch (err) {
            showStatus("Server error. Is the backend running?", "error");
        }
    });
});