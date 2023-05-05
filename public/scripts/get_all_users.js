function getAllUsers() {
    return $.post("/get_all_users", function(res) {
        if (res.error) {
            console.log("Error occurred retrieving list of Studium users");
        }

        if (res.users) {
            all_users = res.users;
        }
        else {
            console.log("All users not found");
        }
    })
}