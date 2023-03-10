$(function() {
    getUserNotifications();
})

function getUserNotifications() {
    $.post('/get_notifications', function(res) {
        let url = new URL(window.location.href);
        let pathname = url.pathname;
        let on_notifications_page = pathname === "/notifications";

        console.log("On notifications page: " + on_notifications_page);

        if (res.error) {
            console.log("Error occurred retrieving notifications");

            if (pathname === "/notifications") {
                let notifications_html =
                    "<div class='notification_wrapper'>" +
                        "<p>Error occurred retrieving notifications</p>" +
                    "</div>";
                    
                $("#notifications_container").html(notifications_html);
            }
        }

        if (!res.user_logged_in) {
            console.log("User not logged in");
        }
        else if (res.notifications) {
            let notifications_array = [
                res.notifications.chat_reply_notifications,
                res.notifications.new_question_notifications
            ]

            let unread_notification_count = getNotificationCount(notifications_array);

            $("#notification_count").html("(" + unread_notification_count + ")");

            // If on the notifications page, display notifications and mark all notifications as now read
            if (on_notifications_page) {
                displayNotifications(notifications_array);
                markAllNotificationsAsRead();
            }
        }
        else {
            console.log("Error retrieving notifications");
            $("#notification_count").html("(0)");

            if (on_notifications_page) {
                let notifications_html =
                    "<div class='notification_wrapper'>" +
                        "<p>Error occurred retrieving notifications</p>" +
                    "</div>";
                    
                $("#notifications_container").html(notifications_html);
            }
        }
    })
}

function getNotificationCount(notifications_array) {
    let unread_notification_count = 0;

    notifications_array.forEach(function(notification_array) {
        notification_array.forEach(function(notification) {
            if (!notification.read) {
                unread_notification_count++;
            }
        })
    })

    return unread_notification_count;
}

/**
 * Method for displaying a user's notifications
 */
function displayNotifications(notifications_array) {
    let notifications_html = "";
    let all_notifications = [];

    notifications_array.forEach(function(notification_array) {
        notification_array.forEach(function(notification) {
            all_notifications.push(notification);
        })
    })

    if (all_notifications.length > 0) {
        all_notifications = sortNotifications(all_notifications);

        // For each chat reply notification
        all_notifications.forEach(function(notification) {
            let users = [];

            if (notification._id.includes("chat_reply_")) {
                users = notification.new_replies;
            }
            else if (notification._id.includes("new_question_")) {
                users = notification.question_askers;
            }

            let notification_time = notification.date;
            let notification_html = "";

            // If there are replies
            if (users.length > 0) {
                let user_ids = [];

                // Get the user ID of each unique replier
                users.forEach(function(user_id) {
                    user_ids.push({
                        _id: user_id
                    })
                })

                let data = {
                    user_ids: user_ids
                }

                // Get the usernames of each replier
                $.post("/get_usernames", data, function(res) {
                    if (res.error) {
                        console.log("error occurred retrieving usernames");
                    }

                    if (!res.users) {
                        console.log("no users found when retrieving usernames");
                    }
                    else {
                        let user_names = {};

                        // Add each user's matching ID and username to replier_names object
                        res.users.forEach(function(user) {
                            user_names[user._id] = user.username
                        })

                        // Get the current user's details
                        $.post('/get_current_user', function(current_user) {
                            let msg_end = "";
                            
                            if (notification._id.includes("chat_reply_")) {
                                msg_end = " replied to a comment";
                            }
                            else if (notification._id.includes("new_question_")) {
                                msg_end = " asked a question";
                            }

                            if (!current_user) {
                                console.log("current user not found");
                            }
                            else {
                                // Set end of notification message based on whether the reply is to a comment posted by the current user
                                if (notification._id.includes("chat_reply_")) {
                                    if (current_user._id === notification.original_author_id) {
                                        msg_end = " replied to your comment";
                                    }
                                    else {
                                        msg_end = " replied to a comment you are watching";
                                    }
                                }
                            }

                            let bold_start = "";
                            let bold_end = "";

                            if (!notification.read) {
                                bold_start = "<b>";
                                bold_end = "</b>";
                            }

                            // Create notification text
                            if (users.length === 1) {
                                notification_html = "<p>" + bold_start + "@" + user_names[users[0]] + msg_end + bold_end + "</p>";
                            }
                            else if (users.length === 2) {
                                notification_html = "<p>" + bold_start+ "@" + user_names[users[1]] + " and @" + user_names[users[0]] +
                                    msg_end + bold_end + "</p>";
                            }
                            else {
                                let other_users_count = users.length - 2;
                                let other_grammar = "others";
                                
                                if (other_users_count === 1) {
                                    other_grammar = "other";
                                }

                                notification_html = "<p>" + bold_start + "@" + user_names[users[users.length - 1]] + ", " +
                                    "@" + user_names[users[users.length - 2]] + " and " + other_users_count +
                                    " " + other_grammar + msg_end + bold_end + "</p>";
                            }

                            notification_html += "<p class='notification_time'>" + getLengthOfTime(notification_time) + "</p>"; 

                            notifications_html +=
                            "<div class='notification_wrapper'>" +
                                "<div id='" + notification._id + "'class='notification'>" +
                                    notification_html +
                                "</div>" +
                            "</div>";
                        
                            // Add notifications HTML to page
                            $("#notifications_container").html(notifications_html);
                        })
                    }
                })
            }
        })
    }
    else {
        let notifications_html =
            "<div class='notification_wrapper'>" +
                "<p>No notifications to show</p>" +
            "</div>";
        
        $("#notifications_container").html(notifications_html);
    }
}

function sortNotifications(notifications) {
    notifications.sort(function(a, b) {
        return b.date - a.date;
    })

    return notifications;
}

/**
 * Method for marking all notifications as read
 */
function markAllNotificationsAsRead() {
    let update = {
        $set: {}
    }

    update.$set["notifications.chat_reply_notifications.$[notification].read"] = true;
    update.$set["notifications.new_question_notifications.$[notification].read"] = true;

    let options = {
        arrayFilters: [
            {
                'notification.read': false
            }
        ]
    }

    let data = {
        update: JSON.stringify(update),
        options: JSON.stringify(options)
    }

    // Update all notifications to be marked as read
    $.post('/update_current_user', data, function(res) {
        if (res.error) {
            console.log("Error marking notifications as read");
        }

        if (!res.logged_in) {
            console.log("User not logged in");
        }

        if (res.user_not_found) {
            console.log("User was not found");
        }
    })
}