var current_template_page = undefined;  // Currently displayed template page
var showing_template = false;  // Indicates if the course's template is being displayed
var showing_template_content = false;

function setTemplateControlsDisplay() {
    // If the current user is an admin not in student view or is a teacher
    if ((is_admin || is_teacher) && !student_view) {
        $("#pages_list_template_controls_connector").css("display", "block");
        $("#template_controls_wrapper").css("display", "block");
        $("#clone_template_page_structure_button_and_helper_icon_wrapper").css("display", "none");

        // If the course has no template
        if (course.template === undefined || !course.template.set) {
            $("#template_course_link").html("No template");
            $("#change_template_button_and_helper_icon_wrapper").css("display", "none");
            $("#remove_template_button_and_helper_icon_wrapper").css("display", "none");
            $("#clone_template_page_structure_button_and_helper_icon_wrapper").css("display", "none");
            $("#show_template_checkbox_wrapper").css("display", "none");
            $("#show_template_content_checkbox_wrapper").css("display", "none");

            if (is_admin && !student_view) {
                $("#add_template_button_and_helper_icon_wrapper").css("display", "flex");
            }
            else {
                $("#add_template_button_and_helper_icon_wrapper").css("display", "none");
            }
        }
        // If the course has a template
        else {
            let template_course_link =
            "<a href='/course/" + course.template.source_id + "'>" + course.template.title + "</a>";
            $("#template_course_link").html(template_course_link);
            $("#add_template_button_and_helper_icon_wrapper").css("display", "none");
            $("#show_template_checkbox_wrapper").css("display", "block");

            if (course.template.includes_content) {
                $("#show_template_content_checkbox_wrapper").css("display", "block");
            }
            else {
                $("#show_template_content_checkbox_wrapper").css("display", "none");
            }

            if (is_admin && !student_view) {
                $("#change_template_button_and_helper_icon_wrapper").css("display", "flex");
                $("#remove_template_button_and_helper_icon_wrapper").css("display", "flex");
            }
        }

        setTemplateControlsHandlers();
    }
    else {
        $("#pages_list_template_controls_connector").css("display", "none");
        $("#template_controls_wrapper").css("display", "none");
    }
}

function setTemplateControlsHandlers() {
    $("#add_template_button").unbind("click");
    $("#add_template_button").click(function() {
        addNewTemplate();
    })

    $("#change_template_button").unbind("click");
    $("#change_template_button").click(function() {
        addNewTemplate();
    })

    $("#remove_template_button").unbind("click");
    $("#remove_template_button").click(function() {
        let confirm_window_html =
        "<h3 id='confirm_window_header'>Removing Template</h3>" +
        "<div class='divider'></div>" +
        "<p class='confirm_window_text'>Are you sure you want to remove this course's template?</p>" +
        "<button id='confirm_remove_template_button' class='white_button leftmost_button'>Remove Template</button>" +
        "<button id='cancel_remove_template' class='white_button middle_button'>Cancel</button>";

        $("#confirm_window").html(confirm_window_html);
        $("#confirm_window_wrapper").css("display", "block");

        $("#confirm_remove_template_button").unbind("click");
        $("#confirm_remove_template_button").click(function() {
            console.log("confirm remove CLICK");
            let data = {
                course_id: course._id
            }

            $.post("/remove_course_template", data, function(res) {
                if (res.errors.length > 0) {
                    setAlert(res.errors[res.errors.length - 1].error_message, "bad", 3000);
                }
                else {
                    course.template = {
                        set: false
                    }
                    showing_template = false;
                    setTemplateControlsDisplay();
                    hideTemplate();
                    closeConfirmWindow();
                    setAlert("Template removed from course", "good", 3000);
                }
            })
        })

        $("#cancel_remove_template").unbind("click");
        $("#cancel_remove_template").click(function() {
            console.log("cancel remove CLICK");
            closeConfirmWindow();
        })
    })

    $("#show_template_checkbox").unbind("change");
    $("#show_template_checkbox").change(function() {
        if ($(this).is(":checked")) {
            showing_template = true;
            showTemplate();
            $("#clone_template_page_structure_button_and_helper_icon_wrapper").css("display", "flex");
        }
        else {
            showing_template = false;
            hideTemplate();
            $("#clone_template_page_structure_button_and_helper_icon_wrapper").css("display", "none");
        }

        onResize();
    })

    $("#show_template_content_checkbox").unbind("change");
    $("#show_template_content_checkbox").change(function() {
        if ($(this).is(":checked")) {
            showing_template_content = true;
        }
        else {
            showing_template_content = false;
        }
        setCourseDetailsValues(true);
        displayPageContent(current_template_page, true);
    })

    $("#clone_template_page_structure_button").click(function() {
        if (current_page.top_element === null) {
            copyTemplateStructure(current_template_page.top_element, current_page._id);
        }
        else {
            setAlert("Cannot copy template structure if course page already has content", "bad", 4000);
        }
    });
}

