/**
 * Method for calculating the length of time since a given time
 * @param {} time Timestamp in milliseconds
 * @returns Time since given time
 */
function getLengthOfTime(milliseconds) {
    let time_since = Date.now() - milliseconds;
    let seconds = Math.floor((time_since / 1000) % 60);
    let minutes = Math.floor((time_since / (1000 * 60)) % 60);
    let hours = Math.floor((time_since / (1000 * 60 * 60)) % 24);
    let days = Math.floor(time_since / (1000 * 60 * 60 * 24));
    let years = Math.floor(time_since / (1000 * 60 * 60 * 24 * 365));

    if (years > 0) {
        if (years === 1) {
            return "1 yr ago";
        }
        return years + " yrs ago"
    }
    else if (days > 0) {
        if (days === 1) {
            return "1 day ago"
        }
        return days + " days ago"
    }
    else if (hours > 0) {
        if (hours === 1) {
            return "1 hr ago"
        }
        return hours + " hrs ago"
    }
    else if (minutes > 0) {
        if (minutes === 1) {
            return "1 min ago"
        }
        return minutes + " mins ago"
    }
    else if (seconds > 0) {
        if (seconds === 1) {
            return "1 sec ago"
        }
        return seconds + " secs ago"
    }
    else {
        return "Less than 1 sec ago"
    }
}