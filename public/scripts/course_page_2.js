var course = undefined;
var current_page = undefined;   // The course page currently being viewed
var is_teacher = false;  // Indicates if user is a teacher on the current course
var is_admin = false;   // Indicates if user is a course admin
var student_view = false;  // Indicates if user is viewing the page from a user's perspective
var show_all_saved_staff = false;
var pages_which_can_be_included_in_template_count = 0;
var url_params;

$(function() {
    /*let message = "<p>Big fan of LadyHawke rn</p><p>Yeah she's cool</p>";
    $.when(addMessageToUserSession(message).done(function(res) {
        console.log("Add Message res:");
        console.log(res);

        $.when(getUserSessionMessage().done(function(res) {
            console.log("Get Message res:");
            console.log(res);

            $.when(removeMessageFromUserSession().done(function(res) {
                console.log("Remove Message res:");
                console.log(res);
            }))
        }))
    }))*/

    let course_id = getCourseID();
    added_users.staff = [];

    if (course_id === null) {
        setAlert("Course ID not found", "bad", 3000);
    }
    else {
        displayCourse(course_id);
    }
})

function displayCourse(course_id) {
    $.when(getCourse(course_id).done(function(res) {
        if (res.errors.length > 0) {
            console.log(res.errors);
            let message =
            "<h3>Course Not Found</h3>" +
            '<p>Course with ID <i>"' + course_id + '"</i> was not found.</p>';
            $.when(addMessageToUserSession(message).done(function(res) {
                if (res.errors.length > 0) {
                    window.location.href = "/";
                }
                else {
                    window.location.href = "/course_not_found";
                }
            }))
            return;
        }

        course = res.course;
        document.title = course.title + " | Studium";
        pages_which_can_be_included_in_template_count = res.pages_which_can_be_included_in_template_count;
        displayCourseWindows();

        $.when(getCurrentUser().done(function() {
            $.when(getAllUsers().done(function() {
                let query_string = window.location.search;
                url_params = new URLSearchParams(query_string);
                setIsAdminIsTeacher();
                setCurrentPage();
                setBottomBanner();
                getStaffDetails(course.staff);
                setCourseDetailsValues(false);

                if (is_admin) {
                    addEditorsToCourseDetails();
                }

                if (course.template.set && (is_admin || is_teacher)) {
                    setCurrentTemplatePage();
                    setPagesList(course.template.pages, true);

                    if (course.template.includes_content) {
                        getStaffDetails(course.template.staff);
                    }
                }

                // If the current user is permitted to view the course's pages
                if (current_user !== undefined && (is_admin || is_teacher || course.students.includes(current_user._id))) {
                    // Set admin display if current user is an admin
                    if (is_admin) {
                        setAdminDisplay();
                        setStaffControls();
                    }
                    // Set teacher display if current user is a teacher and not an admin
                    else if (is_teacher) {
                        setTeacherDisplay();
                        setStaffControls();
                    }
                    // Set non-staff display if current user is not staff
                    else {
                        setNonStaffDisplay();
                    }

                    // If pages exist
                    if (course.hasOwnProperty("pages") && course.pages.length > 0) {
                        displayPageContent(current_page, false);    // Display the course page's content
                        setVideoWindowCloseButton();    // Set the close button for closing the video window
                        handleURLParams();

                        if (is_admin || is_teacher) {
                            getPageStats(current_page, false);
                        }

                        window.onresize = function() {
                            onResize();
                        }
                    }
                }
                else {
                    // Display a message informing the user the course no content
                    setNonStaffDisplay();
                }
            }))
        }))
    }))
}

function getCourseID() {
    let pathname_array = window.location.pathname.split("/course/");

    if (pathname_array.length > 0) {
        return pathname_array[1];
    }
    else {
        return null;
    }
}

function getCourse(course_id) {
    let data = {
        course_id: course_id
    }

    return $.post("/get_course", data);
}

function displayCourseWindows() {
    $("#course_and_pages_list_and_template_controls_wrapper").css("display", "flex");
}

function setIsAdminIsTeacher() {
    if (current_user === undefined) {
        return;
    }

    course.staff.forEach(function(staff_member) {
        if (staff_member._id === current_user._id) {
            if (staff_member.is_teacher) {
                is_teacher = true;
            }

            if (staff_member.is_admin) {
                is_admin = true;
            }
        }
    })
}

function setCurrentPage() {
    // If the current user is not logged in or not a student or staff member, display message
    if (current_user === undefined || (!course.students.includes(current_user._id) && !is_admin && !is_teacher)) {
        return;
    }

    // If the course's pages property exists
    if (course.hasOwnProperty("pages")) {
        // If the course has pages
        if (course.pages.length > 0) {
            if (url_params.has("page_id")) {
                let page_found = false;
                for (let i = 0; i < course.pages.length; i++) {
                    if (course.pages[i]._id === url_params.get("page_id")) {
                        page_found = true;
                        current_page = course.pages[i];
                        break;
                    }
                }

                if (!page_found) {
                    current_page = course.pages[0];
                }
            }
            // Set the current page as the first page (if the current user is not staff, any pages not visibile
            // to them will have been filtered out on the server-side)
            current_page = course.pages[0];
        }
    }
    // If the pages property doesn't exist
    else {
        console.log("Course pages object not found");
    }
}

function setCurrentTemplatePage() {
    if (is_teacher || is_admin) {
        if (course.template !== undefined && course.template.set && course.template.pages.length > 0) {
            current_template_page = course.template.pages[0];
        }
        else {
            console.log("Course has no template attached");
        }
    }
}

function getStaffDetails(staff_list) {
    staff_list.forEach(function(staff_member) {
        for (let i = 0; i < all_users.length; i++) {
            if (staff_member._id === all_users[i]._id) {
                staff_member.avatar_path = all_users[i].avatar_path;
                staff_member.forename = all_users[i].forename;
                staff_member.surname = all_users[i].surname;
                staff_member.username = all_users[i].username;
                break;
            }
        }
    })
}

function setStudentViewButton() {
    $("#student_view_button").unbind("click");
    $("#student_view_button").click(function() {
        if (is_admin || is_teacher) {
            if (!student_view) {
                if (open_editors.length > 0 || $("#cancel_edit_course_details_button").css("display") !== "none") {
                    setAlert("Please close all editors before entering Student View", "bad", 5000);
                    return;
                }

                student_view = true;
                $(this).html("Close Student View");
                $("#bottom_banner").css("background-color", "navy");
                $("#add_page_button").html("Add Page");
                $("#cancel_add_page_button").click();
                $("#cancel_add_template_button").click();
                $("#cancel_remove_template").click();

                if (getNumberOfPagesVisibleToStudents() > 0) {
                    // If the current page is visible only to staff
                    if (current_page.visible_only_to_staff) {
                        // If a video is displayed, hide it
                        if (current_video !== null) {
                            $("#close_video_window_button").click();
                        }

                        // Get the first page visible to students
                        for (let i = 0; i < course.pages.length; i++) {
                            if (!course.pages[i].visible_only_to_staff) {
                                current_page = course.pages[i];
                                break;
                            }
                        }
                    }
                    // If the current page is visible to students
                    else {
                        // If a video is currently being displayed, set the video chat display
                        if (current_video !== null) {
                            addAllChatMessages();
                        }
                    }

                    setNonStaffDisplay();
                    displayPageContent(current_page, false);
                }
                else {
                    setNonStaffDisplay();
                }

                setAlert("Student View displayed", "good", 3000);
            }
            else {
                student_view = false;
                $(this).html("Show Student View");
                $("#bottom_banner").css("background-color", "black");
                if (is_admin) {
                    setAdminDisplay();
                }
                else if (is_teacher) {
                    setTeacherDisplay();
                }

                if (current_video !== null) {
                    addAllChatMessages();
                }

                if (course.pages.length > 0) {
                    displayPageContent(current_page, false);
                }

                getPageStats(current_page, false);
                setAlert("Student View exited", "good", 3000);
            }
        }
    })
}

function getNumberOfPagesVisibleToStudents() {
    let pages_visible_to_students_count = 0;
    course.pages.forEach(function(page) {
        if (!page.visible_only_to_staff) {
            pages_visible_to_students_count++;
        }
    })
    return pages_visible_to_students_count;
}

