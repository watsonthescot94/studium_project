$(function() {
    $.when(getCurrentUser().done(setBottomBanner()));

    $("#update_email_button").unbind("click");
    $("#update_email_button").click(function() {
        $("#profile_detail_edit_window").html(getEditEmailHTML());
        setEditEmailButtonClickHandlers();
        openProfileDetailEditWindow();
        setHelperIconEventHandlers();
    })

    $("#update_username_button").unbind("click");
    $("#update_username_button").click(function() {
        $("#profile_detail_edit_window").html(getEditUsernameHTML());
        setEditUsernameButtonClickHandlers();
        openProfileDetailEditWindow();
        setHelperIconEventHandlers();
    })

    $("#update_name_button").unbind("click");
    $("#update_name_button").click(function() {
        $("#profile_detail_edit_window").html(getEditNameHTML());
        setEditNameButtonClickHandlers();
        openProfileDetailEditWindow();
        setHelperIconEventHandlers();
    })

    $("#update_password_button").unbind("click");
    $("#update_password_button").click(function() {
        $("#profile_detail_edit_window").html(getEditPasswordHTML());
        setEditPasswordButtonClickHandlers();
        openProfileDetailEditWindow();
        setHelperIconEventHandlers();
    })

    setDeleteProfileWindowButtonClickHandlers();
    $("#delete_profile_button").unbind("click");
    $("#delete_profile_button").click(function() {
        openDeleteProfileWindow();
        setHelperIconEventHandlers();
    })
})

function openProfileDetailEditWindow() {
    $("#profile_detail_edit_window_wrapper").css("display", "block");
}

function closeProfileDetailEditWindow() {
    $("#profile_detail_edit_window_wrapper").css("display", "none");
}

function openDeleteProfileWindow() {
    $("#delete_profile_window_wrapper").css("display", "block");
}

function closeDeleteProfileWindow() {
    $("#delete_profile_window_wrapper").css("display", "none");
}

function setDeleteProfileWindowButtonClickHandlers() {
    $("#delete_profile_confirm_button").unbind("click");
    $("#delete_profile_confirm_button").click(function() {
        let data = {
            confirmational_password_input: $("#delete_profile_window_confirm_password_input").val()
        }

        $.post("/delete_account", data, function(res) {
            if (res.errors.length > 0) {
                console.log(res.errors);
                let confirmational_password_error = false;

                res.errors.forEach(function(error) {
                    if (error.error_type === "confirmational_password_error") {
                        confirmational_password_error = true;
                        $("#delete_profile_window_confirm_password_error_message").html(error.error_message);
                        $("#delete_profile_window_confirm_password_error_message").css("display", "block");
                    }
                    else {
                        setAlert(error.error_message, "bad", 3000);
                    }
                })

                if (!confirmational_password_error) {
                    $("#delete_profile_window_confirm_password_error_message").css("display", "none");
                }
            }
            else {
                Cookies.set("display_alert_message", true);
                Cookies.set("alert_message_text", "Account deleted");
                Cookies.set("alert_message_type", "good");
                Cookies.set("alert_message_length", 3000);
                window.location.href = "/";
            }
        })
    })

    $("#delete_profile_cancel_button").unbind("click");
    $("#delete_profile_cancel_button").click(function() {
        closeDeleteProfileWindow();
    })
}

