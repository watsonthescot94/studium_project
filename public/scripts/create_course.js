$(function() {
    added_users.staff = [];

    $.when(getCurrentUser().done(function(user) {
        if (!user) {
            window.location.href="/login";
        }
        else {
            current_user = user;
            addUser(current_user, "staff");
            getAllUsers();
            setBottomBanner();
        }
    }));

    addCourseSubjectsToDropdownMenu();
    setStartDateMinAndMax();
    setCourseCreateSubmitButton();
})

function setCourseCreateSubmitButton() {
    $("#course_create_submit_button").click(function() {
        let input = {
            title: $("#course_title_edit").val(),
            subject: $("#course_subject_edit").val(),
            description: $("#course_description_edit").val(),
            publicly_listed: $("#course_publicly_listed_edit").is(":checked"),
            staff: added_users.staff,
            start_date: $("#course_start_date_edit").val(),
            templates_include_content: $("#course_templates_include_content_edit").is(":checked"),
            template: {}
        }

        let data = {
            input: JSON.stringify(input)
        }

        $.post("create_course", data, function(res) {
            if (res.errors && res.errors.length > 0) {
                console.log(res.errors);
                let title_error = false;
                let subject_error = false;
                let description_error = false;
                let staff_error = false;
                let start_date_error = false;
                let publicly_listed_error = false;
                let templates_include_content_error = false;

                res.errors.forEach(function(error) {
                    if (error.error_type === "title_error") {
                        title_error = true;
                        $("#title_error_message").html(error.error_message);
                        $("#title_error_message").css("display", "block");
                    }
                    else if (error.error_type === "subject_error") {
                        subject_error = true;
                        $("#subject_error_message").html(error.error_message);
                        $("#subject_error_message").css("display", "block");
                    }
                    else if (error.error_type === "description_error") {
                        description_error = true;
                        $("#description_error_message").html(error.error_message);
                        $("#description_error_message").css("display", "block");
                    }
                    else if (error.error_type === "staff_error") {
                        staff_error = true;
                        $("#search_error_message_staff").html(error.error_message);
                        $("#search_error_message_staff").css("display", "block");
                    }
                    else if (error.error_type === "start_date_error") {
                        start_date_error = true;
                        $("#start_date_error_message").html(error.error_message);
                        $("#start_date_error_message").css("display", "block");
                    }
                    else if (error.error_type === "publicly_listed_error") {
                        publicly_listed_error = true;
                        $("#course_publicly_listed_error_message").html(error.error_message);
                        $("#course_publicly_listed_error_message").css("display", "block");
                    }
                    else if (error.error_type === "templates_include_content_error") {
                        templates_include_content_error = true;
                        $("#course_templates_include_content_error_message").html(error.error_message);
                        $("#course_templates_include_content_error_message").css("display", "block");
                    }
                    else if (error.error_type === "db_error" || error.error_type === "log_in_error") {
                        setAlert(error.error_message, "bad", 3000);
                    }
                })

                if (!title_error) {
                    $("#title_error_message").css("display", "none");
                }

                if (!subject_error) {
                    $("#subject_error_message").css("display", "none");
                }

                if (!description_error) {
                    $("#description_error_message").css("display", "none");
                }

                if (!staff_error) {
                    $("#search_error_message_staff").css("display", "none");
                }

                if (!start_date_error) {
                    $("#start_date_error_message").css("display", "none");
                }

                if (!publicly_listed_error) {
                    $("#course_publicly_listed_error_message").css("display", "none");
                }

                if (!templates_include_content_error) {
                    $("#course_templates_include_content_error").css("display", "none");
                }
            }

            else {
                if (res.new_course_id) {
                    window.location.href = "/course/" + res.new_course_id;
                }
                else {
                    console.log("Course ID not found");
                }
            }
        })
    })
}

function setStartDateMinAndMax() {
    let current_date = new Date();
    let current_day = current_date.getUTCDate();
    let current_month = current_date.getUTCMonth() + 1;
    let current_year = current_date.getUTCFullYear();
    
    let max_day = current_day;
    let max_month = current_month;
    let max_year = current_year + 5;

    if (current_day === 29 && current_month === 2) {
        max_day = 28;
    }

    if (current_day < 10) {
        current_day = "0" + current_day;
        max_day = "0" + max_day;
    }

    if (current_month < 10) {
        current_month = "0" + current_month;
        max_month = "0" + max_month;
    }

    let min_date = current_year + "-" + current_month + "-" + current_day;
    let max_date = max_year + "-" + max_month + "-" + max_day;
    $("#course_start_date_edit").attr("min", min_date);
    $("#course_start_date_edit").attr("max", max_date);
}

function addCourseSubjectsToDropdownMenu() {
    sortCourseSubjects();
    course_subjects.unshift("Choose Subject");
    course_subjects.push("Other");
    course_subjects.forEach(function(subject) {
        let option = "<option value='" + subject + "'>" + subject + "</option>";
        $("#course_subject_edit").append(option);
    })
}