function setRepliesDisplayed(video_id) {
    course.pages.forEach(function(page) {
        let current_element = page.top_element;
        let found = false;

        while (current_element !== null && !found) {
            if (current_element._id === video_id) {
                let questions_feedback = [current_element.questions, current_element.feedback];

                questions_feedback.forEach(function(comment_array) {
                    comment_array.forEach(function(comment) {
                        comment.replies_displayed = false;
                    })
                })
            }

            current_element = current_element.child;
        }
    })
}

function onResize() {
    setThumbnailHeight();
}

function addNewPage(previous_page_id) {
    let new_page_title = $("#add_page_textarea").val();
    let visible_only_to_staff = $("#new_page_visible_checkbox").is(":checked");
        
    let new_page = {
        title: new_page_title,
        top_element: null,
        visible_only_to_staff: visible_only_to_staff
    }

    let new_page_info = {
        course_id: course._id,
        new_page: new_page,
        previous_page_id: previous_page_id
    }

    let data = {
        new_page_info: JSON.stringify(new_page_info)
    }

    $.post("/add_course_page", data, function(res) {
        if (res.errors.length > 0) {
            let title_error = false;
            let visible_error = false;

            res.errors.forEach(function(error) {
                if (error.error_type === "db_error" || error.error_type === "user_error" || error.error_type === "info_error") {
                    setAlert(error.error_message, "bad", 3000);
                }
                else if (error.error_type === "title_error") {
                    title_error = true;
                    $("#add_page_textarea_error_message").html(error.error_message);
                    $("#add_page_textarea_error_message").css("display", "block");
                }
                else if (error.error_type === "visible_error") {
                    visible_error = true;
                    $("#add_page_visible_error_message").html(error.error_message);
                    $("#add_page_visible_error_message").css("display", "block");
                }
            })

            if (!title_error) {
                $("#add_page_textarea_error_message").css("display", "none");
            }

            if (!visible_error) {
                $("#add_page_visible_error_message").css("display", "none");
            }
        }
        else {
            new_page._id = res.new_page_id;
            new_page.title = res.new_page_title;
            let previous_page_found = false;
            let previous_page_i = 0;

            if (previous_page_id === course._id) {
                previous_page_found = true;
                previous_page_i = -1;
            }
            else {
                // Find the current page's index
                for (let i = 0; i < course.pages.length; i++) {
                    if (course.pages[i]._id === previous_page_id) {
                        previous_page_found = true;
                        break;
                    }

                    previous_page_i++;
                }
            }

            // If the course has no pages, or the previous page wasn't found, or the page is being added as the last page,
            // push new page to array
            if (course.pages.length === 0 || !previous_page_found || previous_page_i === course.pages.length - 1) {
                previous_page_found = true;
                course.pages.push(new_page)
                current_page = course.pages[course.pages.length - 1];

                // Display error message if the previous page wasn't found
                if (!previous_page_found) {
                    setAlert("Error trying to add new page", "bad", 3000);
                }
            }
            // If the page is not to be added as the last page
            else {
                let new_page_index = previous_page_i + 1;
                course.pages.splice(new_page_index, 0, new_page);
                current_page = course.pages[new_page_index];
            }

            setPagesList(course.pages, false);
            $("#course_page_wrapper").css("display", "block");
            displayPageContent(current_page, false);    // Display the new page
            closeAddPageWindow();   // Close the Add Page window
        }
    })
}

function openAddPageWindow(previous_page_id) {
    let add_page_window_info = "";

    if (course.pages.length === 0) {
        add_page_window_info = "Adding the course's first page."
    }
    else if (previous_page_id === course._id) {
        add_page_window_info = "Adding a new first page."
    }
    else {
        let previous_page_name = "";
        for (let i = 0; i < course.pages.length; i++) {
            if (course.pages[i]._id === previous_page_id) {
                previous_page_name = course.pages[i].title;
            }
        }
        add_page_window_info = 'Adding a new page after page <b>"' + previous_page_name + '"</b>';
    }

    let add_page_confirm_button_html =
    "<button id='add_page_confirm_button_" + previous_page_id + "' class='white_button leftmost_button'>Add Page</button>";

    $("#add_page_window_info").html(add_page_window_info);
    $("#add_page_textarea").val("");
    $("#add_page_textarea_error_message").css("display", "none");
    $("#new_page_visible_checkbox").prop("checked", true);
    $("#add_page_confirm_button_wrapper").html(add_page_confirm_button_html);
    $("#add_page_window_wrapper").css("display", "block");

    $("#add_page_confirm_button_" + previous_page_id).unbind("click");
    $("#add_page_confirm_button_" + previous_page_id).click(function() {
        let previous_page_id = $(this).attr("id").split("add_page_confirm_button_")[1];
        addNewPage(previous_page_id);
    })
}

function closeAddPageWindow() {
    $("#add_page_window_wrapper").css("display", "none");
}

function addSavedStaff(is_template) {
    let saved_staff_list_wrapper = "#saved_staff_list_wrapper";
    let saved_staff_show_more_button = "#saved_staff_show_more_button";
    let staff_list = course.staff;

    if (is_template) {
        saved_staff_list_wrapper = "#template_saved_staff_list_wrapper";
        saved_staff_show_more_button = "#template_saved_staff_show_more_button";
        staff_list = course.template.staff;
    }

    $(saved_staff_list_wrapper).html("");
    let staff_displayed_count = staff_list.length;

    if (staff_list.length > 3) {
        $(saved_staff_show_more_button).css("display", "inline-block");

        if (show_all_saved_staff) {
            $(saved_staff_show_more_button).html("Show Less Staff");
        }
        else {
            staff_displayed_count = 3;
            $(saved_staff_show_more_button).html("Show All Staff");
        }
    }
    else {
        $(saved_staff_show_more_button).css("display", "none");
    }

    let column_i = 1;
    let staff_member_html = "";
    for (let i = 0; i < staff_displayed_count; i++) {
        let role_text = ""
        if (staff_list[i].is_teacher) {
            role_text = "Teacher";
            if (staff_list[i].is_admin) {
                role_text += " & Admin";
            }
        }
        else if (staff_list[i].is_admin) {
            role_text = "Admin";
        }

        // Default row / staff member styles
        let justify_content = "space-between";
        let margin_left = "0px";

        // If staff member is the 2nd staff member in the row and is the last staff member
        if (column_i === 2 && i === staff_list.length - 1) {
            margin_left = "10px";
        }

        // If the staff member is the 1st staff member
        if (column_i === 1) {
            // If the 2nd staff member in this row is the last staff member
            if (i === staff_list.length - 2) {
                justify_content = "start";
            }

            staff_member_html += "<div class='saved_staff_members_row' style='justify-content:" + justify_content + "'>";
        }

        let forename = staff_list[i].forename;
        let surname = staff_list[i].surname;
        let username = staff_list[i].username;
        let avatar_path = staff_list[i].avatar_path;
        let href_start = "a href='/user/" + staff_list[i]._id + "'";
        let href_end = "a";

        if (is_template && !showing_template_content && course.template.includes_content) {
            forename = "Forename";
            surname = "Surname";
            username = "username";
            avatar_path = "/images/default_avatar.jpg";
            href_start = "div";
            href_end = "div";
        }

        staff_member_html +=
        "<" + href_start + " class='saved_staff_member_wrapper' style='margin-left:" + margin_left + "'>" +
            "<div class='saved_staff_member_avatar_wrapper'>" +
                "<img class='saved_staff_member_avatar' src='" + avatar_path + "'>" +
            "</div>" +

            "<div class='saved_staff_member_name_and_username_wrapper'>" +
                "<p class='saved_staff_member_name_and_username'>" +
                    "<b>" + forename + " " + surname + "</b><br>" +
                    "@" + username +
                "</p>" +
            "</div>" +

            "<div class='divider'></div>" +

            "<div class='saved_staff_member_role_wrapper'>" +
                "<p class='saved_staff_member_role'>" + role_text + "</p>" +
            "</div>" +
        "</" + href_end + ">";

        if (column_i === 3 || i === staff_list.length - 1) {
            staff_member_html += "</div>";
            column_i = 1;
        }
        else {
            column_i++;
        }
    }

    $(saved_staff_list_wrapper).append(staff_member_html);
}