function getEditEmailHTML() {
    return "<div id='profile_detail_edit_window_header_and_helper_icon_wrapper'>" +
            "<h3 id='profile_detail_edit_window_header'>Update Email Address</h3>" +

            "<div class='helper_icon_wrapper'>" +
                "<img class='helper_icon' src='/images/helper_icon.png'>" +

                "<div id='profile_detail_edit_window_header_helper_icon_text_wrapper' class='helper_icon_text_wrapper helper_icon_text_wrapper_top'>" +
                    "<p class='helper_icon_text'>" +
                        'To update your email address, enter your new email ' +
                        'address in the text box labelled "New email address," confirm your password in the text box ' +
                        'labelled "Confirm password," and then click the "Update Email Address" button. Your new email ' +
                        'address will be saved to your account and this window will close.<br><br>' +
                        'To cancel updating your email address, click the "Cancel" button. This window ' +
                        'will then close and your email address will not be updated.' +
                    "</p>" +
                "</div>" +
            "</div>" +
        "</div>" +

        "<div class='divider'></div>" +

        "<div class='profile_detail_edit_window_field_wrapper'>" +
            "<div class='profile_detail_edit_window_input_and_helper_icon_wrapper'>" +
                "<label for='profile_detail_edit_window_email_input' class='profile_detail_edit_window_label'>" +
                    "New email address" + 
                "</label>" +

                "<div class='helper_icon_wrapper'>" +
                    "<img class='helper_icon' src='/images/helper_icon.png'>" +

                    "<div class='profile_detail_edit_window_input_helper_icon_text_wrapper helper_icon_text_wrapper helper_icon_text_wrapper_top'>" +
                        "<p class='helper_icon_text'>" +
                            "Please enter your new email address in the text box below. Your email address must not be " +
                            "in use by another Studium account and must be in a valid email format (e.g., " +
                            "john_smith@gmail.com)." +
                        "</p>" +
                    "</div>" +
                "</div>" +
            "</div>" +
            
            "<input id='profile_detail_edit_window_email_input' class='profile_detail_edit_window_input' " +
                "type='email' placeholder='Enter your new email address here...'>" +

            "<p id='profile_detail_edit_window_email_error_message' class='page_error_message'></p>" +
        "</div>" +

        "<div class='profile_detail_edit_window_field_wrapper'>" +
            "<div class='profile_detail_edit_window_input_and_helper_icon_wrapper'>" +
                "<label for='profile_detail_edit_window_confirmational_password_input' class='profile_detail_edit_window_label'>" +
                    "Confirm password" +
                "</label>" +

                "<div class='helper_icon_wrapper'>" +
                    "<img class='helper_icon' src='/images/helper_icon.png'>" +

                    "<div class='profile_detail_edit_window_input_helper_icon_text_wrapper helper_icon_text_wrapper helper_icon_text_wrapper_top'>" +
                        "<p class='helper_icon_text'>" +
                            "Please confirm your current password in the text box below. This is required so we know " +
                            "it is really you updating your email address." +
                        "</p>" +
                    "</div>" +
                "</div>" +
            "</div>" +

            "<input id='profile_detail_edit_window_confirmational_password_input' class='profile_detail_edit_window_input' " +
                "type='password' placeholder='Confirm your password here...' autocomplete='new-password'>" +
            
            "<p id='profile_detail_edit_window_confirmational_password_error_message' class='page_error_message'></p>" +
        "</div>" +

        "<div id='profile_detail_edit_window_bottom_buttons_wrapper'>" +
            "<span class='profile_detail_edit_window_button_and_helper_icon_wrapper leftmost_button'>" +
                "<button id='update_email_confirm_button' class='white_button leftmost_button'>Update Email Address</button>" +

                "<div class='helper_icon_wrapper'>" +
                    "<img class='helper_icon' src='/images/helper_icon.png'>" +

                    "<div class='profile_detail_edit_window_button_helper_icon_text_wrapper helper_icon_text_wrapper helper_icon_text_wrapper_top'>" +
                        "<p class='helper_icon_text'>" +
                            'When you click the "Update Email Address" button, your new email address will be saved ' +
                            'to your account, provided no errors occur, and this window will close. If any errors ' +
                            'do occur, error messages will help you to resolve them.' +
                        "</p>" +
                    "</div>" +
                "</div>" +
            "</span>" +

            "<span class='profile_detail_edit_window_button_and_helper_icon_wrapper leftmost_button'>" +
                "<button id='cancel_update_email_button' class='white_button rightmost_button'>Cancel</button>" +

                "<div class='helper_icon_wrapper'>" +
                    "<img class='helper_icon' src='/images/helper_icon.png'>" +

                    "<div class='profile_detail_edit_window_button_helper_icon_text_wrapper helper_icon_text_wrapper helper_icon_text_wrapper_top'>" +
                        "<p class='helper_icon_text'>" +
                            'When you click the "Cancel" button, this window will close without your new email address ' +
                            'being saved.' +
                        "</p>" +
                    "</div>" +
                "</div>" +
            "</span>" +
        "</div>";
}

