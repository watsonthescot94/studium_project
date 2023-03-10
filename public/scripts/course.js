var course_id = "";
var course_visible_to_public = false;

$(function() {
    course_id = $("#course_id").html();
    course_visible_to_public = $("#make_course_visible_checkbox").is(":checked");

    $("#enrol_button").click(function() {
        console.log("#enrol_button clicked");
        let enrolling = $(this).hasClass("enrol_button");
        updateStudentEnrollment(enrolling);
    })

    $("#add_new_page_button").click(function() {
        $("#pop_up_background").css("display", "inline-block");
        $("#add_new_page_container").css("display", "inline-block");
        $("#new_page_error_message").html("");
    })

    $("#cancel_create_new_page_button").click(function() {
        $("#pop_up_background").css("display", "none");
        $("#add_new_page_container").css("display", "none");
    })

    $("#create_new_page_button").click(function() {
        let new_page_name = $("#new_page_name_input").val();
        let new_page_description = $("#new_page_description_input").val();
        let errors = 0;

        $("#new_page_error_message").html("");

        if (new_page_name.trim().length == 0) {
            $("#new_page_error_message").append("<p style='color:red'>Please enter page name");
            errors++;
        }

        if (new_page_description.trim().length == 0) {
            $("#new_page_error_message").append("<p style='color:red'>Please enter page description");
            errors++;
        }

        if (errors == 0) {
            let new_page = {
                new_page_name,
                new_page_description,
                course_id
            }

            $.post("/create_new_course_page", new_page, function(response) {
                if (response.success) {
                    $("#page_links").append("<a href='/course/" + course_id + "/page/" + response.page_id + "'><button class='class_link'>" + new_page_name + "</button>");
                    $("#new_page_name_input").val("");
                    $("#new_page_description_input").val("");
                    $("#pop_up_background").css("display", "none");
                    $("#add_new_page_container").css("display", "none");
                }
                else {
                    $("#new_page_error_message").append("<p style='color:red'>Error occured while creating page");
                }
            })
        }
    })

    $("#enter_edit_mode_button").click(function() {
        $("#enter_edit_mode_button").css("display", "none");
        $("#save_edit_button").css("display", "inline-block");
        $("#cancel_edit_button").css("display", "inline-block");
        $("#course_info").css("display", "none");
        $("#edit_course_info").css("display", "inline-block");
        $("#edit_course_name_input").val($("#course_name").html());
        $("#edit_course_description_input").val($("#course_description").html());
        $("#edit_course_subject").val($("#course_subject").html());
        $("#make_course_visible_checkbox").prop("checked", course_visible_to_public);
    })

    $("#cancel_edit_button").click(function() {
        $("#save_edit_button").css("display", "none");
        $("#cancel_edit_button").css("display", "none");
        $("#edit_course_info").css("display", "none");
        $("#enter_edit_mode_button").css("display", "inline-block");
        $("#course_info").css("display", "inline-block");
    })

    $("#save_edit_button").click(function() {
        let new_description = $("#edit_course_description_input").val().trim();
        let new_title = $("#edit_course_name_input").val().trim();
        let new_subject = $("#edit_course_subject").val();
        course_visible_to_public = $("#make_course_visible_checkbox").is(":checked");
        let visible = course_visible_to_public;
        console.log("New description:");
        console.log(new_description);
        console.log("New title:");
        console.log(new_title);
        console.log("New subject:");
        console.log(new_subject);
        console.log("Make course visible:");
        console.log(visible);

        let new_page = {
            course_id,
            new_description,
            new_title,
            new_subject,
            visible
        }

        $.post("/update_course", new_page, function(res) {
            if (res.success) {
                $("#course_name").html(new_title);
                $("#course_description").html(new_description);
                $("#course_subject").html(new_subject);
                $("#cancel_edit_button").css("display", "none");
                $("#save_edit_button").css("display", "none");
                $("#enter_edit_mode_button").css("display", "inline-block");
                $("#course_info").css("display", "inline-block");
                $("#edit_course_info").css("display", "none");
            }
            else {
                console.log("Error updating course details:");
                console.log(res);
            }
        })
    })
})

function updateStudentEnrollment(enrolling) {
    let data = {
        course_id: course_id,
        enrolling: enrolling
    }

    if (course_id !== "") {
        $.post("/update_student_enrollment", data, function(response) {
            if (response.success) {
                let success_msg = "Student enrolled";
                let class_being_removed = "enrol_button";
                let class_being_added = "unenrol_button";
                let button_text = "UNENROL";

                if (!enrolling) {
                    success_msg = "Student unenrolled";
                    class_being_removed = "unenrol_button";
                    class_being_added = "enrol_button";
                    button_text = "ENROL";
                }

                console.log(success_msg);

                $("#enrol_button").removeClass(class_being_removed).addClass(class_being_added).html(button_text);
                return;
            }
            else {
                if (!response.user_logged_in) {
                    console.log("User not logged in");
                }
                
                if (response.db_error) {
                    console.log("Database error occured");
                }
                
                if (response.user_not_found) {
                    console.log("Account not found in database");
                }

                if (response.course_not_found) {
                    console.log("Course not found");
                }
            }
        })
    }
    else {
        console.log("Course id not found");
    }
}