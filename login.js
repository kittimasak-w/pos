(function() {
    const DEFAULT_USER = "admin";
    const DEFAULT_PASS = "1234";

    document.getElementById("btnLogin").addEventListener("click", function () {
        const user = document.getElementById("username").value.trim();
        const pass = document.getElementById("password").value.trim();

        if (user === DEFAULT_USER && pass === DEFAULT_PASS) {
            localStorage.setItem("pos_logged_in", "1");
            window.location.href = "cashier.html";
            return;
        }

        document.getElementById("loginError").style.display = "block";
    });
})();

