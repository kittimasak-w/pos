(function() {
    const allowed = localStorage.getItem("pos_logged_in");

    if (!allowed) {
        window.location.href = "login.html";
    }
})();