function setCourseDetailsValues(is_template) {
    if (!is_template) {
        $("#course_title_text").html(course.title);
        $("#course_start_date_text").html(convertDateToDayMonthYearString(course.start_date));
        $("#course_subject_text").html(course.subject);
        addSavedStaff(false);
        $("#course_description_text").html(course.description);
    }
    else {
        $("#template_subject_text").html(course.template.subject);
        $("#template_start_date_text").html(convertDateToDayMonthYearString(course.template.start_date));
        addSavedStaff(true);
        setShowAllTemplateStaffButton();
        $("#template_details_title_word_count").html(calculateWordCount(course.template.title_lorem_ipsum.replaceAll("<br>", " ")));
        $("#template_details_description_word_count").html(calculateWordCount(course.template.description_lorem_ipsum.replaceAll("<br>", " ")));

        if (showing_template_content && course.template.includes_content) {
            $("#template_title_text").html(course.template.title);
            $("#template_description_text").html(course.template.description);
        }
        else {
            $("#template_title_text").html(course.template.title_lorem_ipsum);
            $("#template_description_text").html(course.template.description_lorem_ipsum);
        }
    }
}

function setCourseDetailsDisplay(is_template) {
    setEnrolButtonDisplay();
    setSaveTemplateButtonDisplay();
    setShowAllStaffButton();

    if (is_admin && !student_view) {
        $("#course_details_buttons_divider").css("display", "block");
        $("#course_details_buttons_wrapper").css("display", "flex");
    }
    else {
        $("#course_details_buttons_divider").css("display", "none");
        $("#course_details_buttons_wrapper").css("display", "none");
        $("#course_details_word_counts").css("display", "none");
    }

    if ((is_admin || is_teacher) && !student_view) {
        $("#course_details_title_word_count").html(calculateWordCount(course.title.replaceAll("<br>", " ")));
        $("#course_details_description_word_count").html(calculateWordCount(course.description.replaceAll("<br>", " ")));
        $("#course_details_word_counts").css("display", "block");
    }
}

function addEditorsToCourseDetails() {
    if (is_admin) {
        let title_edit_html =
        '<textarea id="course_title_edit" class="course_detail_edit" rows="3"></textarea>' +
        '<p id="course_title_error_message" class="page_error_message"></p>';

        let subject_edit_html =
        '<select id="course_subject_edit" class="course_detail_edit">' +
            '<option value="Art">Art</option>' +
            '<option value="History">History</option>' +
            '<option value="Media">Media</option>' +
            '<option value="Mathematics">Mathematics</option>' +
            '<option value="Physics">Physics</option>' +
        '</select>' +
        '<p id="course_subject_error_message" class="page_error_message"></p>';

        let staff_edit_html = 
        "<div id='search_input_wrapper_staff' class='search_input_wrapper course_detail_edit'>" +
            "<input id='search_input_staff' class='search_input' type='text' placeholder='Insert staff member&apos;s username here...'>" +
            "<div id='search_results_staff' class='search_results'></div>" +
        "</div>" +
        "<div id='added_users_wrapper_staff' class='added_users_wrapper course_detail_edit'></div>" +
        "<p id='course_staff_error_message' class='page_error_message course_detail_edit'></p>";

        let description_edit_html = '<textarea id="course_description_edit" class="course_detail_edit" rows="5"></textarea>' +
        '<p id="course_description_error_message" class="page_error_message"></p>';

        let start_date_edit_html = '<input id="course_start_date_edit" class="course_detail_edit" type="date">' +
        '<p id="course_start_date_error_message" class="page_error_message"></p>';

        let course_publicly_listed_html = 
        '<div id="course_publicly_listed_edit_wrapper" class="course_detail_edit">' +
            '<input id="course_publicly_listed_edit" type="checkbox">' +
            '<label id="course_publicly_listed_edit_label" for="course_publicly_listed_edit">' +
                'Course is publicly listed on Studium' +
            '</label>' +
        '</div>' +
        '<p id="course_publicly_listed_error_message" class="page_error_message"></p>';

        let templates_include_content_html = 
        '<div id="course_templates_include_content_edit_wrapper" class="course_detail_edit">' +
            '<input id="course_templates_include_content_edit" type="checkbox">' +
            '<label id="course_templates_include_content_edit_label" for="course_templates_include_content_edit">' +
                'Templates based on this course will include its original content' +
            '</label>' +
        '</div>' +
        '<p id="course_templates_include_content_error_message" class="page_error_message"></p>';

        let course_details_word_counts_html =
        '<div id="course_details_buttons_divider" class="divider"></div>' +
        '<p id="course_details_word_counts" class="word_character_counts course_detail">' +
            'Title: <span id="course_details_title_word_count"></span> words | ' +
            'Description: <span id="course_details_description_word_count"></span> words' +
        '</p>';

        let course_details_buttons_html =
        '<div id="course_details_buttons_wrapper">' +
            '<div class="course_details_bottom_button_and_helper_icon_wrapper">' +
                '<button id="edit_course_details_button" class="course_detail white_button">Edit Course Details</button>' +

                '<div class="helper_icon_wrapper">' +
                    '<img class="helper_icon" src="/images/helper_icon.png">' +

                    '<div class="course_details_bottom_button_helper_icon_wrapper helper_icon_text_wrapper helper_icon_text_wrapper_top">' +
                        '<p class="helper_icon_text">' +
                            'bleh bleh bleh' +
                        '</p>' +
                    '</div>' +
                '</div>' +
            '</div>' +

            '<button id="save_edit_course_details_button" class="course_detail_edit white_button leftmost_button">Save Edit</button>' +
            '<button id="cancel_edit_course_details_button" class="course_detail_edit white_button middle_button">Cancel Edit</button>' +
            
            '<div id="delete_course_button_and_helper_icon_wrapper" class="course_details_bottom_button_and_helper_icon_wrapper">' +
                '<button id="delete_course_button" class="red_button">Delete Course</button>' +

                '<div class="helper_icon_wrapper">' +
                    '<img class="helper_icon" src="/images/helper_icon.png">' +

                    '<div class="course_details_bottom_button_helper_icon_wrapper helper_icon_text_wrapper helper_icon_text_wrapper_top">' +
                        '<p class="helper_icon_text">' +
                            'bleh bleh bleh' +
                        '</p>' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</div>';

        $("#course_title_wrapper").append(title_edit_html);
        $("#course_subject_wrapper").append(subject_edit_html);
        $("#course_staff_wrapper").append(staff_edit_html);
        $("#course_about_wrapper").append(description_edit_html);
        $("#course_start_date_wrapper").append(start_date_edit_html);
        $("#course_details_wrapper").append(course_publicly_listed_html);
        $("#course_details_wrapper").append(templates_include_content_html);
        $("#course_details_wrapper").append(course_details_word_counts_html);
        $("#course_details_wrapper").append(course_details_buttons_html);

        setEditCourseDetailsButton();
        setSaveEditCourseDetailsButton();
        setCancelEditCourseDetailsButton();
        setDeleteCourseButton();
        setSearchInputHandler();
        setHelperIconEventHandlers();
    }
}

function setShowAllStaffButton() {
    $("#saved_staff_show_more_button").click(function() {
        show_all_saved_staff = !show_all_saved_staff;
        addSavedStaff(false);
    })
}

function setShowAllTemplateStaffButton() {
    $("#template_saved_staff_show_more_button").click(function() {
        show_all_template_saved_staff = !show_all_template_saved_staff;
        addSavedStaff(true);
    })
}

