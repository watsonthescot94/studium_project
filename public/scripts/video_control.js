// Need:
// If in teacher mode, can delete comments
// Note if comment has been edited
// "Teacher" message indicator
var video = {}
var course_id = "";
var chat_users_details = []
var current_tab = "questions";
var replying_to = {}
var current_user = {}
var editing_message = false;
var message_being_edited = {}
let teachers = []
let moderators = []
 
/**
 * Function that executes when DOM finishes loading
 */
$(function() {
    $("#video_lecture")[0].onplay = function() {

    }
    let no_messages_html = "<p id='no_chat_messages_message'>Fetching comments...</p>"
    $("#chatbox_messages").append(no_messages_html);

    getTeachersAndModerators();

    $("#video_lecture")[0].ontimeupdate = setMessageDisplayType; // On video playtime change, set message display types

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
                $("#add_new_comment_title").html("ASK A QUESTION");
                $("#add_new_comment_input").attr("placeholder", "Ask a question...");
            }
            else {
                $("#add_new_comment_title").html("PROVIDE FEEDBACK");
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
        editing_message = false;
        hideNewCommentBox();
    })

    $("#add_new_reply_cancel_button").click(function() {
        hideNewReplyBox();
    })

    $("#add_new_reply_submit_button").click(function() {
        let input = $("#add_new_reply_input").val().trim();
        if (input.length > 0 && !$.isEmptyObject(current_user) && !$.isEmptyObject(replying_to)) {
            $("#add_new_reply_error_message").html("");

            var reply = {
                "author_id": current_user._id,
                "replying_to": replying_to.author_id,
                "text": input,
                "posting_time": Date.now(),
                "highlighted": false,
                "vote_count": 0,
                "upvotes": [],
                "downvotes": []
            }

            let comment_id = replying_to._id;
            let message_obj = getMessageFromID(comment_id);
            if (message_obj.is_reply) {
                comment_id = message_obj.recipient._id;
            }

            addNewReply(comment_id, reply);
        }
        else if (input.length === 0) {
            $("#add_new_reply_error_message").html("<p style='color: red'>Reply cannot be blank</p>");
        }
        else {
            $("#add_new_reply_error_message").html("<p style='color: red'>Something went wrong.</p>");
        }
    })

    $("#add_new_comment_submit_button").click(function() {
        let input = $("#add_new_comment_input").val().trim();
        if (input.length > 0) {
            $("#add_new_comment_error_message").html("");
            
            if (!editing_message) {
                var new_message = {
                    "author_id": current_user._id,
                    "text": input,
                    "timestamp": Math.floor($("#video_lecture")[0].currentTime),
                    "posting_time": Date.now(),
                    "highlighted": false,
                    "vote_count": 0,
                    "replies": [],
                    "upvotes": [],
                    "downvotes": [],
                    "notify": [
                        current_user._id
                    ]
                }
    
                addNewChatMessage(new_message);
            }
            else {
                let message_obj = getMessageFromID(message_being_edited._id);
                if (message_obj.is_reply) {
                    updateReplyText(message_obj.recipient._id, message_being_edited._id, input);
                }
                else {
                    updateCommentText(message_being_edited._id, input);
                }
            }
        }
        else {
            $("#add_new_comment_error_message").html("<p style='color: red'>Comment cannot be blank</p>");
        }
    })

    $("#add_notification_button").click(function() {
        let message_obj = getMessageFromID("62f04382d9fa41e79dc2266f");
        if (message_obj !== null && message_obj.recipient._id !== undefined) {
            addReplyNotification(message_obj);
        }
        else {
            console.log("Reply not found when attempting to notify users of reply");
        }
    })

    //$("#chatbox_container").height($("#video_lecture").height());
})

function getCurrentUser() {
    $.post("/get_current_user", function(user) {
        if (!user) {
            console.log("User not logged in");
        }
        else {
            current_user = user;
            chat_users_details.push(current_user);
            setReceiveNotificationsCheckbox();
        }

        addAllChatMessages()
    })
}

