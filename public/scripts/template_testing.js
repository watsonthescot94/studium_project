var edit_mode = false;  // Indicates if user is currently in edit mode
var current_page;   // The course page currently being viewed
var current_template;   // The template page currently being viewed
var template_displayed = true;  // Indicates if the course's template is being displayed
var template_content_displayed = true;  // Indicates if the template's content is currently being displayed
var is_teacher = true;  // Indicates if user is a teacher on the current course
var user_view = false;  // Indicates if user is viewing the page from a user's perspective
var open_editors = [];

$(function() {
    current_page = course.pages[0]; // Set current page
    convertLoremIpsumToArray();
    createTemplate();
    displayPageContent(current_page, false);   // Display the page's content
    displayPageContent(template.pages[0], true);
    setPageDropdownMenu(course.pages, false);
    setPageDropdownMenu(template.pages, true);
    setTemplateCheckboxes();
})

function moveElementUp(element_moving_up_id) {
    if (current_page.top_element._id === element_moving_up_id) {
        console.log("Can't move element up, disable element's 'Move Up' button");
        return;
    }
    else if (current_page.top_element.child === null) {
        console.log("Can't find element");
        return;
    }
    else if (current_page.top_element.child._id === element_moving_up_id) {
        let element_moving_down = JSON.parse(JSON.stringify(current_page.top_element));
        let element_moving_up = JSON.parse(JSON.stringify(current_page.top_element.child));
        element_moving_down.child = element_moving_up.child;
        element_moving_up.child = element_moving_down;
        current_page.top_element = element_moving_up;

        let wrapper_id = getWrapperIdFromDatabaseId(element_moving_up_id);
        let editor_id = getEditorIdFromDatabaseId(element_moving_up_id);
        let add_new_element_id = getAddNewElementIdFromDatabaseId(element_moving_up_id);

        let element_html = $("#" + wrapper_id)[0].outerHTML +
            $("#" + editor_id)[0].outerHTML +
            $("#" + add_new_element_id)[0].outerHTML;

        $("#" + wrapper_id).remove();
        $("#" + editor_id).remove();
        $("#" + add_new_element_id).remove();

        $("#" + add_new_element_id).after(element_html);
        $("#" + add_new_element_id)[0].scrollIntoView({
            behavior: "smooth",
            block: "nearest"
        });

        setTextInputHandlers();
        setEditElementButtons();
        setCancelEditElementButtons();
        setSaveEditElementButtons();
        setAddNewElementHandlers();
        setDeleteElementButtons();
        setMoveElementButtons();

        console.log(JSON.parse(JSON.stringify(current_page)));
        return;
    }

    let previous_element = current_page.top_element;
    let current_element = previous_element.child;
    
    while (current_element !== null) {
        if (current_element.child !== null && current_element.child._id === element_moving_up_id) {
            let element_moving_up = current_element.child;
            let element_moving_down = current_element;
            element_moving_down.child = element_moving_up.child;
            element_moving_up.child = element_moving_down;
            previous_element.child = element_moving_up;
        }

        previous_element = current_element;
        current_element = current_element.child;
    }

    console.log(JSON.parse(JSON.stringify(current_page)));
}

function moveElementDown(element_moving_down_id) {
    if (current_page.top_element.child === null) {
        console.log("Can't move down");
        return;
    }
    else if (current_page.top_element._id === element_moving_down_id) {
        let element_moving_down = JSON.parse(JSON.stringify(current_page.top_element));
        let element_moving_up = JSON.parse(JSON.stringify(current_page.top_element.child));
        element_moving_down.child = element_moving_up.child;
        current_page.top_element = element_moving_up;
        current_page.top_element.child = element_moving_down;
        console.log(JSON.parse(JSON.stringify(current_page)));
        return;
    }

    let previous_element = current_page.top_element;
    let current_element = current_page.top_element.child;

    while (current_element.child !== null) {
        console.log(current_element._id);
        if (current_element._id === element_moving_down_id) {
            console.log("found");
            found = true;
            let element_moving_down = JSON.parse(JSON.stringify(current_element));
            let element_moving_up = JSON.parse(JSON.stringify(current_element.child));
            element_moving_down.child = element_moving_up.child;
            element_moving_up.child = element_moving_down;
            previous_element.child = element_moving_up;
        }

        previous_element = current_element;
        current_element = current_element.child;
    }

    if (current_element._id === element_moving_down_id) {
        console.log("Can't move down, disable element's Move Down button");
    }

    console.log(JSON.parse(JSON.stringify(current_page)));
}

function addNewImageElementAndEditor(anchor_element_db_id) {
    $.get("/get_random_id", function(random_id) {
        let new_image = {
            _id: "image_" + random_id,
            image_src: "/images/default_image.jpg",
            caption: ""
        }

        addNewElementToLocalDB(anchor_element_db_id, new_image);
        let new_image_html = getImageElement(new_image) + getImageEditor(new_image) + getAddNewElementDiv("image_" + random_id);
        $("#add_new_element_wrapper_" + anchor_element_db_id).after(new_image_html);
        $("#add_new_element_dropdown_" + anchor_element_db_id).val("choose_element_type");
        $("#image_wrapper_" + random_id).css("display", "none");
        $("#image_editor_wrapper_" + random_id).css("display", "inline-block");
        $("#save_edit_element_button_image_wrapper_" + random_id).prop("disabled", true);
        $("#image_editor_wrapper_" + random_id)[0].scrollIntoView({
            behavior: "smooth",
            block: "nearest"
        });
        
        if (!open_editors.includes("image_editor_wrapper_" + random_id)) {
            open_editors.push("image_wrapper_" + random_id);
        }

        setEditElementButtons();
        setImageEditors();
        setCancelEditElementButtons();
        setSaveEditElementButtons();
        setAddNewElementHandlers();
        setDeleteElementButtons();
        setMoveElementButtons();
    })
}

function addNewTopElementToLocalDB(element) {
    element.child = current_page.top_element;
    current_page.top_element = element;
    console.log(current_page);
}

function getParentElement(element_id) {
    let parent_element = current_page.top_element;
    let current_element = parent_element.child;

    while (current_element !== null) {
        if (current_element._id === element_id) {
            return parent_element._id;
        }

        parent_element = current_element;
        current_element = current_element.child;
    }

    return false;
}

