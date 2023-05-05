var current_user = undefined;

function getCurrentUser() {
    return $.post("/get_current_user", function(user) {
        if (!user) {
            console.log("User not logged in");
        }
        else {
            current_user = user;
        }
    })
}