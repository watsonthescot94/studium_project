var notifications_array = [];
var notifications_displayed = false;
var notifications_wrapper_clicked = false;
var notification_button_clicked = false;

$(function() {
    $.when(getCurrentUser().done(function() {
        $.when(getAllUsers().done(function() {
            $.when(getNotifications().done(function(res) {
                if (res.errors.length > 0) {
                    console.log(res.errors);
                }
                else {
                    notifications_array = res.notifications;
                    console.log("notifications:");
                    console.log(notifications_array);
                    setNotificationsLinkClickHandler();
                    setNotificationsWrapperClickHandler();
        
                    if (notifications_array.length > 0) {
                        setNotificationsCountIcon();
                        setNotificationsHTML();
                        sortNotificationsArray();
                        addAllNotifications();
                        setNotificationClickHandler();
                        setRemoveNotificationButtons();
                        setShowMoreCommentPreviewsButtons();
                    }
                }
            }))
        }))
    }))
})

function setNotificationsLinkClickHandler() {
    $("#notifications_link").click(function() {
        if (notifications_wrapper_clicked) {
            notifications_wrapper_clicked = false;
            return;
        }

        notifications_displayed = !notifications_displayed;

        if (!notifications_displayed) {
            closeNotifications();
            return;
        }

        hideNotificationsCountIcon();
        displayNotifications();
    })
}

function setNotificationsCountIcon() {
    let unread_notification_count = getUnreadNotificationCount();
    if (unread_notification_count > 0) {
        $("#notifications_count_icon_text").html(unread_notification_count);
        $("#notifications_count_icon_wrapper").css("display", "block");
    }
}

function hideNotificationsCountIcon() {
    $("#notifications_count_icon_wrapper").css("display", "none");
}

function setNotificationsWrapperClickHandler() {
    $("#notifications_wrapper").click(function() {
        notifications_wrapper_clicked = true;
        if (notification_button_clicked) {
            notification_button_clicked = false;
            return;
        }
    })
}

function setNotificationClickHandler() {
    $(".notification").unbind("click");
    $(".notification").click(function() {
        if (notification_button_clicked) {
            notification_button_clicked = false;
            return;
        }

        let notification_id = $(this).attr("id").split("notification_")[1];
        let notification = {};
        let notification_found = false;

        for (let i = 0; i < notifications_array.length; i++) {
            if (notifications_array[i]._id === notification_id) {
                notification_found = true;
                notification = notifications_array[i];
                break;
            }
        }

        if (!notification_found) {
            console.log("Notification not found");
            return;
        }

        let href = "/course/" + notification.course_id + "?page_id=" + notification.page_id +
            "&video_link_id=" + notification.video_link_id + "&message_tab=" + notification.message_tab;
        
        if (notification.notification_type === "new_questions_notification" ||
            notification.notification_type === "new_feedback_notification") {
            href += "&comment_id=" + notification.new_comments[notification.new_comments.length - 1]._id;
        }
        else if (notification.notification_type === "new_replies" ||
            notification.notification_type === "watched_comment_new_replies") {
            href += "&comment_id=" + notification.new_replies[notification.new_replies.length - 1]._id;
        }
        else if (notification.notification_type === "highlighted_comment_notification") {
            href += "&comment_id=" + notification.highlighted_comment;
        }
        else {
            console.log("Notification type not found");
            return;
        }

        window.location.href = href;
    })
}

function closeNotifications() {
    $("#notifications_link").css("background-color", "");
    $("#notifications_wrapper").css("display", "none");
}

function updateNotificationTimeStamps() {
    $(".notification_timestamp").each(function() {
        let notification_id = $(this).attr("id").split("notification_timestamp_")[1];
        let timestamp = "";
        for (let i = 0; i < notifications_array.length; i++) {
            if (notifications_array[i]._id === notification_id) {
                timestamp = getLengthOfTime(notifications_array[i].date);
                break;
            }
        }
        $(this).html(timestamp);
    })
}

