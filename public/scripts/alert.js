var alert_fade_in_interval;
var alert_fade_out_interval;
var alert_timeout;

$(function() {
    let display_alert_message = Cookies.get("display_alert_message");
    if (display_alert_message !== undefined && display_alert_message) {
        let text = Cookies.get("alert_message_text");
        let type = Cookies.get("alert_message_type");
        let length = Cookies.get("alert_message_length");
        setAlert(text, type, length);
        Cookies.remove("display_alert_message");
        Cookies.remove("alert_message_text");
        Cookies.remove("alert_message_type");
        Cookies.remove("alert_message_length");
    }
})

function fadeInAlert() {
    let current_opacity = Number($("#alert_message_container").css("opacity"));

    if (current_opacity < 1) {
        $("#alert_message_container").css("opacity", current_opacity + 0.2);
    }
    else {
        clearInterval(alert_fade_in_interval);
    }
}

function fadeOutAlert() {
    let current_opacity = Number($("#alert_message_container").css("opacity"));

    if (current_opacity > 0) {
        $("#alert_message_container").css("opacity", current_opacity - 0.2);
    }
    else {
        clearInterval(alert_fade_out_interval);
    }
}

function goodAlert() {
    $("#alert_message_container").css("background-color", "#228B22");
}

function badAlert() {
    $("#alert_message_container").css("background-color", "#B33A3A");
}

function hideAlertMessage() {
    alert_fade_out_interval = setInterval(fadeOutAlert, 50);
}

function clearAlert() {
    clearInterval(alert_fade_in_interval);
    clearInterval(alert_fade_out_interval);
}

function setAlert(text, type, duration) {
    $("#alert_message").html(text);

    if (type === "good") {
        goodAlert();
    }
    else if (type === "bad") {
        badAlert();
    }

    clearAlert();
    clearTimeout(alert_timeout);
    alert_fade_in_interval = setInterval(fadeInAlert, 50);
    alert_timeout = setTimeout(hideAlertMessage, duration);
}

function addAlertMessageToUserSession(text, type, length) {
    let data = {
        alert_message_text: text,
        alert_message_type: type,
        alert_message_length: length
    }

    return $.post("/add_alert_message_to_user_session", data);
}

function getAlertMessageFromUserSession() {
    return $.post("/get_alert_message_from_user_session");
}

function removeAlertMessageFromUserSession() {
    return $.post("/remove_alert_message_from_user_session");
}