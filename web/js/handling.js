$(document).ready(function () {

    var logout_handler = function () {
        $("#logout_button").click(function () {
            $.get("/logout");
            window.location.replace("index.html");
        });
    }

    logout_handler();

});