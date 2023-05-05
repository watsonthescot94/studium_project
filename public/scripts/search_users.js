var added_users = {};
var all_users = [];

$(function() {
    setSearchInputHandler();
})

function setSearchInputHandler() {
    $(".search_input").on("input", function() {
        let input = $(this).val().trim();
        let key = $(this).attr("id").split("search_input_")[1];

        if (input.length === 0) {
            $("#search_results_" + key).css("display", "none");
            return;
        }

        let results = getUserSearchResults(input);
        displayResults(results, key);
        setUserResultsClickHandlers();
    })
}

function getUserSearchResults(input) {
    if (input[0] === "@") {
        input = input.replace("@", "");
    }

    input = input.toLowerCase();

    let match_not_at_beginning = [];
    let results = [];

    all_users.forEach(function(user) {
        if (user.username.toLowerCase().includes(input)) {
            if (user.username.substring(0, input.length) === input) {
                results.push(user);
            }
            else {
                match_not_at_beginning.push(user);
            }
        }
    })

    match_not_at_beginning.forEach(function(user) {
        results.push(user);
    })

    return results;
}

function displayResults(results, key) {
    if (results.length === 0) {
        let no_results_html = "<a id='user_result_username_no_users_found_key_" + key + "' class='user_result'>No users found</a>";
        $("#search_results_" + key).html(no_results_html);
    }
    else {
        let user_options = "";

        results.forEach(function(user) {
            user_options +=
            "<a id='user_result_username_" + user.username + "_key_" + key + "' class='user_result'>" +
                "@" + user.username + " (" + user.forename + " " + user.surname +")" +
            "</a>";
        })

        $("#search_results_" + key).html(user_options);
    }

    let results_height = $("#search_results_" + key).height();
    let results_bottom = results_height - 1;
    $("#search_results_" + key).css("bottom", "-" + results_bottom + "px");
    $("#search_results_" + key).css("display", "block");
}

function setUserResultsClickHandlers() {
    $(".user_result").click(function() {
        let username_and_key = $(this).attr("id").split("user_result_username_");
        let username = username_and_key[1].split("_key_")[0];
        let key = username_and_key[1].split("_key_")[1];

        $("#search_results_" + key).css("display", "none");
        $("#search_input_" + key).val("");

        if (username === "no_users_found") {
            return;
        }
        
        let already_added = false;

        for (let i = 0; i < added_users[key].length; i++) {
            if (added_users[key][i].username === username) {
                already_added = true;
            }
        }

        if (!already_added) {
            for (let i = 0; i < all_users.length; i++) {
                if (all_users[i].username === username) {
                    addUser(all_users[i], key);
                    break;
                }
            }
        }
        else {
            setAlert("You have already added @" + username, "bad", 3000);
        }
    })
}

function addUser(user, key) {
    if (key.includes("staff") && user.is_teacher === undefined && user.is_admin === undefined) {
        user.is_teacher = false;
        user.is_admin = false;
    }
    
    added_users[key].push(user);

    let added_user_html =
    "<div id='added_user_wrapper_username_" + user.username + "_key_" + key + "' class='added_user_wrapper'>" +
        "<a href='/user/" + user._id + "' class='added_user_details_wrapper'>" +
            "<div class='added_user_avatar_wrapper'>" +
                "<img src='" + user.avatar_path + "' class='added_user_avatar'>" +
            "</div>" +

            "<div class='added_user_username_name_wrapper'>" +
                "<p>" + user.forename + " " + user.surname + "<br>@" + user.username + "</p>" +
            "</div>" +
        "</a>";

    if (key.includes("staff")) {
        added_user_html += 
        "<div class='staff_settings_wrapper'>" +
            "<div class='staff_settings_details'>" +
                "<div class='is_teacher_wrapper'>" +
                    "<input id='is_teacher_checkbox_username_" + user.username + "_key_" + key + "' class='is_teacher_checkbox' type='checkbox'>" +
                    "<label for='is_teacher_checkbox_username_" + user.username + "_key_" + key + "'>Teacher</label>" +
                "</div>" +

                "<div class='is_admin_wrapper'>" +
                    "<input id='is_admin_checkbox_username_" + user.username + "_key_" + key + "' class='is_admin_checkbox' type='checkbox'>" +
                    "<label for='is_admin_checkbox_username_" + user.username + "_key_" + key + "'>Admin</label>" +
                "</div>" +
            "</div>" +
        "</div>";
    }

    added_user_html +=
        "<div class='remove_added_user_button_wrapper'>" +
            "<button id='remove_added_user_button_username_" + user.username + "_key_" + key + "' class='remove_added_user_button white_button' type='button'>Remove</button>" +
        
            "<div class='helper_icon_wrapper'>" +
                "<img class='helper_icon' src='/images/helper_icon.png'>" +

                "<div class='remove_added_user_button_helper_icon_text_wrapper helper_icon_text_wrapper helper_icon_text_wrapper_top'>" +
                    "<p class='helper_icon_text'>" +
                        "To the left is a listing for an added staff member. If you click on the block containing " +
                        "their avatar, username, and name, you will be redirect to their Profile Page.<br><br>" +
                        "You can set the user as a teacher and/or an admin user for this course with the checkmarks " +
                        "labelled Teacher and Admin.<br><br>" +
                        'If you want to remove a staff member, click the "Remove" button.' +
                    "</p>" +
                "</div>" +
            "</div>" +
        "</div>" +
    "</div>";

    $("#added_users_wrapper_" + key).append(added_user_html);

    if (key.includes("staff")) {
        setIsAdminButtons();
        setIsTeacherButtons();
    }

    setRemoveAddedUserButtons();
    setHelperIconEventHandlers();
}

function setRemoveAddedUserButtons() {
    $(".remove_added_user_button").unbind("click");
    $(".remove_added_user_button").click(function() {
        let username_and_key = $(this).attr("id").split("remove_added_user_button_username_");
        let username = username_and_key[1].split("_key_")[0];
        let key = username_and_key[1].split("_key_")[1];
        let found = false;
        
        for (let i = 0; i < added_users[key].length; i++) {
            if (added_users[key][i].username === username) {
                added_users[key].splice(i, 1);
                found = true;
            }
        }

        if (!found) {
            console.log("User not found");
        }
        else {
            $("#added_user_wrapper_username_" + username + "_key_" + key).remove();
        }
    })
}

function setIsTeacherButtons() {
    $(".is_teacher_checkbox").unbind("change");
    $(".is_teacher_checkbox").change(function() {
        let username_and_key = $(this).attr("id").split("is_teacher_checkbox_username_");
        let username = username_and_key[1].split("_key_")[0];
        let key = username_and_key[1].split("_key_")[1];

        for (let i = 0; i < added_users[key].length; i++) {
            if (added_users[key][i].username === username) {
                added_users[key][i].is_teacher = $(this).is(":checked");
                break;
            }
        }
    })
}

function setIsAdminButtons() {
    $(".is_admin_checkbox").unbind("change");
    $(".is_admin_checkbox").change(function() {
        let username_and_key = $(this).attr("id").split("is_admin_checkbox_username_");
        let username = username_and_key[1].split("_key_")[0];
        let key = username_and_key[1].split("_key_")[1];

        for (let i = 0; i < added_users[key].length; i++) {
            if (added_users[key][i].username === username) {
                added_users[key][i].is_admin = $(this).is(":checked");
                break;
            }
        }
    })
}