function showTemplate() {
    if (!course.template.pages) {
        setAlert("Template not found", "bad", 3000);
        return;
    }

    // Set course display
    $("#course_and_template_wrapper").css("width", "100%");
    $("#course_and_pages_list_and_template_controls_wrapper").css("width", "50%");
    $("#course_and_pages_list_and_template_controls_wrapper").css("margin-right", "20px");

    // Set template display
    $("#template_and_pages_list_wrapper").css("display", "flex");
    $("#template_and_pages_list_wrapper").css("width", "50%");
    $("#template_page_wrapper").css("display", "block");
    // Set template values
    setCourseDetailsValues(true);
    getPageStats(current_template_page, true);
    displayPageContent(current_template_page, true);
}

function hideTemplate() {
    // Set course display
    $("#course_and_template_wrapper").css("width", "70%");
    $("#course_and_pages_list_and_template_controls_wrapper").css("width", "100%");
    $("#course_and_pages_list_and_template_controls_wrapper").css("margin-right", "0px");

    // Set template display
    $("#template_and_pages_list_wrapper").css("display", "none");
}

function addNewTemplate() {
    if (!is_admin) {
        setAlert("You must be an admin to add a new template", "bad", 3000);
        return;
    }

    if (current_user.templates.length === 0) {
        setAlert("You have no templates saved", "bad", 3000);
        return;
    }

    let confirm_window_html =
    "<h3 id='confirm_window_header'>Adding Template</h3>" +
    "<div class='divider'></div>" +
    "<p class='confirm_window_text'>Select Template From Your Saved Templates</p>" +
    "<select id='saved_templates_dropdown' class='confirm_window_dropdown_menu'>";

    current_user.templates.forEach(function(template) {
        confirm_window_html += "<option value='" + template._id + "'>" + template.title + "</option>";
    })

    confirm_window_html +=
    "</select>" +
    "<button id='confirm_add_template_button' class='white_button leftmost_button'>Add Template</button>" +
    "<button id='cancel_add_template_button' class='white_button middle_button'>Cancel</button>";

    $("#confirm_window").html(confirm_window_html);
    $("#confirm_window_wrapper").css("display", "block");

    $("#confirm_add_template_button").unbind("click");
    $("#confirm_add_template_button").click(function() {
        let template_id = $("#saved_templates_dropdown").val();
        console.log("selected template: " + template_id);
        let data = {
            course_id: course._id,
            template_id: template_id
        }

        $.post("/add_template_to_course", data, function(res) {
            if (res.errors.length > 0) {
                setAlert(res.errors[res.errors.length - 1].error_message, "bad", 3000);
            }
            else {
                course.template = res.template;
                setCurrentTemplatePage();
                getStaffDetails(course.template.staff);
                setPagesList(course.template.pages, true);
                setTemplateControlsDisplay();

                if (showing_template) {
                    showTemplate();
                }

                setAlert("Template added to course", "good", 3000);
                closeConfirmWindow();
            }
        })
    })

    $("#cancel_add_template_button").unbind("click");
    $("#cancel_add_template_button").click(function() {
        console.log("cancel add template CLICK");
        closeConfirmWindow();
    })
}


