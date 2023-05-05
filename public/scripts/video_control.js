var current_video = null;
var current_tab = "questions";
var comment_being_replied_to = {}
var current_user = undefined;
var editing_comment = false;
var comment_being_edited = {}
var chat_users_details = [];
 
/**
 * Function that executes when DOM finishes loading
 */
$(function() {
    let no_messages_html = "<p id='no_chat_messages_message'>Fetching comments...</p>";
    $("#chatbox_messages").append(no_messages_html);

    $("#questions_tab").click(function() {
        if (!$("#questions_tab").hasClass("active_tab")) {
            $("#questions_tab").addClass("active_tab");
            $("#feedback_tab").removeClass("active_tab");
            current_tab = "questions";
            $("#add_new_comment_button").prop("value", "Ask a Question");
            addAllChatMessages();
        }
    })

    $("#feedback_tab").click(function() {
        if (!$("#feedback_tab").hasClass("active_tab")) {
            $("#feedback_tab").addClass("active_tab");
            $("#questions_tab").removeClass("active_tab");
            current_tab = "feedback";
            $("#add_new_comment_button").prop("value", "Provide Feedback");
            addAllChatMessages();
        }
    })

    $("#add_new_comment_button").click(function() {
        if (!$.isEmptyObject(current_user)) {
            $("#video_lecture")[0].pause();
            displayNewCommentBox();
            if (current_tab === "questions") {
                $("#add_new_comment_title").html("Ask a Question");
                $("#add_new_comment_input").attr("placeholder", "Ask a question...");
            }
            else {
                $("#add_new_comment_title").html("Provide Feedback");
                $("#add_new_comment_input").attr("placeholder", "Provide feedback...");
            }
            
            $("#add_new_comment_input").focus();
            $("#add_new_comment_input").val("");
        }
        else {
            setAlert("You must be logged in to comment", "bad", 5000);
        }
    })

    $("#add_new_comment_cancel_button").click(function() {
        editing_comment = false;
        hideNewCommentBox();
    })

    $("#add_new_reply_cancel_button").click(function() {
        hideNewReplyBox();
    })

    $("#add_new_reply_submit_button").click(function() {
        addNewReply();
    })

    $("#add_new_comment_submit_button").click(function() {
        addOrUpdateComment();
    })
})

function convertDateToDateWithDashes(date_string) {
    let date = new Date(date_string);
    let day = date.getUTCDate();
    let month = date.getUTCMonth() + 1;
    let year = date.getUTCFullYear();

    if (day < 10) {
        day = "0" + day;
    }

    if (month < 10) {
        month = "0" + month;
    }

    return year + "-" + month + "-" + day;
}

function makeTimestampsClickable() {
    $(".message_timestamp").click(function() {
        var time = ($(this).html().split(":"));
        var hrs = 0;
        var mins_index = 0;
        var secs_index = 1;

        if (time.length == 3) {
            mins_index++;
            secs_index++;
            hrs = parseInt(time[0]) * 3600;
        }

        var mins = parseInt(time[mins_index]) * 60;
        var secs = parseInt(time[secs_index]);
        $("#video_lecture")[0].currentTime = hrs + mins + secs;
    })
}

function initialiseCommentVoteStatuses() {
    if (current_video === null) {
        return;
    }

    let comment_array = []

    if (current_tab === "questions") {
        comment_array = current_video.questions;
    }
    else if (current_tab === "feedback") {
        comment_array = current_video.feedback;
    }

    for (let i = 0; i < comment_array.length; i++) {
        comment_array[i].upvoted = false;
        comment_array[i].downvoted = false;

        for (let ii = 0; ii < comment_array[i].replies.length; ii++) {
            comment_array[i].replies[ii].upvoted = false;
            comment_array[i].replies[ii].downvoted = false;
        }
    }
}

/**
 * Method for adding a new chat message to the chatbox
 * @param {*} message Message to be added
 */