function setDeleteCourseButton() {
    $("#delete_course_button").unbind("click");
    $("#delete_course_button").click(function() {
        let confirm_window_html = 
        "<h3 id='confirm_window_header'>Deleting Course</h3>" +
        "<div class='divider'></div>" +
        "<p class='confirm_window_text'>Are you sure you want to delete this course?</p>" +
        "<p class='confirm_window_text'>Please enter your password to confirm course deletion.</p>" +
        "<input id='confirm_window_password_input' type='password'>" +
        "<p id='confirm_window_password_error_message' class='page_error_message'></p>" +
        "<div id='confirm_window_buttons_wrapper'>" +
            "<button id='confirm_course_deletion_button' class='red_button leftmost_button'>Delete Course</button>" +
            "<button id='cancel_course_deletion_button' class='white_button rightmost_button'>Cancel</button>" +
        "</div>";

        $("#confirm_window").html(confirm_window_html);
        $("#confirm_window_wrapper").css("display", "inline-block");

        $("#confirm_course_deletion_button").unbind("click");
        $("#confirm_course_deletion_button").click(function() {
            let data = {
                course_id: course._id,
                confirmational_password_input: $("#confirm_window_password_input").val()
            }

            $.post("/delete_course", data, function(res) {
                console.log(res);
                if (res.errors.length > 0) {
                    let confirmational_password_error = false;

                    res.errors.forEach(function(error) {
                        if (error.error_type === "confirmational_password_error") {
                            confirmational_password_error = true;
                            $("#confirm_window_password_error_message").html(error.error_message);
                            $("#confirm_window_password_error_message").css("display", "block");
                        }
                        else {
                            setAlert(error.error_message, "bad", 3000);
                        }
                    })

                    if (!confirmational_password_error) {
                        $("#confirm_window_password_error_message").css("display", "none");
                    }
                }
                else {
                    Cookies.set("display_alert_message", true);
                    Cookies.set("alert_message_text", "Course deleted");
                    Cookies.set("alert_message_type", "good");
                    Cookies.set("alert_message_length", 3000);
                    window.location.href = "/";
                }
            })
        })

        $("#cancel_course_deletion_button").unbind("click");
        $("#cancel_course_deletion_button").click(function() {
            $("#confirm_window_wrapper").css("display", "none");
        })
    })
}

function setEditCourseDetailsButton() {
    $("#edit_course_details_button").click(function() {
        $(".course_detail").css("display", "none");
        $("#edit_course_details_header").css("display", "block");
        $("#course_title_header").css("display", "block");
        $("#course_title_edit").val(course.title);
        $("#course_title_edit").css("display", "block");
        $("#course_start_date_header").css("display", "block");
        $("#course_start_date_edit").val(convertDateToDateWithDashes(course.start_date));
        $("#course_start_date_edit").css("display", "block");
        $("#course_subject_header").css("display", "block");
        $("#course_subject_edit").val(course.subject);
        $("#course_subject_edit").css("display", "block");
        $("#search_input_wrapper_staff").css("display", "block");
        $("#added_users_wrapper_staff").html("");

        added_users.staff = [];

        course.staff.forEach(function(staff_member) {
            addUser(staff_member, "staff");
            $("#is_teacher_checkbox_username_" + staff_member.username + "_key_staff").prop("checked", staff_member.is_teacher);
            $("#is_admin_checkbox_username_" + staff_member.username + "_key_staff").prop("checked", staff_member.is_admin);
        })

        $("#added_users_wrapper_staff").css("display", "block");
        $("#course_about_header").css("display", "block");
        $("#course_description_edit").val(course.description);
        $("#course_description_edit").css("display", "block");
        $("#course_publicly_listed_edit").prop("checked", course.publicly_listed);
        $("#course_publicly_listed_edit_wrapper").css("display", "block");
        $("#course_templates_include_content_edit_wrapper").css("display", "block");
        $("#course_templates_include_content_edit").prop("checked", course.templates_include_content);
        $("#save_edit_course_details_button").css("display", "inline-block");
        $("#cancel_edit_course_details_button").css("display", "inline-block");
    })
}

function setSaveEditCourseDetailsButton() {
    $("#save_edit_course_details_button").unbind("click");
    $("#save_edit_course_details_button").click(function() {
        let title = $("#course_title_edit").val();
        let subject = $("#course_subject_edit").val().trim();
        let start_date = $("#course_start_date_edit").val();
        let description = $("#course_description_edit").val();
        let publicly_listed = $("#course_publicly_listed_edit").is(":checked");
        let templates_include_content = $("#course_templates_include_content_edit").is(":checked");

        let course_details = {
            course_id: course._id,
            title: title,
            subject: subject,
            staff: added_users.staff,
            start_date: start_date,
            description: description,
            publicly_listed: publicly_listed,
            templates_include_content: templates_include_content
        }

        let data = {
            course_details: JSON.stringify(course_details)
        }

        $.post("/update_course_details", data, function(res) {
            if (res.errors.length > 0) {
                let title_error = false;
                let subject_error = false;
                let staff_error = false;
                let start_date_error = false;
                let description_error = false;
                let publicly_listed_error = false;
                let templates_include_content_error = false;

                res.errors.forEach(function(error) {
                    if (error.type === "title_error") {
                        title_error = true;
                        $("#course_title_error_message").html(error.text);
                        $("#course_title_error_message").css("display", "block");
                    }
                    else if (error.type === "subject_error") {
                        subject_error = true;
                        $("#course_subject_error_message").html(error.text);
                        $("#course_subject_error_message").css("display", "block");
                    }
                    else if (error.type === "staff_error") {
                        staff_error = true;
                        $("#course_staff_error_message").html(error.text);
                        $("#course_staff_error_message").css("display", "block");
                    }
                    else if (error.type === "start_date_error") {
                        start_date_error = true;
                        $("#course_start_date_error_message").html(error.text);
                        $("#course_start_date_error_message").css("display", "block");
                    }
                    else if (error.type === "description_error") {
                        description_error = true;
                        $("#course_description_error_message").html(error.text);
                        $("#course_description_error_message").css("display", "block");
                    }
                    else if (error.type === "publicly_listed_error") {
                        publicly_listed_error = true;
                        $("#course_publicly_listed_error_message").html(error.text);
                        $("#course_publicly_listed_error_message").css("display", "block");
                    }
                    else if (error.type === "templates_include_content_error") {
                        templates_include_content_error = true;
                        $("#course_templates_include_content_error").html(error.text);
                        $("#course_templates_include_content_error").css("display", "block");
                    }
                    else if (error.type === "db_error") {
                        setAlert(error.text, "bad", 3000);
                    }
                })

                if (!title_error) {
                    $("#course_title_error_message").css("display", "none");
                }
                
                if (!subject_error) {
                    $("#course_subject_error_message").css("display", "none");
                }

                if (!staff_error) {
                    $("#course_staff_error_message").css("display", "none");
                }
                
                if (!start_date_error) {
                    $("#course_start_date_error_message").css("display", "none");
                }

                if (!description_error) {
                    $("#course_description_error_message").css("display", "none");
                }

                if (!publicly_listed_error) {
                    $("#course_publicly_listed_error_message").css("display", "none");
                }

                if (!templates_include_content_error) {
                    $("#course_templates_include_content_error").css("display", "none");
                }
            }
            else {
                course.title = res.title;
                course.subject = subject;
                course.start_date = new Date(start_date);
                course.description = res.description;
                course.publicly_listed = publicly_listed;
                course.staff = added_users.staff;
                course.templates_include_content = templates_include_content;
                setCourseDetailsValues(false);
                setCourseDetailsDisplay();
                $("#cancel_edit_course_details_button").click();
                setAlert("Course details updated", "good", 3000);
            }
        })
    })
}

function setCancelEditCourseDetailsButton() {
    $("#cancel_edit_course_details_button").unbind("click");
    $("#cancel_edit_course_details_button").click(function() {
        $(".course_detail_edit").css("display", "none");
        $("#course_details_wrapper .page_error_message").css("display", "none");
        $("#course_title_text").css("display", "block");
        $("#course_subject_text").css("display", "block");
        $("#course_details_header_separator").css("display", "block");
        $("#saved_staff_list_wrapper").css("display", "block");
        if (course.staff.length > 3) {
            $("#saved_staff_show_more_button").css("display", "inline-block");
        }
        $("#course_start_date_text").css("display", "block");
        $("#course_enrol_template_buttons_wrapper").css("display", "block");
        $("#course_description_text").css("display", "block");
        $("#edit_course_details_button").css("display", "inline-block");
        $("#course_details_word_counts").css("display", "block");
    })
}