function addNewElementToLocalDB(parent_id, new_element) {
    if (parent_id === current_page._id) {
        new_element.child = current_page.top_element;
        current_page.top_element = new_element;
        return;
    }

    let current_element = current_page.top_element;
    let found = false;

    while (current_element !== null && !found) {
        if (current_element._id === parent_id) {
            found = true;
            new_element.child = current_element.child;
            current_element.child = new_element;
        }

        current_element = current_element.child;
    }

    //console.log("After new element inserted:");
    //console.log(JSON.parse(JSON.stringify(current_page)));
}

function removeElementFromDB(element_id) {
    console.log("removeElement()");
    if (element_id === current_page.top_element._id) {
        current_page.top_element = current_page.top_element.child;
    }

    if (current_page.top_element !== null) {
        let parent_element = current_page.top_element;
        let current_element = parent_element.child;
        let found = false;

        while (current_element !== null && !found) {
            if (current_element._id === element_id) {
                found = true;
                parent_element.child = current_element.child;
            }

            parent_element = current_element;
            current_element = current_element.child;
        }
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

        // If the original src has resulted in an error
        if (src === "/images/image_not_found.jpg") {
            // Display error message
            $("#image_upload_error_message_" + id_no).css("display", "block");
        }
        // If the original src has not resulted in an error
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

function setImageEditors() {
    $(".image_link_button").click(function() {
        console.log("image_link_button CLICK");
        let id = $(this).attr("id").split("image_link_button_")[1];
        let link_input = $("#image_link_input_" + id);
        let link = link_input.val();
        
        if (isValidURL(link)) {
            $("#uploaded_image_" + id).attr("src", link);
        }
        else {
            $("#image_upload_error_message_" + id).css("display", "block");
        }
    })

    /*$(".image_upload_button").click(function() {
        let id_no = $(this).attr("id").split("image_upload_button_")[1];
        let src = $("#uploaded_image_" + id_no).attr("src");

        // If the image link is valid
        if (src !== "/images/image_not_found.jpg" && src !== "/images/default_image.jpg") {
            // Get input caption
            let caption = $("#image_caption_input_" + id_no).val().trim();

            let current_element = current_page.top_element;
            let found = false;

            while (current_element !== null && !found) {
                if (current_element._id === "image_" + id_no) {
                    found = true;
                    // Set DB image src
                    current_element.image_src = src;

                    // If caption has changed, set DB caption
                    if (caption !== current_element.caption) {
                        current_element.caption = caption;
                    }
                }

                // Go to next element
                current_element = current_element.child;
            }

            // Post new image
            postNewImage(id_no, src, caption);
        }
    }) */
}

function saveImageEdit(wrapper_id) {
    let id_no = wrapper_id.split("image_wrapper_")[1];
    let src = $("#uploaded_image_" + id_no).attr("src");

    // If the image link is valid
    if (src !== "/images/image_not_found.jpg" && src !== "/images/default_image.jpg") {
        // Get input caption
        let caption = $("#image_caption_input_" + id_no).val().trim();

        let current_element = current_page.top_element;
        let found = false;

        while (current_element !== null && !found) {
            if (current_element._id === "image_" + id_no) {
                found = true;
                // Set DB image src
                current_element.image_src = src;

                // If caption has changed, set DB caption
                if (caption !== current_element.caption) {
                    current_element.caption = caption;
                }
            }

            // Go to next element
            current_element = current_element.child;
        }

        // Set image element src
        $("#image_" + id_no).attr("src", src);
        // Display image element, hide editor
        $("#" + wrapper_id).css("display", "inline-block");
        $("#image_editor_wrapper_" + id_no).css("display", "none");
        removeFromOpenEditors(wrapper_id);

        let caption_html = "<i>" + caption + "</i>";
        $("#image_caption_" + id_no).html(caption_html);

        if (caption === "") {
            $("#image_caption_" + id_no).css("display", "none");
        }
        else {
            $("#image_caption_" + id_no).css("display", "block");
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

function setTemplateCheckboxes() {
    $("#show_template_checkbox").change(function() {
        console.log($(this).is(":checked"));
    })

    $("#show_template_content_checkbox").change(function() {
        console.log($(this).is(":checked"));
    })
}

function setPageDropdownMenu(pages, template_pages) {
    let dropdown_menu = "#course_page_names";

    if (template_pages) {
        dropdown_menu = "#template_page_names";
    }

    // Add page names to dropdown menu
    pages.forEach(function(page) {
        let id = page._id;
        let title = page.title;

        if (template_pages) {
            title = page.title_lorem_ipsum;
        }

        let option = "<option id='page_option_" + id + "' value='" + id + "'>" + title + "</option>";
        $(dropdown_menu).append(option);
    })

    // Set change handler for dropdown menu
    $(dropdown_menu).change(function() {
        if (!template_pages && open_editors.length !== 0) {
            $("#course_page_names_error_message").html("An editor is still open");
            $("#course_page_names_error_message").css("display", "block");
;            $(this).val(current_page._id);
            return;
        }
        else {
            $("#course_page_names_error_message").css("display", "none");
        }

        let page_id = $(this).val();

        pages.forEach(function(page) {
            if (page._id === page_id) {
                if (template_pages) {
                    current_template = page;
                    displayPageContent(current_template, true);    //Display the template's content
                }
                else {
                    current_page = page;
                    displayPageContent(current_page, false);   // Display the page's content
                }
            }
        })
    })
}

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

/**
 * Method for setting the change handlers for text inputs
 */
function setTextInputHandlers() {
    $(".title_editor_textarea").on("input", function() {
        let id = $(this).attr("id").split("title_editor_textarea_")[1];
        let character_count = calculateCharacterCount($(this).val());
        let word_count = calculateWordCount($(this).val());
        $("#title_character_count_" + id).html(character_count);
        $("#title_word_count_" + id).html(word_count);
    })

    $(".text_block_editor_textarea").on("input", function() {
        let id = $(this).attr("id").split("text_block_editor_textarea_")[1];
        let character_count = calculateCharacterCount($(this).val());
        let word_count = calculateWordCount($(this).val());
        $("#text_block_character_count_" + id).html(character_count);
        $("#text_block_word_count_" + id).html(word_count);
    })
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
 * Method for displaying a page's content
 */
function displayPageContent(page, template) {
    let title_html = "";
    let content_div = "";

    // If the page is a template page
    if (template) {
        // Create HTML for the template title
        title_html = getTemplateTitle(page);

        // Content will be added to the template page
        content_div = "#template_content";
    }
    else {  // If the page is a coure page
        // Create HTML for the course page title and its editor
        title_html = getTitleElement() + getTitleEditor() + getAddNewElementDiv(current_page._id);

        // Content will be added to the course page
        content_div = "#page_content";
    }

    // Add the title to the page
    $(content_div).html(title_html);

    // If page has no content, display error message
    if (page.top_element === null) {
        let error_msg = "<p>This page does not currently have any content</p>";
        $(content_div).append(error_msg);
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
            if (template) {
                // Set HTML for the template text block
                element_html = getTemplateTextBlock(current_element);
            }
            else {  // If the page is a course page
                // Set HTML for the text block and its editor
                element_html = getTextBlock(current_element) + getTextBlockEditor(current_element) + 
                    getAddNewElementDiv(current_element._id);
            }
        }
        // If element is an image
        else if (current_element._id.includes("image")) {
            // If the page is a template page
            if (template) {

            }
            // If the page is a course page
            else {
                // Set HTML for the photo element and its editor
                element_html += getImageElement(current_element) + getImageEditor(current_element) +
                    getAddNewElementDiv(current_element._id);
            }
        }

        // Add the element to the page
        $(content_div).append(element_html);

        // Go to next page element
        current_element = current_element.child;
    }

    // If page is not a template page, set the text input handlers
    if (!template) {
        setImageEditors();
        setTextInputHandlers();
        setEditElementButtons();
        setCancelEditElementButtons();
        setSaveEditElementButtons();
        setDeleteElementButtons();
        setAddNewElementHandlers();
        setMoveElementButtons();
    }
    
    // If page is not a template page and user is in edit mode
    if (!template && edit_mode) {
        // Display editors
        displayEditors();
    }
}

function getAddNewElementDiv(id) {
    let add_new_element_html =
    "<fieldset id='add_new_element_wrapper_" + id + "' class='add_new_element_wrapper'>" +
        "<legend class='legend'>Add Page Element</legend>" +
        "<div class='add_new_element_dropdown_input_wrapper'>" +
            "<select id='add_new_element_dropdown_" + id + "' class='add_new_element_dropdown'>" +
                "<option value='choose_element_type'>Choose Element Type</option>" +
                "<option value='text_block'>Text Block</option>" +
                "<option value='image'>Image</option>" +
            "</select>" +
            "<input type='button' id='add_new_element_button_" + id + "' class='add_new_element_button' value='Add New Element'>" +
        "</div>" +
        "<p id='add_new_element_error_message_" + id + "' class='add_new_element_error_message'>Please choose an element type to add</p>" +
    "</fieldset>";

    return add_new_element_html;
}

function setAddNewElementHandlers() {
    $(".add_new_element_button").unbind("click");

    $(".add_new_element_button").click(function() {
        let anchor_element_db_id = $(this).attr("id").split("add_new_element_button_")[1];
        let new_element_type = $("#add_new_element_dropdown_" + anchor_element_db_id).val();

        if (new_element_type === "choose_element_type") {
            $("#add_new_element_error_message_" + anchor_element_db_id).css("display", "block");
        }
        else {
            $("#add_new_element_error_message_" + anchor_element_db_id).css("display", "none");

            if (new_element_type === "text_block") {
                addNewTextBlockAndEditor(anchor_element_db_id);
            }
            else if (new_element_type === "image") {
                addNewImageElementAndEditor(anchor_element_db_id);
            }
        }
    })
}

function addNewTextBlockAndEditor(anchor_element_db_id) {
    $.get("/get_random_id", function(random_id) {
        let new_text_block = {
            _id: "text_block_" + random_id,
            text: "",
            child: null
        }

        console.log("addNewTextBlockAndEditor()");
        addNewElementToLocalDB(anchor_element_db_id, new_text_block);
        let new_text_block_html = getTextBlock(new_text_block) + getTextBlockEditor(new_text_block) +
            getAddNewElementDiv("text_block_" + random_id);
        $("#add_new_element_wrapper_" + anchor_element_db_id).after(new_text_block_html);
        $("#add_new_element_dropdown_" + anchor_element_db_id).val("choose_element_type");
        $("#text_block_wrapper_" + random_id).css("display", "none");
        $("#text_block_editor_wrapper_" + random_id).css("display", "inline-block");
        $("#text_block_editor_wrapper_" + random_id)[0].scrollIntoView({
            behavior: "smooth",
            block: "nearest"
        })

        if (!open_editors.includes("text_block_editor_wrapper_" + random_id)) {
            open_editors.push("text_block_wrapper_" + random_id);
        }

        //$("#add_new_element_button_" + anchor_element_db_id).unbind("click");
        setTextInputHandlers();
        setEditElementButtons();
        setCancelEditElementButtons();
        setSaveEditElementButtons();
        setAddNewElementHandlers();
        setDeleteElementButtons();
        setMoveElementButtons();
    })
    /*
        addNewElementToLocalDB(anchor_element_db_id, new_image);
        let new_image_html = getImageElement(new_image) + getImageEditor(new_image) + getAddNewElementDiv(random_id);
        $("#add_new_element_wrapper_" + anchor_element_db_id).after(new_image_html);
        $("#image_wrapper_" + random_id).css("display", "none");
        $("#image_editor_wrapper_" + random_id).css("display", "inline-block");
        $("#save_edit_element_button_image_wrapper_" + random_id).prop("disabled", true);
        $("#image_editor_wrapper_" + random_id)[0].scrollIntoView({
            behavior: "smooth",
            block: "nearest"
        });

        setEditElementButtons();
        setImageEditors();
        setCancelEditElementButtons();
        setSaveEditElementButtons();
        setAddNewElementHandlers();
    */
}

function setEditElementButtons() {
    $(".edit_element_button").click(function() {
        let wrapper_id = $(this).attr("id").split("edit_element_button_")[1];

        if (wrapper_id.includes("title")) {
            setTitleEditorValues(wrapper_id);
        }
        else if (wrapper_id.includes("text_block")) {
            setTextBlockEditorValues(wrapper_id);
        }
        else if (wrapper_id.includes("image")) {
            setImageEditorValues(wrapper_id);
        }

        $("#" + wrapper_id).css("display", "none");
        $("#" + getEditorIdFromWrapperId(wrapper_id)).css("display", "inline-block");
        $("#" + getEditorIdFromWrapperId(wrapper_id))[0].scrollIntoView({
            behavior: "smooth",
            block: "nearest"
        });

        if (!open_editors.includes(wrapper_id)) {
            open_editors.push(wrapper_id);
        }
    })
}

function setTextBlockEditorValues(wrapper_id) {
    let id_no = wrapper_id.split("text_block_wrapper_")[1];
    let textarea = $("#text_block_editor_textarea_" + id_no);
    let text = $("#text_block_" + id_no).html().replaceAll("<br>", "\n");
    textarea.val(text);
    let character_count = calculateCharacterCount(text);
    let word_count = calculateWordCount(text);
    $("#text_block_character_count_" + id_no).html(character_count);
    $("#text_block_word_count_" + id_no).html(word_count);
}

function setImageEditorValues(wrapper_id) {
    let id_no = wrapper_id.split("image_wrapper_")[1];
    let current_element = current_page.top_element;
    let found = false;
    let original_src = "";

    while (current_element !== null && !found) {
        if (current_element._id === "image_" + id_no) {
            found = true;
            original_src = current_element.image_src;
        }
        
        current_element = current_element.child;
    }

    let link_input = $("#image_link_input_" + id_no);
    let src = $("#image_" + id_no).attr("src");
    let caption = $("#image_caption_" + id_no).html().replace("<i>", "").replace("</i>", "");
    link_input.val(original_src);
    $("#uploaded_image_" + id_no).attr("src", src);
    $("#image_caption_input_" + id_no).val(caption);
}

function setTitleEditorValues(wrapper_id) {
    let id_no = wrapper_id.split("page_title_wrapper_")[1];
    let textarea = $("#title_editor_textarea_" + id_no);
    let text = $("#page_title_" + id_no).html().replaceAll("<br>", "\n");
    textarea.val(text);
    let character_count = calculateCharacterCount(text);
    let word_count = calculateWordCount(text);
    $("#title_character_count_" + id_no).html(character_count);
    $("#title_word_count_" + id_no).html(word_count);
}

function saveTitleEdit(wrapper_id) {
    let id_no = wrapper_id.split("page_title_wrapper_")[1];
    let new_title = $("#title_editor_textarea_" + id_no).val().replaceAll("\n", "<br>").trim();

    if (new_title === "") {
        $("#page_title_error_message_" + id_no).html("Title cannot be blank");
        $("#page_title_error_message_" + id_no).css("display", "block");
    }
    else {
        current_page.title = new_title;
        $("#page_title_" + id_no).html(new_title);
        $("#page_title_wrapper_" + id_no).css("display", "inline-block");
        $("#page_title_editor_wrapper_" + id_no).css("display", "none");
        $("#page_option_" + current_page._id).html(new_title);
        $("#page_title_error_message_" + id_no).css("display", "none");
        removeFromOpenEditors(wrapper_id);
    }
}

function removeFromOpenEditors(wrapper_id) {
    open_editors = jQuery.grep(open_editors, function(value) {
        return value != wrapper_id;
    });

    if (open_editors.length === 0) {
        $("#course_page_names_error_message").css("display", "none");
    }
}

function saveTextBlockEdit(wrapper_id) {
    let id_no = wrapper_id.split("text_block_wrapper_")[1];
    let new_text = $("#text_block_editor_textarea_" + id_no).val().trim().replaceAll("\n", "<br>");
    console.log("wrapper_id: " + wrapper_id);
    console.log("id_no: "+ id_no);
    console.log("Before removal:");
    console.log(JSON.parse(JSON.stringify(open_editors)));

    if (new_text === "") {
        $("#text_block_error_message_" + id_no).html("Text block cannot be blank");
        $("#text_block_error_message_" + id_no).css("display", "block");
    }
    else {
        let current_element = current_page.top_element;
        let found = false;

        while (current_element !== null && !found) {
            if (current_element._id === "text_block_" + id_no) {
                found = true;
                current_element.text = new_text;
                $("#text_block_" + id_no).html(new_text);
                $("#text_block_wrapper_" + id_no).css("display", "inline-block");
                $("#text_block_editor_wrapper_" + id_no).css("display", "none");
                $("#text_block_error_message_" + id_no).css("display", "none");
                removeFromOpenEditors(wrapper_id);
                console.log("after removal:");
                console.log(JSON.parse(JSON.stringify(open_editors)));
            }

            current_element = current_element.child;
        }
    }
}

function setDeleteElementButtons() {
    $(".delete_element_button").click(function() {
        console.log("delete_element_button.CLICK");
        let wrapper_id = $(this).attr("id").split("delete_element_button_")[1];
        console.log("wrapper_id: " + wrapper_id);
        let id_no = "";

        let add_new_element_wrapper_id = "";
        let element_db_id = "";

        if (wrapper_id.includes("image")) {
            id_no = wrapper_id.split("image_wrapper_")[1];
            element_db_id = "image_" + id_no;
            add_new_element_wrapper_id = "add_new_element_wrapper_image_" + id_no;
        }
        else if (wrapper_id.includes("text_block")) {
            console.log("includes text_block");
            id_no = wrapper_id.split("text_block_wrapper_")[1];
            element_db_id = "text_block_" + id_no;
            add_new_element_wrapper_id = "add_new_element_wrapper_text_block_" + id_no;
            console.log("add_newElement_wrapper_id: " + add_new_element_wrapper_id);
        }

        removeElementFromDB(element_db_id);
        $("#" + wrapper_id).remove();
        $("#" + getEditorIdFromWrapperId(wrapper_id)).remove();
        $("#" + add_new_element_wrapper_id).remove();
    })
}

function setCancelEditElementButtons() {
    $(".cancel_edit_element_button").click(function() {
        let wrapper_id = $(this).attr("id").split("cancel_edit_element_button_")[1];
        let id_no = "";

        let current_element = current_page.top_element;
        let found = false;
        let removed = false;
        let add_new_element_wrapper_id = "";
        let element_db_id = "";

        if (wrapper_id.includes("page_title")) {
            id_no = wrapper_id.split("page_title_wrapper_")[1];
            $("#page_title_error_message_" + id_no).css("display", "none");
        }
        else if (wrapper_id.includes("image")) {
            id_no = wrapper_id.split("image_wrapper_")[1];
            element_db_id = "image_" + id_no;
            add_new_element_wrapper_id = "add_new_element_wrapper_image_" + id_no;
        }
        else if (wrapper_id.includes("text_block")) {
            id_no = wrapper_id.split("text_block_wrapper_")[1];
            element_db_id = "text_block_" + id_no;
            add_new_element_wrapper_id = "add_new_element_wrapper_text_block_" + id_no;
            $("#text_block_error_message_" + id_no).css("display", "none");
        }

        while (current_element !== null && ! found) {
            if (("image_" + id_no === current_element._id && current_element.image_src === "/images/default_image.jpg") ||
                ("text_block_" + id_no === current_element._id && current_element.text === "")) {
                    console.log("found");
                found = true;
                removed = true;
                $("#" + wrapper_id).remove();
                $("#" + getEditorIdFromWrapperId(wrapper_id)).remove();
                $("#" + add_new_element_wrapper_id).remove();
                removeElementFromDB(element_db_id);
            }
            
            current_element = current_element.child;
        }

        if (!removed) {
            $("#" + wrapper_id).css("display", "inline-block");
        }
        
        $("#" + getEditorIdFromWrapperId(wrapper_id)).css("display", "none");
        removeFromOpenEditors(wrapper_id);

        console.log(open_editors);
    })
}

function setSaveEditElementButtons() {
    $(".save_edit_element_button").click(function() {
        let wrapper_id = $(this).attr("id").split("save_edit_element_button_")[1];

        if (wrapper_id.includes("title")) {
            saveTitleEdit(wrapper_id);
        }
        else if (wrapper_id.includes("text_block")) {
            saveTextBlockEdit(wrapper_id);
        }
        else if (wrapper_id.includes("image")) {
            saveImageEdit(wrapper_id);
        }
    })
}

function setMoveElementButtons() {
    $(".move_element_up_button").click(function() {
        console.log("move_element_up_button_CLICK");
        let wrapper_id = $(this).attr("id").split("move_element_up_button_")[1];
        let element_db_id = "";
        console.log("wrapper_id: " + wrapper_id);

        if (wrapper_id.includes("text_block")) {
            console.log("is text block");
            let id_no = wrapper_id.split("text_block_wrapper_")[1];
            element_db_id = "text_block_" + id_no;
        }
        else if (wrapper_id.includes("image")) {
            console.log("is image");
            let id_no = wrapper_id.split("image_wrapper_")[1];
            element_db_id = "image_" + id_no;
        }

        moveElementUp(element_db_id);
    })

    $(".move_element_down_button").click(function() {
        console.log("move_element_down_button_CLICK");
        let wrapper_id = $(this).attr("id").split("move_element_down_button_")[1];
        let element_db_id = "";

        if (wrapper_id.includes("text_block")) {
            let id_no = wrapper_id.split("text_block_wrapper_")[1];
            element_db_id = "text_block_" + id_no;
        }
        else if (wrapper_id.includes("image")) {
            let id_no = wrapper_id.split("image_wrapper_")[1];
            element_db_id = "image_" + id_no;
        }

        moveElementDown(element_db_id);
    })
}

function getTemplateTitle(page) {
    let template_title = page.title_lorem_ipsum;

    let template_title_html = 
    "<fieldset class='page_title_wrapper'>" +
        "<legend class='legend'>Title</legend>" +
        "<h1 class='template_title'>" + template_title + "</h1>" +
        "<span class='template_bottom_info_wrapper'>" +
            "<div class='divider'></div>" +
            "<p class='template_bottom_info'>" + calculateWordCount(template_title.replaceAll("<br>", " ")) + " words" +
            "</p>" +
        "</span>"
    "</fieldset>";

    return template_title_html;
}

function getEditorIdFromWrapperId(wrapper_id) {
    if (wrapper_id.includes("page_title")) {
        let editor_id_no = wrapper_id.split("page_title_wrapper_")[1];
        return "page_title_editor_wrapper_" + editor_id_no;
    }
    else if (wrapper_id.includes("text_block")) {
        let editor_id_no = wrapper_id.split("text_block_wrapper_")[1];
        return "text_block_editor_wrapper_" + editor_id_no;
    }
    else if (wrapper_id.includes("image")) {
        let editor_id_no = wrapper_id.split("image_wrapper_")[1];
        return "image_editor_wrapper_" + editor_id_no;
    }
}

function getEditorIdFromDatabaseId(db_id) {
    if (db_id.includes("course_page")) {
        let id_no = db_id.split("course_page_")[1];
        return "page_title_editor_wrapper_" + id_no;
    }
    else if (db_id.includes("text_block")) {
        let id_no = db_id.split("text_block_")[1];
        return "text_block_editor_wrapper_" + id_no;
    }
    else if (db_id.includes("image")) {
        let id_no = db_id.split("image_")[1];
        return "image_editor_wrapper_" + id_no;
    }
}

function getWrapperIdFromDatabaseId(db_id) {
    if (db_id.includes("course_page")) {
        let id_no = db_id.split("course_page_")[1];
        return "page_title_wrapper_" + id_no;
    }
    else if (db_id.includes("text_block")) {
        let id_no = db_id.split("text_block_")[1];
        return "text_block_wrapper_" + id_no;
    }
    else if (db_id.includes("image")) {
        let id_no = db_id.split("image_")[1];
        return "image_wrapper_" + id_no;
    }
}

function getAddNewElementIdFromDatabaseId(db_id) {
    return "add_new_element_wrapper_" + db_id;
}

function getDatabaseIdFromWrapper(wrapper_id) {
    if (wrapper_id.includes("text_block")) {
        let splitter = "";

        if (wrapper_id.includes("editor")) {
            splitter = "text_block_editor_wrapper_";
        }
        else {
            splitter = "text_block_wrapper_";
        }

        let id_no = wrapper_id.split(splitter)[1];
        return "text_block_" + id_no;
    }
    else if (wrapper_id.includes("image")) {
        let splitter = "";

        if (wrapper_id.includes("editor")) {
            splitter = "image_editor_wrapper_";
        }
        else {
            splitter = "image_wrapper_";
        }

        let id_no = wrapper_id.split(splitter)[1];
        return "image_" + id_no;
    }

    return null;
}

function getTitleElement() {
    let id_no = current_page._id.split("course_page_")[1];
    let title_html = "";

    if (user_view) {
        title_html =
        "<div id='page_title_wrapper_" + id_no + "' class='page_title_wrapper page_element'>" +
            "<h1 id='page_title_" + id_no + "'>" + current_page.title + "</h1>" +
        "</div>";
    }
    else {
        title_html =
        "<fieldset id='page_title_wrapper_" + id_no + "' class='page_title_wrapper page_element'>" +
            "<legend class='legend'>Title</legend>" +
            "<h1 id='page_title_" + id_no + "'>" + current_page.title + "</h1>" +
            "<div class='divider'></div>" +
            "<input id='edit_element_button_page_title_wrapper_" + id_no + "' class='edit_element_button' type='button' value='Edit'></input>" +
        "</fieldset>";
    }

    return title_html;
}

function getTitleEditor() {
    let id_no = current_page._id.split("course_page_")[1];

    let title_html =
    "<fieldset id='page_title_editor_wrapper_" + id_no + "' class='page_element_editor page_title_editor_wrapper'>" +
        "<legend class='legend'>Title Editor</legend>" +
        "<textarea id='title_editor_textarea_" + id_no + "' class='title_editor_textarea' rows='3'></textarea>" +
        "<p id='page_title_error_message_" + id_no + "' class='page_title_error_message'></p>" +
        "<p class='word_character_counts'><span id='title_word_count_" + id_no + "'>0</span> words " +
            "| <span id='title_character_count_" + id_no + "'>0</span> characters" +
        "</p>" +
        "<div class='divider'></div>" +
        "<input id='save_edit_element_button_page_title_wrapper_" + id_no + "' class='save_edit_element_button' type='button' value='Save'></input>" +
        "<input id='cancel_edit_element_button_page_title_wrapper_" + id_no + "' class='cancel_edit_element_button' type='button' value='Cancel'></input>" +
    "</fieldset>";

    return title_html;
}

function getTextBlock(text_block) {
    let id_no = text_block._id.split("text_block_")[1];
    let text_block_html = "";

    if (user_view) {
        text_block_html =
        "<div id='text_block_wrapper_" + id_no + "' class='page_element text_block'>" +
            "<p id='" + text_block._id + "' class='text_block'>" + text_block.text + "</p>" +
        "</div>";
    }
    else {
        text_block_html =
        "<fieldset id='text_block_wrapper_" + id_no + "' class='page_element text_block_wrapper'>" +
            "<legend class='legend'>Text Block</legend>" +
            "<p id='" + text_block._id + "' class='text_block'>" + text_block.text + "</p>" +
            "<div class='divider'></div>" +
            "<input id='edit_element_button_text_block_wrapper_" + id_no + "' class='edit_element_button' type='button' value='Edit'></input>" +
            "<input id='delete_element_button_text_block_wrapper_" + id_no + "' class='delete_element_button' type='button' value='Delete'></input>" +
            "<input id='move_element_up_button_text_block_wrapper_" + id_no + "' class='move_element_up_button' type='button' value='Move Up'></input>" +
            "<input id='move_element_down_button_text_block_wrapper_" + id_no + "' class='move_element_down_button' type='button' value='Move Down'></input>" +
        "</fieldset>";
    }

    return text_block_html;
}

/**
 * Method for getting HTML for a text editor
 * @param {*} item Text block item
 * @returns HTML for a text editor
 */
function getTextBlockEditor(element) {
    let id_no = element._id.split("text_block_")[1];
    
    let editor_html =
    "<fieldset id='text_block_editor_wrapper_" + id_no + "' class='page_element_editor text_block_editor_wrapper'>" +
        "<legend class='legend'>Text Block Editor</legend>" +
        "<textarea id='text_block_editor_textarea_" + id_no + "' class='text_block_editor_textarea' rows='10'></textarea>" + 
        "<p id='text_block_error_message_" + id_no + "' class='text_block_error_message'></p>" +
        "<p class='word_character_counts'><span id='text_block_word_count_" + id_no + "'>0</span> words " +
            "| <span id='text_block_character_count_" + id_no + "'>0</span> characters" +
        "</p>" +
        "<div class='divider'></div>" +
        "<input id='save_edit_element_button_text_block_wrapper_" + id_no + "' class='save_edit_element_button' type='button' value='Save'></input>" +
        "<input id='cancel_edit_element_button_text_block_wrapper_" + id_no + "' class='cancel_edit_element_button' type='button' value='Cancel'></input>" +
    "</fieldset>";

    return editor_html;
}

function getTemplateTextBlock(text_block) {
    let text = text_block.text_lorem_ipsum;

    let element_html =
    "<fieldset id='" + text_block._id + "' class='page_element template_text_block_wrapper'>" +
        "<legend class='legend'>Text Block</legend>" +
        "<p id='" + text_block._id + "' class='template_text_block'>" + text + "</p>" +
        "<div class='divider'></div>" +
        "<p class='template_bottom_info'>" + calculateWordCount(text.replaceAll("<br>", " ")) + " words</p>" +
    "</fieldset>";

    return element_html;
}

function getImageElement(element) {
    let id_no = element._id.split("image_")[1];
    let caption_style = "style='display: block'";

    if (element.caption === "") {
        caption_style = "style='display: none'";
    }

    let caption_html =
    "<p id='image_caption_" + id_no + "' class='image_caption' " + caption_style + ">" +
        "<i>" + element.caption + "</i>" +
    "</p>";

    let image_html = "";

    if (user_view) {
        image_html =
        "<div id='image_wrapper_" + id_no + "' class='image_wrapper page_element'>" +
            "<img id='image_" + id_no + "' src='" + element.image_src +
                "' class='image_element' onerror='imageSrcError(this.id)'>" +
            caption_html +
        "</div>";
    }
    else {
        image_html = 
        "<fieldset id='image_wrapper_" + id_no + "' class='image_wrapper page_element'>" +
            "<legend class='legend'>Image</legend>" +
            "<img id='image_" + id_no + "' src='" + element.image_src +
                "' class='image_element' onerror='imageSrcError(this.id)'>" +
            caption_html +
            "<div class='divider'></div>" +
            "<input id='edit_element_button_image_wrapper_" + id_no + "' class='edit_element_button' type='button' value='Edit'></input>" +
            "<input id='delete_element_button_image_wrapper_" + id_no + "' class='delete_element_button' type='button' value='Delete'></input>" +
            "<input id='move_element_up_button_image_wrapper_" + id_no + "' class='move_element_up_button' type='button' value='Move Up'></input>" +
            "<input id='move_element_down_button_image_wrapper_" + id_no + "' class='move_element_down_button' type='button' value='Move Down'></input>" +
        "</fieldset>";
    }

    return image_html;
}

function getImageEditor(element) {
    let id_no = element._id.split("image_")[1];
    let image_src = element.image_src;

    let editor_html =
    "<fieldset id='image_editor_wrapper_" + id_no + "' class='image_editor_wrapper page_element_editor'>" +
        "<legend class='legend'>Image Editor</legend>" +
        "<div class='image_link_wrapper'>" +
            "<input id='image_link_input_" + id_no + "' type='url' class='image_link_input' placeholder='Insert image link here...'>" +
            "<input id='image_link_button_" + id_no + "' type='button' class='image_link_button' value='Add Image'>" +
        "</div>" +

        "<p id='image_upload_error_message_" + id_no + "' class='image_upload_error_message'>" +
            "Error: please input a valid image URL" +
        "</p>" +

        "<div id='uploaded_image_wrapper_" + id_no + "' class='uploaded_image_wrapper'>" +
            "<img id='uploaded_image_" + id_no + "' class='uploaded_image' src='" + image_src + "'" +
                "onerror='imageSrcError(this.id)' onload='imageSrcSuccess(this.id)'>" +
        "</div>" +

        "<div class='image_caption_wrapper'>" +
            "<input id='image_caption_input_" + id_no + "' type='text' class='image_caption_input' placeholder='Insert image caption here... (optional)'>" +
        "</div>" +
        "<div class='divider'></div>" +
        "<input id='save_edit_element_button_image_wrapper_" + id_no + "' type='button' class='save_edit_element_button' value='Save'>" +
        "<input id='cancel_edit_element_button_image_wrapper_" + id_no + "' class='cancel_edit_element_button' type='button' value='Cancel'></input>" +
    "</fieldset>"

    return editor_html;
}

function createTemplate() {
    template.pages.forEach(function(page) {
        let title = page.title;
        let title_array = convertTextToLoremIpsum(title);
        title_array[title_array.length - 1] = title_array[title_array.length - 1].substring(0, title_array[title_array.length - 1].length - 1);
        let title_lorem_ipsum = "";

        title_array.forEach(function(word, i) {
            if (i !== 0 && title_array[i] !== '<br>' && title_array[i - 1] !== '<br>') {
                title_lorem_ipsum += " ";
            }

            title_lorem_ipsum += word;
        })

        page.title_lorem_ipsum = title_lorem_ipsum;

        let current_element = page.top_element;
        while (current_element !== null) {
            if (current_element._id.includes("text_block")) {
                let text_array = convertTextToLoremIpsum(current_element.text);
                let text_lorem_ipsum = "";

                text_array.forEach(function(word, i) {
                    if (i !== 0 && text_array[i] !== '<br>' && text_array[i - 1] !== '<br>') {
                        text_lorem_ipsum += " ";
                    }

                    text_lorem_ipsum += word;
                })

                current_element.text_lorem_ipsum = text_lorem_ipsum;
            }

            current_element = current_element.child;
        }
    })
}

/**
 * Method for filtering out spaces from an array of strings
 * @param {*} word Word being checked
 * @returns True if word is not a space
 */
function noSpaces(word) {
    return word !== "";
}

var course = {
    pages: [
        {
            _id: "course_page_50485045",
            title: "Iron Man (2008)",
            top_element: {
                _id: "text_block_03853058",
                text: "Iron Man is a 2008 American superhero film based on the Marvel Comics character of the same name. " +
                    "Produced by Marvel Studios and distributed by Paramount Pictures, it is the first film in the Marvel Cinematic "+
                    "Universe (MCU). Directed by Jon Favreau from a screenplay by the writing teams of Mark Fergus and Hawk Ostby, and " +
                    "Art Marcum and Matt Holloway, the film stars Robert Downey Jr. as Tony Stark / Iron Man alongside Terrence Howard, " +
                    "Jeff Bridges, Gwyneth Paltrow, Leslie Bibb, and Shaun Toub.<br><br>" +
                    "In the film, following his escape from captivity by a terrorist group, world famous industrialist and master " +
                    "engineer Tony Stark builds a mechanized suit of armor and becomes the superhero Iron Man.",
                child: {
                    _id: "image_284082408",
                    image_src: "https://mutantreviewers.files.wordpress.com/2011/07/iron-man.jpg",
                    caption: "Iron Man (dir. Jon Favreau)",
                    child: {
                        _id: "text_block_22424343434",
                        text: "A film featuring the character was in development at Universal Pictures, 20th Century Fox, " +
                        "and New Line Cinema at various times since 1990, before Marvel Studios reacquired the rights in 2005. " +
                        "Marvel put the project in production as its first self-financed film, with Paramount Pictures " +
                        "distributing. Favreau signed on as director in April 2006, and faced opposition from Marvel when " +
                        "trying to cast Downey in the title role; the actor was signed in September.<br><br>Filming took place from " +
                        "March to June 2007, primarily in California to differentiate the film from numerous other superhero " +
                        "stories that are set in New York City-esque environments. During filming, the actors were free to " +
                        "create their own dialogue because pre-production was focused on the story and action. Rubber and " +
                        "metal versions of the armor, created by Stan Winston's company, were mixed with computer-generated " +
                        "imagery to create the title character.",
                        child: null
                    }
                }
            }
        },
        {
            _id: "course_page_08504850",
            title: "The Incredible Hulk (2008)",
            top_element: {
                _id: "text_block_919324084",
                text: "The Incredible Hulk is a 2008 American superhero film based on the Marvel Comics character the Hulk. " +
                    "Produced by Marvel Studios and distributed by Universal Pictures, it is the second film in the Marvel " +
                    "Cinematic Universe (MCU). It was directed by Louis Leterrier from a screenplay by Zak Penn, and stars " +
                    "Edward Norton as Bruce Banner alongside Liv Tyler, Tim Roth, William Hurt, Tim Blake Nelson, Ty Burrell, " +
                    "and Christina Cabot.<br><br>In the film, Bruce Banner becomes the Hulk as an unwitting pawn in a military scheme " +
                    "to reinvigorate the Super-Soldier program through gamma radiation. Banner goes on the run from the military " +
                    "while attempting to cure himself of the Hulk.",
                child: {
                    _id: "image_403840934",
                    image_src: "https://static.onecms.io/wp-content/uploads/sites/6/2018/03/the-hulk-2000.jpg",
                    caption: "The Incredible Hulk (dir. Louis Leterrier)",
                    child: null
                }
            }
        }
    ]
}

var template = {
    pages: [
        {
            _id: "template_page_9248385835",
            title: "Aquaman (2018)",
            top_element: {
                _id: "text_block_55255636",
                text: "Aquaman is a 2018 American superhero film based on the DC character of the same name. " +
                "Produced by DC Entertainment and Peter Safran Productions and distributed by Warner Bros. Pictures, " +
                "it is the sixth film in the DC Extended Universe (DCEU). The film was directed by James Wan from a " +
                "screenplay by David Leslie Johnson-McGoldrick and Will Beall.<br><br>It stars Jason Momoa as Arthur Curry / " +
                "Aquaman, who sets out to lead the underwater kingdom of Atlantis and stop his half-brother, King Orm, " +
                "from uniting the seven underwater kingdoms to destroy the surface world. Amber Heard, Willem Dafoe, " +
                "Patrick Wilson, Dolph Lundgren, Yahya Abdul-Mateen II, and Nicole Kidman appear in supporting roles.",
                child: {
                    _id: "image_2438384",
                    image_src: "https://m.media-amazon.com/images/M/MV5BMjE2MDg1OTg5NF5BMl5BanBnXkFtZTgwMTIwMTg0NjM@._V1_.jpg",
                    caption: "Aquaman (dir. James Wan)",
                    child: null
                }
            }
        },
        {
            _id: "template_page_2842740",
            title: "Wonder Woman (2017)",
            top_element: {
                _id: "text_block_243535",
                text: "Wonder Woman is a 2017 superhero film based on the DC Comics character of the same name. " +
                "Produced by Warner Bros. Pictures, DC Films, Atlas Entertainment and Cruel and Unusual Films, and "+
                "distributed by Warner Bros. Pictures, it is the fourth installment of the DC Extended Universe (DCEU), " +
                "and a prequel/spin-off to Batman v Superman: Dawn of Justice (2016). Directed by Patty Jenkins and " +
                "written by Allan Heinberg from a story by Heinberg, Zack Snyder and Jason Fuchs, Wonder Woman stars Gal " +
                "Gadot in the title role, alongside Chris Pine, Robin Wright, Danny Huston, David Thewlis, Connie Nielsen " +
                "and Elena Anaya.<br><br>It is the second live action theatrical film featuring Wonder Woman following her debut " +
                "in Batman v Superman: Dawn of Justice. In Wonder Woman, the Amazon princess Diana sets out to stop " +
                "World War I, believing the conflict was started by the longtime enemy of the Amazons, Ares, after " +
                "American pilot and spy Steve Trevor crash-lands on their island Themyscira and informs her about it.",
                child: {
                    _id: "image_2443434",
                    image_src: "https://static01.nyt.com/images/2017/06/02/arts/02WONDER/02WONDER-superJumbo.jpg",
                    caption: "Wonder Woman (dir. Patty Jenkins)",
                    child: null
                }
            }
        }
    ]
}

let lorem_ipsum = "lorem ipsum dolor sit amet consectetur adipiscing elit nulla purus odio aliquet at sagittis et pellentesque " +
"eget dui nullam non felis volutpat posuere eros nec tristique erat donec posuere imperdiet placerat etiam vitae dolor in metus " +
"auctor gravida id eget justo lorem ipsum dolor sit amet consectetur adipiscing elit aliquam mattis augue in tempor vulputate " +
"purus enim cursus nisl eget iaculis tortor neque vel quam fusce feugiat varius libero vitae elementum lorem cursus eu praesent " +
"leo augue cursus auctor tristique nec ultricies vitae elit etiam eleifend efficitur erat ut viverra nibh feugiat vel donec " +
"porttitor neque a bibendum facilisis morbi scelerisque diam nec ipsum eleifend euismod praesent ullamcorper magna at aliquam " +
"vestibulum nisl diam mattis mi cursus feugiat leo enim a libero cras porta egestas felis ac ullamcorper libero tincidunt " +
"congue aliquam egestas sapien a neque lobortis finibus duis ultricies mi vitae tempus tincidunt est ante varius sapien nec " +
"pharetra urna felis vel dolor pellentesque scelerisque elit non urna viverra varius ultrices elit pellentesque aliquam orci " +
"urna tincidunt quis odio sed vestibulum commodo nunc cras id dictum nunc non maximus purus aenean scelerisque nisi metus quis " +
"gravida purus suscipit eu duis id mi risus pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis " +
"egestas sed at congue velit aliquam tellus enim auctor ut vehicula quis tincidunt id mi in aliquam volutpat urna vel lacinia " +
"phasellus semper massa sit amet lobortis cursus nam sed dui molestie tempus urna at sodales justo aenean ullamcorper tempus " +
"tristique nulla tellus orci malesuada eu tempus sit amet placerat at mi praesent pulvinar vitae magna nec venenatis ut risus " +
"arcu accumsan non mauris eget gravida consequat leo donec fermentum nibh leo quis finibus neque ullamcorper eu phasellus neque " +
"purus venenatis id quam et dictum lacinia quam suspendisse mattis magna sed justo elementum quis ullamcorper ligula faucibus " +
"etiam congue volutpat turpis ut consectetur pellentesque eu sem sem sed nec libero vitae lacus commodo lobortis phasellus ex " +
"diam tempus et ex pulvinar volutpat ultricies leo morbi leo neque varius vel nisl non efficitur dictum leo etiam nec mattis " +
"magna ut lobortis leo sit amet elit dictum ac bibendum neque tristique donec orci risus rhoncus ac metus ut porta convallis " +
"sem vivamus diam odio ultricies vitae ultricies in tristique quis libero donec mollis turpis sit amet orci fringilla aliquet " +
"nec ut elit donec semper nibh quis nunc feugiat euismod in facilisis imperdiet lacus nec euismod massa convallis id mauris " +
"vel rutrum mauris mauris risus lectus pretium at sem at iaculis viverra nulla suspendisse non luctus tortor quisque egestas " +
"purus sapien et porttitor turpis varius sed donec sed turpis et libero tincidunt hendrerit curabitur efficitur metus vel " +
"neque euismod iaculis mauris placerat efficitur venenatis quisque quis magna laoreet vestibulum sapien at vulputate ipsum " +
"pellentesque ut dignissim nunc et tincidunt ipsum"