function addOrUpdateComment() {
    if (student_view) {
        setAlert("You cannot post a comment in student view", "bad", 3000);
        return;
    }

    let comment_data = {
        course_id: course._id,
        page_id: current_page._id,
        video_link_id: current_video._id,
        message_tab: current_tab,
        comment_text: $("#add_new_comment_input").val(),
        editing_comment: editing_comment
    }

    if (editing_comment) {
        comment_data.comment_id = comment_being_edited._id;
        comment_data.is_reply = getMessageFromID(comment_being_edited._id).is_reply
    }
    else {
        comment_data.comment_timestamp = $("#video_lecture")[0].currentTime;
    }

    console.log(comment_data);

    let data = {
        comment_data: JSON.stringify(comment_data)
    }

    $.post('/add_or_update_chat_comment', data, function(res) {
        console.log("res:");
        console.log(res);

        if (res.errors.length > 0) {
            console.log(res.errors);
            let comment_error = false;
            for (let i = 0; i < res.errors.length; i++) {
                if (res.errors[i].error_type === "comment_error") {
                    comment_error = true;
                    $("#add_new_comment_error_message").html(res.errors[i].error_message);
                    $("#add_new_comment_error_message").css("display", "block");
                    break;
                }
            }

            if (!comment_error) {
                $("#add_new_comment_error_message").css("display", "none");
                setAlert(res.errors[res.errors.length - 1].error_message, "bad", 3000);
            }
        }
        else {
            let comment_array = [];

            if (current_tab === "questions") {
                comment_array = current_video.questions;
            }
            else if (current_tab === "feedback") {
                comment_array = current_video.feedback;
            }

            hideNewCommentBox();

            if (editing_comment) {
                editing_comment = false;
                setAlert("Comment updated", "good", 3000);
                for (let comment_i = 0; comment_i < comment_array.length; comment_i++) {
                    if (comment_array[comment_i]._id === res.comment._id) {
                        comment_array[comment_i].text = res.comment.text;
                        break;
                    }
                    else {
                        for (let reply_i = 0; reply_i < comment_array[comment_i].replies.length; reply_i++) {
                            if (comment_array[comment_i].replies[reply_i]._id === res.comment._id) {
                                comment_array[comment_i].replies[reply_i].text = res.comment.text;
                                break;
                            }
                        }
                    }
                }

                addAllChatMessages();
                return;
            }

            setAlert("Comment posted", "good", 3000);
            comment_array.push(res.comment);    // Add new comment to chat messages object
            addAllChatMessages();   // Add all chat messages to chatbox

            let notification_data = {
                course_id: course._id,
                page_id: current_page._id,
                video_link_id: current_video._id,
                comment_id: res.comment._id,
                message_tab: current_tab
            }

            $.post('/add_notifications_for_new_chat_comment', notification_data, function(res) {
                console.log(res);
                if (res.errors.length > 0) {
                    res.errors.forEach(function(error) {
                        console.log(error.error_message);
                    })
                }
            })
        }
    })
}

function addNewReply() {
    let reply_data = {
        course_id: course._id,
        page_id: current_page._id,
        video_link_id: current_video._id,
        new_reply_text: $("#add_new_reply_input").val(),
        comment_being_replied_to: comment_being_replied_to._id,
        message_tab: current_tab
    }

    $.post('/add_new_chat_reply', reply_data, function(res) {
        if (res.errors.length > 0) {
            console.log(res.errors);
            let reply_error = false;

            res.errors.forEach(function(error) {
                if (error.error_type === "reply_error") {
                    reply_error = true;
                    $("#add_new_reply_error_message").html(error.error_message);
                    $("#add_new_reply_error_message").css("display", "block");
                }
            })

            if (!reply_error) {
                $("#add_new_reply_error_message").css("display", "none");
                setAlert(res.errors[res.errors.length - 1].error_message, "bad", 3000);
            }
        }
        else {
            console.log("no errors");
            setAlert("Reply posted", "good", 3000);
            hideNewReplyBox();
            $("#add_new_reply_input").val("");

            for (let comment_i = 0; comment_i < current_video[current_tab].length; comment_i++) {
                if (current_video[current_tab][comment_i]._id === comment_being_replied_to._id) {
                    current_video[current_tab][comment_i].replies.push(res.new_reply);
                    break;
                }
                else {
                    for (let reply_i = 0; reply_i < current_video[current_tab][comment_i].replies.length; reply_i++) {
                        if (current_video[current_tab][comment_i].replies[reply_i]._id === comment_being_replied_to._id) {
                            console.log("Reply found");
                            current_video[current_tab][comment_i].replies.push(res.new_reply);
                            break;
                        }
                    }
                }
            }

            console.log(JSON.parse(JSON.stringify(current_video[current_tab])));

            addAllChatMessages();

            let notification_data = {
                course_id: course._id,
                page_id: current_page._id,
                video_link_id: current_video._id,
                reply_id: res.new_reply._id,
                message_tab: current_tab,
                comment_being_replied_to: comment_being_replied_to._id
            }

            $.post("/add_notifications_for_new_reply", notification_data, function(res) {
                console.log(res.errors);
            })
        }
    })
}

function getElementPath(element) {
    let element_path = "top_element";
    if (current_page.top_element._id !== element._id) {
        let current_element = current_page.top_element.child;
        let found = false;

        while (current_element !== null && !found) {
            element_path += ".child";

            if (current_element._id === element._id) {
                found = true;
            }

            current_element = current_element.child;
        }
    }

    return element_path;
}

function getMessageIndex(array, id) {
    for (let i = 0; i < array.length; i++) {
        if (array[i]._id == id) {
            return i;
        }
    }

    return -1;
}