function setEnrolButtonDisplay() {
    $("#course_enrol_template_buttons_wrapper").html("");

    if ((current_user !== undefined && !is_admin && !is_teacher) || student_view) {
        let enrol_button_text = "Enrol";

        if (course.students.includes(current_user._id) || student_view) {
            enrol_button_text = "Unenrol";
        }

        let enrol_button_html = 
        '<div id="course_enrol_button_and_helper_icon_wrapper">' +
            '<button id="course_enrol_button" class="white_button">' + enrol_button_text + '</button>' +

            '<div class="helper_icon_wrapper">' +
                '<img class="helper_icon" src="/images/helper_icon.png">' +

                '<div id="course_enrol_button_helper_icon_text_wrapper" class="helper_icon_text_wrapper helper_icon_text_wrapper_top">' +
                    '<p class="helper_icon_text">' +
                        'bleh bleh bleh' +
                    '</p>' +
                '</div>' +
            '</div>' +
        '</div>';
        $("#course_enrol_template_buttons_wrapper").append(enrol_button_html);
        setEnrolButtonHandler();
        setHelperIconEventHandlers();
    }
}

function setEnrolButtonHandler() {
    $("#course_enrol_button").unbind("click");
    $("#course_enrol_button").click(function() {
        if (!is_admin && !is_teacher && current_user !== undefined) {
            // If the student is attempting to unenrol
            if (course.students.includes(current_user._id)) {
                let confirm_window_html = 
                "<h3 id='confirm_window_header'>Unenrolling</h3>" +
                "<div class='divider'></div>" +
                "<p class='confirm_window_text'>Are you sure you want to unenrol?</p>" +
                "<div id='confirm_window_buttons_wrapper'>" +
                    "<button id='confirm_unenrol_button' class='white_button leftmost_button'>Unenrol</button>" +
                    "<button id='cancel_unenrol_button' class='white_button rightmost_button'>Cancel</button>" +
                "</div>";

                $("#confirm_window").html(confirm_window_html);
                $("#confirm_window_wrapper").css("display", "inline-block");

                $("#confirm_unenrol_button").click(function() {
                    updateCourseEnrollment(false);
                })

                $("#cancel_unenrol_button").click(function() {
                    closeConfirmWindow();
                })
            }
            else {
                updateCourseEnrollment(true);
                $("#course_enrol_button").html("Unenrol");
            }
        }
    })
}

function updateCourseEnrollment(enrolling) {
    let info = {
        course_id: course._id,
        enrolling: enrolling
    }

    let data = {
        info: JSON.stringify(info)
    }

    $.post("/update_course_enrollment", data, function(res) {
        if (res.errors.length > 0) {
            setAlert(res.errors[res.errors.length - 1].error_message, "bad", 3000);
        }
        else {
            // If the user is enrolling
            if (enrolling) {
                course.students.push(current_user._id);
                setAlert("Successfully enrolled", "good", 3000);
                setBottomBanner();

                $.when(getCourse(course._id).done(function() {
                    setCurrentPage();
                    setNonStaffDisplay();

                    if (course.hasOwnProperty("pages") && course.pages.length > 0) {
                        displayPageContent(current_page, false);
                        setVideoWindowCloseButton();

                        window.onresize = function() {
                            onResize();
                        }
                    }
                }))
            }
            // If the user is unenrolling
            else {
                let i = 0;
                let found = false;
                for (i; i < course.students.length; i++) {
                    if (course.students[i] === current_user._id) {
                        found = true;
                        break;
                    }
                }

                if (found) {
                    course.students.splice(i, 1);
                }

                setAlert("Successfully unenrolled", "good", 3000);
                $("#course_enrol_button").html("Enrol");
                setBottomBanner();
                closeConfirmWindow();

                $.when(getCourse(course._id).done(function() {
                    setNonStaffDisplay();
                }))
            }
        }
    })
}

function setSaveTemplateButtonDisplay() {
    if (current_user !== undefined && pages_which_can_be_included_in_template_count > 0) {
        let margin_left = "10px";

        if ((is_teacher || is_admin) && !student_view) {
            margin_left = "0px";
        }

        let contains_content = "Content Not Included";

        if (course.templates_include_content) {
            contains_content = "Content Included";
        }

        let save_or_update_text = "Save";
        for (let i = 0; i < current_user.templates.length; i++) {
            if (current_user.templates[i].source_id === course._id) {
                save_or_update_text = "Update";
            }
        }

        let save_course_template_button_html =
        '<div id="save_course_template_button_and_helper_icon_wrapper" class="middle_button" style="margin-left:' + margin_left + '">' +
            '<button id="save_course_template_button" class="white_button"></button>' +

            '<div class="helper_icon_wrapper">' +
                '<img class="helper_icon" src="/images/helper_icon.png">' +

                '<div id="save_course_template_button_helper_icon_text_wrapper" class="helper_icon_text_wrapper helper_icon_text_wrapper_top">' +
                    '<p class="helper_icon_text">' +
                        'bleh bleh bleh' +
                    '</p>' +
                '</div>' +
            '</div>' +
        '</div>';

        $("#course_enrol_template_buttons_wrapper").append(save_course_template_button_html);
        setSaveTemplateButtonHandler();
        setHelperIconEventHandlers();
    }
}

function setSaveTemplateButtonText() {
    let contains_content = "Content Not Included";

    if (course.templates_include_content) {
        contains_content = "Content Included";
    }

    let save_or_update_text = "Save";
    for (let i = 0; i < current_user.templates.length; i++) {
        if (current_user.templates[i].source_id === course._id) {
            save_or_update_text = "Update";
        }
    }

    let text = save_or_update_text + " Template (" + contains_content + ")"

    $("#save_course_template_button").html(text);
}

function setSaveTemplateButtonHandler() {
    setSaveTemplateButtonText();
    $("#save_course_template_button").unbind("click");
    $("#save_course_template_button").click(function() {
        let data = {
            course_id: course._id
        }
    
        $.post("/save_template", data, function(res) {
            if (res.errors.length > 0) {
                setAlert(res.errors[res.errors.length - 1].error_message, "bad", 3000);
            }
            else {
                current_user.templates.push(res.template);
                let alert_message = "Course template added to your templates";

                if (res.updating_existing_template) {
                    alert_message = "Course template updated in your templates";
                }
                else {
                    setSaveTemplateButtonText();
                }

                setAlert(alert_message, "good", 3000);
            }
        })
    })
}

/**
 * Method for displaying a page's content
 */
function displayPageContent(page, is_template) {
    let title_html = "";
    let content_div = "";

    // If the page is a template page
    if (is_template) {
        // Create HTML for the template title
        title_html = getTemplateTitle(page);

        // Content will be added to the template page
        content_div = "#template_page_content";
    }
    // If the page is a course page
    else {
        // Create HTML for the course page title and its editor
        title_html = getTitleElement();

        if (!student_view) {
            title_html += getTitleEditor();

            if (is_admin) {
                title_html += getAddNewElementDiv(current_page._id);
            }
        }

        // Content will be added to the course page
        content_div = "#course_page_content";
    }

    // Add the title to the page
    $(content_div).html(title_html);

    // If page has no content, set handlers for title and Add New Element button
    if (page.top_element === null) {
        setTextInputHandlers();
        setEditElementButtons();
        setCancelEditElementButtons();
        setSaveEditElementButtons();
        setAddNewElementHandlers();
        return;
    }

    let current_element = page.top_element;
    // For each content item
    while (current_element !== null) {
        let element_html = "";

        // If element is a text block
        if (current_element._id.includes("text_block")) {
            // If the page is a template page
            if (is_template) {
                // Set HTML for the template text block
                element_html = getTemplateTextBlock(current_element);
            }
            else {  // If the page is a course page
                // Set HTML for the text block and its editor
                element_html = getTextBlock(current_element);

                if (!student_view) {
                    element_html += getTextBlockEditor(current_element);
                    
                    if (is_admin) {
                        element_html += getAddNewElementDiv(current_element._id);
                    }
                }
            }
        }
        // If element is an image
        else if (current_element._id.includes("image")) {
            // If the page is a template page
            if (is_template) {
                element_html = getTemplateImage(current_element);
            }
            // If the page is a course page
            else {
                // Set HTML for the photo element and its editor
                element_html = getImageElement(current_element);

                if (!student_view) {
                    element_html += getImageEditor(current_element);
                    
                    if (is_admin) {
                        element_html += getAddNewElementDiv(current_element._id);
                    }
                }
            }
        }
        else if (current_element._id.includes("video_link")) {
            if (is_template) {
                element_html = getTemplateVideoLink(current_element);
            }
            else {
                element_html = getVideoLink(current_element);

                if (!student_view) {
                    element_html += getVideoLinkEditor(current_element);
                    
                    if (is_admin) {
                        element_html += getAddNewElementDiv(current_element._id);
                    }
                }
            }
        }

        // Add the element to the page
        $(content_div).append(element_html);

        if (!is_template) {
            if (current_element._id === current_page.top_element._id) {
                $("#move_element_up_button_" + getWrapperIdFromDatabaseId(current_element._id)).prop("disabled", true);
            }
    
            if (current_element.child === null) {
                $("#move_element_down_button_" + getWrapperIdFromDatabaseId(current_element._id)).prop("disabled", true);
            }
        }

        // Go to next page element
        current_element = current_element.child;
    }

    setElementEventHandlers();
}

