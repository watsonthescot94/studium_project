$(function() {
    $.when(getCurrentUser().done(setBottomBanner()));
    allowUserToRegisterWithEnterKeyPress();
})

function allowUserToRegisterWithEnterKeyPress() {
    $(".register_input").on("keypress",function(e) {
        if(e.which == 13) {
            $("#register_submit_button").click();
        }
    });
}

/*function registerAccount() {
    // Get the details input by the user
    let email = $("#register_email_input").val();
    let username = $("#register_username_input").val();
    let forename = $("#register_forename_input").val();
    let surname = $("#register_surname_input").val();
    let password = $("#register_password_input").val();
    let confirm_password = $("#register_confirm_password_input").val();

    let data = {
        email: email,
        username: username,
        forename: forename,
        surname: surname,
        password: password,
        confirm_password: confirm_password
    }

    console.log(data);

    // Attempt to register the user
    $.post('/register', data, function(res) {
        // If any errors occurred during the registration attempt
        if (res.errors.length > 0) {
            console.log(res.errors);
            let email_error = false;
            let username_error = false;
            let forename_error = false;
            let surname_error = false;
            let password_error = false;
            let confirm_password_error = false;
            let register_error = false;

            res.errors.forEach(function(error) {
                if (error.error_type === "email_error") {
                    email_error = true;
                    $("#register_email_error_message").html(error.error_message);
                    $("#register_email_error_message").css("display", "block");
                }
                else if (error.error_type === "username_error") {
                    username_error = true;
                    $("#register_username_error_message").html(error.error_message);
                    $("#register_username_error_message").css("display", "block");
                }
                else if (error.error_type === "forename_error") {
                    forename_error = true;
                    $("#register_forename_error_message").html(error.error_message);
                    $("#register_forename_error_message").css("display", "block");
                }
                else if (error.error_type === "surname_error") {
                    surname_error = true;
                    $("#register_surname_error_message").html(error.error_message);
                    $("#register_surname_error_message").css("display", "block");
                }
                else if (error.error_type === "password_error") {
                    password_error = true;
                    $("#register_password_error_message").html(error.error_message);
                    $("#register_password_error_message").css("display", "block");
                }
                else if (error.error_type === "confirm_password_error") {
                    confirm_password_error = true;
                    $("#register_confirm_password_error_message").html(error.error_message);
                    $("#register_confirm_password_error_message").css("display", "block");
                }
                else if (error.error_type === "register_error") {
                    register_error = true;
                    $("#register_confirm_password_error_message").html(error.error_message);
                    $("#register_confirm_password_error_message").css("display", "block");
                }
            })

            if (!email_error) {
                $("#register_email_error_message").css("display", "none");
            }

            if (!username_error) {
                $("#register_username_error_message").css("display", "none");
            }

            if (!forename_error) {
                $("#register_forename_error_message").css("display", "none");
            }

            if (!surname_error) {
                $("#register_surname_error_message").css("display", "none");
            }

            if (!password_error) {
                $("#register_password_error_message").css("display", "none");
            }

            if (!confirm_password_error && !register_error) {
                $("#register_confirm_password_error_message").css("display", "none");
            }
        }
        else { // If no errors occurred
            // Account successfully screated, so redirect to homepage
            $.when(addMessageToUserSession(getAccountCreatedHTML(username)).done(function(res) {
                if (res.errors.length > 0) {
                    $.when(addAlertMessageToUserSession("Account created").done(function(res) {
                        window.location.href = "/";
                    }))
                }
                else {
                    window.location.href = "/account_created";
                }
            }))
        }
    })
}

function getAccountCreatedHTML(username) {
    return "<h3>Account Created</h3>" +
    "<p>Your account was succesfully created and you are now logged in as @" + username + "</p>";
}*/