function deleteChatComment(comment_id) {
    let data = {
        course_id: course._id,
        page_id: current_page._id,
        video_link_id: current_video._id,
        message_tab: current_tab,
        comment_id: comment_id
    }

    $.post('/delete_chat_comment', data, function(res) {
        if (res.errors.length > 0) {
            setAlert(res.errors[res.errors.length - 1].length, "bad", 3000);
        }
        else {
            setAlert("Comment deleted", "good", 3000);
            let comments = current_video[current_tab];
            for (let comment_i = 0; comment_i < comments.length; comment_i++) {
                if (comments[comment_i]._id === comment_id) {
                    comments.splice(comment_i, 1);
                    break;
                }
                else {
                    for (let reply_i = 0; reply_i < comments[comment_i].replies.length; reply_i++) {
                        if (comments[comment_i].replies[reply_i]._id === comment_id) {
                            comments[comment_i].replies.splice(reply_i, 1);
                        }
                    }
                }
            }

            addAllChatMessages();
        }
    })
}

/**
 * Method for sorting chat messages in chronological order
 */
function sortChatMessages() {
    if (current_tab === "questions") {
        current_video.questions.sort(sortMessages); // Sort chat messages chronologically
    }
    else if (current_tab === "feedback") {
        current_video.feedback.sort(sortMessages);
    }
}

/**
 * Method for clearing the chatbox
 */
function clearChatBox() {
    $("#chatbox_messages").html("");
}

/**
 * Add all chat messages to chatbox
 */
function addAllChatMessages() {
    if (current_video === null) {
        return;
    }

    let comment_array = []

    if (current_tab === "questions") {
        comment_array = current_video.questions;
    }
    else if (current_tab === "feedback") {
        comment_array = current_video.feedback;
    }

    clearChatBox();
    sortChatMessages();

    if (comment_array.length > 0) {
        comment_array.forEach(function(comment) {
            insertChatMessage(comment);
        });
        setMessageDisplayType();    // Set the display types for every message
        makeTimestampsClickable();  // Make timestamps clickable
        makeVoteButtonsClickable(); // Make upvote/downvote buttons clickable
        setReplyButtonClickHandlers();
        setEditButtonClickHandlers();
        setDeleteButtonClickHandlers();
        setHighlightButtonClickHandlers();
        setWatchButtonClickHandlers();
    }
    else {
        noChatMessages();
    }
}

function addNewQuestionNotifications() {
    let data = {
        video_id: current_video._id,
        question_asker_id: current_user._id,
        course_id: course_id
    }

    console.log(data);

    $.post('/add_new_question_notification', data, function(res) {
        if (res.error) {
            console.log("Error adding notifications");
        }
        else {
            console.log("Notifications added successfully");
        }
    })
}

function addReplyNotification(reply_obj) {
    let data = {
        video_id: current_video._id,
        recipient_id: reply_obj.recipient._id,
        current_tab: current_tab
    }

    $.post('/add_chat_reply_notification', data, function(res) {
        if (res.error) {
            console.log("ERROR");
        }
        else {
            console.log("SUCCESS");
        }
    })
}

function watchComment(comment_id, watch) {
    if (student_view) {
        setAlert("You cannot watch a comment in student view", "bad", 3000);
        return;
    }

    let info = {
        course_id: course._id,
        page_id: current_page._id,
        video_link_id: current_video._id,
        message_tab: current_tab,
        comment_id: comment_id,
        watch: watch
    }

    let data = {
        info: JSON.stringify(info)
    }

    $.post('/watch_or_unwatch_comment', data, function(res) {
        if (res.errors.length > 0) {
            setAlert(res.errors[res.errors.length - 1].error_message, "bad", 3000);
        }
        else {
            let new_watch_text = "WATCH";
            let alert_message = "Comment no longer being watched";

            if (watch) {
                new_watch_text = "UNWATCH";
                alert_message = "Comment is now being watched";
            }

            $("#watch_comment_button_" + comment_id).html("<b>" + new_watch_text + "</b>");
            setAlert(alert_message, "good", 3000);
        }
    })
}

function setWatchButtonClickHandlers() {
    $(".watch_comment_button").click(function() {
        if ($.isEmptyObject(current_user)) {
            setAlert("You must be logged in to watch a comment", "bad", 5000);
            return;
        }

        let comment_id = $(this).attr("id").split("watch_comment_button_")[1];

        if ($(this).html() === "<b>WATCH</b>") {
            watchComment(comment_id, true);
        }
        else if ($(this).html() === "<b>UNWATCH</b>") {
            watchComment(comment_id, false);
        }
        else {
            setAlert("An error occurred", "bad", 3000);
        }
    })
}

function setEditButtonClickHandlers() {
    $(".edit_comment_button").click(function() {
        if (student_view) {
            setAlert("You cannot edit a comment in student view", "bad", 3000);
            return;
        }

        editing_comment = true;
        let id = $(this).attr("id").split("edit_comment_button_")[1];

        let message_obj = getMessageFromID(id);

        if (message_obj !== null) {
            comment_being_edited = message_obj.comment;
            $("#add_new_comment_title").html("EDIT COMMENT");
            $("#add_new_comment_input").val(comment_being_edited.text);
            $("#video_lecture")[0].pause();
            displayNewCommentBox();
            $("#add_new_comment_input").focus();
        }
        else {
            editing_comment = false;
            setAlert("Error finding comment", "bad", 3000);
        }
    })
}