function setStaffControls() {
    $("#add_page_button").unbind("click");
    $("#add_page_button").click(function() {
        if (course.pages.length === 0) {
            openAddPageWindow(course._id);
            return;
        }

        if ($(".add_page_here_button_wrapper").first().css("display") === "none") {
            $("#add_page_button").html("<b>Finish Adding Pages</b>");
            $(".add_page_here_button_wrapper").css("display", "flex");
        }
        else {
            $("#add_page_button").html("<b>Add Page</b>");
            $(".add_page_here_button_wrapper").css("display", "none");
        }
    })

    $("#cancel_add_page_button").unbind("click");
    $("#cancel_add_page_button").click(function() {
        closeAddPageWindow()
    })
}

function setCourseContentMessage(message) {
    $("#course_content_message").html(message);
    $("#course_content_message").css("display", "block");
}

function hideCourseContentMessage() {
    $("#course_content_message").css("display", "none");
}

function wipePagesList() {
    $("#pages_list_pages").html("");
}

function setNonStaffDisplay() {
    $("#course_details_wrapper").css("display", "block");
    $("#pages_list_wrapper").css("display", "block");
    $("#pages_list_course_details_connector").css("display", "block");
    $("#add_page_button").css("display", "none");
    $("#course_page_stats").css("display", "none");
    setCourseDetailsDisplay();
    setTemplateControlsDisplay();
    hideTemplate();

    // If current user is not a student
    if (current_user === undefined || (!course.students.includes(current_user._id) && !is_admin && !is_teacher)) {
        setPagesListMessage("You must be enrolled in this course to view its content");
        wipePagesList();
        $("#course_page_wrapper").css("display", "none");
        $("#course_details_course_page_connector").css("display", "none");
        return;
    }
    // If current user is a student but there are no pages to display, or the current user is a staff
    // member in student view and there are no pages visible to students
    else if (course.pages.length === 0 || (getNumberOfPagesVisibleToStudents() === 0 && student_view)) {
        setPagesListMessage("No pages yet");
        wipePagesList();
        $("#course_page_wrapper").css("display", "none");
        $("#course_details_course_page_connector").css("display", "none");
        return;
    }

    $("#course_page_wrapper").css("display", "block");
    $("#course_details_course_page_connector").css("display", "block");
    setPagesList(course.pages, false);
}

function setAdminDisplay() {
    $("#course_details_wrapper").css("display", "block");
    $("#pages_list_wrapper").css("display", "block");
    $("#pages_list_course_details_connector").css("display", "block");
    $("#add_page_button").css("display", "block");
    $("#pages_list_template_controls_connector").css("display", "block");
    $("#change_template_button_and_helper_icon_wrapper").css("display", "flex");
    $("#remove_template_button_and_helper_icon_wrapper").css("display", "flex");
    setCourseDetailsDisplay();
    setTemplateControlsDisplay();

    if (showing_template) {
        showTemplate();
    }

    if (course.pages.length === 0) {
        $("#course_details_course_page_connector").css("display", "none");
        $("#course_page_wrapper").css("display", "none");
        setPagesListMessage("No pages yet");
        return;
    }

    hidePagesListMessage();
    $("#course_details_course_page_connector").css("display", "block");
    $("#course_page_wrapper").css("display", "block");
    setPagesList(course.pages, false);
}

function setTeacherDisplay() {
    $("#course_details_wrapper").css("display", "block");
    $("#pages_list_wrapper").css("display", "block");
    $("#pages_list_course_details_connector").css("display", "block");
    $("#add_page_button").css("display", "none");
    $("#change_template_button_and_helper_icon_wrapper").css("display", "none");
    $("#remove_template_button_and_helper_icon_wrapper").css("display", "none");
    setCourseDetailsDisplay();
    setTemplateControlsDisplay();

    if (showing_template) {
        showTemplate();
    }

    if (course.pages.length === 0) {
        setPagesListMessage("No pages yet");
        wipePagesList();
        $("#course_page_wrapper").css("display", "none");
        $("#course_details_course_page_connector").css("display", "none");
        return;
    }

    hidePagesListMessage();
    $("#course_page_wrapper").css("display", "block");
    $("#course_details_course_page_connector").css("display", "block");
    setPagesList(course.pages, false);
}

function setPagesListMessage(message) {
    $("#pages_list_message").html(message);
    $("#pages_list_message").css("display", "block");
}

function hidePagesListMessage() {
    $("#pages_list_message").css("display", "none");
}

var edit_click = false;
var controls_click = false;
var adding_page = false;

function setPagesList(pages, is_template) {
    let page_list = "#pages_list_pages";

    if (is_template) {
        page_list = "#template_pages_list_pages";
    }

    if (!is_template && pages.length > 0) {
        hidePagesListMessage();
    }

    $(page_list).html("");

    // Add page names to dropdown menu
    pages.forEach(function(page, i) {
        if (student_view && page.visible_only_to_staff) {
            return;
        }

        let id = page._id;
        let title = page.title;
        let page_item_class = "unselected_page_item";

        if ((is_template && page._id === current_template_page._id) || (!is_template && page._id === current_page._id)) {
            page_item_class = "selected_page_item";
        }

        if (is_template) {
            if (showing_template_content) {
                title = page.title;
            }
            else {
                title = page.title_lorem_ipsum;
            }
        }

        let page_item = "";

        if (!is_template && is_admin && !student_view) {
            let page_above = "";
            if (i === 0) {
                page_above = course._id;
            }
            else {
                page_above = pages[i - 1]._id;
            }

            page_item +=
            "<div class='add_page_here_button_wrapper'>" +
                "<p id='add_page_here_button_" + page_above + "' class='add_page_here_button'>+ Add Page Here</p>" +
            "</div>";
        }

        let template_text = "";
        if (is_template) {
            template_text = "template_";
        }

        page_item +=
        "<div id='" + template_text + "page_item_" + id + "' class='page_item " + page_item_class + "'>" +
            "<div class='page_item_title_wrapper'>" +
                "<p class='page_item_title'>" + title + "</p>";

        if (!is_template && is_admin && !student_view) {
            page_item +=
                "<button id='edit_page_settings_button_" + id + "' class='edit_page_settings_button white_button'>Settings</button>";
        }

        page_item +=
            "</div>";
        
        if (!is_template && is_admin && !student_view) {
            page_item +=
            "<div id='page_item_controls_" + id + "' class='page_item_controls'>" +
                "<div class='page_visible_checkbox_and_label_wrapper'>" +
                    "<div class='page_visible_checkbox_wrapper'>" +
                        "<input id='page_visible_checkbox_" + id + "' class='page_visible_checkbox' type='checkbox'>" +
                    "</div>" +
                    "<div id='page_visible_label_wrapper' class='page_visible_label_wrapper'>" +
                        "<label for='page_visible_checkbox_" + id + "'>Page Visible Only to Staff</label>" +
                    "</div>" +
                "</div>" +
                "<div class='delete_page_button_wrapper'>" +
                    "<button id='save_page_settings_button_" + id + "' class='save_page_settings_button white_button'>Save</button>" +
                    "<button id='delete_page_button_" + id + "' class='delete_page_button red_button'>Delete Page</button>" +
                "</div>" +
            "</div>";
        }

        page_item +=
        "</div>";

        if (!is_template && is_admin && !student_view && i === pages.length - 1) {
            page_item +=
            "<div class='add_page_here_button_wrapper'>" +
                "<p id='add_page_here_button_" + page._id + "' class='add_page_here_button'>+ Add Page Here</p>" +
            "</div>";
        }

        $(page_list).append(page_item);

        if (!is_template) {
            $("#page_visible_checkbox_" + id).prop("checked", page.visible_only_to_staff);
        }
    })

    setPageItemControls();
}

