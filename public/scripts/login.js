$(function() {
    $.when(getCurrentUser().done(setBottomBanner()));
    allowUserToLoginWithEnterKeyPress();
})

function allowUserToLoginWithEnterKeyPress() {
    $(".login_input").on("keypress",function(e) {
        if(e.which == 13) {
            $("#login_submit_button").click();
        }
    });
}

/**
 * Method for logging the user in or displaying error messages on login fail
 */
/*function login() {
    // Get the credentials input by the user
    let username = $("#login_username_input").val();
    let password = $("#login_password_input").val();

    let data = {
        username: username,
        password: password
    }

    // Attempt to log the user in
    $.post('/login', data, function(res) {
        // If any errors occurred during the login attempt
        if (res.errors.length > 0) {
            console.log(res.errors);
            let username_error = false;
            let password_error = false;
            let login_error = false;

            res.errors.forEach(function(error) {
                console.log(error);
                if (error.error_type === "username_error") {
                    username_error = true;
                    $("#login_username_error_message").html(error.error_message);
                    $("#login_username_error_message").css("display", "block");
                }
                else if (error.error_type === "password_error") {
                    console.log("password error");
                    password_error = true;
                    $("#login_password_error_message").html(error.error_message);
                    $("#login_password_error_message").css("display", "block");
                }
                else if (error.error_type === "login_error") {
                    login_error = true;
                    $("#login_password_error_message").html(error.error_message);
                    $("#login_password_error_message").css("display", "block");
                }
            })

            if (!username_error) {
                $("#login_username_error_message").css("display", "none");
            }

            if (!password_error && !login_error) {
                $("#login_password_error_message").css("display", "none");
            }
        }
        else { // If no errors occurred
            // User successfully logged in, so redirect to homepage
            Cookies.set("display_alert_message", true);
            Cookies.set("alert_message_text", "Logged in");
            Cookies.set("alert_message_type", "good");
            Cookies.set("alert_message_length", 3000);
            window.location.href = "/";
        }
    })
}*/