function displayNewCommentBox() {
    $("#pop_up_background").css("display", "inline-block");
    $("#add_new_comment_container").css("display", "inline-block");
}

function hideNewCommentBox() {
    $("#pop_up_background").css("display", "none");
    $("#add_new_comment_container").css("display", "none");
    $("#add_new_comment_error_message").html("");
    $("#add_new_comment_input").val("");
}
 
function setDeleteButtonClickHandlers() {
    $(".delete_comment_button").click(function() {
        let comment_id = $(this).attr("id").split("delete_comment_button_")[1];
        deleteChatComment(comment_id);
    })
}

function setHighlightButtonClickHandlers() {
    $(".highlight_comment_button").click(function() {
        let comment_id = $(this).attr("id").split("highlight_comment_button_")[1];
        let highlight = $("#highlight_comment_button_" + comment_id + "_text").html() === "HIGHLIGHT";
        highlightComment(comment_id, highlight);
    })
}

function highlightComment(comment_id, highlight) {
    let highlight_info = {
        course_id: course._id,
        page_id: current_page._id,
        video_link_id: current_video._id,
        message_tab: current_tab,
        comment_id: comment_id,
        highlight: highlight
    }

    let highlight_data = {
        info: JSON.stringify(highlight_info)
    }

    $.post('/highlight_or_unhighlight_comment', highlight_data, function(res) {
        if (res.errors.length > 0) {
            setAlert(res.errors[res.errors.length - 1].error_message, "bad", 3000);
        }
        else {
            let highlight_text = "";

            if (!highlight) {
                highlight_text = "un";
            }

            let message_obj = getMessageFromID(comment_id);
            message_obj.comment.highlighted_by_staff = highlight;
            addAllChatMessages();
            setAlert("Comment " + highlight_text + "highlighted", "good", 3000);

            $.post('/add_highlighted_comment_notification', highlight_data, function(res) {
                if (res.errors.length > 0) {
                    console.log(res.errors);
                }
                else {
                    console.log("no errors while adding notification");
                }
            })
        }
    })
}

function setReplyButtonClickHandlers() {
    $(".reply_button").click(function() {
        if (student_view) {
            setAlert("You cannot reply to a comment in student view", "bad", 3000);
            return;
        }
        
        if (current_user !== undefined) {
            let recipient_comment_id = $(this).attr("id").split("reply_button_")[1];
            let recipient_comment_obj = getMessageFromID(recipient_comment_id);

            if (recipient_comment_obj === null) {
                setAlert("Error finding comment", "bad", 3000);
                return;
            }
            
            comment_being_replied_to = recipient_comment_obj.comment;
            let username = "(Username Not Found)";
            let avatar_path = "/images/default_avatar.jpg";
            let original_message_recipient_username = "";
            let recipient_found = false;

            for (let i = 0; i < all_users.length; i++) {
                if (all_users[i]._id === comment_being_replied_to.author_id) {
                    username = all_users[i].username;
                    avatar_path = all_users[i].avatar_path;
                    recipient_found = true;
                }

                if (recipient_comment_obj.is_reply) {
                    if (all_users[i]._id === comment_being_replied_to.author_being_replied_to) {
                        original_message_recipient_username = "@" + all_users[i].username;
                    }
                }

                if (recipient_found) {
                    break;
                }
            }

            let recipient_html = "<div class='avatar_wrapper'><a href='/user/" + comment_being_replied_to.author_id + "'><img class='avatar' src='" +
            avatar_path + "'></a></div>" +
            "<div class='message'><div class='message_top_line_wrapper'>" +
            "<p class='message_top_line'><a class='username_link' href='/user/" + comment_being_replied_to.author_id + "'><b>@" + username + "</b></a>" +
            " &middot; <span class='message_posting_time'>" + getLengthOfTime(comment_being_replied_to.posting_time) + "</span></p>" +
            "</div><div class='message_bubble'><p class='message_text'><b>" + original_message_recipient_username + "</b> " + comment_being_replied_to.text + "</p></div></div>";

            $("#add_new_reply_recipient_container").html(recipient_html);
            displayNewReplyBox();
            $("#add_new_reply_input").focus();
            $("#video_lecture")[0].pause();
        }
    })
}

function displayNewReplyBox() {
    $("#pop_up_background").css("display", "inline-block");
    $("#add_new_reply_container").css("display", "inline-block");
    $("#add_new_reply_error_message").html("");
    $("#add_new_reply_error_message").css("display", "none");
}

function hideNewReplyBox() {
    $("#pop_up_background").css("display", "none");
    $("#add_new_reply_container").css("display", "none");
    $("#add_new_reply_error_message").html("");
    $("#add_new_reply_error_message").css("display", "none");
    $("#add_new_reply_input").val("");
}

