var open_editors = [];  // Contains IDs of editors currently open

// Title

function getTitleEditor() {
    let id_no = current_page._id/*.split("course_page_")[1]*/;

    let title_html =
    "<fieldset id='page_title_editor_wrapper_" + id_no + "' class='page_element_editor page_title_editor_wrapper'>" +
        "<legend class='legend'>Title Editor</legend>" +
        "<p class='editor_header'>Title</p>" +
        "<textarea id='title_editor_textarea_" + id_no + "' class='title_editor_textarea' rows='3' placeholder='Enter title here...'></textarea>" +
        "<p id='page_title_error_message_" + id_no + "' class='page_error_message'></p>" +
        "<p class='word_character_counts'><span id='title_editor_word_count_" + id_no + "'>0</span> words " +
            "| <span id='title_editor_character_count_" + id_no + "'>0</span> characters" +
        "</p>" +
        "<div class='divider'></div>" +
        "<input id='save_edit_element_button_page_title_wrapper_" + id_no + "' class='save_edit_element_button white_button leftmost_button' type='button' value='Save'></input>" +
        "<input id='cancel_edit_element_button_page_title_wrapper_" + id_no + "' class='cancel_edit_element_button white_button rightmost_button' type='button' value='Cancel'></input>" +
    "</fieldset>";

    return title_html;
}

function setTitleEditorValues(wrapper_id) {
    let id_no = wrapper_id.split("page_title_wrapper_")[1];
    let textarea = $("#title_editor_textarea_" + id_no);
    let text = $("#page_title_" + id_no).html().replaceAll("<br>", "\n");
    textarea.val(text);
    let character_count = calculateCharacterCount(text.replaceAll("\n", ""));
    let word_count = calculateWordCount(text.replaceAll("\n", " "));
    $("#title_editor_character_count_" + id_no).html(character_count);
    $("#title_editor_word_count_" + id_no).html(word_count);
}

function saveTitleEdit(wrapper_id) {
    let id_no = wrapper_id.split("page_title_wrapper_")[1];
    let new_title = $("#title_editor_textarea_" + id_no).val();

    let query = {
        _id: course._id,
        'page._id': current_page._id
    }

    let update = {
        'pages.$[page].title': new_title
    }

    let options = {
        arrayFilters: [
            {
                'page._id': current_page._id
            }
        ]
    }

    let data = {
        query: JSON.stringify(query),
        update: JSON.stringify(update),
        options: JSON.stringify(options)
    }

    $.post("/update_course_page_title", data, function(res) {
        console.log("Response:");
        console.log(res);
        if (res.errors.length > 0) {
            let title_error = false;

            res.errors.forEach(function(error) {
                console.log("error");
                if (error.error_type === "title_error") {
                    console.log("error is title_error");
                    title_error = true;
                    $("#page_title_error_message_" + current_page._id).html(error.error_message);
                    $("#page_title_error_message_" + current_page._id).css("display", "block");
                }
                else {
                    console.log(error.error_message);
                }
            })

            if (!title_error) {
                $("#page_title_error_message").css("display", "none");
            }
        }
        else {
            let word_count = calculateWordCount(new_title.replaceAll("<br>", " "));
            current_page.title = new_title;
            $("#page_title_" + id_no).html(new_title);
            $("#title_word_count_" + current_page._id).html(word_count);
            $("#page_title_wrapper_" + id_no).css("display", "inline-block");
            $("#page_title_editor_wrapper_" + id_no).css("display", "none");
            $("#page_option_" + current_page._id).html(new_title);
            $("#page_title_error_message_" + id_no).css("display", "none");
            removeFromOpenEditors(wrapper_id);
            setAlert("Title edit saved", "good", 3000);
        }
    })
}