function getEditUsernameHTML() {
    return "<div id='profile_detail_edit_window_header_and_helper_icon_wrapper'>" +
            "<h3 id='profile_detail_edit_window_header'>Update Username</h3>" +

            "<div class='helper_icon_wrapper'>" +
                "<img class='helper_icon' src='/images/helper_icon.png'>" +

                "<div id='profile_detail_edit_window_header_helper_icon_text_wrapper' class='helper_icon_text_wrapper helper_icon_text_wrapper_top'>" +
                    "<p class='helper_icon_text'>" +
                        'To update your username, enter your new username in the text box labelled "New username," ' +
                        'confirm your password in the text box labelled "Confirm password," and then click the ' +
                        '"Update Username" button. Your new username will be saved to your account and this window ' +
                        'will close.<br><br>' +
                        'To cancel updating your username, click the "Cancel" button. This window ' +
                        'will then close and your username will not be updated.' +
                    "</p>" +
                "</div>" +
            "</div>" +
        "</div>" +

        "<div class='divider'></div>" +

        "<div class='profile_detail_edit_window_field_wrapper'>" +
            "<div class='profile_detail_edit_window_input_and_helper_icon_wrapper'>" +
                "<label for='profile_detail_edit_window_username_input' class='profile_detail_edit_window_label'>" +
                    "New username" + 
                "</label>" +

                "<div class='helper_icon_wrapper'>" +
                    "<img class='helper_icon' src='/images/helper_icon.png'>" +

                    "<div class='profile_detail_edit_window_input_helper_icon_text_wrapper helper_icon_text_wrapper helper_icon_text_wrapper_top'>" +
                        "<p class='helper_icon_text'>" +
                            "Please enter your new username in the text box below. Your username must not be in " +
                            "use by another account, must not contain any spaces, and must be no longer than 30 " +
                            "characters." +
                        "</p>" +
                    "</div>" +
                "</div>" +
            "</div>" +
            
            "<input id='profile_detail_edit_window_username_input' class='profile_detail_edit_window_input' " +
                "type='text' placeholder='Enter your new username here...'>" +

            "<p id='profile_detail_edit_window_username_error_message' class='page_error_message'></p>" +
        "</div>" +

        "<div class='profile_detail_edit_window_field_wrapper'>" +
            "<div class='profile_detail_edit_window_input_and_helper_icon_wrapper'>" +
                "<label for='profile_detail_edit_window_confirmational_password_input' class='profile_detail_edit_window_label'>" +
                    "Confirm password" +
                "</label>" +

                "<div class='helper_icon_wrapper'>" +
                    "<img class='helper_icon' src='/images/helper_icon.png'>" +

                    "<div class='profile_detail_edit_window_input_helper_icon_text_wrapper helper_icon_text_wrapper helper_icon_text_wrapper_top'>" +
                        "<p class='helper_icon_text'>" +
                            "Please confirm your current password in the text box below. This is required so we know " +
                            "it is really you updating your email address." +
                        "</p>" +
                    "</div>" +
                "</div>" +
            "</div>" +

            "<input id='profile_detail_edit_window_confirmational_password_input' class='profile_detail_edit_window_input' " +
                "type='password' placeholder='Confirm your password here...' autocomplete='new-password'>" +
            
            "<p id='profile_detail_edit_window_confirmational_password_error_message' class='page_error_message'></p>" +
        "</div>" +

        "<div id='profile_detail_edit_window_bottom_buttons_wrapper'>" +
            "<span class='profile_detail_edit_window_button_and_helper_icon_wrapper leftmost_button'>" +
                "<button id='update_username_confirm_button' class='white_button leftmost_button'>Update Username</button>" +

                "<div class='helper_icon_wrapper'>" +
                    "<img class='helper_icon' src='/images/helper_icon.png'>" +

                    "<div class='profile_detail_edit_window_button_helper_icon_text_wrapper helper_icon_text_wrapper helper_icon_text_wrapper_top'>" +
                        "<p class='helper_icon_text'>" +
                            'When you click the "Update Username" button, your new username will be saved ' +
                            'to your account, provided no errors occur, and this window will close. If any errors ' +
                            'do occur, error messages will help you to resolve them.' +
                        "</p>" +
                    "</div>" +
                "</div>" +
            "</span>" +

            "<span class='profile_detail_edit_window_button_and_helper_icon_wrapper leftmost_button'>" +
                "<button id='cancel_update_username_button' class='white_button rightmost_button'>Cancel</button>" +

                "<div class='helper_icon_wrapper'>" +
                    "<img class='helper_icon' src='/images/helper_icon.png'>" +

                    "<div class='profile_detail_edit_window_button_helper_icon_text_wrapper helper_icon_text_wrapper helper_icon_text_wrapper_top'>" +
                        "<p class='helper_icon_text'>" +
                            'When you click the "Cancel" button, this window will close without your new username ' +
                            'being saved.' +
                        "</p>" +
                    "</div>" +
                "</div>" +
            "</span>" +
        "</div>";
}