function noChatMessages() {
    let no_messages_html = "";
    if (current_tab === "questions") {
        no_messages_html = "<p id='no_chat_messages_message'>No questions yet!</p>";
    }
    else if (current_tab === "feedback") {
        no_messages_html = "<p id='no_chat_messages_message'>No feedback yet!</p>";
    }

    $("#chatbox_messages").append(no_messages_html);
}

/**
 * Add a chat message to chatbox
 * @param {*} comment Chat message to be added
 */
function insertChatMessage(comment) {
    // Check if the comment author is a staff member
    let commenter_is_staff = false;
    for (let i = 0; i < course.staff.length; i++) {
        if (course.staff[i]._id === comment.author_id) {
            commenter_is_staff = true;
        }
    }

    // Set staff member comment and highlighted comment flairs
    let staff_member_flair_html = "";
    let highlighted_comment_flair_html = "";

    if (commenter_is_staff) {
        staff_member_flair_html = "<p class='flair staff_member_flair'>Staff Member</p>";
    }
    else if (comment.highlighted_by_staff) {
        highlighted_comment_flair_html = "<p class='flair highlighted_comment_flair'>Highlighted By Staff</p>";
    }

    // Set the Edit, Delete, and Highlight buttons
    let edit_delete_html = "";
    if (current_user !== undefined) {
        if ((is_teacher || is_admin) && !student_view && !commenter_is_staff && comment.author_id !== current_user._id) {
            let highlighted_text = "HIGHLIGHT";

            if (comment.highlighted_by_staff) {
                highlighted_text = "UNHIGHLIGHT";
            }

            edit_delete_html = 
            "<button class='highlight_comment_button' id='highlight_comment_button_" + comment._id + "'>" +
                "<b id='highlight_comment_button_" + comment._id + "_text'>" + highlighted_text + "</b>" + 
            "</button>";
        }

        if (comment.author_id === current_user._id && !student_view) {
            edit_delete_html +=
            "<button class='edit_comment_button' id='edit_comment_button_" + comment._id + "'>" +
                "<b>EDIT</b>" +
            "</button>" +

            "<button class='delete_comment_button' id='delete_comment_button_" + comment._id + "'>" + 
                "<b>DELETE</b>" + 
            "</button>";
        }
        else {
            let watch_text = "WATCH";

            if (comment.users_watching_this_comment.includes(current_user._id) && !student_view) {
                watch_text = "UNWATCH";
            }
                
            edit_delete_html +=
            "<button class='watch_comment_button' id='watch_comment_button_" + comment._id + "'>" + 
                "<b>" + watch_text + "</b>" + 
            "</button>";
        }
    }

    // Get usernames and avatar images
    let username = "(Username Not Found)";
    let author_being_replied_to = "(Username Not Found)";
    let avatar_path = "/images/default_avatar.jpg";

    for (let i = 0; i < all_users.length; i++) {
        if (all_users[i]._id === comment.author_id) {
            username = all_users[i].username;
            avatar_path = all_users[i].avatar_path;
        }

        if (all_users[i]._id === comment.author_being_replied_to) {
            author_being_replied_to = all_users[i].username;
        }
    }

    // Set comment's upvote/downvote images
    let upvote_img = "/images/upvote_neutral.png";
    let downvote_img = "/images/downvote_neutral.png";
    if (comment.upvotes.includes(current_user._id) && !student_view) {
        upvote_img = "/images/upvote.png";
    }
    else if (comment.downvotes.includes(current_user._id) && !student_view) {
        downvote_img = "/images/downvote.png";
    }

    // Set Show Replies Button HTML
    let show_replies_html = "";
    let replies_count = 0;
    if (comment.hasOwnProperty("replies")) {
        replies_count = comment.replies.length;

        if (replies_count > 0) {
            show_replies_html =
            "<button class='show_replies_button' id='show_replies_btn_" + comment._id + "'>" +
                "<b id='show_replies_text_" + comment._id + "'>" + getShowRepliesText(comment._id) + "</b>" +
            "</button>";
        }
    }

    // Create comment HTML
    var chatbox_message = 
    "<div id='message_and_replies_wrapper_" + comment._id + "' class='message_and_replies_wrapper not_reached'>" +
        "<div id='message_wrapper_" + comment._id + "' class='message_wrapper'>" +
            "<div class='avatar_wrapper'>" +
                "<a href='/user/" + comment.author_id + "'>" +
                    "<img class='avatar' src='" + avatar_path + "'>" +
                "</a>" +
            "</div>" +

            "<div class='message' id='message_" + comment._id + "'>" +
                "<div class='message_top_line_wrapper'>" +
                    "<p class='message_top_line_left'>" +
                        "<a class='username_link' href='/user/" + comment.author_id + "'>" +
                            "<b>@" + username + "</b>" +
                        "</a>" + 
                        " &middot; " +
                        "<span class='message_posting_time'>" +
                            getLengthOfTime(comment.posting_time) +
                        "</span>" +
                    "</p>" +

                    "<p class='message_top_line_right'>" +
                        "<span class='message_timestamp'>" + 
                            convertMessageTimestamp(comment.timestamp) + 
                        "</span>" +
                    "</p>" +
                "</div>";

    // Add Comment Flairs
    if (commenter_is_staff || comment.highlighted_by_staff) {
        chatbox_message +=
            "<div class='comment_flairs'>" +
                staff_member_flair_html +
                highlighted_comment_flair_html +
            "</div>";
    }

    chatbox_message +=
                "<div class='message_bubble'>" +
                    "<p class='message_text'>" + comment.text + "</p>" +
                "</div>" +
                "<div class='message_bottom_line_wrapper'>" +
                    "<p class='message_bottom_line_left'>" +
                        "<span id='upvote_button_" + comment._id + "' class='vote_button_wrapper upvote_button'>" +
                            "<img class='vote_button_image' src='" + upvote_img + "'>" +
                        "</span>" +
                        "<span class='vote_count'>" +
                            calculateVoteCount(comment) +
                        "</span>" +
                        "<span id='downvote_button_" + comment._id + "' class='vote_button_wrapper downvote_button'>" +
                            "<img class='vote_button_image' src='" + downvote_img + "'>" +
                        "</span>" +
                        edit_delete_html + 
                    "</p>" +

                    "<p class='message_bottom_line_right'>" +
                        "<button id='reply_button_" + comment._id + "' class='reply_button'>" +
                            "<b>REPLY</b>" +
                        "</button>" +
                    "</p>" +
                "</div>" +
                show_replies_html + 
            "</div>" +
        "</div>" +
        "<div class='replies_and_filler' id='replies_and_filler_" + comment._id + "'>" +
            "<div class='replies_filler'>" +
            "</div>" +
            "<div class='replies_wrapper'>";
    
    if (replies_count > 0) {
        comment.replies.forEach(function(reply, i) {
            // Check if commenter is a staff member
            let replier_is_staff = false;
            for (let i = 0; i < course.staff.length; i++) {
                if (course.staff[i]._id === reply.author_id) {
                    replier_is_staff = true;
                }
            }

            // Set staff member comment and highlighted comment flairs
            let staff_member_flair_html = "";
            let highlighted_comment_flair_html = "";

            if (replier_is_staff) {
                staff_member_flair_html = "<p class='flair staff_member_flair'>Staff Member</p>";
            }
            else if (reply.highlighted_by_staff) {
                highlighted_comment_flair_html = "<p class='flair highlighted_comment_flair'>Highlighted By Staff</p>";
            }

            let username = "(Username Not Found)";
            let avatar_path = "/images/default_avatar.jpg";
            let replying_to_username = "";

            for (let i = 0; i < all_users.length; i++) {
                if (all_users[i]._id === reply.author_id) {
                    username = all_users[i].username;
                    avatar_path = all_users[i].avatar_path;
                }

                if (all_users[i]._id === reply.author_being_replied_to) {
                    replying_to_username =
                    "<a class='username_link' href='/user/" + all_users[i]._id + "'>" +
                        "@" + all_users[i].username + 
                    "</a>";
                }
            }

            let upvote_img = "/images/upvote_neutral.png";
            let downvote_img = "/images/downvote_neutral.png";

            if (current_user !== undefined && reply.upvotes.includes(current_user._id) && !student_view) {
                upvote_img = "/images/upvote.png";
            }
            else if (current_user !== undefined && reply.downvotes.includes(current_user._id) && !student_view) {
                downvote_img = "/images/downvote.png";
            }

            let edit_delete_html = "";

            if (current_user !== undefined) {
                if ((is_teacher || is_admin) && !student_view) {
                    let highlighted_text = "HIGHLIGHT";

                    if (reply.highlighted_by_staff) {
                        highlighted_text = "UNHIGHLIGHT";
                    }

                    edit_delete_html = 
                    "<button class='highlight_comment_button' id='highlight_comment_button_" + reply._id + "'>" +
                        "<b id='highlight_comment_button_" + reply._id + "_text'>" +
                            highlighted_text +
                        "</b>" +
                    "</button>";
                }
                
                if (reply.author_id === current_user._id && !student_view) {
                    edit_delete_html +=
                    "<button class='edit_comment_button' id='edit_comment_button_" + reply._id + "'>" +
                        "<b>EDIT</b>" +
                    "</button>" +
                    "<button class='delete_comment_button' id='delete_comment_button_" + reply._id + "'>" +
                        "<b>DELETE</b>" +
                    "</button>";
                }
            }

            let separator_html = "";

            if (i !== replies_count - 1) {
                separator_html = "<div class='message_separator'></div>";
            }

            chatbox_message +=
            "<div class='reply_wrapper' id='reply_wrapper_" + reply._id + "'>" +
                "<div class='avatar_wrapper'>" +
                    "<a href='/user/" + reply.author_id + "'>" +
                        "<img class='avatar' src='" + avatar_path + "'>" +
                    "</a>" +
                "</div>" +
                "<div class='message'>" +
                    "<div class='message_top_line_wrapper'>" +
                        "<p class='message_top_line'>" + 
                            "<a class='username_link' href='/user/" + reply.author_id + "'>" +
                                "<b>@" + username + "</b>" +
                            "</a> " +
                            "&middot;" +
                            "<span class='posting_time'>" +
                                getLengthOfTime(reply.posting_time) + 
                            "</span>" +
                        "</p>" +
                    "</div>";

            // Add Comment Flairs
            if (replier_is_staff || reply.highlighted_by_staff) {
                chatbox_message +=
                    "<div class='comment_flairs'>" +
                        staff_member_flair_html +
                        highlighted_comment_flair_html +
                    "</div>";
            }

            chatbox_message +=
                    "<div class='message_bubble'>" +
                        "<p class='message_text'>" +
                            "<b>" + replying_to_username + "</b> " + 
                            reply.text + 
                        "</p>" +
                    "</div>" +
                    "<div class='message_bottom_line_wrapper'>" +
                        "<p class=''>" +
                            "<span id='upvote_button_" + reply._id + "' class='vote_button_wrapper upvote_button'>" +
                                "<img class='vote_button_image' src='" + upvote_img + "'>" +
                            "</span>" +
                            "<span class='vote_count'>" +
                                calculateVoteCount(reply) +
                            "</span>" +
                            "<span id='downvote_button_" + reply._id + "' class='vote_button_wrapper downvote_button'>" +
                                "<img class='vote_button_image' src='" + downvote_img + "'>" +
                            "</span>" +
                            edit_delete_html +
                            "<button id='reply_button_" + reply._id + "' class='reply_button'>" +
                                "<b>REPLY</b>" +
                            "</button>" +
                        "</p>" +
                    "</div>" +
                "</div>" +
            "</div>" + separator_html;
        })
    }

    chatbox_message += 
            "</div>" + 
        "</div>" +
        "<div class='message_separator'>" +
        "</div>" + 
    "</div>";

    $("#chatbox_messages").append(chatbox_message);

    if (replies_count > 0) {
        makeShowRepliesButtonClickable(comment._id);
    }

    if (checkIfRepliesAreDisplayed(comment._id)) {
        $("#replies_and_filler_" + comment._id).css("display", "flex");
    }
    else {
        $("#replies_and_filler_" + comment._id).css("display", "none");
    }
}