// Text Block

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
        "<p class='editor_header'>Text</p>" +
        "<textarea id='text_block_editor_textarea_" + id_no + "' class='text_block_editor_textarea' rows='10' placeholder='Enter text here...'></textarea>" + 
        "<p id='text_block_error_message_" + id_no + "' class='page_error_message'></p>" +
        "<p class='word_character_counts'><span id='text_block_editor_word_count_" + id_no + "'>0</span> words " +
            "| <span id='text_block_editor_character_count_" + id_no + "'>0</span> characters" +
        "</p>" +
        "<div class='divider'></div>" +
        "<input id='save_edit_element_button_text_block_wrapper_" + id_no + "' class='save_edit_element_button white_button leftmost_button' type='button' value='Save'></input>" +
        "<input id='cancel_edit_element_button_text_block_wrapper_" + id_no + "' class='cancel_edit_element_button white_button rightmost_button' type='button' value='Cancel'></input>" +
    "</fieldset>";

    return editor_html;
}

function setTextBlockEditorValues(wrapper_id) {
    let id_no = wrapper_id.split("text_block_wrapper_")[1];
    let textarea = $("#text_block_editor_textarea_" + id_no);
    let text = $("#text_block_" + id_no).html().replaceAll("<br>", "\n");
    textarea.val(text);
    let character_count = calculateCharacterCount(text.replaceAll("\n", ""));
    let word_count = calculateWordCount(text.replaceAll("\n", " "));
    $("#text_block_editor_character_count_" + id_no).html(character_count);
    $("#text_block_editor_word_count_" + id_no).html(word_count);
}

function saveTextBlockEdit(wrapper_id) {
    let id_no = wrapper_id.split("text_block_wrapper_")[1];
    let new_text = $("#text_block_editor_textarea_" + id_no).val();
    let parent_element_id = "";
    let element = undefined;

    // If the text block being added/updated is the top element
    if (current_page.top_element._id === "text_block_" + id_no) {
        parent_element_id = current_page._id;
        element = current_page.top_element;
    }
    // If the text block being added/updated is not the top element
    else {
        let previous_element = current_page.top_element || null;
        let current_element = current_page.top_element.child || null;
        let found = false;

        while (current_element !== null && !found) {
            if (current_element._id === "text_block_" + id_no) {
                found = true;
                element = current_element;
                parent_element_id = previous_element._id;
            }

            previous_element = current_element;
            current_element = current_element.child;
        }
    }

    let data = {
        course_id: course._id,
        page_id: current_page._id,
        element: JSON.stringify(element),
        parent_element_id: parent_element_id,
        text_block_text: new_text,
    }

    $.post("/update_course_page_element", data, function(res) {
        console.log(res);
        if (res.errors.length > 0) {
            let text_block_error = false;

            res.errors.forEach(function(error) {
                if (error.error_type === "info_not_found") {
                    setAlert(error.error_message, "bad", 3000);
                }
                else if (error.error_type === "user_error") {
                    setAlert(error.error_message, "bad", 3000);
                }
                else if (error.error_type === "db_error") {
                    setAlert(error.error_message, "bad", 3000);
                }
                else if (error.error_type === "text_block_error") {
                    text_block_error = true;
                    $("#text_block_error_message_" + id_no).html(error.error_message);
                    $("#text_block_error_message_" + id_no).css("display", "block");
                }

                if (!text_block_error) {
                    $("#text_block_error_message_" + id_no).css("display", "none");
                }
            })
        }
        else {
            element.text = new_text.trim().replaceAll("\n", "<br>");
            $("#text_block_" + id_no).html(element.text);
            let word_count = calculateWordCount(new_text.replaceAll("<br>", " "));
            $("#text_block_word_count_" + id_no).html(word_count);
            $("#text_block_wrapper_" + id_no).css("display", "inline-block");
            $("#text_block_editor_wrapper_" + id_no).css("display", "none");
            $("#text_block_error_message_" + id_no).css("display", "none");
            removeFromOpenEditors(wrapper_id);
            setAlert("Text block edit saved", "good", 3000);
        }
    })
}

// Image