function getEditNameHTML() {
    return "<div id='profile_detail_edit_window_header_and_helper_icon_wrapper'>" +
            "<h3 id='profile_detail_edit_window_header'>Update Name</h3>" +

            "<div class='helper_icon_wrapper'>" +
                "<img class='helper_icon' src='/images/helper_icon.png'>" +

                "<div id='profile_detail_edit_window_header_helper_icon_text_wrapper' class='helper_icon_text_wrapper helper_icon_text_wrapper_top'>" +
                    "<p class='helper_icon_text'>" +
                        'To update your name, enter your forename in the text box labelled "New forename," ' +
                        'enter your surname in the text box labelled "New surname," ' +
                        'confirm your password in the text box labelled "Confirm password," and then click the ' +
                        '"Update Name" button. Your new name will be saved to your account and this window ' +
                        'will close.<br><br>' +
                        'To cancel updating your name, click the "Cancel" button. This window ' +
                        'will then close and your name will not be updated.' +
                    "</p>" +
                "</div>" +
            "</div>" +
        "</div>" +

        "<div class='divider'></div>" +

        "<div class='profile_detail_edit_window_field_wrapper'>" +
            "<div class='profile_detail_edit_window_input_and_helper_icon_wrapper'>" +
                "<label for='profile_detail_edit_window_forename_input' class='profile_detail_edit_window_label'>" +
                    "New forename" + 
                "</label>" +

                "<div class='helper_icon_wrapper'>" +
                    "<img class='helper_icon' src='/images/helper_icon.png'>" +

                    "<div class='profile_detail_edit_window_input_helper_icon_text_wrapper helper_icon_text_wrapper helper_icon_text_wrapper_top'>" +
                        "<p class='helper_icon_text'>" +
                            "Please enter your new forename in the text box below. If you have any middle names " +
                            "you can include them here." +
                        "</p>" +
                    "</div>" +
                "</div>" +
            "</div>" +
            
            "<input id='profile_detail_edit_window_forename_input' class='profile_detail_edit_window_input' " +
                "type='text' placeholder='Enter your new forename here...'>" +

            "<p id='profile_detail_edit_window_forename_error_message' class='page_error_message'></p>" +
        "</div>" +

        "<div class='profile_detail_edit_window_field_wrapper'>" +
            "<div class='profile_detail_edit_window_input_and_helper_icon_wrapper'>" +
                "<label for='profile_detail_edit_window_surname_input' class='profile_detail_edit_window_label'>" +
                    "New surname" + 
                "</label>" +

                "<div class='helper_icon_wrapper'>" +
                    "<img class='helper_icon' src='/images/helper_icon.png'>" +

                    "<div class='profile_detail_edit_window_input_helper_icon_text_wrapper helper_icon_text_wrapper helper_icon_text_wrapper_top'>" +
                        "<p class='helper_icon_text'>" +
                            "Please enter your new surname in the text box below." +
                        "</p>" +
                    "</div>" +
                "</div>" +
            "</div>" +
            
            "<input id='profile_detail_edit_window_surname_input' class='profile_detail_edit_window_input' " +
                "type='text' placeholder='Enter your new surname here...'>" +

            "<p id='profile_detail_edit_window_surname_error_message' class='page_error_message'></p>" +
        "</div>" +

        "<div class='profile_detail_edit_window_field_wrapper'>" +
            "<div class='profile_detail_edit_window_input_and_helper_icon_wrapper'>" +
                "<label for='profile_detail_edit_window_confirmational_password_input' class='profile_detail_edit_window_label'>" +
                    "Confirm password" +
                "</label>" +

                "<div class='helper_icon_wrapper'>" +
                    "<img class='helper_icon' src='/images/helper_icon.png'>" +

                    "<div class='profile_detail_edit_window_input_helper_icon_text_wrapper helper_icon_text_wrapper helper_icon_text_wrapper_top'>" +
                        "<p class='helper_icon_text'>" +
                            "Please confirm your current password in the text box below. This is required so we know " +
                            "it is really you updating your name." +
                        "</p>" +
                    "</div>" +
                "</div>" +
            "</div>" +

            "<input id='profile_detail_edit_window_confirmational_password_input' class='profile_detail_edit_window_input' " +
                "type='password' placeholder='Confirm your password here...' autocomplete='new-password'>" +
            
            "<p id='profile_detail_edit_window_confirmational_password_error_message' class='page_error_message'></p>" +
        "</div>" +

        "<div id='profile_detail_edit_window_bottom_buttons_wrapper'>" +
            "<span class='profile_detail_edit_window_button_and_helper_icon_wrapper leftmost_button'>" +
                "<button id='update_name_confirm_button' class='white_button'>Update Name</button>" +

                "<div class='helper_icon_wrapper'>" +
                    "<img class='helper_icon' src='/images/helper_icon.png'>" +

                    "<div class='profile_detail_edit_window_button_helper_icon_text_wrapper helper_icon_text_wrapper helper_icon_text_wrapper_top'>" +
                        "<p class='helper_icon_text'>" +
                            'When you click the "Update Name" button, your new name will be saved ' +
                            'to your account, provided no errors occur, and this window will close. If any errors ' +
                            'do occur, error messages will help you to resolve them.' +
                        "</p>" +
                    "</div>" +
                "</div>" +
            "</span>" +

            "<span class='profile_detail_edit_window_button_and_helper_icon_wrapper rightmost_button'>" +
                "<button id='cancel_update_name_button' class='white_button'>Cancel</button>" +

                "<div class='helper_icon_wrapper'>" +
                    "<img class='helper_icon' src='/images/helper_icon.png'>" +

                    "<div class='profile_detail_edit_window_button_helper_icon_text_wrapper helper_icon_text_wrapper helper_icon_text_wrapper_top'>" +
                        "<p class='helper_icon_text'>" +
                            'When you click the "Cancel" button, this window will close without your new name ' +
                            'being saved.' +
                        "</p>" +
                    "</div>" +
                "</div>" +
            "</span>" +
        "</div>";
}