function calculateVoteCount(message) {
    return message.upvotes.length - message.downvotes.length;
}

function makeVoteButtonsClickable() {
    $(".upvote_button").click(function() {
        let comment_id = ($(this).attr("id")).split("upvote_button_")[1];
        updateVote(comment_id, "upvote");
    })

    $(".downvote_button").click(function() {
        let comment_id = ($(this).attr("id")).split("downvote_button_")[1];
        updateVote(comment_id, "downvote");
    })
}

function updateVote(comment_id, vote_type) {
    if (student_view) {
        setAlert("You cannot update a comment's vote in student view", "bad", 3000);
        return;
    }

    let local_comment = undefined;

    for (let comment_i = 0; comment_i < current_video[current_tab].length; comment_i++) {
        if (current_video[current_tab][comment_i]._id === comment_id) {
            local_comment = current_video[current_tab][comment_i];
            break;
        }
        else {
            for (let reply_i = 0; reply_i < current_video[current_tab][comment_i].replies.length; reply_i++) {
                if (current_video[current_tab][comment_i].replies[reply_i]._id === comment_id) {
                    local_comment = current_video[current_tab][comment_i].replies[reply_i];
                    break;
                }
            }
        }
    }

    let data = {
        course_id: course._id,
        page_id: current_page._id,
        video_link_id: current_video._id,
        message_tab: current_tab,
        comment_id: comment_id,
        local_comment: JSON.stringify(local_comment),
        vote_type: vote_type
    }

    console.log(data);

    $.post("/update_comment_vote", data, function(res) {
        if (res.errors.length > 0) {
            setAlert(res.errors[res.errors.length - 1].error_message, "bad", 3000);
        }
        else {
            if (vote_type === "upvote") {
                if (local_comment.upvotes.includes(current_user._id)) {
                    local_comment.upvotes.splice(local_comment.upvotes.indexOf(current_user._id), 1);
                }
                else {
                    local_comment.upvotes.push(current_user._id);
                }

                if (local_comment.downvotes.includes(current_user._id)) {
                    local_comment.downvotes.splice(local_comment.downvotes.indexOf(current_user._id), 1);
                }
            }
            else if (vote_type === "downvote") {
                if (local_comment.downvotes.includes(current_user._id)) {
                    local_comment.downvotes.splice(local_comment.downvotes.indexOf(current_user._id), 1);
                }
                else {
                    local_comment.downvotes.push(current_user._id);
                }

                if (local_comment.upvotes.includes(current_user._id)) {
                    local_comment.upvotes.splice(local_comment.upvotes.indexOf(current_user._id), 1);
                }
            }

            addAllChatMessages();
        }
    })
}