// Template title

function getTemplateTitle(page) {
    let template_title = "";
    if (showing_template_content) {
        template_title = page.title;
    }
    else {
        template_title = page.title_lorem_ipsum;
    }

    let template_title_html = 
    "<fieldset class='page_title_wrapper page_element'>" +
        "<legend class='legend'>Title</legend>" +
        "<h1 class='template_title'>" + template_title + "</h1>" +
        "<div class='divider'></div>" +
        "<p class='template_bottom_info'>" + calculateWordCount(template_title.replaceAll("<br>", " ")) + " words" + "</p>" +
    "</fieldset>";

    return template_title_html;
}

// Template text block

function getTemplateTextBlock(text_block) {
    let id_no = text_block._id.split("text_block_")[1];
    let text = "";
    if (showing_template_content) {
        text = text_block.text;
    }
    else {
        text = text_block.text_lorem_ipsum;
    }

    let element_html =
    "<fieldset id='template_text_block_wrapper_" + id_no + "' class='page_element text_block_wrapper'>" +
        "<legend class='legend'>Text Block</legend>" +
        "<p id='" + text_block._id + "' class='template_text_block'>" + text + "</p>" +
        "<div class='divider'></div>" +
        "<p class='word_character_counts'>" + calculateWordCount(text.replaceAll("<br>", " ")) + " words</p>" +
    "</fieldset>";

    return element_html;
}

// Template image

function getTemplateImage(image) {
    let id_no = image._id.split("image_")[1];
    let caption_html = "";
    let caption_text = "";
    let image_src = "";

    if (image.caption !== "") {
        if (showing_template_content) {
            caption_text = image.caption;
        }
        else {
            caption_text = image.caption_lorem_ipsum;
        }

        caption_html = "<p class='image_caption'>" + caption_text + "</p>";
    }

    if (showing_template_content) {
        image_src = image.image_src;
    }
    else {
        image_src = "/images/default_image.jpg";
    }

    let template_image_html =
    "<fieldset id='template_image_" + id_no + "' class='page_element image_wrapper'>" +
        "<legend class='legend'>Image</legend>" +
        "<img id='template_image_" + id_no + "' src='" + image_src + "' class='image_element'>" +
        caption_html +
        "<div class='divider'></div>" +
        "<p class='word_character_counts'>Caption: " + calculateWordCount(image.caption.replaceAll("<br>", " ")) + " words</p>" +
    "</fieldset>"

    return template_image_html;
}

// Video link

function getTemplateVideoLink(video_link) {
    let id_no = video_link._id.split("video_link_")[1];
    let read_more_button_text = "";
    let title = "";
    let description = "";
    let thumbnail_src = "";

    if (showing_template_content) {
        title = video_link.title;
        description = video_link.description;
        thumbnail_src = video_link.thumbnail;
    }
    else {
        title = video_link.title_lorem_ipsum;
        description = video_link.description_lorem_ipsum;
        thumbnail_src = "/images/default_thumbnail.jpg";
    }

    let reduced_description_array = getReducedDescription(description);
    let was_reduced = reduced_description_array[0];
    description = reduced_description_array[1];

    if (was_reduced) {
        read_more_button_text = "+ Read more";
    }

    let video_link_html =
    "<fieldset id='template_video_link_wrapper_" + id_no + "' class='video_link_wrapper page_element'>" +
        "<legend class='legend'>Video Link</legend>" +
        "<div id='template_video_link_thumbnail_wrapper_" + id_no + "' class='video_link_thumbnail_wrapper'>" +
            "<img id='template_video_link_thumbnail_" + id_no + "' src='" + thumbnail_src + "' class='video_link_thumbnail'>" +
            "<img src='/images/play_symbol.png' class='video_link_thumbnail_play_symbol'>" +
        "</div>" +

        "<div id='template_video_link_text_wrapper_" + id_no + "' class='video_link_text_wrapper'>" +
            "<h2 id='template_video_link_title_" + id_no + "'>" + title + "</h2>" +
            "<p class='video_duration'><b>Video Duration: </b><span id='video_duration_" + id_no + "'" + "</span></p>" +
            "<p id='template_video_link_description_" + id_no + "' class='video_link_description'><b>Description: </b>" + description + "</p>" +
            "<p><span id='template_read_more_button_" + id_no + "' class='read_more_button'>" + read_more_button_text + "</span></p>" +

        "<div class='divider'></div>" +
        "<p class='word_character_counts'>Title: " + calculateWordCount(title.replaceAll("<br>", " ")) + " words | " +
            "Description: " + calculateWordCount(description.replaceAll("<br>", " ")) + " words</p>" +
        "</div>" +

        "<video id='template_temp_video_" + id_no + "' class='temp_video'>" +
            "<source id='template_temp_video_source_" + id_no + "' src='" + video_link.video_src + "'></source>" +
        "</video>" +
    "</fieldset>"

    return video_link_html;
}