function getEditPasswordHTML() {
    return "<div id='profile_detail_edit_window_header_and_helper_icon_wrapper'>" +
            "<h3 id='profile_detail_edit_window_header'>Update Password</h3>" +

            "<div class='helper_icon_wrapper'>" +
                "<img class='helper_icon' src='/images/helper_icon.png'>" +

                "<div id='profile_detail_edit_window_header_helper_icon_text_wrapper' class='helper_icon_text_wrapper helper_icon_text_wrapper_top'>" +
                    "<p class='helper_icon_text'>" +
                        'To update your password, enter your new password in the text box labelled "New password," ' +
                        'confirm your new password in the text box labelled "Confirm new password," ' +
                        'confirm your current password in the text box labelled "Confirm current password," and then click the ' +
                        '"Update Password" button. Your new password will be saved to your account and this window ' +
                        'will close.<br><br>' +
                        'To cancel updating your password, click the "Cancel" button. This window ' +
                        'will then close and your password will not be updated.' +
                    "</p>" +
                "</div>" +
            "</div>" +
        "</div>" +

        "<div class='divider'></div>" +

        "<div class='profile_detail_edit_window_field_wrapper'>" +
            "<div class='profile_detail_edit_window_input_and_helper_icon_wrapper'>" +
                "<label for='profile_detail_edit_window_password_input' class='profile_detail_edit_window_label'>" +
                    "New password" + 
                "</label>" +

                "<div class='helper_icon_wrapper'>" +
                    "<img class='helper_icon' src='/images/helper_icon.png'>" +

                    "<div class='profile_detail_edit_window_input_helper_icon_text_wrapper helper_icon_text_wrapper helper_icon_text_wrapper_top'>" +
                        "<p class='helper_icon_text'>" +
                            "Please enter your new password in the text box below. Your password must be at least " +
                            "6 characters long and must not contain any spaces. To protect your account you won't " +
                            "see the characters you type." +
                        "</p>" +
                    "</div>" +
                "</div>" +
            "</div>" +
            
            "<input id='profile_detail_edit_window_password_input' class='profile_detail_edit_window_input' " +
                "type='password' placeholder='Enter your new password here...'>" +

            "<p id='profile_detail_edit_window_password_error_message' class='page_error_message'></p>" +
        "</div>" +

        "<div class='profile_detail_edit_window_field_wrapper'>" +
            "<div class='profile_detail_edit_window_input_and_helper_icon_wrapper'>" +
                "<label for='profile_detail_edit_window_confirm_password_input' class='profile_detail_edit_window_label'>" +
                    "Confirm new password" + 
                "</label>" +

                "<div class='helper_icon_wrapper'>" +
                    "<img class='helper_icon' src='/images/helper_icon.png'>" +

                    "<div class='profile_detail_edit_window_input_helper_icon_text_wrapper helper_icon_text_wrapper helper_icon_text_wrapper_top'>" +
                        "<p class='helper_icon_text'>" +
                            "Please confirm your new password in the text box below. This is required to ensure " +
                            "your new password is exactly the password you want it to be." +
                        "</p>" +
                    "</div>" +
                "</div>" +
            "</div>" +
            
            "<input id='profile_detail_edit_window_confirm_password_input' class='profile_detail_edit_window_input' " +
                "type='password' placeholder='Confirm your new password here...'>" +

            "<p id='profile_detail_edit_window_confirm_password_error_message' class='page_error_message'></p>" +
        "</div>" +

        "<div class='profile_detail_edit_window_field_wrapper'>" +
            "<div class='profile_detail_edit_window_input_and_helper_icon_wrapper'>" +
                "<label for='profile_detail_edit_window_confirmational_password_input' class='profile_detail_edit_window_label'>" +
                    "Confirm current password" +
                "</label>" +

                "<div class='helper_icon_wrapper'>" +
                    "<img class='helper_icon' src='/images/helper_icon.png'>" +

                    "<div class='profile_detail_edit_window_input_helper_icon_text_wrapper helper_icon_text_wrapper helper_icon_text_wrapper_top'>" +
                        "<p class='helper_icon_text'>" +
                            "Please confirm your current password in the text box below. This is required so we know " +
                            "it is really you updating your password." +
                        "</p>" +
                    "</div>" +
                "</div>" +
            "</div>" +

            "<input id='profile_detail_edit_window_confirmational_password_input' class='profile_detail_edit_window_input' " +
                "type='password' placeholder='Enter your current password here...' autocomplete='new-password'>" +
            
            "<p id='profile_detail_edit_window_confirmational_password_error_message' class='page_error_message'></p>" +
        "</div>" +

        "<div id='profile_detail_edit_window_bottom_buttons_wrapper'>" +
            "<span class='profile_detail_edit_window_button_and_helper_icon_wrapper leftmost_button'>" +
                "<button id='update_password_confirm_button' class='white_button'>Update Password</button>" +

                "<div class='helper_icon_wrapper'>" +
                    "<img class='helper_icon' src='/images/helper_icon.png'>" +

                    "<div class='profile_detail_edit_window_button_helper_icon_text_wrapper helper_icon_text_wrapper helper_icon_text_wrapper_top'>" +
                        "<p class='helper_icon_text'>" +
                            'When you click the "Update Password" button, your new password will be saved ' +
                            'to your account, provided no errors occur, and this window will close. If any errors ' +
                            'do occur, error messages will help you to resolve them.' +
                        "</p>" +
                    "</div>" +
                "</div>" +
            "</span>" +

            "<span class='profile_detail_edit_window_button_and_helper_icon_wrapper rightmost_button'>" +
                "<button id='cancel_update_password_button' class='white_button'>Cancel</button>" +

                "<div class='helper_icon_wrapper'>" +
                    "<img class='helper_icon' src='/images/helper_icon.png'>" +

                    "<div class='profile_detail_edit_window_button_helper_icon_text_wrapper helper_icon_text_wrapper helper_icon_text_wrapper_top'>" +
                        "<p class='helper_icon_text'>" +
                            'When you click the "Cancel" button, this window will close without your new password ' +
                            'being saved.' +
                        "</p>" +
                    "</div>" +
                "</div>" +
            "</span>" +
        "</div>";
}

