function setBottomBanner() {
    let url = new URL(window.location.href);
    let pathname = url.pathname;
    let is_course_page = false;
    console.log("pathname: " + pathname);
    if (pathname.includes("/course/")) {
        console.log("includes /course/");
        is_course_page = true;
    }

    let text = "";
    if (is_course_page) {
        if (is_admin && is_teacher) {
            text = "Course Role: Teacher and Admin";
        }
        else if (is_admin) {
            text = "Course Role: Admin";
        }
        else if (is_teacher) {
            text = "Course Role: Teacher";
        }
        else if (current_user !== undefined && course.students.includes(current_user._id)) {
            text = "Course Role: Student";
        }
        else {
            text = "Course Role: None";
        }

        if (is_admin || is_teacher) {
            $("#bottom_banner_text_wrapper_and_student_view_button_divider").css("display", "inline-block");
            $("#student_view_button_wrapper").css("display", "flex");
            setStudentViewButton();
        }
    }
    else if (current_user !== undefined) {
        text = "You are logged in";
    }
    else {
        text = "You are not logged in";
    }

    console.log("Text: " + text);
    $("#bottom_banner_text").html(text);
}