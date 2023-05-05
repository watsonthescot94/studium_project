var all_courses = []        // Contains every retrieved course
var displayed_courses = []  // Contains every currently displayed course, is sorted/filtered when user chooses

$(function() {
    $.when(getCurrentUser().done(function() {
        setBottomBanner();
    }))
    
    // Get API URL for retrieving courses
    sortCourseSubjects();
    addCourseSubjectsToDropdownMenu();
    let api_url_and_course_type = getAPIURLAndCourseType();
    $.when(getCourses(api_url_and_course_type.course_url, api_url_and_course_type.course_type).done(function(res) {
        console.log(res);
        // If an error occurs, display error message
        if (res.errors.length > 0) {
            showCourseDisplayMessage(res.errors[res.errors.length - 1].error_message);
        }
        // Else if no error
        else {
            // Initialise course variables
            all_courses = res.courses;
            displayed_courses = res.courses;
            
            // If courses were found, sort them and display them
            if (res.courses.length > 0) {
                hideCourseDisplayMessage();
                displayCourses();
                handleURLParams();
            }
            // If no courses were found, display message
            else {
                showCourseDisplayMessage("No courses to display");
            }
        }
    }))

    // Set the sorting dropdown menu's event triggers
    $("#filter_displayed_courses_by_start_date_dropdown_menu").on('change', function() {
        filterDisplayedCourses();

        if (displayed_courses.length > 0) {
            hideCourseDisplayMessage();
            displayCourses();
        }
        else {
            hideDisplayedCourses();
            showCourseDisplayMessage("No courses to display");
        }
    })

    // Set the subject filter's event trigger
    $("#filter_displayed_courses_by_subject_dropdown_menu").on('change', function(){
        filterDisplayedCourses();

        if (displayed_courses.length > 0) {
            hideCourseDisplayMessage();
            displayCourses();
        }
        else {
            hideDisplayedCourses();
            showCourseDisplayMessage("No courses to display");
        }
    })
})

/**
 * Method for getting the URL for the API from which courses will be retrieved
 * @returns API URL
 */
function getAPIURLAndCourseType() {
    // Get pathname
    let url = new URL(window.location.href);
    let pathname = url.pathname;
    let response = {
        course_url: "",
        course_type: ""
    }

    if (pathname.charAt(pathname.length - 1) === "/") {
        pathname = pathname.slice(0, -1);
    }
    
    // Set the API URL for fetching courses depending on the pathname
    switch (pathname) {
        case "/all-courses":
            console.log(" url is /all-courses");
            response.course_url = "/get_all_courses";
            break;
        case "/my-courses/enrolled-in":
            response.course_url = "/get_user_courses";
            response.course_type = "enrolled_in";
            break;
        case "/my-courses/in-charge-of":
            response.course_url = "/get_user_courses";
            response.course_type = "courses_in_charge_of";
            break;
        default:
            console.log("url not found");
            response.course_url = "/get-all-courses";
    }

    return response;
}

function getCourses(course_url, course_type) {
    let course_data = {
        course_type: course_type
    }
    console.log("course_url: " + course_url);

    // Get courses
    return $.post(course_url, course_data);
}

/**
 * Method for displaying courses
 */
function displayCourses() {
    if (displayed_courses.length > 0) {
        showDisplayedCourses();
    }

    let course_html = "";
    // For each course, create HTML with course information included and add it to the page
    displayed_courses.forEach(function(course, i) {
        //let course_listing_position = "";

        if (i % 4 === 0) {
            let row_margin_class = "";
            if (i + 3 <= displayed_courses.length - 1) {
                row_margin_class = "not_bottom_course_listing_row";
            }
            course_html += "<div class='course_listing_row " + row_margin_class + "'>";
        }
        
        course_html +=
        "<div class='course_listing_wrapper'>" +
            "<a href='/course/" + course._id + "' class='course_listing'>" +
                "<div class='course_listing_course_title_and_subject_wrapper'>" +
                    "<h3 class='course_listing_course_title'>" + course.title + "</h3>" +
                    "<p class='course_listing_course_subject'>" + course.subject + "</p>" +
                "</div>" +

                "<div class='course_listing_course_start_date_wrapper'>" +
                    "<div class='divider'></div>" +
                    "<p class='course_listing_course_start_date_header'><b>Start Date</b>" + 
                    "<p class='course_listing_course_start_date_text'>" +
                        convertDateToDayMonthYearString(course.start_date) +
                    "</p>" +
                "</div>" +
            "</a>" +
        "</div>";

        if ((i + 1) % 4 === 0 || i === displayed_courses.length - 1) {
            course_html += "</div>";
        }
    })

    $("#displayed_courses").html(course_html);
}