function setEditEmailButtonClickHandlers() {
    $("#update_email_confirm_button").unbind("click");
    $("#update_email_confirm_button").click(function() {
        let data = {
            field_being_updated: "email",
            input: {
                email_input: $("#profile_detail_edit_window_email_input").val(),
                confirmational_password_input: $("#profile_detail_edit_window_confirmational_password_input").val()
            }
        }

        $.post("/update_account_details", data, function(res) {
            if (res.errors.length > 0) {
                console.log(res.errors);
                let email_error = false;
                let confirmational_password_error = false;

                res.errors.forEach(function(error) {
                    if (error.error_type === "email_error") {
                        email_error = true;
                        $("#profile_detail_edit_window_email_error_message").html(error.error_message);
                        $("#profile_detail_edit_window_email_error_message").css("display", "block");
                    }
                    else if (error.error_type === "confirmational_password_error") {
                        confirmational_password_error = true;
                        $("#profile_detail_edit_window_confirmational_password_error_message").html(error.error_message);
                        $("#profile_detail_edit_window_confirmational_password_error_message").css("display", "block");
                    }
                    else {
                        setAlert(error.error_message, "bad", 3000);
                    }
                })

                if (!email_error) {
                    $("#profile_detail_edit_window_email_error_message").css("display", "none");
                }

                if (!confirmational_password_error) {
                    $("#profile_detail_edit_window_confirmational_password_error_message").css("display", "none");
                }
            }
            else {
                $("#profile_email").html(res.validated_email);
                closeProfileDetailEditWindow();
                setAlert("Email updated", "good", 3000);
            }
        })
    })

    $("#cancel_update_email_button").unbind("click");
    $("#cancel_update_email_button").click(function() {
        closeProfileDetailEditWindow();
    })
}