function getImageEditor(element) {
    let id_no = element._id.split("image_")[1];
    let image_src = element.image_src;

    let editor_html =
    "<fieldset id='image_editor_wrapper_" + id_no + "' class='image_editor_wrapper page_element_editor'>" +
        "<legend class='legend'>Image Editor</legend>" +
        "<p class='editor_header'>Image URL</p>" +
        "<div class='image_link_wrapper'>" +
            "<input id='image_link_input_" + id_no + "' type='url' class='image_link_input' placeholder='Enter image URL here...'>" +
            "<input id='image_link_button_" + id_no + "' type='button' class='image_link_button white_button' value='Add Image'>" +
        "</div>" +

        "<p id='image_upload_error_message_" + id_no + "' class='page_error_message'>" +
            "Error: please input a valid image URL" +
        "</p>" +

        "<div id='uploaded_image_wrapper_" + id_no + "' class='uploaded_image_wrapper'>" +
            "<img id='uploaded_image_" + id_no + "' class='uploaded_image' src='" + image_src + "'" +
                "onerror='imageSrcError(this.id)' onload='imageSrcSuccess(this.id)'>" +
        "</div>" +

        "<div class='image_caption_wrapper'>" +
            "<p class='editor_header'>Image Caption</p>" +
            "<input id='image_caption_input_" + id_no + "' type='text' class='image_caption_input' placeholder='Insert image caption here... (optional)'>" +
        "</div>" +
        "<div class='divider'></div>" +
        "<input id='save_edit_element_button_image_wrapper_" + id_no + "' type='button' class='save_edit_element_button white_button leftmost_button' value='Save'>" +
        "<input id='cancel_edit_element_button_image_wrapper_" + id_no + "' class='cancel_edit_element_button white_button rightmost_button' type='button' value='Cancel'></input>" +
    "</fieldset>"

    return editor_html;
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

function setImageEditors() {
    $(".image_link_button").unbind("click");
    $(".image_link_button").click(function() {
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
}

function saveImageEdit(wrapper_id) {
    let id_no = wrapper_id.split("image_wrapper_")[1];
    let image_src = $("#uploaded_image_" + id_no).attr("src");
    let image_caption = $("#image_caption_input_" + id_no).val().trim();
    let parent_element_id = "";
    let element = undefined;

    // If the image being added/updated is the top element
    if (current_page.top_element._id === "image_" + id_no) {
        parent_element_id = current_page._id;
        element = current_page.top_element;
    }
    // If the image being added/updated is not the top element
    else {
        let previous_element = current_page.top_element || null;
        let current_element = current_page.top_element.child || null;
        let found = false;

        while (current_element !== null && !found) {
            if (current_element._id === "image_" + id_no) {
                found = true;
                element = current_element;
                parent_element_id = previous_element._id;
            }

            previous_element = current_element;
            current_element = current_element.child;
        }
    }

    let data = {
        course_id: course._id,
        page_id: current_page._id,
        element: JSON.stringify(element),
        parent_element_id: parent_element_id,
        image_src: image_src,
        image_caption: image_caption
    }

    $.post("/update_course_page_element", data, function(res) {
        console.log(res);
        if (res.errors.length > 0) {
            let image_src_error = false;
            res.errors.forEach(function(error) {
                if (error.error_type === "info_not_found") {
                    setAlert(error.error_message, "bad", 3000);
                }
                else if (error.error_type === "user_error") {
                    setAlert(error.error_message, "bad", 3000);
                }
                else if (error.error_type === "db_error") {
                    setAlert(error.error_message, "bad", 3000);
                }
                else if (error.error_type === "image_src_error") {
                    image_src_error = true;
                    $("#image_upload_error_message_" + id_no).html(error.error_message);
                    $("#image_upload_error_message_" + id_no).css("display", "block");
                }

                if (!image_src_error) {
                    $("#image_upload_error_message_" + id_no).css("display", "none");
                }
            })
        }
        else {
            element.image_src = image_src;
            element.caption = image_caption.trim();
            // Set image element src
            $("#image_" + id_no).attr("src", image_src);
            $("#image_caption_word_count_" + id_no).html(calculateWordCount(image_caption.replaceAll("<br>", " ")))
            // Display image element, hide editor
            $("#" + wrapper_id).css("display", "inline-block");
            $("#image_editor_wrapper_" + id_no).css("display", "none");
            removeFromOpenEditors(wrapper_id);
            setAlert("Image edit saved", "good", 3000);

            let caption_html = "<i>" + image_caption + "</i>";
            $("#image_caption_" + id_no).html(caption_html);

            if (image_caption === "") {
                $("#image_caption_" + id_no).css("display", "none");
            }
            else {
                $("#image_caption_" + id_no).css("display", "block");
            }
        }
    })
}

// Video

function getVideoLinkEditor(video) {
    let id_no = video._id.split("video_link_")[1];
    let img_src = "/images/default_image.jpg";

    let options_html = "<option value='Select a Video File'>Select a Video File</option>";
    videos_and_thumbnails.forEach(function(video_and_thumbnail) {
        let value = video_and_thumbnail.video_src;
        let text = value.split("/videos/")[1];
        options_html += "<option value='" + value + "'>" + text + "</option>"
    })

    let video_link_editor_html =
    "<fieldset id='video_link_editor_wrapper_" + id_no + "' class='video_link_editor_wrapper page_element_editor'>" +
        "<legend class='legend'>Video Editor</legend>" +

        "<div id='video_link_editor_thumbnail_wrapper_" + id_no + "' class='video_link_editor_thumbnail_wrapper'>" +
            "<img id='video_link_editor_thumbnail_" + id_no + "' class='video_link_editor_thumbnail' src='" + img_src + "'>" +
        "</div>" +

        "<div id='video_link_editor_video_dropdown_wrapper_" + id_no + "' class='video_link_editor_video_dropdown_wrapper'>" +
            "<p class='editor_header'>Video File</p>" +
            "<select id='video_link_editor_video_dropdown_" + id_no + "' class='video_link_editor_video_dropdown'>" +
                options_html +
            "</select>" +
            "<p id='video_link_video_file_error_message_" + id_no + "' class='page_error_message'></p>" +
        "</div>" +

        "<div id='video_link_editor_title_wrapper_" + id_no + "'>" +
            "<p class='editor_header'>Video Title</p>" +
            "<textarea id='video_link_editor_title_textarea_" + id_no + "' class='video_link_editor_title_textarea' " +
                "placeholder='Enter video title here...' rows='3'>" +
            "</textarea>" +
            "<p id='video_link_title_error_message_" + id_no + "' class='page_error_message'></p>" +
            "<p class='word_character_counts'><span id='video_link_editor_title_word_count_" + id_no + "'>0</span> words | " +
                "<span id='video_link_editor_title_character_count_" + id_no + "'>0</span> characters" +
            "</p>" +
        "</div>" +

        "<div id='video_link_editor_description_wrapper_" + id_no + "'>" +
            "<p class='editor_header'>Video Description</p>" +
            "<textarea id='video_link_editor_description_textarea_" + id_no + "' " +
                "class='video_link_editor_description_textarea' placeholder='Enter video description here...' rows='10'>" +
            "</textarea>" +
            "<p id='video_link_description_error_message_" + id_no + "' class='page_error_message'></p>" +
            "<p class='word_character_counts'><span id='video_link_editor_description_word_count_" + id_no + "'>0</span> words | " +
                "<span id='video_link_editor_description_character_count_" + id_no + "'>0</span> characters" +
            "</p>" +
        "</div>" +

        "<div class='divider'></div>" +
        "<input id='save_edit_element_button_video_link_wrapper_" + id_no + "' type='button' class='save_edit_element_button white_button leftmost_button' value='Save'>" +
        "<input id='cancel_edit_element_button_video_link_wrapper_" + id_no + "' class='cancel_edit_element_button white_button rightmost_button' type='button' value='Cancel'></input>" +
    "</fieldset>"

    return video_link_editor_html;
}

function setVideoLinkEditorValues(wrapper_id) {
    let id_no = wrapper_id.split("video_link_wrapper_")[1];
    let title = "";
    let description = "";
    let thumbnail_src = "";
    let video_src = "Select a Video File";
    
    let found = false;
    let current_element = current_page.top_element;

    while (current_element !== null && !found) {
        if (current_element._id === "video_link_" + id_no) {
            title = current_element.title.trim().replaceAll("<br>", "\n");
            description = current_element.description.trim().replaceAll("<br>", "\n");
            thumbnail_src = current_element.thumbnail;
            video_src = current_element.video_src;
        }

        current_element = current_element.child;
    }

    $("#video_link_editor_title_textarea_" + id_no).val(title);
    $("#video_link_editor_description_textarea_" + id_no).val(description);
    $("#video_link_editor_thumbnail_" + id_no).attr("src", thumbnail_src);
    $("#video_link_editor_video_dropdown_" + id_no).val(video_src);
    let title_character_count = calculateCharacterCount(title.replaceAll("\n", ""));
    let title_word_count = calculateWordCount(title.replaceAll("\n", " "));
    let description_character_count = calculateCharacterCount(description.replaceAll("\n", ""));
    let description_word_count = calculateWordCount(description.replaceAll("\n", " "));
    $("#video_link_editor_title_character_count_" + id_no).html(title_character_count);
    $("#video_link_editor_title_word_count_" + id_no).html(title_word_count);
    $("#video_link_editor_description_character_count_" + id_no).html(description_character_count);
    $("#video_link_editor_description_word_count_" + id_no).html(description_word_count);
    $("#video_link_video_file_error_message_" + id_no).css("display", "none");
    $("#video_link_title_error_message_" + id_no).css("display", "none");
    $("#video_link_description_error_message_" + id_no).css("display", "none");
}

function saveVideoLinkEdit(wrapper_id) {
    let id_no = wrapper_id.split("video_link_wrapper_")[1];
    let video_title = $("#video_link_editor_title_textarea_" + id_no).val();
    let video_description = $("#video_link_editor_description_textarea_" + id_no).val();
    let video_src = $("#video_link_editor_video_dropdown_" + id_no).val();

    let video_thumbnail = "";
    videos_and_thumbnails.forEach(function(video_and_thumbnail) {
        if (video_and_thumbnail.video_src === video_src) {
            video_thumbnail = video_and_thumbnail.thumbnail;
        }
    })

    let parent_element_id = "";
    let element = undefined;

    // If the image being added/updated is the top element
    if (current_page.top_element._id === "video_link_" + id_no) {
        parent_element_id = current_page._id;
        element = current_page.top_element;
    }
    // If the image being added/updated is not the top element
    else {
        let previous_element = current_page.top_element || null;
        let current_element = current_page.top_element.child || null;
        let found = false;

        while (current_element !== null && !found) {
            if (current_element._id === "video_link_" + id_no) {
                found = true;
                element = current_element;
                parent_element_id = previous_element._id;
            }

            previous_element = current_element;
            current_element = current_element.child;
        }
    }

    let data = {
        course_id: course._id,
        page_id: current_page._id,
        element: JSON.stringify(element),
        parent_element_id: parent_element_id,
        video_src: video_src,
        video_thumbnail: video_thumbnail,
        video_title: video_title,
        video_description: video_description
    }

    $.post("/update_course_page_element", data, function(res) {
        if (res.errors.length > 0) {
            let video_file_error = false;
            let video_title_error = false;
            let video_description_error = false;

            res.errors.forEach(function(error) {
                if (error.error_type === "video_src_error" || error.error_type === "video_thumbnail_error") {
                    video_file_error = true;
                    $("#video_link_video_file_error_message_" + id_no).css("display", "block");
                    $("#video_link_video_file_error_message_" + id_no).html(error.error_message);
                }
                else if (error.error_type === "video_title_error") {
                    video_title_error = true;
                    $("#video_link_title_error_message_" + id_no).css("display", "block");
                    $("#video_link_title_error_message_" + id_no).html(error.error_message);
                }
                else if (error.error_type === "video_description_error") {
                    video_description_error = true;
                    $("#video_link_description_error_message_" + id_no).css("display", "block");
                    $("#video_link_description_error_message_" + id_no).html(error.error_message);
                }
            })

            if (!video_file_error) {
                $("#video_link_video_file_error_message_" + id_no).css("display", "none");
            }

            if (!video_title_error) {
                $("#video_link_title_error_message_" + id_no).css("display", "none");
            }

            if (!video_description_error) {
                $("#video_link_description_error_message_" + id_no).css("display", "none");
            }
        }
        else {
            element.video_src = res.video_src || "";
            element.title = res.video_title || "";
            element.description = res.video_description || "";
            element.thumbnail = res.video_thumbnail || "";

            new_description_array = getReducedDescription(element.description);

            // If description was reduced
            if (new_description_array[0]) {
                video_description = new_description_array[1];
                $("#read_more_button_" + id_no).html("+ Read more");
            }
            else {
                $("#read_more_button_" + id_no).html("");
            }

            $("#video_link_title_" + id_no).html(element.title);
            $("#video_link_title_word_count_" + id_no).html(calculateWordCount(element.title.replaceAll("<br>", " ")));
            $("#video_link_description_word_count_" + id_no).html(calculateWordCount(element.description.replaceAll("<br>", " ")));
            $("#video_link_description_" + id_no).html("<b>Description: </b>" + video_description);
            $("#video_link_thumbnail_" + id_no).attr("src", element.thumbnail);
            $("#" + wrapper_id).css("display", "inline-block");
            $("#video_link_editor_wrapper_" + id_no).css("display", "none");
            removeFromOpenEditors(wrapper_id);
            setAlert("Video edit saved", "good", 3000);
            setElementEventHandlers();
        }
    })
}

function setVideoFileDropdown() {
    $(".video_link_editor_video_dropdown").on("change", function() {
        let id_no = $(this).attr("id").split("video_link_editor_video_dropdown_")[1];
        let selected_video = $(this).val();
        
        if (selected_video !== "Select a Video File") {
            // Get the thumbnail image
            let thumbnail = "";
            videos_and_thumbnails.forEach(function(video_and_thumbnail) {
                if (video_and_thumbnail.video_src === selected_video) {
                    thumbnail = video_and_thumbnail.thumbnail;
                }
            })

            // Set the thumbnail image in the editor
            $("#video_link_editor_thumbnail_" + id_no).attr("src", thumbnail);
            
            // Create a new temp video with the chosen src, insert it
            let temp_video_html = 
            "<video id='temp_video_" + id_no + "' class='temp_video'>" +
                "<source id='temp_video_source_" + id_no + "' src='" + selected_video + "'></source>" +
            "</video>";

            $("#temp_video_" + id_no).remove();
            $("#video_link_text_wrapper_" + id_no).after(temp_video_html);
        }
        else {
            $("#video_link_editor_thumbnail_" + id_no).attr("src", "/images/default_image.jpg");
        }
    })
}

function setThumbnailHeight() {
    $(".video_link_thumbnail_wrapper").each(function() {
        let video_width = $(this).css("width").split("px")[0];
        let video_height = video_width * 0.56;
        $(this).css("height", video_height);
    })

    $(".video_link_editor_thumbnail_wrapper").each(function() {
        let video_width = $(this).css("width").split("px")[0];
        let video_height = video_width * 0.56;
        $(this).css("height", video_height);
    })

    $(".template_video_link_thumbnail_wrapper").each(function() {
        let video_width = $(this).css("width").split("px")[0];
        let video_height = video_width * 0.56;
        $(this).css("height", video_height);
    })
}

// Set save/cancel edit buttons

function setSaveEditElementButtons() {
    $(".save_edit_element_button").unbind("click");

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
        else if (wrapper_id.includes("video_link")) {
            saveVideoLinkEdit(wrapper_id);
        }
    })
}

function setCancelEditElementButtons() {
    $(".cancel_edit_element_button").unbind("click");
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
        else if (wrapper_id.includes("video_link")) {
            id_no = wrapper_id.split("video_link_wrapper_")[1];
            element_db_id = "video_link_" + id_no;
            add_new_element_wrapper_id = getAddNewElementIdFromDatabaseId(element_db_id);
            $("#video_link_title_error_message_" + id_no).css("display", "none");
        }

        while (current_element !== null && ! found) {
            if (("image_" + id_no === current_element._id && current_element.image_src === "/images/default_image.jpg") ||
                ("text_block_" + id_no === current_element._id && current_element.text === "") ||
                ("video_link_" + id_no === current_element._id && current_element.video_src === "")) {
                found = true;
                removed = true;
                $("#" + wrapper_id).remove();
                $("#" + getEditorIdFromWrapperId(wrapper_id)).remove();
                $("#" + add_new_element_wrapper_id).remove();
                removeElementFromDB(element_db_id);
                getPageStats(current_page, false);
                
                if (current_page.top_element !== null) {
                    enableAndDisableMoveElementButtons();
                }
            }
            
            current_element = current_element.child;
        }

        if (!removed) {
            $("#" + wrapper_id).css("display", "inline-block");

            if (wrapper_id.includes("video_link")) {
                setThumbnailHeight();
            }
        }
        
        $("#" + getEditorIdFromWrapperId(wrapper_id)).css("display", "none");
        removeFromOpenEditors(wrapper_id);
    })
}

