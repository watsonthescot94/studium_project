var course = {
    _id: 44556,
    pages: [
        {
            "name": "Page 1",
            "_id": 4494994,
            "flashcards": [
                {
                    "_id": 123,
                    "author": "a",
                    "question": "Here's a question about JavaScript",
                    "answer": "JavaScript"
                },
                {
                    "_id": 456,
                    "author": "b",
                    "question": "Here's a question about JQuery",
                    "answer": "JQuery"
                },
                {
                    "_id": 789,
                    "author": "c",
                    "question": "Here's a question about Angular",
                    "answer": "Angular"
                },
                {
                    "_id": 109,
                    "author": "b",
                    "question": "Here's a question about NodeJS",
                    "answer": "NodeJS"
                },
                {
                    "_id": 156,
                    "author": "e",
                    "question": "Here's a question about Heroku",
                    "answer": "Heroku"
                }
            ]
        },
        {
            "name": "Page 2",
            "_id": 145592,
            "flashcards": [
                {
                    "_id": 4748,
                    "author": "f",
                    "question": "Here's a question about Gogglebox",
                    "answer": "Gogglebox"
                },
                {
                    "_id": 1323,
                    "author": "b",
                    "question": "Here's a question about HTML",
                    "answer": "HTML"
                }
            ]
        },
        {
            "name": "Page 3",
            "_id": 57558,
            "flashcards": []
        },
        {
            "name": "Page 4",
            "_id": 202344,
            "flashcards": [
                {
                    "_id": 938447,
                    "author": "p",
                    "question": "Here's a question about CSS",
                    "answer": "CSS"
                }
            ]
        }
    ]
}

var current_user = "b";
var edit_id = "";
var page_id = "";

$(function() {
    // Flashcards attached to course
        //Flashcards created by teachers
        // Flashcards created by students
    displayFlashCards();

    $("#edit_flashcard_submit_button").click(function() {
        let edit_question = $("#edit_question_input").val().trim();
        let edit_answer = $("#edit_answer_input").val().trim();
        $("#edit_flashcard_error_message").html("");
        let error_count = 0;

        if (edit_question.length == 0) {
            $("#edit_flashcard_error_message").append("<p style='color: red'>Question must not be blank</p>");
            error_count++;
        }

        if (edit_answer.length == 0) {
            $("#edit_flashcard_error_message").append("<p style='color: red'>Answer must not be blank</p>");
            error_count++;
        }

        if (edit_id == "" || edit_id == undefined) {
            $("#edit_flashcard_error_message").append("<p style='color: red'>Sorry, something went wrong</p>");
            error_count++;
        }

        if (error_count == 0) {
            $("#pop_up_background").css("display", "none");
            $("#edit_flashcard_contaienr").css("display", "none");

            for (let page_i = 0; page_i < course.pages.length; page_i++) {
                for (let flashcard_i = 0; flashcard_i < course.pages[page_i].flashcards.length; flashcard_i++) {
                    if (course.pages[page_i].flashcards[flashcard_i]._id == edit_id) {
                        course.pages[page_i].flashcards[flashcard_i].question = edit_question;
                        course.pages[page_i].flashcards[flashcard_i].answer = edit_answer;
                        break;
                    }
                }
            }

            if ($("#flashcard_button_" + edit_id).text() == "Reveal Answer") {
                $("#flashcard_text_" + edit_id).html(edit_question);
            }
            else {
                $("#flashcard_text_" + edit_id).html(edit_answer);
            }
        }
    })

    $("#edit_flashcard_cancel_button").click(function() {
        $("#pop_up_background").css("display", "none");
        $("#edit_flashcard_contaienr").css("display", "none");
    })

    $("#new_flashcard_submit_button").click(function() {
        let new_question = $("#new_question_input").val().trim();
        let new_answer = $("#new_answer_input").val().trim();
        $("#new_flashcard_error_message").html("");
        let error_count = 0;

        if (new_question.length == 0) {
            $("#new_flashcard_error_message").append("<p style='color: red'>Question can't be blank</p>");
            error_count++;
        }

        if (new_answer.length == 0) {
            $("#new_flashcard_error_message").append("<p style='color: red'>Answer can't be blank</p>");
            error_count++;
        }

        if (error_count == 0) {
            for (let page_i = 0; page_i < course.pages.length; page_i++) {
                if (course.pages[page_i]._id == page_id) {
                    course.pages[page_i].flashcards.push({
                        "_id": 452,
                        "author": current_user,
                        "question": new_question,
                        "answer": new_answer
                    })
                }
            }

            displayFlashCards();

            $("#pop_up_background").css("display", "none");
            $("#create_new_flashcard_container").css("display", "none");
            $("#new_question_input").val("");
            $("#new_answer_input").val("");
        }
    })

    $("#new_flashcard_cancel_button").click(function() {
        $("#pop_up_background").css("display", "none");
        $("#create_new_flashcard_container").css("display", "none");
    })
})