function setAllNotificationsAsRead() {
    $.post('/set_all_notifications_as_read', function(res) {
        if (res.errors.length > 0) {
            console.log(res.errors);
        }
        else {
            notifications_array.forEach(function(notification) {
                notification.read = true;
            })
        }
    })
}

function getNotifications() {
    return $.post("/get_notifications");
}

function setShowMoreCommentPreviewsButtons() {
    $(".show_more_comment_previews_button").unbind("click");
    $(".show_more_comment_previews_button").click(function() {
        notification_button_clicked = true;
        let notification_id = $(this).attr("id").split("show_more_comment_previews_button_")[1];
        let notification_found = false;

        for (let notification_i = 0; notification_i < notifications_array.length; notification_i++) {
            if (notifications_array[notification_i]._id === notification_id) {
                notification_found = true;
                notifications_array[notification_i].displaying_all_previews = !notifications_array[notification_i].displaying_all_previews;

                let comments_array = [];

                if (notifications_array[notification_i].notification_type === "new_questions_notification" ||
                    notifications_array[notification_i].notification_type === "new_feedback_notification") {
                    comments_array = notifications_array[notification_i].new_comments;
                }
                else if (notifications_array[notification_i].notification_type === "new_replies" ||
                    notifications_array[notification_i].notification_type === "watched_comment_new_replies") {
                    comments_array = notifications_array[notification_i].new_replies;
                }

                if (notifications_array[notification_i].displaying_all_previews) {
                    $("#comment_preview_wrapper_" + comments_array[1]._id).removeClass("last_new_comment_wrapper");
                    $("#comment_preview_wrapper_" + comments_array[1]._id).addClass("new_comment_wrapper");
                }
                else {
                    $("#comment_preview_wrapper_" + comments_array[1]._id).removeClass("new_comment_wrapper");
                    $("#comment_preview_wrapper_" + comments_array[1]._id).addClass("last_new_comment_wrapper");
                }

                for (let comment_i = 2; comment_i < comments_array.length; comment_i++) {
                    if (notifications_array[notification_i].displaying_all_previews) {
                        $("#comment_preview_wrapper_" + comments_array[comment_i]._id).css("display", "block");
                    }
                    else {
                        $("#comment_preview_wrapper_" + comments_array[comment_i]._id).css("display", "none");
                    }
                }

                break;
            }
        }

        if (!notification_found) {
            console.log("Notification not found");
        }
    })
}

function setRemoveNotificationButtons() {
    $(".remove_notification_button").unbind("click");
    $(".remove_notification_button").click(function() {
        notification_button_clicked = true;
        let notification_id = $(this).attr("id").split("remove_notification_button_")[1];
        let notification_type = "";
        for (let i = 0; i < notifications_array.length; i++) {
            if (notifications_array[i]._id === notification_id) {
                notification_type = notifications_array[i].notification_type;
                break;
            }
        }

        let data = {
            notification_id: notification_id,
            notification_type: notification_type
        }

        $.post("/delete_notification", data, function(res) {
            if (res.errors.length > 0) {
                console.log(res.errors);
            }
            else {
                let i = 0;
                for (i; i < notifications_array.length; i++) {
                    if (notifications_array[i]._id === notification_id) {
                        break;
                    }
                }

                notifications_array.splice(i, 1);
                wipeNotificationsDisplay();
                setNotificationsHTML();
                addAllNotifications();
                setRemoveNotificationButtons();
            }
        })
    })
}

function wipeNotificationsDisplay() {
    $("#notifications_list").html("");
}