// Text input handlers set

/**
 * Method for handling text input
 */
function setTextInputHandlers() {
    $(".title_editor_textarea").on("input", function() {
        let id_no = $(this).attr("id").split("title_editor_textarea_")[1];
        let character_count = calculateCharacterCount($(this).val().replaceAll("\n", ""));
        let word_count = calculateWordCount($(this).val().replaceAll("\n", " "));
        $("#title_editor_character_count_" + id_no).html(character_count);
        $("#title_editor_word_count_" + id_no).html(word_count);
    })

    $(".text_block_editor_textarea").on("input", function() {
        let id_no = $(this).attr("id").split("text_block_editor_textarea_")[1];
        let character_count = calculateCharacterCount($(this).val().replaceAll("\n", ""));
        let word_count = calculateWordCount($(this).val().replaceAll("\n", " "));
        $("#text_block_editor_character_count_" + id_no).html(character_count);
        $("#text_block_editor_word_count_" + id_no).html(word_count);
    })

    $(".video_link_editor_title_textarea").on("input", function() {
        let id_no = $(this).attr("id").split("video_link_editor_title_textarea_")[1];
        let character_count = calculateCharacterCount($(this).val().replaceAll("\n", ""));
        let word_count = calculateWordCount($(this).val().replaceAll("\n", " "));
        $("#video_link_editor_title_character_count_" + id_no).html(character_count);
        $("#video_link_editor_title_word_count_" + id_no).html(word_count);
    })

    $(".video_link_editor_description_textarea").on("input", function() {
        let id_no = $(this).attr("id").split("video_link_editor_description_textarea_")[1];
        let character_count = calculateCharacterCount($(this).val().replaceAll("\n", ""));
        let word_count = calculateWordCount($(this).val().replaceAll("\n", " "));
        $("#video_link_editor_description_character_count_" + id_no).html(character_count);
        $("#video_link_editor_description_word_count_" + id_no).html(word_count);
    })
}

