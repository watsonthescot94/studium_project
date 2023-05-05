var displayed_courses = [];
var displayed_subjects = ["Media", "Software"];

$(function() {
    /*$.when(getAllCourses().done(function(res) {
        if (res.errors.length > 0) {
            console.log(res.errors);
            setAlert(res.errors[res.errors.length - 1].error_message, "bad", 3000);
        }
        else {
            console.log(res.courses);
        }
    }))*/
    $.when(getCurrentUser().done(function() {
        setBottomBanner();
    }))
    getDisplayedCourses();
    displayHomepageCourses();
})

function getAllCourses() {
    return $.post("/get_all_courses");
}

function getDisplayedCourses() {
    displayed_subjects.forEach(function(subject) {
        displayed_courses[subject] = [];
    })

    for (let i = 0; i < homepage_courses.length; i++) {
        if (displayed_subjects.includes(homepage_courses[i].subject) && displayed_courses[homepage_courses[i].subject].length < 4) {
            displayed_courses[homepage_courses[i].subject].push(homepage_courses[i]);
        }

        if (displayed_courses[displayed_subjects[0]].length === 4 && displayed_courses[displayed_subjects[1]].length === 4) {
            break;
        }
    }
}

function displayHomepageCourses() {
    let html = "";
    
    displayed_subjects.forEach(function(subject) {
        html += 
        "<div class='homepage_course_list_and_top_line_wrapper'>" +
            "<div class='homepage_course_list_top_line'>" +
                "<div class='homepage_course_list_top_line_header_and_helper_icon'>" + 
                    "<h3 class='homepage_course_list_top_line_header'>" + subject + " Courses</h3>" +
                    
                    "<div class='helper_icon_wrapper'>" +
                        "<img class='helper_icon' src='/images/helper_icon.png'>" +

                        "<div class='homepage_course_list_top_line_header_helper_icon_text_wrapper helper_icon_text_wrapper helper_icon_text_wrapper_top'>" +
                            '<p class="helper_icon_text">Below are links to some of the ' + subject + ' courses Studium ' +
                            'has to offer. When you click one of these course links, you will be taken to the course\'s page.</p>' +
                        "</div>" +
                    "</div>" +
                "</div>" +

                "<div class='homepage_course_list_see_all_button_and_helper_wrapper'>" +
                    "<div class='homepage_course_list_see_all_button_wrapper'>" +
                        "<a href='/all-courses?subject=" + subject + "' id='homepage_course_list_see_all_button_" + subject + "' " +
                            "class='homepage_course_list_see_all_button'>See All</a>" +
                    "</div>" +

                    "<div class='helper_icon_wrapper'>" +
                        "<img class='helper_icon' src='/images/helper_icon.png'>" +

                        "<div class='homepage_course_list_see_all_button_helper_icon_text_wrapper helper_icon_text_wrapper helper_icon_text_wrapper_top'>" +
                            '<p class="helper_icon_text">When you click "See All," you will be taken to a page showing all ' +
                                'of the ' + subject + ' courses Studium has to offer.</p>' +
                        "</div>" +
                    "</div>" +
                "</div>" +
            "</div>" +

            "<div class='homepage_course_list_wrapper'>" +
                "<div class='homepage_course_list_row'>";
        
        displayed_courses[subject].forEach(function(course) {
            html +=
                    "<div class='homepage_course_listing_wrapper'>" +
                        "<a href='/course/" + course._id + "' class='homepage_course_listing'>" +

                        "<div class='homepage_course_listing_title_and_subject_wrapper'>" +
                            "<h3 class='homepage_course_listing_title'>" + course.title + "</h3>" +
                            "<p class='homepage_course_listing_subject'>" + course.subject + "</p>" +
                        "</div>" +

                        "<div class='homepage_course_listing_start_date_wrapper'>" +
                            "<div class='divider'></div>" +
                            "<p class='homepage_course_listing_start_date_header'><b>Start Date</b>" + 
                            "<p class='homepage_course_listing_start_date_text'>" +
                                convertDateToDayMonthYearString(course.start_date) +
                            "</p>" +
                        "</div>" +

                        "</a>" +
                    "</div>";
        })

        html +=
                "</div>" +
            "</div>" +
        "</div>";
    })

    $("#homepage_course_links_wrapper").html(html);
}

var homepage_courses = [
    {
        _id: "92409340283023",
        start_date: "2023-03-30T00:00:00.000Z",
        subject: "Software",
        title: "HTML and CSS"
    },
    {
        _id: "3032443443894358",
        start_date: "2023-03-30T00:00:00.000Z",
        subject: "Media",
        title: "Evil Dead II"
    },
    {
        _id: "41739240248384",
        start_date: "2023-03-28T00:00:00.000Z",
        subject: "Software",
        title: "Databases: A Very Awesome and Cool Introduction to Them Yay Woohoo"
    },
    {
        _id: "573590287259304",
        start_date: "2023-05-22T00:00:00.000Z",
        subject: "Media",
        title: "Jaws"
    },
    {
        _id: "615031749350395",
        start_date: "2023-02-22T00:00:00.000Z",
        subject: "History",
        title: "King Henry VIII"
    },
    {
        _id: "01033983577",
        start_date: "2023-04-12T00:00:00.000Z",
        subject: "Media",
        title: "Heat"
    },
    {
        _id: "394304930580458045",
        start_date: "2023-04-01T00:00:00.000Z",
        subject: "Media",
        title: "The Cabinet of Dr. Caligari"
    },
    {
        _id: "058385759935",
        start_date: "2023-03-30T00:00:00.000Z",
        subject: "Software",
        title: "JavaScript 101"
    },
    {
        _id: "1540402387246358304",
        start_date: "2023-03-29T00:00:00.000Z",
        subject: "Software",
        title: "Web Security"
    }
]