function setNotificationsHTML() {
    notifications_array.forEach(function(notification) {
        if (notification.notification_type === "new_questions_notification" ||
            notification.notification_type === "new_feedback_notification") {
            notification.html = getNewQuestionOrFeedbackNotificationHTML(notification);
        }
        else if (notification.notification_type === "new_replies" ||
            notification.notification_type === "watched_comment_new_replies") {
            notification.html = getNewRepliesNotificationHTML(notification);
        }
        else if (notification.notification_type === "highlighted_comment_notification") {
            notification.html = getHighlightedCommentNotificationHTML(notification);
        }
    })
}

function getNewQuestionOrFeedbackNotificationHTML(notification) {
    notification.displaying_all_previews = false;
    let flair_type = "";
    let notification_type_flair_text = "";
    let notification_text = "";

    if (notification.notification_type === "new_questions_notification") {
        notification_type_flair_text = "New Question";
        flair_type = "new_questions_flair";
        notification_text = notification.new_comments.length + " new question";

        if (notification.new_comments.length > 1) {
            notification_type_flair_text += "s";
            notification_text += "s";
        }

        notification_text += " asked in video <i>" + notification.video_title + "</i>";
    }
    else if (notification.notification_type === "new_feedback_notification") {
        flair_type = "new_feedback_flair";
        notification_type_flair_text = "New Feedback";
        notification_text = notification.new_comments.length + " new feedback comment";
        if (notification.new_comments.length > 1) {
            notification_text += "s";
        }
        notification_text += " in video <i>" + notification.video_title + "</i>";
    }
    
    notification.new_comments = sortNewestToOldestByPostingTime(notification.new_comments);
    notification.date = notification.new_comments[0].posting_time;

    let font_weight_class = "";

    if (!notification.read) {
        font_weight_class = "bold";
    }

    let notification_html =
    '<div id="notification_' + notification._id + '" class="notification">' +
        '<div class="notification_top_text_wrapper">' +
            '<p class="notification_top_text ' + font_weight_class + '"><i>' + notification.course_title + '</i></p>' +
            '<p id="notification_timestamp_' + notification._id + '" class="notification_timestamp ' + font_weight_class + '">' +
                getLengthOfTime(notification.date) +
            '</p>' +
        '</div>' +

        '<div class="notification_flairs">' +
            '<p class="flair ' + flair_type + ' ' + font_weight_class + '">' + notification_type_flair_text + '</p>';
    
    if (!notification.read) {
        notification_html +=
            '<p class="flair unread_flair bold"><b>Unread</b></p>';
    }
    
    notification_html +=
        '</div>' +

        '<p class="notification_text ' + font_weight_class + '">' + notification_text + '</p>' +

        '<div class="new_comment_previews_list">';
    
    notification.new_comments.forEach(function(new_comment, i) {
        let author_username = "";
        for (let i = 0; i < all_users.length; i++) {
            if (all_users[i]._id === new_comment.author_id) {
                author_username = all_users[i].username;
                break;
            }
        }

        let display_style = "block";
        let new_question_wrapper_class = "new_comment_wrapper";

        if (i === 1 || i === notification.new_comments.length - 1) {
            new_question_wrapper_class = "last_new_comment_wrapper";
        }
        
        if (i > 1) {
            display_style = "none";
        }

        notification_html +=
            '<div id="comment_preview_wrapper_' + new_comment._id + '" class="' + new_question_wrapper_class + '" style="display:' + display_style + '">' +
                '<p class="new_comment_username_and_timestamp ' + font_weight_class + '">' +
                    '@' + author_username + ' &bull; ' + getLengthOfTime(new_comment.posting_time) +
                '</p>' +

                '<p class="new_comment_text ' + font_weight_class + '">' +
                    new_comment.text +
                '</p>' +
            '</div>';
    })

    notification_html +=
        '</div>';

    if (notification.new_comments.length > 2) {
        let show_all_text = "";
        if (notification.notification_type === "new_questions_notification") {
            show_all_text = "Show All Questions";
        }
        else if (notification.notification_type === "new_feedback_notification") {
            show_all_text = "Show All Feedback Comments"
        }

        notification_html +=
        '<p id="show_more_comment_previews_button_' + notification._id + '" class="show_more_comment_previews_button">' +
            show_all_text +
        '</p>';
    }

    notification_html +=
        '<div class="remove_notification_button_wrapper">' +
            '<button id="remove_notification_button_' + notification._id + '" class="remove_notification_button white_button">' +
                'Remove' +
            '</button>' +
        '</div>' +
    '</div>';

    return notification_html;
}