// Read More button setter

function setReadMoreButtons() {
    $(".read_more_button").unbind("click");

    $(".read_more_button").click(function() {
        let template = $(this).attr("id").includes("template");
        let id_no = "";
        let page;
        let description_key = "";
        let description_element = "";
        let found = false;

        if (template) {
            id_no = $(this).attr("id").split("template_read_more_button_")[1];
            page = current_template_page;
            description_element = "template_video_link_description_";

            if (showing_template_content) {
                description_key = "description";
            }
            else {
                description_key = "description_lorem_ipsum";
            }
        }
        else {
            id_no = $(this).attr("id").split("read_more_button_")[1];
            page = current_page;
            description_key = "description";
            description_element = "video_link_description_";
        }

        let current_element = page.top_element;

        while (current_element !== null && !found) {
            if (current_element._id === "video_link_" + id_no) {
                description = current_element[description_key];
                found = true;
            }

            current_element = current_element.child;
        }

        if (!found) {
            description = "Description not found";
        }

        if ($(this).html() === "+ Read more") {
            $("#" + description_element + id_no).html(
                "<b>Description: </b>" + description
            )

            $(this).html("- Read less")
        }
        else {
            $("#" + description_element + id_no).html(
                "<b>Description: </b>" + getReducedDescription(description)[1]
            )

            $(this).html("+ Read more")
        }
    })
}

// ID getters

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
    else if (wrapper_id.includes("video_link")) {
        let editor_id_no = wrapper_id.split("video_link_wrapper_")[1];
        return "video_link_editor_wrapper_" + editor_id_no;
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
    else if (db_id.includes("video_link")) {
        let id_no = db_id.split("video_link_")[1];
        return "video_link_editor_wrapper_" + id_no;
    }
}

// Remove from Open Editors array

function removeFromOpenEditors(wrapper_id) {
    open_editors = jQuery.grep(open_editors, function(value) {
        return value != wrapper_id;
    });

    if (open_editors.length === 0) {
        $("#course_page_names_error_message").css("display", "none");
    }
}