function copyTemplateStructure(current_template_element, anchor_element_db_id) {
    $("#no_content_message").remove();

    if (current_template_element === null) {
        return;
    }

    if (current_template_element._id.includes("text_block")) {
        $.when(addNewTextBlockAndEditor(anchor_element_db_id)).done(function() {
            anchor_element_db_id = getBottomElementDBId();
            copyTemplateStructure(current_template_element.child, anchor_element_db_id);
        })
    }
    else if (current_template_element._id.includes("image")) {
        $.when(addNewImageElementAndEditor(anchor_element_db_id)).done(function() {
            anchor_element_db_id = getBottomElementDBId();
            copyTemplateStructure(current_template_element.child, anchor_element_db_id);
        })
    }
    else if (current_template_element._id.includes("video")) {
        $.when(addNewVideoElementAndEditor(anchor_element_db_id)).done(function() {
            anchor_element_db_id = getBottomElementDBId();
            copyTemplateStructure(current_template_element.child, anchor_element_db_id);
        })
    }
}

// Lorem ipsum

function convertLoremIpsumToArray() {
    lorem_ipsum = lorem_ipsum.split(/\s+/).filter(noSpaces);
}

function convertTextToLoremIpsum(text) {
    let lorem_ipsum_i = Math.floor(Math.random() * lorem_ipsum.length);
    text = text.replaceAll("<br>", " <br> ");
    let text_array = text.split(/\s+/).filter(noSpaces);

    text_array.forEach(function(word, i) {
        if (text_array[i] !== '&' && text_array[i] !== '.') {
            text_array[i] = lorem_ipsum[lorem_ipsum_i];

            if (word === "<br>") {
                text_array[i] = "<br>";
                return;
            }

            let last_character = word.charAt(word.length - 1);

            if (last_character === "." || last_character === "!" || last_character === "?" || last_character === ",") {
                text_array[i] = text_array[i] + last_character;
            }
            else if (i === text_array.length - 1) {
                text_array[i] = text_array[i] + ".";
            }

            if (i !== 0) {
                let last_word = text_array[i - 1];
                let last_character_of_last_word = last_word.charAt(last_word.length - 1);

                if (last_character_of_last_word === "." || last_character_of_last_word === "?" ||
                    last_character_of_last_word === "!" || last_word === "<br>") {
                        text_array[i] = text_array[i].charAt(0).toUpperCase() + text_array[i].slice(1);
                }
            }
            else {
                text_array[i] = text_array[i].charAt(0).toUpperCase() + text_array[i].slice(1);
            }

            if (lorem_ipsum_i === lorem_ipsum.length - 1) {
                lorem_ipsum_i = 0;
            }
            else {
                lorem_ipsum_i++;
            }
        }
    })

    return text_array;
}