function getNewRepliesNotificationHTML(notification) {
    notification.displaying_all_previews = false;
    let flair_type = "";
    let notification_type_flair_text = "";
    let notification_text = notification.new_replies.length;

    if (notification.notification_type === "new_replies") {
        flair_type = "new_replies_flair";
        if (notification.new_replies.length > 1) {
            notification_type_flair_text = "New Replies";
            notification_text += ' new replies ';
        }
        else {
            notification_type_flair_text = "New Reply";
            notification_text += ' new reply ';
        }

        notification_text += 'to your comment ("' + notification.comment_being_replied_to.text + '") in video ' +
        '<i>' + notification.video_title + '</i>';
    }
    else if (notification.notification_type === "watched_comment_new_replies") {
        flair_type = "watched_comment_new_replies_flair";
        notification_type_flair_text = "Watched Comment";
        
        if (notification.new_replies.length > 1) {
            notification_text += " new replies ";
        }
        else {
            notification_text += " new reply ";
        }

        notification_text += 'to a comment you are watching ("' + notification.comment_being_replied_to.text + '") in video <i>' +
            notification.video_title + '</i>';
    }
    
    notification.new_replies = sortNewestToOldestByPostingTime(notification.new_replies);
    notification.date = notification.new_replies[0].posting_time;

    let font_weight_class = "";

    if (!notification.read) {
        font_weight_class = "bold";
    }

    let notification_html =
    '<div id="notification_' + notification._id + '" class="notification">' +
        '<div class="notification_top_text_wrapper">' +
            '<p class="notification_top_text ' + font_weight_class + '"><i>' + notification.course_title + '</i></p>' +
            '<p id="notification_timestamp_' + notification._id + '" class="notification_timestamp ' + font_weight_class + '">' +
                getLengthOfTime(notification.date) +
            '</p>' +
        '</div>' +

        '<div class="notification_flairs">' +
            '<p class="flair ' + flair_type + ' ' + font_weight_class + '">' + notification_type_flair_text + '</p>';
    
    if (!notification.read) {
        notification_html +=
            '<p class="flair unread_flair ' + font_weight_class + '">Unread</p>';
    }
    
    notification_html +=
        '</div>' +

        '<p class="notification_text ' + font_weight_class + '">' + notification_text + '</p>' +

        '<div class="new_comment_previews_list">';
    
    notification.new_replies.forEach(function(new_reply, reply_i) {
        let author_username = "";
        for (let i = 0; i < all_users.length; i++) {
            if (all_users[i]._id === new_reply.author_id) {
                author_username = all_users[i].username;
                break;
            }
        }

        let display_style = "block";
        let new_reply_wrapper_class = "new_comment_wrapper";
        if (reply_i === 1 || reply_i === notification.new_replies.length - 1) {
            new_reply_wrapper_class = "last_new_comment_wrapper";
        }

        if (reply_i > 1) {
            display_style = "none";
        }

        notification_html +=
            '<div id="comment_preview_wrapper_' + new_reply._id + '" class="' + new_reply_wrapper_class + '" style="display:' + display_style + '">' +
                '<p class="new_comment_username_and_timestamp ' + font_weight_class + '">' +
                    '@' + author_username + ' &bull; ' + getLengthOfTime(new_reply.posting_time) +
                '</p>' +

                '<p class="new_comment_text ' + font_weight_class + '">' +
                    '@' + current_user.username + " " + new_reply.text +
                '</p>' +
            '</div>';
    })

    notification_html +=
        '</div>';

    if (notification.new_replies.length > 2) {
        notification_html +=
        '<p id="show_more_comment_previews_button_' + notification._id + '" class="show_more_comment_previews_button">' +
            'Show All Replies' +
        '</p>';
    }

    notification_html +=
        '<div class="remove_notification_button_wrapper">' +
        '<button id="remove_notification_button_' + notification._id + '" class="remove_notification_button white_button">' +
            'Remove' +
        '</button>' +
        '</div>' +
    '</div>';

    return notification_html;
}