function setEditUsernameButtonClickHandlers() {
    $("#update_username_confirm_button").unbind("click");
    $("#update_username_confirm_button").click(function() {
        let data = {
            field_being_updated: "username",
            input: {
                username_input: $("#profile_detail_edit_window_username_input").val(),
                confirmational_password_input: $("#profile_detail_edit_window_confirmational_password_input").val()
            }
        }

        $.post("/update_account_details", data, function(res) {
            if (res.errors.length > 0) {
                console.log(res.errors);
                let username_error = false;
                let confirmational_password_error = false;

                res.errors.forEach(function(error) {
                    if (error.error_type === "username_error") {
                        username_error = true;
                        $("#profile_detail_edit_window_username_error_message").html(error.error_message);
                        $("#profile_detail_edit_window_username_error_message").css("display", "block");
                    }
                    else if (error.error_type === "confirmational_password_error") {
                        confirmational_password_error = true;
                        $("#profile_detail_edit_window_confirmational_password_error_message").html(error.error_message);
                        $("#profile_detail_edit_window_confirmational_password_error_message").css("display", "block");
                    }
                    else {
                        setAlert(error.error_message, "bad", 3000);
                    }
                })

                if (!username_error) {
                    $("#profile_detail_edit_window_username_error_message").css("display", "none");
                }

                if (!confirmational_password_error) {
                    $("#profile_detail_edit_window_confirmational_password_error_message").css("display", "none");
                }
            }
            else {
                $("#profile_username").html("@" + res.validated_username);
                closeProfileDetailEditWindow();
                setAlert("Username updated", "good", 3000);
            }
        })
    })

    $("#cancel_update_username_button").unbind("click");
    $("#cancel_update_username_button").click(function() {
        closeProfileDetailEditWindow();
    })
}