$( window ).resize(function() {
    setFlashCardsHeight();
});

function setFlashCardsHeight() {
    $(".flashcard").each(function() {
        $(this).css("height", $(this).css("width"));
    })
}

function displayFlashCards() {
    let flashcard_html = "";
    $("#flashcards").html("");
    for (let page_i = 0; page_i < course.pages.length; page_i++) {
        if (page_i > 0) {
            flashcard_html += "<div class='row_separator'></div>";
        }

        flashcard_html += "<div class='page_flashcards'>" +
            "<h1><a href='/course/" + course._id + "/page/" + course.pages[page_i]._id + "'>" + course.pages[page_i].name + "</a></h1>" +
            "<button id='create_new_flashcard_button_" + course.pages[page_i]._id + "' class='create_new_flashcard_button'>CREATE FLASHCARD</button>";
        if (course.pages[page_i].flashcards.length == 0) {
            flashcard_html += "<p>No flashcards yet</p>";
        }
        else {
            for (let flashcard_i = 0; flashcard_i < course.pages[page_i].flashcards.length; flashcard_i++) {
                if (flashcard_i % 3 == 0) {
                    flashcard_html += "<div class='row'>"
                }
                flashcard_html += "<div class='column'>" +
                    "<div class='flashcard'>" +
                            "<p id='flashcard_text_" + course.pages[page_i].flashcards[flashcard_i]._id + "' class='flashcard_text'>" + course.pages[page_i].flashcards[flashcard_i].question + "</p>" +
                        "</div>" +
                        "<div class='flashcard_button_container'>" +
                            "<p class='flashcard_author'>Created by @" + course.pages[page_i].flashcards[flashcard_i].author + "</p>" +
                            "<button id='flashcard_button_" + course.pages[page_i].flashcards[flashcard_i]._id + "' class='flashcard_button'>Reveal Answer</button>";
                
                if (current_user == course.pages[page_i].flashcards[flashcard_i].author) {
                    flashcard_html += "<button id='flashcard_edit_button_" + course.pages[page_i].flashcards[flashcard_i]._id + "' class='flashcard_edit_button'>Edit</button>";
                }

                flashcard_html += "</div></div>";

                if (flashcard_i % 3 == 2 || flashcard_i == course.pages[page_i].flashcards.length -1) {
                    flashcard_html += "</div>";
                }

                if (flashcard_i % 3 == 2 && flashcard_i !== course.pages[page_i].flashcards.length -1) {
                    flashcard_html += "<div class='row_separator'></div>";
                }
            }
        }
        flashcard_html += "</div>";
    }

    $("#flashcards").append(flashcard_html);
    setFlashCardsHeight();

    $(".flashcard_button").click(function() {
        let id = $(this).attr("id").split("flashcard_button_")[1];
        let clicked_flashcard;

        for (let page_i = 0; page_i < course.pages.length; page_i++) {
            for (let flashcard_i = 0; flashcard_i < course.pages[page_i].flashcards.length; flashcard_i++) {
                if (course.pages[page_i].flashcards[flashcard_i]._id == id) {
                    clicked_flashcard = course.pages[page_i].flashcards[flashcard_i];
                    break;
                }
            }
        }

        if ($(this).text() == "Reveal Answer") {
            $("#flashcard_text_" + id).html(clicked_flashcard.answer);
            $(this).text("Hide Answer");
        }
        else {
            $("#flashcard_text_" + id).html(clicked_flashcard.question);
            $(this).text("Reveal Answer");
        }
    })

    $(".flashcard_edit_button").each(function() {
        $(this).click(function() {
            edit_id = $(this).attr("id").split("flashcard_edit_button_")[1];
            $("#edit_question_input").val("");
            $("#edit_answer_input").val("");
            $("#edit_flashcard_error_message").html("");
            let question = "";
            let answer = "";
            
            for (let page_i = 0; page_i < course.pages.length; page_i++) {
                for (let flashcard_i = 0; flashcard_i < course.pages[page_i].flashcards.length; flashcard_i++) {
                    if (course.pages[page_i].flashcards[flashcard_i]._id == edit_id) {
                        question = course.pages[page_i].flashcards[flashcard_i].question;
                        answer = course.pages[page_i].flashcards[flashcard_i].answer;
                        break;
                    }
                }
            }

            $("#edit_question_input").val(question);
            $("#edit_answer_input").val(answer);
            $("#pop_up_background").css("display", "inline-block");
            $("#edit_flashcard_container").css("display", "inline-block");
        })
    })

    $(".create_new_flashcard_button").click(function() {
        $("#pop_up_background").css("display", "inline-block");
        $("#create_new_flashcard_container").css("display", "inline-block");
        page_id = $(this).attr("id").split("create_new_flashcard_button_")[1];
    })
}