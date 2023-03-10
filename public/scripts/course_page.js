var course_id = "";
var page_id = "";
var page_content = [];
var edit_mode = false;

$(function() {
    let id_split = $("#course_id_page_id").html().split(" ");
        if (id_split.length == 2) {
            course_id = id_split[0];
            page_id = id_split[1];
    }

    console.log("Course ID:" + course_id);
    console.log("Page ID:" + page_id);

    $("#make_page_template_button").click(function() {
        console.log("h");
        let num_of_text_bubbles = 0;
        let word_count = 0;
        page_content.forEach(function(content, i) {
            if (content.type == "text") {
                num_of_text_bubbles++;
                word_count += $("#edit_bubble_" + page_content[i].id).val().split(" ").length;
            }
        })

        console.log(word_count);
        console.log(num_of_text_bubbles);
        let average_word_count = word_count/num_of_text_bubbles;
        console.log(average_word_count);
    })
    
    $("#save_edit_button").click(function() {
        let new_name = $("#edit_page_name_input").val().trim();
        let new_description = $("#edit_page_description_input").val().trim();
        let page_info = {
            new_name,
            new_description,
            page_id,
            course_id
        }
        
        let cont = true;

        $(".edit_text_bubble").each(function() {
            let id = $(this).attr("id").split("edit_bubble_")[1];
            console.log(id);
            $("#bubble_errors_container_" + id).html("");
            let text = $("#edit_bubble_textarea_" + id).val().trim();

            if (text.length > 0) {
                $("#bubble_text_" + id).html(text);
                $("#edit_bubble_" + id).css("display", "none");
                $("#bubble_" + id).css("display", "inline-block");
                $("#add_text_bubble_button").css("display", "none");
            }
            else {
                $("#bubble_errors_container_" + id).append("<p style='color:red'>Please enter some text</p>");
                cont = false;
            }
        })

        if (cont) {
            let content = [];

            page_content.forEach(function(bubble_edit) {
                let new_content = {};
                if (bubble_edit.type == "text") {
                    new_content.type = "text";
                    new_content.text = $("#bubble_text_" + bubble_edit.id).html();
                }

                if (bubble_edit.id.substring(0, 4) !== "temp") {
                    new_content._id = bubble_edit.id;
                }

                if (bubble_edit.video_path) {
                    new_content.video_path = bubble_edit.video_path;
                }

                new_content.visible = true;

                content.push(new_content);
            })

            let body = {
                content,
                page_info
            }

            if (new_name.length > 0 && new_description.length > 0) {
                $.post("/update_course_page", body, function(response) {
                    if (response.success !== undefined && response.success) {
                        console.log("success");
                        edit_mode = false;
                        $("#enter_edit_mode_button").css("display", "inline-block");
                        $("#save_edit_button").css("display", "none");
                        $("#edit_page_info").css("display", "none");
                        $("#page_info").css("display", "inline-block");
                        $("#page_name").html(new_name);
                        $("#page_description").html(new_description);
                        $(".edit_bubble_button").each(function() {
                            $(this).css("display", "none");
                        })
                    } else {
                        console.log("fail");
                    }
                })
            }
        }
        else {
            console.log("Inputs can't be empty");
        }

        console.log("BOTTOM OF SAVE_EDIT Edit bubble html:");
        console.log($("#edit_bubble_626852d891016c0d1dc98dd6").html());
    })

    $("#delete_page_button").click(function() {
        $("#pop_up_background").css("display", "inline-block");
        $("#page_delete_confirmation_container").css("display", "inline-block");
        $("#page_delete_error_message").html("");
        $("#page_delete_password_input").val("");
        $("#page_delete_password_input").focus();
    })

    $("#page_delete_confirmation_button").click(function() {
        let password_input = $("#page_delete_password_input").val();

        $("#page_delete_error_message").html("");
        
        if (password_input.length == 0) {
            $("#page_delete_error_message").append("<p style='color:red'>Please enter your password</p>")
        }
        else {
            let body = {
                page_id,
                password_input,
                course_id,
                page_id
            }

            $.post("/delete_course_page", body, function(response) {
                if (typeof response.sucess !== 'undefined' && !response.success) {
                    $("#page_delete_error_message").append("<p style='color:red'>Error occured while deleting page</p>")
                }
                else if (typeof response.passwords_match !== 'undefined' && !response.passwords_match) {
                    $("#page_delete_error_message").append("<p style='color:red'>Incorrect password entered</p>");
                }
                else {
                    window.location.href="/course/" + course_id;
                }
            })
        }
    })

    $("#page_delete_cancel_button").click(function() {
        $("#pop_up_background").css("display", "none");
        $("#page_delete_confirmation_container").css("display", "none");
    })

    $("#add_text_bubble_button").click(function() {
        addFirstTextBubble();
    })

    getPageContent();
})