function setReceiveNotificationsCheckbox() {
    if (current_user.enrolled_in.includes(course_id)) {
        let checkbox_html = '<input type="checkbox" id="receive_question_notifications_checkbox">' +
        '<label for="receive_question_notifications_checkbox">Receive a notification when a new Question is asked</label>';

        $("#receive_question_notifications_checkbox_container").html(checkbox_html);

        if (video.students_not_receiving_question_notifications) {
            if (!video.students_not_receiving_question_notifications.includes(current_user._id)) {
                $("#receive_question_notifications_checkbox").prop("checked", true);
            }
        }

        $("#receive_question_notifications_checkbox").change(function() {
            // If the user isn't logged in, display alert message
            if (Object.keys(current_user).length === 0) {
                setAlert("You must be logged in to update your notification preferences", "bad", 3000);
                return;
            }
    
            let opting_out = !$("#receive_question_notifications_checkbox").prop("checked");
            updateUserQuestionNotificationPreferences(opting_out);
        })
    }
}

function updateUserQuestionNotificationPreferences(opting_out) {
    let data = {
        video_id: video._id,
        opting_out: opting_out
    }

    console.log(data);

    $.post('/update_user_question_notification_preferences', data, function(res) {
        if (!res.logged_in) {
            setAlert("You are not logged in", "bad", 3000);
        }
        else if (res.error || !res.video_found) {
            setAlert("Error updating your notification preferences", "bad", 3000);
        }
        else {
            setAlert("Your notification preferences have been updated", "good", 3000);
        }
    })
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

function getTeachersAndModerators() {
    let url = window.location.href;
    let course_and_video_ids = url.split("course/")[1];
    course_id = course_and_video_ids.split("/video/")[0];
    let data = {
        course_id: course_id
    }

    $.post('/get_moderators', data, function(result) {
        if (result.error) {
            console.log("Error retrieving teachers and moderators");
        }
        else if (!result.course_found) {
            console.log("Course not found");
        }
        else {
            teachers = result.teachers;
            moderators = result.moderators;
        }

        getVideo();
    })
}

function getVideo() {
    let url = window.location.href;
    let video_id = url.split("video/")[1].split("?")[0];
    let data = {
        video_id: video_id
    }

    $.post('/get_video', data, function(result) {
        if (result.error) {
            $("#error_message").val("<p>Sorry, error retrieving video</p>");
            $("#error_title").val("Error | Studium");
            $("#error_redirect_form").submit();
        }
        else if (!result.video_found) {
            $("#error_message").val("<p>Video not found</p>");
            $("#error_title").val("Video Not Found | Studium");
            $("#error_redirect_form").submit();
        }
        else {
            video = result.video;
            chat_users_details = result.user_details;
            document.title = video.title + " | Studium";
            $("#video_title").html(video.title);
            $("#video_description").html(video.description);
            getCurrentUser();
        }
    })
}

function initialiseCommentVoteStatuses() {
    let comment_array = []

    if (current_tab === "questions") {
        comment_array = video.questions;
    }
    else if (current_tab === "feedback") {
        comment_array = video.feedback;
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
function addNewChatMessage(message) {
    $.get('/generate_id', function(new_id) {
        message._id = new_id;

        let query = {
            _id: video._id
        }

        let update = {
            $push: {}
        }

        update.$push[current_tab] = message;
        let comment_array = []
    
        if (current_tab === "questions") {
            comment_array = video.questions;
        }
        else if (current_tab === "feedback") {
            comment_array = video.feedback;
        }
    
        let options = {
            new: true
        }
    
        let data = {
            query: JSON.stringify(query),
            update: JSON.stringify(update),
            options: JSON.stringify(options)
        }

        $.post('/update_video_chat', data, function(res) {
            if (!res.error) {
                setAlert("Comment posted", "good", 3000);
                comment_array.push(message);    // Add new message to chat messages object
                addAllChatMessages();   // Add all chat messages to chatbox
                hideNewCommentBox();

                if (current_tab === "questions") {
                    addNewQuestionNotifications();
                }
            }
            else {
                setAlert("Error posting comment", "bad", 3000);
            }
        })
    })
}

function addNewReply(comment_id, reply) {
    $.get('/generate_id', function(new_id) {
        reply._id = new_id;

        let query = {
            _id: video._id
        }

        let update = {
            $push: {}
        }

        query[current_tab + "._id"] = comment_id;
        update.$push[current_tab + ".$.replies"] = reply;

        let options = {
            new: true
        }

        let data = {
            query: JSON.stringify(query),
            update: JSON.stringify(update),
            options: JSON.stringify(options)
        }

        $.post('/update_video_chat', data, function(res) {
            if (!res.error) {
                setAlert("Reply posted", "good", 3000);
                hideNewReplyBox();
                $("#add_new_reply_input").val("");
                let message_obj = getMessageFromID(comment_id);

                if (message_obj !== null) {
                    message_obj.comment.replies.push(reply);
                }

                addAllChatMessages();

                let reply_obj = getMessageFromID(reply._id);

                if (reply_obj !== null) {
                    addReplyNotification(reply_obj);
                }
            }
            else {
                setAlert("Error posting reply", "bad", 3000);
            }
        })
    })
}

function deleteReply(orig_comment_id, reply_id) {
    let query = {
        _id: video._id
    }

    let update = {
        $pull: {}
    }

    let options = {
        new: true
    }

    query[current_tab + "._id"] = orig_comment_id;
    update.$pull[current_tab + ".$.replies"] = {
        _id: reply_id
    }

    let comment_array = []

    if (current_tab === "questions") {
        comment_array = video.questions;
    }
    else if (current_tab === "feedback") {
        comment_array = video.feedback;
    }

    let data = {
        query: JSON.stringify(query),
        update: JSON.stringify(update),
        options: JSON.stringify(options)
    }

    $.post('/update_video_chat', data, function(res) {
        if (!res.error) {
            setAlert("Reply deleted", "good", 3000);
            let comment_index = getMessageIndex(comment_array, orig_comment_id);
            let reply_index = getMessageIndex(comment_array[comment_index].replies, reply_id);
            comment_array[comment_index].replies.splice(reply_index, 1);
            addAllChatMessages();
        }
        else {
            setAlert("Error deleting reply", "bad", 3000);
        }
    })
}

function getMessageIndex(array, id) {
    for (let i = 0; i < array.length; i++) {
        if (array[i]._id == id) {
            return i;
        }
    }

    return -1;
}

function updateCommentText(id, new_text) {
    let query = {
        _id: video._id
    }

    let update = {
        $set: {}
    }

    let options = {
        new: true
    }

    query[current_tab + "._id"] = id;
    update.$set[current_tab + ".$.text"] = new_text;

    let data = {
        query: JSON.stringify(query),
        update: JSON.stringify(update),
        options: JSON.stringify(options)
    }

    $.post('/update_video_chat', data, function(res) {
        if (!res.error) {
            setAlert("Comment text updated", "good", 3000);
            editing_message = false;
            let message_obj = getMessageFromID(id);

            if (message_obj !== null) {
                message_obj.comment.text = new_text;
            }

            addAllChatMessages();
            hideNewCommentBox();
        }
        else {
            setAlert("Error updating comment text", "bad", 3000);
        }
    })
}

function updateReplyText(comment_id, reply_id, new_text) {
    let query = {
        _id: video._id
    }

    let update = {
        $set: {}
    }

    update.$set[current_tab + ".$[comment].replies.$[reply].text"] = new_text;

    let options = {
        arrayFilters: [
            {
                "comment._id": comment_id
            },
            {
                "reply._id": reply_id
            }
        ],
        new: true
    }

    let data = {
        query: JSON.stringify(query),
        update: JSON.stringify(update),
        options: JSON.stringify(options)
    }

    $.post('/update_video_chat', data, function(res) {
        if (!res.error) {
            editing_message = false;
            setAlert("Reply text updated", "good", 3000);
            let message_obj = getMessageFromID(reply_id);

            if (message_obj !== null) {
                message_obj.comment.text = new_text;
            }

            addAllChatMessages();
            hideNewCommentBox();
        }
        else {
            setAlert("Error updating reply text", "bad", 3000);
        }
    })
}

function deleteChatMessage(id) {
    let query = {
        _id: video._id
    }

    let update = {
        $pull: {}
    }

    update.$pull[current_tab] = {
        _id: id
    }

    let comment_array = []

    if (current_tab === "questions") {
        comment_array = video.questions;
    }
    else if (current_tab === "feedback") {
        comment_array = video.feedback;
    }

    let options = {
        new: true
    }

    let data = {
        query: JSON.stringify(query),
        update: JSON.stringify(update),
        options: JSON.stringify(options)
    }

    $.post('/update_video_chat', data, function(res) {
        if (!res.error) {
            setAlert("Comment deleted", "good", 3000);
            let comment_index = getMessageIndex(comment_array, id);
            comment_array.splice(comment_index, 1);
            addAllChatMessages();
        }
        else {
            setAlert("Error deleting comment", "bad", 3000);
        }
    })
}

/**
 * Method for sorting chat messages in chronological order
 */
function sortChatMessages() {
    if (current_tab === "questions") {
        video.questions.sort(sortMessages); // Sort chat messages chronologically
    }
    else if (current_tab === "feedback") {
        video.feedback.sort(sortMessages);
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
    let comment_array = []

    if (current_tab === "questions") {
        comment_array = video.questions;
    }
    else if (current_tab === "feedback") {
        comment_array = video.feedback;
    }

    clearChatBox();
    sortChatMessages();

    if (comment_array.length > 0) {
        comment_array.forEach(insertChatMessage);
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
        video_id: video._id,
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
        video_id: video._id,
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

function watchComment(message_obj, watch) {
    let query = {
        _id: video._id
    }

    query[current_tab + "._id"] = message_obj.comment._id;

    let update = {
    }

    if (watch) {
        update = {
            $addToSet: {}
        }
        update.$addToSet[current_tab + ".$.notify"] = current_user._id;
    }
    else {
        update = {
            $pull: {}
        }
        update.$pull[current_tab + ".$.notify"] = current_user._id;
    }

    let options = {
        new: true
    }

    let data = {
        query: JSON.stringify(query),
        update: JSON.stringify(update),
        options: JSON.stringify(options)
    }

    $.post('/update_video_chat', data, function(res) {
        if (!res.error) {
            let new_watch_text = "WATCH";
            let alert_message = "Comment unwatched";

            if (watch) {
                new_watch_text = "UNWATCH";
                alert_message = "Comment being watched";
            }

            $("#watch_comment_button_" + message_obj.comment._id).html("<b>" + new_watch_text + "</b>");
            setAlert(alert_message, "good", 3000);
        }
        else {
            let alert_message = "Error unwatching comment";

            if (watch) {
                alert_message = "Error watching comment";
            }

            setAlert(alert_message, "bad", 3000);
        }
    })
}

function setWatchButtonClickHandlers() {
    $(".watch_comment_button").click(function() {
        if ($.isEmptyObject(current_user)) {
            setAlert("You must be logged in to watch a comment", "bad", 5000);
            return;
        }

        let id = $(this).attr("id").split("watch_comment_button_")[1];
        let message_obj = getMessageFromID(id);

        if (message_obj !== null) {
            if ($(this).html() === "<b>WATCH</b>") {
                watchComment(message_obj, true);
            }
            else if ($(this).html() === "<b>UNWATCH</b>") {
                watchComment(message_obj, false);
            }
            else {
                setAlert("An error occurred", "bad", 3000);
            }
        }
        else {
            setAlert("An error occurred", "bad", 3000);
        }
    })
}

function setEditButtonClickHandlers() {
    $(".edit_comment_button").click(function() {
        editing_message = true;
        let id = $(this).attr("id").split("edit_comment_button_")[1];

        let message_obj = getMessageFromID(id);

        if (message_obj !== null) {
            message_being_edited = message_obj.comment;
            $("#add_new_comment_title").html("EDIT COMMENT");
            $("#add_new_comment_input").val(message_being_edited.text);
            $("#video_lecture")[0].pause();
            displayNewCommentBox();
            $("#add_new_comment_input").focus();
        }
        else {
            editing_message = false;
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
        let id = $(this).attr("id").split("delete_comment_button_")[1];
        let message_obj = getMessageFromID(id);

        if (message_obj !== null) {
            if (message_obj.is_reply) {
                deleteReply(message_obj.recipient._id, message_obj.comment._id);
            }
            else {
                deleteChatMessage(message_obj.comment._id);
            }
        }
        else {
            setAlert("Error finding comment", "bad", 3000);
        }
    })
}

function setHighlightButtonClickHandlers() {
    $(".highlight_comment_button").click(function() {
        let message_id = $(this).attr("id").split("highlight_comment_button_")[1];
        let message_obj = getMessageFromID(message_id);

        if (message_obj !== null) {
            let highlight = $("#highlight_comment_button_" + message_id + "_text").html() === "HIGHLIGHT";
            highlightComment(message_obj, highlight);
        }
        else {
            setAlert("Error finding comment", "bad", 3000);
        }
    })
}

function highlightComment(message_obj, highlight) {
    let query = {
        _id: video._id
    }

    let update = {
        $set: {}
    }

    let options = {
        new: true
    }

    if (message_obj.is_reply) {
        update.$set[current_tab + ".$[comment].replies.$[reply].highlighted"] = highlight;

        options["arrayFilters"] = [
            {
                "comment._id": message_obj.recipient._id
            },
            {
                "reply._id": message_obj.comment._id
            }
        ]
    }
    else {
        query[current_tab + "._id"] = message_obj.comment._id;
        update.$set[current_tab + ".$.highlighted"] = highlight;
    }

    let data = {
        query: JSON.stringify(query),
        update: JSON.stringify(update),
        options: JSON.stringify(options)
    }

    console.log(data);

    $.post('/update_video_chat', data, function(result) {
        let highlight_text = "";

        if (!highlight) {
            highlight_text = "un";
        }

        if (result.error) {
            setAlert("Error " + highlight_text + "highlighting comment", "bad", 3000);
        }
        else {
            message_obj.comment.highlighted = highlight;
            addAllChatMessages();
            setAlert("Comment " + highlight_text + "highlighted", "good", 3000);
        }
    })
}

function setReplyButtonClickHandlers() {
    $(".reply_button").click(function() {
        if (!$.isEmptyObject(current_user)) {
            let replying_to_message_id = $(this).attr("id").split("reply_button_")[1];
            let message_obj = getMessageFromID(replying_to_message_id);

            if (message_obj !== null) {
                replying_to = message_obj.comment;
            }
            else {
                setAlert("Error finding comment", "bad", 3000);
                return;
            }

            let username = "(Username Not Found)";
            let avatar_path = "/images/default_avatar.jpg";
            let orig_message_recipient_username = "";

            for (let i = 0; i < chat_users_details.length; i++) {
                if (chat_users_details[i]._id === replying_to.author_id) {
                    username = chat_users_details[i].username;
                    avatar_path = chat_users_details[i].avatar_path;
                }

                if (message_obj.is_reply) {
                    if (chat_users_details[i]._id === replying_to.replying_to) {
                        orig_message_recipient_username = "@" + chat_users_details[i].username;
                    }
                }
            }

            let recipient_html = "<div class='avatar_wrapper'><a href='/user/" + replying_to.author_id + "'><img class='avatar' src='" +
            avatar_path + "'></a></div>" +
            "<div class='message'><div class='message_top_line_wrapper'>" +
            "<p class='message_top_line'><a class='username_link' href='/user/" + replying_to.author_id + "'><b>@" + username + "</b></a>" +
            " &middot; <span class='message_posting_time'>" + getLengthOfTime(replying_to.posting_time) + "</span></p>" +
            "</div><div class='message_bubble'><p class='message_text'><b>" + orig_message_recipient_username + "</b> " + replying_to.text + "</p></div></div>";

            $("#add_new_reply_recipient_container").html(recipient_html);
            displayNewReplyBox();
            $("#add_new_reply_input").focus();
            $("#video_lecture")[0].pause();
        }
        else {
            setAlert("You must be logged in to reply", "bad", 4000);
        }
    })
}

function displayNewReplyBox() {
    $("#pop_up_background").css("display", "inline-block");
    $("#add_new_reply_container").css("display", "inline-block");
}

function hideNewReplyBox() {
    $("#pop_up_background").css("display", "none");
    $("#add_new_reply_container").css("display", "none");
    $("#add_new_reply_error_message").html("");
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
 * @param {*} message Chat message to be added
 */
function insertChatMessage(message) {
    // Add each chat message to chat window
    var show_replies_html = "";
    replies_count = 0;

    if (message.hasOwnProperty("replies")) {
        replies_count = message.replies.length;

        if (replies_count > 0) {
            show_replies_html = "<button class='show_replies_button' id='show_replies_btn_" + message._id + "'>" +
            "<b id='show_replies_text_" + message._id + "'>" + getShowRepliesText(message._id) + "</b></button>";
        }
    }

    let edit_delete_html = "";

    if (current_user.hasOwnProperty("_id")) {
        if (teachers.includes(current_user._id) || moderators.includes(current_user._id)) {
            let highlighted_text = "HIGHLIGHT";

            if (message.highlighted) {
                highlighted_text = "UNHIGHLIGHT";
            }

            edit_delete_html = 
            "<button class='highlight_comment_button' id='highlight_comment_button_" + message._id + "'>" +
                "<b id='highlight_comment_button_" + message._id + "_text'>" + highlighted_text + "</b>" + 
            "</button>";
        }

        if (message.author_id === current_user._id) {
            edit_delete_html += "<button class='edit_comment_button' id='edit_comment_button_" + message._id + "'>" +
                "<b>EDIT</b>" +
            "</button>" +
            "<button class='delete_comment_button' id='delete_comment_button_" + message._id + "'>" + 
                "<b>DELETE</b>" + 
            "</button>";
        }
        else {
            let watch_text = "WATCH";

            if (message.notify.includes(current_user._id)) {
                watch_text = "UNWATCH";
            }
                
            edit_delete_html += "<button class='watch_comment_button' id='watch_comment_button_" + message._id + "'>" + 
                "<b>" + watch_text + "</b>" + 
            "</button>";
        }
    }

    let username = "(Username Not Found)";
    let avatar_path = "/images/default_avatar.jpg";

    for (let i = 0; i < chat_users_details.length; i++) {
        if (chat_users_details[i]._id === message.author_id) {
            username = chat_users_details[i].username;
            avatar_path = chat_users_details[i].avatar_path;
            break;
        }
    }

    let upvote_img = "/images/upvote_neutral.png";
    let downvote_img = "/images/downvote_neutral.png";

    if (message.upvotes.includes(current_user._id)) {
        upvote_img = "/images/upvote.png";
    }
    else if (message.downvotes.includes(current_user._id)) {
        downvote_img = "/images/downvote.png";
    }

    let highlighted = "";
    let highlighted_text_html = "";

    if (message.highlighted) {
        highlighted = "highlighted";
        highlighted_text_html = 
        " <span class='tooltip unselectable'>&#9733;" +
            "<span class='tooltip_text'>Highlighted by teacher/moderator</span>" +
        "</span>";
    }

    var chatbox_message = 
    "<div id='message_and_replies_wrapper_" + message._id + "' class='message_and_replies_wrapper not_reached'>" +
        "<div class='message_wrapper " + highlighted + "'>" +
            "<div class='avatar_wrapper'>" +
                "<a href='/user/" + message.author_id + "'>" +
                    "<img class='avatar' src='" + avatar_path + "'>" +
                "</a>" +
            "</div>" +
            "<div class='message' id='message_" + message._id + "'>" +
                "<div class='message_top_line_wrapper'>" +
                    "<p class='message_top_line'>" + 
                        "<a class='username_link' href='/user/" + message.author_id + "'>" +
                            "<b>@" + username + "</b>" +
                        "</a>" + 
                        " &middot; " +
                        "<span class='message_posting_time'>" +
                            getLengthOfTime(message.posting_time) +
                        "</span>" +
                        highlighted_text_html +
                        "<span class='message_timestamp'>" + 
                            convertMessageTimestamp(message.timestamp) + 
                        "</span>" +
                    "</p>" +
                "</div>" +
                "<div class='message_bubble'>" +
                    "<p class='message_text'>" + message.text + "</p>" +
                "</div>" +
                "<div class='message_bottom_line'>" +
                    "<p>" +
                        "<div id='upvote_button_" + message._id + "' class='vote_button_wrapper upvote_button'>" +
                            "<img class='vote_button_image' src='" + upvote_img + "'>" +
                        "</div>" +
                        "<span class='vote_count'>" +
                            message.vote_count +
                        "</span>" +
                        "<div id='downvote_button_" + message._id + "' class='vote_button_wrapper downvote_button'>" +
                            "<img class='vote_button_image' src='" + downvote_img + "'>" +
                        "</div>" +
                        edit_delete_html + 
                        "<button id='reply_button_" + message._id + "' class='reply_button'>" +
                            "<b>REPLY</b>" +
                        "</button>" +
                    "</p>" +
                "</div>" +
                show_replies_html + 
            "</div>" +
        "</div>" +
        "<div class='replies_and_filler' id='replies_and_filler_" + message._id + "'>" +
            "<div class='replies_filler'>" +
            "</div>" +
            "<div class='replies_wrapper'>";
    
    if (replies_count > 0) {
        message.replies.forEach(function(reply, i) {
            let username = "(Username Not Found)";
            let avatar_path = "/images/default_avatar.jpg";
            let replying_to_username = "";

            for (let i = 0; i < chat_users_details.length; i++) {
                if (chat_users_details[i]._id === reply.author_id) {
                    username = chat_users_details[i].username;
                    avatar_path = chat_users_details[i].avatar_path;
                }

                if (chat_users_details[i]._id === reply.replying_to) {
                    replying_to_username = "@" + chat_users_details[i].username;
                }
            }

            let upvote_img = "/images/upvote_neutral.png";
            let downvote_img = "/images/downvote_neutral.png";

            if (current_user.hasOwnProperty("_id") && reply.upvotes.includes(current_user._id)) {
                upvote_img = "/images/upvote.png";
            }
            else if (current_user.hasOwnProperty("_id") && reply.downvotes.includes(current_user._id)) {
                downvote_img = "/images/downvote.png";
            }

            let edit_delete_html = "";

            if (current_user.hasOwnProperty("_id")) {
                if (teachers.includes(current_user._id) || moderators.includes(current_user._id)) {
                    let highlighted_text = "HIGHLIGHT";

                    if (reply.highlighted) {
                        highlighted_text = "UNHIGHLIGHT";
                    }

                    edit_delete_html = 
                    "<button class='highlight_comment_button' id='highlight_comment_button_" + reply._id + "'>" +
                        "<b id='highlight_comment_button_" + reply._id + "_text'>" +
                            highlighted_text +
                        "</b>" +
                    "</button>";
                }
                
                if (reply.author_id === current_user._id) {
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

            let highlighted = "";
            let highlighted_text_html = "";

            if (reply.highlighted) {
                highlighted = "highlighted";
                highlighted_text_html = 
                " <span class='tooltip unselectable'>&#9733;" +
                    "<span class='tooltip_text'>" +
                        "Highlighted by teacher/moderator" +
                    "</span>" +
                "</span>";
            }

            chatbox_message +=
            "<div class='reply_wrapper " + highlighted + "' id='reply_" + reply._id + "'>" +
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
                            highlighted_text_html + 
                        "</p>" +
                    "</div>" +
                    "<div class='message_bubble'>" +
                        "<p class='message_text'>" +
                            "<b>" + replying_to_username + "</b> " + 
                            reply.text + 
                        "</p>" +
                    "</div>" +
                    "<div class='message_bottom_line'>" +
                        "<p>" +
                            "<div id='upvote_button_" + reply._id + "' class='vote_button_wrapper upvote_button'>" +
                                "<img class='vote_button_image' src='" + upvote_img + "'>" +
                            "</div>" +
                            "<span class='vote_count'>" +
                                reply.vote_count +
                            "</span>" +
                            "<div id='downvote_button_" + reply._id + "' class='vote_button_wrapper downvote_button'>" +
                                "<img class='vote_button_image' src='" + downvote_img + "'>" +
                            "</div>" +
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
        makeShowRepliesButtonClickable(message._id);
    }

    if (checkIfRepliesAreDisplayed(message._id)) {
        $("#replies_and_filler_" + message._id).css("display", "flex");
    }
    else {
        $("#replies_and_filler_" + message._id).css("display", "none");
    }
}

function makeVoteButtonsClickable() {
    $(".upvote_button").click(function() {
        if (!$.isEmptyObject(current_user)) {
            let comment_id = ($(this).attr("id")).split("upvote_button_")[1];
            updateVote(comment_id, "upvote");
        }
        else {
            setAlert("You must be logged in to vote for a comment", "bad", 5000);
        }
    })

    $(".downvote_button").click(function() {
        if (!$.isEmptyObject(current_user)) {
            let comment_id = ($(this).attr("id")).split("downvote_button_")[1];
            updateVote(comment_id, "downvote");
        }
        else {
            setAlert("You must be logged in to vote for a comment", "bad", 5000);
        }
    })
}

function updateVote(voted_id, vote_type) {
    let message_obj = getMessageFromID(voted_id);   // Get comment which has been voted on

    if (message_obj !== null) {
        if (message_obj.comment.upvotes.length === 0) {
            message_obj.comment.upvotes = [""];
        }

        if (message_obj.comment.downvotes.length === 0) {
            message_obj.comment.downvotes = [""];
        }
        
        let data = {
            video_id: video._id,
            message_obj: message_obj,
            vote_type: vote_type,
            current_tab: current_tab
        }

        $.post("/update_comment_vote", data, function(res) {
            if (res.error) {
                setAlert("Error updating comment vote", "bad", 3000);
            }
            else {
                if (res.vote_change !== undefined) {
                    message_obj.comment.vote_count += res.vote_change;

                    if (res.upvoted) {
                        if (!message_obj.comment.upvotes.includes(current_user._id)) {
                            message_obj.comment.upvotes.push(current_user._id);
                        }

                        if (message_obj.comment.downvotes.includes(current_user._id)) {
                            message_obj.comment.downvotes.splice(message_obj.comment.downvotes.indexOf(current_user._id), 1);
                        }
                    }
                    else if (res.downvoted) {
                        if (!message_obj.comment.downvotes.includes(current_user._id)) {
                            message_obj.comment.downvotes.push(current_user._id);
                        }

                        if (message_obj.comment.upvotes.includes(current_user._id)) {
                            message_obj.comment.upvotes.splice(message_obj.comment.upvotes.indexOf(current_user._id), 1);
                        }
                    }
                    else {
                        if (message_obj.comment.upvotes.includes(current_user._id)) {
                            message_obj.comment.upvotes.splice(message_obj.comment.upvotes.indexOf(current_user._id), 1);
                        }

                        if (message_obj.comment.downvotes.includes(current_user._id)) {
                            message_obj.comment.downvotes.splice(message_obj.comment.downvotes.indexOf(current_user._id), 1);
                        }
                    }

                    addAllChatMessages();
                }
            }
        })
    }
    else {
        setAlert("Error finding comment", "bad", 3000);
    }
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

function getMessageFromID(id) {
    let comment_array = [];

    if (current_tab === "questions") {
        comment_array = video.questions;
    }
    else if (current_tab === "feedback") {
        comment_array = video.feedback;
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
    var currentTime = $("#video_lecture")[0].currentTime;   // Get current playtime
    let comment_array = []

    if (current_tab === "questions") {
        comment_array = video.questions;
    }
    else if (current_tab === "feedback") {
        comment_array = video.feedback;
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