function setPageItemControls() {
    $(".add_page_here_button").unbind("click");
    $(".add_page_here_button").click(function() {
        let previous_page_id = $(this).attr("id").split("add_page_here_button_")[1];
        openAddPageWindow(previous_page_id);
    })

    $(".page_item").unbind("click");
    $(".page_item").click(function() {
        // If a page edit button or the page's controls pad was clicked, do nothing
        if (edit_click || controls_click) {
            edit_click = false;
            controls_click = false;
            return;
        }

        // If the page item is already selected, do nothing
        if ($(this).hasClass("selected_page_item")) {
            return;
        }

        let page_id = $(this).attr("id").split("page_item_")[1];
        let id_opener = "page_item_";
        let pages = course.pages;
        let is_template = $(this).attr("id").includes("template");
        if (is_template) {
            page_id = $(this).attr("id").split("template_page_item_")[1];
            id_opener = "template_page_item_";
            pages = course.template.pages;
        }

        // If editors are still open
        if (!is_template && open_editors.length !== 0) {
            // Display alert message
            setAlert("An editor is still open", "bad", 3000);
            return;
        }

        // Give any page items with open editors the correct background colour
        $(".page_item").each(function() {
            let id_no = $(this).attr("id").split(id_opener)[1];
            if (page_id !== id_no) {
                if ($("#page_item_controls_" + id_no).css("display") === "block") {
                    $("#page_item_" + id_no).css("background-color", "lightgray");
                }
            }
        })

        // Remove any background colour settings for the clicked page editor
        $(this).css("background-color", "");
        
        // Set this page item as selected, all others as unselected
        let found = false;
        pages.forEach(function(page) {
            if (page._id === page_id) {
                found = true;
                if (is_template) {
                    current_template_page = page;
                    displayPageContent(current_template_page, true);    //Display the template's content
                    $("#template_page_item_" + page._id).addClass("selected_page_item");
                    $("#template_page_item_" + page._id).removeClass("unselected_page_item");
                }
                else {
                    current_page = page;
                    displayPageContent(current_page, false);   // Display the page's content
                    $("#page_item_" + page._id).addClass("selected_page_item");
                    $("#page_item_" + page._id).removeClass("unselected_page_item");
                }
            }
            else {
                if (is_template) {
                    $("#template_page_item_" + page._id).removeClass("selected_page_item");
                    $("#template_page_item_" + page._id).addClass("unselected_page_item");
                }
                else {
                    $("#page_item_" + page._id).removeClass("selected_page_item");
                    $("#page_item_" + page._id).addClass("unselected_page_item");
                }
            }
        })

        if (!found) {
            setAlert("Page not found", "bad", 3000);
        }
        else {
            let page_wrapper = "#course_page_wrapper";
            if (is_template) {
                getPageStats(current_template_page, true);
                page_wrapper = "#template_page_wrapper";
            }
            else {
                getPageStats(current_page, false);
            }

            $(page_wrapper)[0].scrollIntoView({
                behavior: "smooth",
                block: "nearest"
            });
        }
    })

    $(".page_item_controls").unbind("click");
    $(".page_item_controls").click(function() {
        controls_click = true;
    })

    $(".edit_page_settings_button").unbind("click");
    $(".edit_page_settings_button").click(function() {
        let page_id = $(this).attr("id").split("edit_page_settings_button_")[1];
        edit_click = true;
        // If a page editor is being opened
        if ($(this).html() === "Settings") {
            // Close all other open page editors
            $(".page_item_controls").css("display", "none");
            $(".edit_page_settings_button").html("Settings");
            $(".page_item").css("background-color", "");

            // Set this page editor as open
            $(this).html("Cancel");
            $("#page_item_controls_" + page_id).css("display", "block");
            if ($("#page_item_" + page_id).hasClass("unselected_page_item")) {
                $("#page_item_" + page_id).css("background-color", "lightgray");
            }
            for (let i = 0; i < course.pages.length; i++) {
                if (course.pages[i]._id === page_id) {
                    $("#page_visible_checkbox_" + page_id).prop("checked", course.pages[i].visible_only_to_staff);
                    break;
                }
            }
        }
        // If a page editor is being closed
        else {
            // Close page editor
            $(this).html("Settings");
            $("#page_item_controls_" + page_id).css("display", "none");
            if ($("#page_item_" + page_id).hasClass("unselected_page_item")) {
                $("#page_item_" + page_id).css("background-color", "");
            }
        }
    })

    $(".save_page_settings_button").unbind("click");
    $(".save_page_settings_button").click(function() {
        let page_id = $(this).attr("id").split("save_page_settings_button_")[1];
        let visible_only_to_staff = $("#page_visible_checkbox_" + page_id).is(":checked");
        
        let info = {
            course_id: course._id,
            page_id: page_id,
            visible_only_to_staff: visible_only_to_staff
        }

        console.log(info);

        let data = {
            info: JSON.stringify(info)
        }

        $.post("/update_course_page_visibility", data, function(res) {
            console.log(res);
            if (res.errors.length > 0) {
                setAlert(res.errors[res.errors.length - 1].error_message, "bad", 3000);
            }
            else {
                for (let i = 0; i < course.pages.length; i++) {
                    if (course.pages[i]._id === page_id) {
                        course.pages[i].visible_only_to_staff = visible_only_to_staff;
                    }
                }

                if (visible_only_to_staff) {
                    setAlert("Page is now visible only to staff", "good", 3000);
                }
                else {
                    setAlert("Page is now visible to students", "good", 3000);
                }

                $("#edit_page_settings_button_" + page_id).click();
            }
        })
    })

    $(".delete_page_button").unbind("click");
    $(".delete_page_button").click(function() {
        let page_id = $(this).attr("id").split("delete_page_button_")[1];
        let page_title = "";

        for (let i = 0; i < course.pages.length; i++) {
            if (course.pages[i]._id === page_id) {
                page_title = course.pages[i].title;
            }
        }

        let confirm_window_html = 
        "<h3 id='confirm_window_header'>Deleting Page</h3>" +
        "<div class='divider'></div>" +
        "<p class='confirm_window_text'>Are you sure you want to delete this page (<b>" + page_title + "</b>)?</p>" +
        "<p class='confirm_window_text'>Please enter your password to confirm page deletion.</p>" +
        "<input id='confirm_window_password_input' type='password'>" +
        "<p id='confirm_window_password_error_message' class='page_error_message'></p>" +
        "<div id='confirm_window_buttons_wrapper'>" +
            "<button id='confirm_page_deletion_button_" + page_id + "' class='white_button leftmost_button'>Delete Page</button>" +
            "<button id='cancel_page_deletion_button_" + page_id + "' class='white_button rightmost_button'>Cancel</button>" +
        "</div>";

        $("#confirm_window").html(confirm_window_html);
        $("#confirm_window_wrapper").css("display", "inline-block");

        $("#confirm_page_deletion_button_" + page_id).click(function() {
            let page_id = $(this).attr("id").split("confirm_page_deletion_button_")[1];
            let password_input = $("#confirm_window_password_input").val();

            let data = {
                course_id: course._id,
                page_id: page_id,
                password_input: password_input
            }

            $.post("/delete_course_page", data, function(res) {
                if (res.errors.length > 0) {
                    let password_error = false;
                    res.errors.forEach(function(error) {
                        if (error.error_type === "db_error" || error.error_type === "user_error") {
                            setAlert(error.error_message, "bad", 3000);
                        }
                        else if (error.error_type === "password_error") {
                            password_error = true;
                            $("#confirm_window_password_error_message").html(error.error_message);
                            $("#confirm_window_password_error_message").css("display", "block");
                        }
                    })

                    if (!password_error) {
                        $("#confirm_window_password_error_message").css("display", "none");
                    }
                }
                else {
                    let page_i = 0;
                    let page_found = false;
                    for (page_i; page_i < course.pages.length; page_i++) {
                        if (course.pages[page_i]._id === page_id) {
                            page_found = true;
                            break;
                        }
                    }

                    if (!page_found) {
                        setAlert("Page not found", "bad", 3000);
                        return;
                    }

                    course.pages.splice(page_i, 1);

                    // If the last page has been removed
                    if (page_i === course.pages.length) {
                        current_page = course.pages[course.pages.length - 1];
                    }
                    else {
                        current_page = course.pages[page_i];
                    }

                    setPagesList(course.pages, false);
                    displayPageContent(current_page, false);
                    closeConfirmWindow();
                    setAlert("Page deleted", "good", 3000);
                }
            })
        })

        $("#cancel_page_deletion_button_" + page_id).click(function() {
            $("#confirm_window_wrapper").css("display", "none");
        })
    })
}

