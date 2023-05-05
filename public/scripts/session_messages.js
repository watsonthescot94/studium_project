function addMessageToUserSession(message_html) {
    let data = {
        message_html: message_html
    }
    
    return $.post("/add_message_to_user_session", data);
}

function getUserSessionMessage() {
    return $.post("/get_user_session_message");
}

function removeMessageFromUserSession() {
    return $.post("/remove_message_from_user_session")
}