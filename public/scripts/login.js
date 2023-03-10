var logging_in = false; // Will be used to prevent a further log in request before the current request is complete

$(function() {
    $("#login_submit_button").click(login);
})

/**
 * Method for logging the user in or displaying error messages on login fail
 */
function login() {
    if (!logging_in) {
        // User is currently trying to log in
        logging_in = true;

        // Get the credentials input by the user
        let username = $("#login_username").val();
        let password = $("#login_password").val();

        let input = {
            username: username,
            password: password
        }

        // Attempt to log the user in
        $.post('/login', input, function(res) {
            // Response received, log in attempt is complete
            logging_in = false;

            // If any errors occurred during the login attempt
            if (res.errors.length > 0) {
                // Empty the error messages section and add new error messages
                $("#error_messages").html("");

                res.errors.forEach(function(error) {
                    $("#error_messages").append("<p class='error_message'>" + error + "</p>");
                })
            }
            else { // If no errors occurred
                // User successfully logged in, so redirect to homepage
                window.location.href = "/";
            }
        })
    }
    
}