function closeConfirmWindow() {
    $("#confirm_window_wrapper").css("display", "none")
}

function hidePageStats() {
    $("#course_page_stats").css("display", "none");
    $("#template_page_stats").css("display", "none");
}

function getPageStats(page, template) {
    console.log("getPageStats()");
    let text_block_count = 0;
    let image_count = 0;
    let video_count = 0;

    let current_element = page.top_element;
    let found = false;

    while (current_element !== null & !found) {
        if (current_element._id.includes("text_block")) {
            text_block_count++;
        }
        else if (current_element._id.includes("image")) {
            image_count++;
        }
        else if (current_element._id.includes("video")) {
            video_count++;
        }

        current_element = current_element.child;
    }

    if (!template) {
        $("#course_page_text_block_count").html(text_block_count);
        $("#course_page_image_count").html(image_count);
        $("#course_page_video_count").html(video_count);
        $("#course_page_stats").css("display", "block");
    }
    else {
        $("#template_page_text_block_count").html(text_block_count);
        $("#template_page_image_count").html(image_count);
        $("#template_page_video_count").html(video_count);
        $("#template_page_stats").css("display", "block");
    }
}

function imageSrcError(image_id) {
    // If the image is an image uploaded by the user or a preview image in the image editor
    if (image_id.includes("uploaded_image")) {
        let id_no = image_id.split("uploaded_image_")[1];
        let image_wrapper = $("#uploaded_image_wrapper_" + id_no);

        // Create new image
        let new_image_html = 
        "<img id='uploaded_image_" + id_no + "' class='uploaded_image' src='/images/image_not_found.jpg'" +
            "onerror='imageSrcError(this.id)' onload='imageSrcSuccess(this.id)'>";

        // Add image
        image_wrapper.html(new_image_html);
        // Disable the save edit button
        $("#save_edit_element_button_image_wrapper_" + id_no).prop("disabled", true);
    }
    // If the image is an image element
    else if (image_id.includes("image")) {
        // Display "image not found" image
        $("#" + image_id).attr("src", "/images/image_not_found.jpg");
    }
}

function imageSrcSuccess(image_id) {
    let id_no ="";
    let src = $("#" + image_id).attr("src");

    // If the image is an image uploaded by the user or a preview image in the image editor
    if (image_id.includes("uploaded_image")) {
        id_no = image_id.split("uploaded_image_")[1];

        // If the image linked by the user wasn't found
        if (src === "/images/image_not_found.jpg") {
            // Display error message
            $("#image_upload_error_message_" + id_no).css("display", "block");
        }
        // If the image linked by the user was found, or the user has opened a new image editor
        else {
            // Do not display error message
            $("#image_upload_error_message_" + id_no).css("display", "none");

            // If the user has opened a new image editor
            if (src === "/images/default_image.jpg") {
                // Disable the save edit button
                $("#save_edit_element_button_image_wrapper_" + id_no).prop("disabled", true);
            }
            // If the user has successfully uploaded an image
            else {
                // Enable the save edit button
                $("#save_edit_element_button_image_wrapper_" + id_no).prop("disabled", false);
            }
        }
    }
}

function isValidURL(url) {
    try {
        new URL(url);
        return true;
    }
    catch (err) {
        return false;
    }
}

function convertMillisecondsToHoursMinutesSeconds(milliseconds) {
    let total_secs = Math.floor(milliseconds);
    let hrs = Math.floor(total_secs / 3600);
    let mins = Math.floor((total_secs - (hrs * 3600)) / 60);
    let secs = (total_secs - (hrs * 3600) - (mins * 60));

    if (mins < 10) {
        mins = "0" + mins;
    }

    if (secs < 10) {
        secs = "0" + secs;
    }

    let converted_time = mins + ":" + secs;

    if (hrs > 0) {
        if (hrs < 10) {
            hrs = "0" + hrs;
        }
        converted_time = hrs + ":" + converted_time;
    }
    
    return converted_time;
}

function getReducedDescription(text) {
    let text_array = text.replaceAll("<br>", " <br> ").split(/\s+/).filter(noSpaces);
    let text_array_without_line_breaks = text.replaceAll("<br>", " ").split(/\s+/).filter(noSpaces);
    let was_reduced = false;

    if (text_array_without_line_breaks.length > 50) {
        was_reduced = true;
        text = "";

        for (let i = 0; i < 50; i++) {
            if (i === 48 && text_array[i] === "<br>" && text_array[i + 1] === "<br>") {
                text += "...";
                break;
            }

            if (i !== 0) {
                text += " ";
            }

            text += text_array[i];

            if (i === 49) {
                text += "...";
            }
        }


    }

    return [was_reduced, text]
}

/**
 * Method for calculating the number of characters in a string
 * @param {} text String with characters to be counted
 * @returns Number of characters
 */
function calculateCharacterCount(text) {
    return text.length;
}

/**
 * Method for calculating the number of words in a string
 * @param {*} text String with words to be counted
 * @returns Number of words
 */
function calculateWordCount(text) {
    return text.trim().split(/\s+/).filter(noSpaces).length;
}

/**
 * Method for filtering out spaces from an array of strings
 * @param {*} word Word being checked
 * @returns True if word is not a space
 */
function noSpaces(word) {
    return word !== "";
}

function capitaliseFirstLetter(text) {
    return text.charAt(0).toUpperCase() + text.slice(1);
}

function handleURLParams() {
    if (url_params.has("video_link_id")) {
        let video_found = false;
        let current_element = current_page.top_element;

        while (current_element !== null && !video_found) {
            if (current_element._id === url_params.get("video_link_id")) {
                video_found = true;
                let video_id_no = url_params.get("video_link_id").split("video_link_")[1];
                $("#video_link_thumbnail_wrapper_" + video_id_no).click();

                let message_tab = "";
                if (url_params.has("message_tab") && url_params.has("comment_id") &&
                    (url_params.get("message_tab") === "questions" ||
                    url_params.get("message_tab") === "feedback")) {
                    message_tab = url_params.get("message_tab");
                }
                else {
                    console.log("Cannot find video comment");
                    return;
                }

                let comment_found = false;
                for (let comment_i = 0; comment_i < current_element[message_tab].length; comment_i++) {
                    if (current_element[message_tab][comment_i]._id === url_params.get("comment_id")) {
                        comment_found = true;
                        $("#message_wrapper_" + current_element[message_tab][comment_i]._id)[0].scrollIntoView({
                            behavior: "smooth",
                            block: "nearest"
                        });
                        break;
                    }
                    else {
                        for (let reply_i = 0; reply_i < current_element[message_tab][comment_i].replies.length; reply_i++) {
                            comment_found = true;
                            if (current_element[message_tab][comment_i].replies[reply_i]._id === url_params.get("comment_id")) {
                                $("#show_replies_btn_" + current_element[message_tab][comment_i]._id).click();
                                $("#reply_wrapper_" + current_element[message_tab][comment_i].replies[reply_i]._id)[0].scrollIntoView({
                                    behavior: "smooth",
                                    block: "nearest"
                                });
                                break;
                            }
                        }
                    }
                }

                if (!comment_found) {
                    console.log("Video comment was not found");
                }
            }
            current_element = current_element.child;
        }
    }
}