function getShowRepliesText(id) {
    let message_obj = getMessageFromID(id);
    let message = {};

    if (message_obj === null || message_obj.comment.replies.length === 0) {
        return "";
    }
    else {
        message = message_obj.comment;
    }

    let first_word = "SHOW";
    let end_word = "REPLY";

    if (message.replies_displayed) {
        first_word = "HIDE";
    }

    if (message.replies.length > 1) {
        end_word = "REPLIES";
    }

    return first_word + " " + message.replies.length + " " + end_word;
}

var replies_currently_displayed = [];

function checkIfRepliesAreDisplayed(id) {
    return replies_currently_displayed.includes(id);
}

function makeShowRepliesButtonClickable(id) {
    $("#show_replies_btn_" + id).click(function() {
        toggleReplies(id);
    })
}

function toggleReplies(id) {
    let message_obj = getMessageFromID(id);
    let message = {};

    if (message_obj !== null) {
        message = message_obj.comment;
    }
    else {
        return
    }

    var replies_display = "flex";

    if ($("#replies_and_filler_" + id).css("display") == "flex") {
        message.replies_displayed = false;
        replies_display = "none";

        if (replies_currently_displayed.includes(id)) {
            replies_currently_displayed.splice(replies_currently_displayed.indexOf(id), 1);
        }
    }
    else {
        message.replies_displayed = true;
        replies_currently_displayed.push(id);
    }
    
    $("#show_replies_text_" + id).html(getShowRepliesText(id));
    $("#replies_and_filler_" + id).css("display", replies_display);
}