function getPageContent() {
    $.post("/get_page_content", { course_id, page_id }, function(response) {
        if (response.error !== undefined && !response.error) {
            console.log("Error retrieving page content")
        }
        else if (response.course_not_found !== undefined && response.course_not_found) {
            console.log("Course not found");
        }
        else {
            page = response.page;
            if (page.content.length > 0) {
                console.log("page.content:");
                console.log(page.content);
                page.content.forEach(function(bubble) {
                    if (bubble.type == "text") {
                        let page_content_html = "<div id='bubble_" + bubble._id + "' class='text_bubble'>" +
                        "<p id='bubble_text_" + bubble._id + "'>" + bubble.text + "</p>" +
                        "<button id='edit_bubble_button_" + bubble._id + "' class='edit_bubble_button bottom_button hidden'>EDIT</button>" +
                        "</div>" +
                        "<div id='edit_bubble_" + bubble._id + "' class='edit_text_bubble hidden'>" +
                        "<textarea id='edit_bubble_textarea_" + bubble._id + "' class='textarea_edit_text_bubble'>" + bubble.text + "</textarea>" +
                        "<div id='bubble_errors_container_" + bubble._id + "'></div>" +
                        "<button id='preview_bubble_button_" + bubble._id + "' class='preview_bubble_button bottom_button'>PREVIEW</button>" + 
                        "<button id='delete_bubble_button_" + bubble._id + "' class='delete_bubble_button'>DELETE</button>" +
                        "</div>";

                        console.log(page_content_html);

                        page_content.push({ id: bubble._id, type: "text", content: page_content_html });
                    }
                    else if (bubble.type == "links") {

                    }
                })

                addToPageContent();
            }

            $("#enter_edit_mode_button").click(function() {
                edit_mode = true;
                $("#enter_edit_mode_button").css("display", "none");
                $("#save_edit_button").css("display", "inline-block");
                $("#edit_page_info").css("display", "inline-block");
                $("#page_info").css("display", "none");
                $("#edit_page_name_input").val($("#page_name").html());
                $("#edit_page_description_input").val($("#page_description").html());
                $(".edit_bubble_button").each(function() {
                    $(this).css("display", "inline-block");
                })
                if (page.content.length == 0) {
                    $("#add_text_bubble_button").css("display", "inline-block");
                }

                console.log("Edit bubble html:");
                console.log($("#edit_bubble_626852d891016c0d1dc98dd6").html());
            })
        }
    })
}

function addFirstTextBubble() {
    let type = "text";
    $.get("/get_random_id", function(temp_id) {
        let edit_text_bubble_html = "<div id='bubble_temp_" + temp_id + "' class='text_bubble hidden'>" +
        "<p id='bubble_text_temp_" + temp_id + "'></p>" +
        "<button id='edit_bubble_button_temp_" + temp_id + "' class='edit_bubble_button bottom_button'>EDIT</button>" +
        "</div>" +

        "<div id='edit_bubble_temp_" + temp_id + "' class='edit_text_bubble'>" + 
        "<textarea id='edit_bubble_textarea_temp_" + temp_id + "' class='textarea_edit_text_bubble'></textarea>" +
        "<div id='bubble_errors_container_temp_" + temp_id + "'></div>" +
        "<button id='preview_bubble_button_temp_" + temp_id + "' class='preview_bubble_button bottom_button'>PREVIEW</button>" +
        "<button id='delete_bubble_button_temp_" + temp_id + "' class='delete_bubble_button bottom_button'>DELETE</button>" +
        "</div>";

        page_content.push({ id: "temp_" + temp_id, type: type, content: edit_text_bubble_html });

        addToPageContent();

        $("#first_edit_text_preview_button").click(function(req, res) {
            page_content.push(edit_text_bubble_html);
        })
    })
}

function addToPageContent() {
    console.log(page_content);
    $("#page_content").html("");
    page_content.forEach(function(bubble_edit) {
        $("#page_content").append(bubble_edit.content);

        if (page_content.length > 0) {
            $("#add_text_bubble_button").css("display", "none");
        }

        $(".preview_bubble_button").click(function() {
            let id = $(this).attr("id").split("preview_bubble_button_")[1];
            $("#bubble_errors_container_" + id).html("");
            let text = $("#edit_bubble_textarea_" + id).val().trim();

            if (text.length > 0) {
                $("#bubble_text_" + id).html(text);
                $("#edit_bubble_" + id).css("display", "none");
                $("#bubble_" + id).css("display", "inline-block");
            }
            else {
                $("#bubble_errors_container_" + id).append("<p style='color:red'>Please enter some text</p>");
            }
        })

        $(".edit_bubble_button").click(function() {
            let id = $(this).attr("id").split("edit_bubble_button_")[1];
            $("#edit_bubble_textarea_" + id).val($("#bubble_text_" + id).html());
            $("#edit_bubble_" + id).css("display", "inline-block");
            $("#bubble_" + id).css("display", "none");
            $("#edit_bubble_textarea_" + id).focus();
        })

        $(".delete_bubble_button").click(function() {
            let id = $(this).attr("id").split("delete_bubble_button_")[1];
            for (let i = 0; i < page_content.length; i++) {
                if (id == page_content[i].id) {
                    page_content.splice(i, 1);
                    break;
                }
            }

            addToPageContent();

            if (page_content.length == 0) {
                $("#add_text_bubble_button").css("display", "inline-block");
            }
            else {
                $("#add_text_bubble_button").css("display", "none");
            }
        })
    })
}