function getHighlightedCommentNotificationHTML(notification) {
    let notification_type_flair_text = "Highlighted Comment";
    let notification_text = 'Your comment "' + notification.highlighted_comment.text + '" in video <i>' + notification.video_title +
        '</i> was highlighted by a course staff member';

    let font_weight_class = "";

    if (!notification.read) {
        font_weight_class = "bold";
    }

    let notification_html =
    '<div id="notification_' + notification._id + '" class="notification">' +
        '<div class="notification_top_text_wrapper">' +
            '<p class="notification_top_text ' + font_weight_class + '"><i>' + notification.course_title + '</i></p>' +
            '<p id="notification_timestamp_' + notification._id + '" class="notification_timestamp ' + font_weight_class + '">' +
                getLengthOfTime(notification.date) +
            '</p>' +
        '</div>' +

        '<div class="notification_flairs">' +
            '<p class="flair highlighted_comment_notification_flair ' + font_weight_class + '">' + notification_type_flair_text + '</p>';
        
    if (!notification.read) {
            notification_html +=
            '<p class="flair unread_flair ' + font_weight_class + '">Unread</p>';
    }
        
    notification_html +=
        '</div>' +

        '<p class="notification_text ' + font_weight_class + '">' + notification_text + '</p>' +

        '<div class="remove_notification_button_wrapper">' +
        '<button id="remove_notification_button_' + notification._id + '" class="remove_notification_button white_button">' +
            'Remove' +
        '</button>' +
        '</div>' +
    '</div>';
    
    return notification_html;
}

function addAllNotifications() {
    notifications_array.forEach(function(notification) {
        $("#notifications_list").append(notification.html);
    })
}

function getUnreadNotificationCount() {
    let unread_notification_count = 0;

    notifications_array.forEach(function(notification) {
        if (!notification.read) {
            unread_notification_count++;
        }
    })

    return unread_notification_count;
}

/**
 * Method for displaying a user's notifications
 */
function displayNotifications() {
    let unread_notification_count = getUnreadNotificationCount();
    $("#notification_count").html("(" + unread_notification_count + " Unread)");
    $(this).css("background-color", "rgb(84, 84, 84)");
    $("#notifications_wrapper").css("display", "block");

    // If notifications exist
    if (notifications_array.length > 0) {
        // Update their timestamps
        updateNotificationTimeStamps();

        // If any notifications are unread
        if (unread_notification_count > 0) {
            // Set any unread notifications as read
            setAllNotificationsAsRead();
        }
        // If all notifications have been read
        else {
            // Set unread notification count as 0, remove unread flairs, and unembolden notification text
            $("#notification_count").html("(0 Unread)");
            $(".unread_flair").css("display", "none");
            $(".notification_top_text").removeClass("bold");
            $(".notification_timestamp").removeClass("bold");
            $(".flair").removeClass("bold");
            $(".notification_text").removeClass("bold");
            $(".new_comment_username_and_timestamp").removeClass("bold");
            $(".new_comment_text").removeClass("bold");
        }
    }
}

function sortNewestToOldestByPostingTime(comments) {
    comments.sort(function(a, b) {
        return b.posting_time - a.posting_time;
    })

    return comments;
}

function sortNotificationsArray() {
    notifications_array.sort(function(a, b) {
        return b.date - a.date;
    })

    return notifications_array;
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