/**
 * Method for displaying a message when no courses have been found
 */
function hideCourseDisplayMessage() {
    $("#course_display_message").css("display", "none");
}

function showCourseDisplayMessage(message) {
    $("#course_display_message").html(message);
    $("#course_display_message").css("display", "block");
}

/**
 * Method for sorting courses from newest to oldest
 */
function sortNewToOld() {
    displayed_courses.sort(function(a, b) {
        return new Date(b.created) - new Date(a.created);
    })
}

/**
 * Method for sorting courses from oldest to newest
 */
function sortOldToNew() {
    displayed_courses.sort(function(a, b) {
        return new Date(a.created) - new Date(b.created);
    })
}

function filterDisplayedCourses() {
    let subject_filter = $("#filter_displayed_courses_by_subject_dropdown_menu").val();
    let start_date_filter = $("#filter_displayed_courses_by_start_date_dropdown_menu").val();
    let new_displayed_courses = [];
    let filtered = false;

    if (subject_filter !== "All Subjects") {
        filtered = true;
        all_courses.forEach(function(course) {
            if (course.subject === subject_filter) {
                new_displayed_courses.push(course);
            }
        })
    }
    else {
        all_courses.forEach(function(course) {
            new_displayed_courses.push(course);
        })
    }

    if (start_date_filter !== "All Start Dates") {
        let courses_to_remove = [];
        let current_date = new Date();
        current_date.setHours(6, 0, 0, 0);

        new_displayed_courses.forEach(function(course) {
            let course_start_date = new Date(course.start_date);
            course_start_date.setHours(6, 0, 0, 0);

            if (start_date_filter === "Upcoming" && course_start_date <= current_date) {
                filtered = true;
                courses_to_remove.push(course._id);
            }
            else if (start_date_filter === "Passed" && course_start_date > current_date) {
                filtered = true;
                courses_to_remove.push(course._id);
            }
        })

        console.log("courses_to_remove");
        console.log(courses_to_remove);

        if (courses_to_remove.length > 0) {
            for (let i = new_displayed_courses.length - 1; i > -1; i--) {
                if (courses_to_remove.includes(new_displayed_courses[i]._id)) {
                    console.log("removing " + new_displayed_courses[i].title);
                    new_displayed_courses.splice(i, 1);
                }
            }
        }
    }

    if (filtered) {
        displayed_courses = new_displayed_courses;
    }
    else {
        displayed_courses = all_courses;
    }
}

function showDisplayedCourses() {
    $("#displayed_courses_wrapper").css("display", "block");
}

function hideDisplayedCourses() {
    $("#displayed_courses_wrapper").css("display", "none");
}

function handleURLParams() {
    let query_string = window.location.search;
    let url_params = new URLSearchParams(query_string);
    console.log("subject: " + url_params.get("subject"));
    if (url_params.has("subject") && course_subjects.includes(url_params.get("subject"))) {
        $("#filter_displayed_courses_by_subject_dropdown_menu").val(url_params.get("subject"));
        $("#filter_displayed_courses_by_subject_dropdown_menu").trigger("change");
    }
}

function addCourseSubjectsToDropdownMenu() {
    course_subjects.unshift("All Subjects");
    course_subjects.push("Other");
    course_subjects.forEach(function(subject) {
        let option = "<option value='" + subject + "'>" + subject + "</option>";
        $("#filter_displayed_courses_by_subject_dropdown_menu").append(option);
    })
}