function setEditNameButtonClickHandlers() {
    $("#update_name_confirm_button").unbind("click");
    $("#update_name_confirm_button").click(function() {
        let data = {
            field_being_updated: "name",
            input: {
                forename_input: $("#profile_detail_edit_window_forename_input").val(),
                surname_input: $("#profile_detail_edit_window_surname_input").val(),
                confirmational_password_input: $("#profile_detail_edit_window_confirmational_password_input").val()
            }
        }

        $.post("/update_account_details", data, function(res) {
            if (res.errors.length > 0) {
                console.log(res.errors);
                let forename_error = false;
                let surname_error = false;
                let confirmational_password_error = false;

                res.errors.forEach(function(error) {
                    if (error.error_type === "forename_error") {
                        forename_error = true;
                        $("#profile_detail_edit_window_forename_error_message").html(error.error_message);
                        $("#profile_detail_edit_window_forename_error_message").css("display", "block");
                    }
                    else if (error.error_type === "surname_error") {
                        surname_error = true;
                        $("#profile_detail_edit_window_surname_error_message").html(error.error_message);
                        $("#profile_detail_edit_window_surname_error_message").css("display", "block");
                    }
                    else if (error.error_type === "confirmational_password_error") {
                        confirmational_password_error = true;
                        $("#profile_detail_edit_window_confirmational_password_error_message").html(error.error_message);
                        $("#profile_detail_edit_window_confirmational_password_error_message").css("display", "block");
                    }
                    else {
                        setAlert(error.error_message, "bad", 3000);
                    }
                })

                if (!forename_error) {
                    $("#profile_detail_edit_window_forename_error_message").css("display", "none");
                }

                if (!surname_error) {
                    $("#profile_detail_edit_window_surname_error_message").css("display", "none");
                }

                if (!confirmational_password_error) {
                    $("#profile_detail_edit_window_confirmational_password_error_message").css("display", "none");
                }
            }
            else {
                $("#profile_name").html(res.validated_forename + " " + res.validated_surname);
                closeProfileDetailEditWindow();
                setAlert("Name updated", "good", 3000);
            }
        })
    })

    $("#cancel_update_name_button").unbind("click");
    $("#cancel_update_name_button").click(function() {
        closeProfileDetailEditWindow();
    })
}

function setEditPasswordButtonClickHandlers() {
    $("#update_password_confirm_button").unbind("click");
    $("#update_password_confirm_button").click(function() {
        let data = {
            field_being_updated: "password",
            input: {
                password_input: $("#profile_detail_edit_window_password_input").val(),
                confirm_password_input: $("#profile_detail_edit_window_confirm_password_input").val(),
                confirmational_password_input: $("#profile_detail_edit_window_confirmational_password_input").val()
            }
        }

        $.post("/update_account_details", data, function(res) {
            if (res.errors.length > 0) {
                console.log(res.errors);
                let password_error = false;
                let confirm_password_error = false;
                let confirmational_password_error = false;

                res.errors.forEach(function(error) {
                    if (error.error_type === "password_error") {
                        password_error = true;
                        $("#profile_detail_edit_window_password_error_message").html(error.error_message);
                        $("#profile_detail_edit_window_password_error_message").css("display", "block");
                    }
                    else if (error.error_type === "confirm_password_error") {
                        confirm_password_error = true;
                        $("#profile_detail_edit_window_confirm_password_error_message").html(error.error_message);
                        $("#profile_detail_edit_window_confirm_password_error_message").css("display", "block");
                    }
                    else if (error.error_type === "confirmational_password_error") {
                        confirmational_password_error = true;
                        $("#profile_detail_edit_window_confirmational_password_error_message").html(error.error_message);
                        $("#profile_detail_edit_window_confirmational_password_error_message").css("display", "block");
                    }
                    else {
                        setAlert(error.error_message, "bad", 3000);
                    }
                })

                if (!password_error) {
                    $("#profile_detail_edit_window_password_error_message").css("display", "none");
                }

                if (!confirm_password_error) {
                    $("#profile_detail_edit_window_confirm_password_error_message").css("display", "none");
                }

                if (!confirmational_password_error) {
                    $("#profile_detail_edit_window_confirmational_password_error_message").css("display", "none");
                }
            }
            else {
                closeProfileDetailEditWindow();
                setAlert("Password updated", "good", 3000);
            }
        })
    })

    $("#cancel_update_password_button").unbind("click");
    $("#cancel_update_password_button").click(function() {
        closeProfileDetailEditWindow();
    })
}