function setVideoWindowCloseButton() {
    $("#close_video_window_button").unbind("click");
    $("#close_video_window_button").click(function() {
        current_video = null;
        $("#video_lecture")[0].pause();
        $("#video_window_wrapper").css("display", "none");
    })
}

function getMessageFromID(id) {
    let comment_array = [];

    if (current_tab === "questions") {
        comment_array = current_video.questions;
    }
    else if (current_tab === "feedback") {
        comment_array = current_video.feedback;
    }

    for (let i = 0; i < comment_array.length; i++) {
        if (comment_array[i]._id == id) {
            return {
                comment: comment_array[i], 
                is_comment: true,
                is_reply: false
            }
        }
        else {
            for (let ii = 0; ii < comment_array[i].replies.length; ii++) {
                if (comment_array[i].replies[ii]._id == id) {
                    return {
                        comment: comment_array[i].replies[ii],
                        is_comment: false,
                        is_reply: true,
                        recipient: comment_array[i] // notf_edit, "recipient" is original comment object
                    }
                }
            }
        }
    }

    return null;
}

/**
 * Method for setting chat message display type based on current playtime
 */
function setMessageDisplayType() {
    if (current_video === null) {
        return;
    }

    var currentTime = $("#video_lecture")[0].currentTime;   // Get current playtime
    let comment_array = []

    if (current_tab === "questions") {
        comment_array = current_video.questions;
    }
    else if (current_tab === "feedback") {
        comment_array = current_video.feedback;
    }

    // Check if display type should be changed for each message, make change
    comment_array.forEach(function(message) {
        var change = false;
        var message_add_class = "reached";
        var message_remove_class = "not_reached";

        // If the message hasn't been reached yet but has been marked as "reached"
        if (message.timestamp > currentTime && $("#message_and_replies_wrapper_" + message._id).hasClass("reached")) {
            change = true;
            message_remove_class = "reached";
            message_add_class = "not_reached";
        }
        // If the message has been reached but has been marked as "not reached"
        else if (message.timestamp <= currentTime && $("#message_and_replies_wrapper_" + message._id).hasClass("not_reached")) {
            change = true;
        }

        // If the message's display type is to change
        if (change) {
            // Change message's display type
            $("#message_and_replies_wrapper_" + message._id).addClass(message_add_class);
            $("#message_and_replies_wrapper_" + message._id).removeClass(message_remove_class);
        }
    });
}

/**
 * Sort chat messages chronologically
 * @param {*} a First message to be compared
 * @param {*} b Second message to be compared
 * @returns Indication of array position change
 */
function sortMessages( a, b ) {
    if ( a.timestamp < b.timestamp ){
      return -1;
    }
    if ( a.timestamp > b.timestamp ){
      return 1;
    }
    return 0;
  }

  /**
   * Method for converting chat message timestamp to h:m:s
   * @param {} time Timestamp in seconds
   * @returns Converted timestamp
   */
  function convertMessageTimestamp(time) {
      let totalSecs = Math.floor(time);
      let hrs = Math.floor(totalSecs / 3600);
      let mins = Math.floor((totalSecs - (hrs * 3600)) / 60);
      let secs = (totalSecs - (hrs * 3600) - (mins * 60));

      if (mins < 10) {
          mins = "0" + mins;
      }

      if (secs < 10) {
          secs = "0" + secs;
      }

      let convertedTime = mins + ":" + secs;

      if (hrs > 0) {
          if (hrs < 10) {
              hrs = "0" + hrs;
          }
          convertedTime = hrs + ":" + convertedTime;
      }
    
      return convertedTime;
  }