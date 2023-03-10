var all_courses = []        // Contains every public course
var displayed_courses = []  // Contains every currently displayed course, is sorted/filtered when user chooses

$(function() {
    // Get API URL for retrieving courses
    let course_url = getAPIURL();

    // Get courses
    $.get(course_url, function(res) {
        // If an error occurs, display error message
        if (res.error) {
            errorMessage(res.error_message);
        }
        // Else if no error
        else {
            // If a courses array was retrieved
            if (res.courses) {
                // Initialise course variables
                all_courses = res.courses;
                displayed_courses = res.courses;
                
                // If courses were found, sort them and display them
                if (res.courses.length > 0) {
                    sortNewToOld();
                    displayCourses();
                }
                // If no courses were found, display message
                else {
                    noCoursesFound();
                }
            }
            // If a course array was not retrieved, display error message
            else {
                let msg = "Error finding courses.";
                errorMessage(msg);
            }
        }
    })

    // Set the sorting dropdown menu's event triggers
    $("#sort").on('change', function() {
        // If there are courses to be sorted
        if (displayed_courses.length > 0) {
            switch (this.value) {
                case "new_to_old":
                    sortNewToOld();
                    break;
                case "old_to_new":
                    sortOldToNew();
                    break;
                default:
                    sortNewToOld();
            }
        }
        // If there are no courses to be sorted, display message
        else {
            noCoursesFound();
        }
    })

    // Set the subject filter's event trigger
    $("#select_subject").on('change', function(){
        filterBySubject(this.value);
    })
})

/**
 * Method for getting the URL for the API from which courses will be retrieved
 * @returns API URL
 */
function getAPIURL() {
    // Get pathname
    let url = new URL(window.location.href);
    let pathname = url.pathname;
    let course_url = "";
    
    // Set the API URL for fetching courses depending on the pathname
    switch (pathname) {
        case "/all-courses":
            course_url = "/get-all-courses";
            break;
        case "/my-courses/enrolled-in":
            course_url = "/get-courses-enrolled-in";
            break;
        case "/my-courses/teaching":
            course_url = "/get-courses-teaching";
            break;
        case "/my-courses/moderating":
            course_url = "/get-courses-moderating";
            break;
        default:
            course_url = "/get-all-courses";
    }

    return course_url;
}

/**
 * Method for displaying courses
 */
function displayCourses() {
    $("#courses").html("");

    // For each course, create HTML with course information included and add it to the page
    displayed_courses.forEach(function(course) {
        let course_html = "<div class='course_listing'>" +
        "<h2><a href='/course/" + course._id + "'>" + course.name + "</a></h2>" +
        "<p><b>Subject:</b> " + course.type + "</p>" +
        "<p><b>Description:</b> " + course.description + "</p>" +
        "</div>";

        $("#courses").append(course_html);
    })
}

/**
 * Method for displaying a message when no courses have been found
 */
function noCoursesFound() {
    let msg_html = "<p>No courses found.</p>";

    $("#courses").html(msg_html);
}

/**
 * Method for displaying an error message when there is a fault retrieving courses
 */
function errorMessage(msg) {
    let msg_html = "<p>" + msg + "</p>";

    $("#courses").html(msg_html);
}

/**
 * Method for sorting courses from newest to oldest
 */
function sortNewToOld() {
    displayed_courses.sort(function(a, b) {
        return new Date(b.created) - new Date(a.created);
    })

    displayCourses();
}

/**
 * Method for sorting courses from oldest to newest
 */
function sortOldToNew() {
    displayed_courses.sort(function(a, b) {
        return new Date(a.created) - new Date(b.created);
    })

    displayCourses();
}

/**
 * Method for filtering courses by subject
 * @param {*} subject Subject of courses to be displayed
 */
function filterBySubject(subject) {
    // If user has chosen to view courses of all subjects
    if (subject === "All Subjects") {
        // All courses will be displayed
        displayed_courses = all_courses;
    }
    // If user is filtering courses by subject
    else {
        let new_displayed_courses = [];

        // Get each course within the chosen subject
        all_courses.forEach(function(course) {
            if (course.type === subject) {
                new_displayed_courses.push(course);
            }
        })

        displayed_courses = new_displayed_courses;
    }

    // Sort courses according to the user's choice
    $("#sort").trigger('change');

    // If there are courses to display, display them
    if (displayed_courses.length > 0) {
        displayCourses();
    }
    // If there are no courses to display, display message
    else {
        noCoursesFound();
    }
}