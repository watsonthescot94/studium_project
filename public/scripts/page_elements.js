var video_files = [
    "/videos/mary berry.mp4",
    "/videos/not_actually_a_video.mp4",
    "/videos/doesnt_exist.mp4"
]

var videos_and_thumbnails = [
    {
        video_src: "/videos/da_vinci.mp4",
        thumbnail: "/images/da_vinci.jpg"
    },
    {
        video_src: "/videos/mary berry.mp4",
        thumbnail: "/images/kurt_cobain.jpg"
    },
    {
        video_src: "/videos/hilarious.mp4",
        thumbnail: "/images/you_just_dont_exist.jpg"
    },
    {
        video_src: "/videos/false.mp4",
        thumbnail: "/images/it_never_happened.jpg"
    }
]

// Title

function getTitleElement() {
    let id_no = current_page._id;
    let title_html = "";

    if (student_view) {
        title_html =
        "<div id='page_title_wrapper_" + id_no + "' class='page_title page_element'>" +
            "<h1 id='page_title_" + id_no + "'>" + current_page.title + "</h1>" +
        "</div>";
    }
    else {
        title_html =
        "<fieldset id='page_title_wrapper_" + id_no + "' class='page_title_wrapper page_element'>" +
            "<legend class='legend'>Title</legend>" +
            "<h1 id='page_title_" + id_no + "'>" + current_page.title + "</h1>" +
            "<div class='divider'></div>" +
            "<p class='word_character_counts'>" +
                "<span id='title_word_count_" + id_no + "'>" + calculateWordCount(current_page.title.replaceAll("<br>", " ")) + "</span> words" +
            "</p>";

            if (is_admin) {
                title_html +=
                "<div class='element_buttons_wrapper'>" +
                    "<input id='edit_element_button_page_title_wrapper_" + id_no + "' class='edit_element_button white_button' type='button' value='Edit'></input>" +
                "</div>";
            }

        title_html +=
        "</fieldset>";
    }

    return title_html;
}

// Text Block

function getTextBlock(text_block) {
    let id_no = text_block._id.split("text_block_")[1];
    let text_block_html = "";

    if (student_view) {
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
            "<p class='word_character_counts'>" +
                "<span id='text_block_word_count_" + id_no + "'>" + calculateWordCount(text_block.text.replaceAll("<br>", " ")) + "</span> words" +
            "</p>";

            if (is_admin) {
                text_block_html +=
                "<div class='element_buttons_wrapper'>" +
                    "<input id='edit_element_button_text_block_wrapper_" + id_no + "' class='edit_element_button white_button leftmost_button' type='button' value='Edit'></input>" +
                    "<input id='delete_element_button_text_block_wrapper_" + id_no + "' class='delete_element_button white_button middle_button' type='button' value='Delete'></input>" +
                    "<input id='move_element_up_button_text_block_wrapper_" + id_no + "' class='move_element_up_button white_button middle_button' type='button' value='Move Up'></input>" +
                    "<input id='move_element_down_button_text_block_wrapper_" + id_no + "' class='move_element_down_button white_button rightmost_button' type='button' value='Move Down'></input>" +
                "</div>";
            }

        text_block_html +=
        "</fieldset>";
    }

    return text_block_html;
}

function addNewTextBlockAndEditor(anchor_element_db_id) {
    return $.get("/get_random_id", function(random_id) {
        let new_text_block = {
            _id: "text_block_" + random_id,
            text: "",
            child: null
        }

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

        setElementEventHandlers();
        enableAndDisableMoveElementButtons();
        getPageStats(current_page, false);
    })
}

// Image

function getImageElement(image) {
    let id_no = image._id.split("image_")[1];
    let caption_style = "style='display: block'";

    if (image.caption === "") {
        caption_style = "style='display: none'";
    }

    let caption_html =
    "<p id='image_caption_" + id_no + "' class='image_caption' " + caption_style + ">" +
        "<i>" + image.caption + "</i>" +
    "</p>";

    let image_html = "";

    if (student_view) {
        image_html =
        "<div id='image_wrapper_" + id_no + "' class='image page_element'>" +
            "<img id='image_" + id_no + "' src='" + image.image_src +
                "' class='image_element' onerror='imageSrcError(this.id)'>" +
            caption_html +
        "</div>";
    }
    else {
        image_html = 
        "<fieldset id='image_wrapper_" + id_no + "' class='image_wrapper page_element'>" +
            "<legend class='legend'>Image</legend>" +
            "<img id='image_" + id_no + "' src='" + image.image_src +
                "' class='image_element' onerror='imageSrcError(this.id)'>" +
            caption_html +
            "<div class='divider'></div>" +
            "<p class='word_character_counts'>Caption: " +
                "<span id='image_caption_word_count_" + id_no + "'>" + calculateWordCount(image.caption.replaceAll("<br>", " ")) +
                "</span> words" +
            "</p>";

            if (is_admin) {
                image_html +=
                "<div class='element_buttons_wrapper'>" +
                    "<input id='edit_element_button_image_wrapper_" + id_no + "' class='edit_element_button white_button leftmost_button' type='button' value='Edit'></input>" +
                    "<input id='delete_element_button_image_wrapper_" + id_no + "' class='delete_element_button white_button middle_button' type='button' value='Delete'></input>" +
                    "<input id='move_element_up_button_image_wrapper_" + id_no + "' class='move_element_up_button white_button middle_button' type='button' value='Move Up'></input>" +
                    "<input id='move_element_down_button_image_wrapper_" + id_no + "' class='move_element_down_button white_button rightmost_button' type='button' value='Move Down'></input>" +
                "</div>";
            }
        
        image_html+=
        "</fieldset>";
    }

    return image_html;
}

function addNewImageElementAndEditor(parent_element_db_id) {
    return $.get("/get_random_id", function(random_id) {
        let new_image = {
            _id: "image_" + random_id,
            image_src: "/images/default_image.jpg",
            caption: ""
        }

        addNewElementToLocalDB(parent_element_db_id, new_image);
        let new_image_html = getImageElement(new_image) + getImageEditor(new_image) + getAddNewElementDiv("image_" + random_id);
        $("#add_new_element_wrapper_" + parent_element_db_id).after(new_image_html);
        $("#add_new_element_dropdown_" + parent_element_db_id).val("choose_element_type");
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

        setElementEventHandlers();
        enableAndDisableMoveElementButtons();
        getPageStats(current_page, false);
    })
}

// Video Link

function getVideoLink(video) {
    let id_no = video._id.split("video_link_")[1];
    let reduced_description_array = getReducedDescription(video.description);
    let was_reduced = reduced_description_array[0];
    let description = reduced_description_array[1];
    let read_more_button_text = "";
    let video_link_html = "";

    if (was_reduced) {
        read_more_button_text = "+ Read more";
    }

    if (student_view) {
        video_link_html =
        "<div id='video_link_wrapper_" + id_no + "' class='video_link_wrapper page_element'>" +
            "<div id='video_link_thumbnail_wrapper_" + id_no + "' class='video_link_thumbnail_wrapper'>" +
                "<img id='video_link_thumbnail_" + id_no + "' src='" + video.thumbnail + "' class='video_link_thumbnail'>" +
                "<img src='/images/play_symbol.png' class='video_link_thumbnail_play_symbol'>" +
            "</div>" +

            "<div id='video_link_text_wrapper_" + id_no + "' class='video_link_text_wrapper'>" +
                "<h2 id='video_link_title_" + id_no + "'>" + video.title + "</h2>" +
                "<p class='video_duration'><b>Video Duration: </b><span id='video_duration_" + id_no + "'" + "</span></p>" +
                "<p id='video_link_description_" + id_no + "' class='video_link_description'><b>Description: </b>" + description + "</p>" +
                "<p><span id='read_more_button_" + id_no + "' class='read_more_button'>" + read_more_button_text + "</span></p>" +
            "</div>" +

            "<video id='temp_video_" + id_no + "' class='temp_video'>" +
                "<source id='temp_video_source_" + id_no + "' src='" + video.video_src + "'></source>" +
            "</video>" +
        "</div>"
    }
    else {
        video_link_html =
        "<fieldset id='video_link_wrapper_" + id_no + "' class='video_link_wrapper page_element'>" +
            "<legend class='legend'>Video Link</legend>" +

            "<div id='video_link_thumbnail_wrapper_" + id_no + "' class='video_link_thumbnail_wrapper'>" +
                "<img id='video_link_thumbnail_" + id_no + "' src='" + video.thumbnail + "' class='video_link_thumbnail'>" +
                "<img src='/images/play_symbol.png' class='video_link_thumbnail_play_symbol'>" +
            "</div>" +

            "<div id='video_link_text_wrapper_" + id_no + "' class='video_link_text_wrapper'>" +
                "<h2 id='video_link_title_" + id_no + "'>" + video.title + "</h2>" +
                "<p class='video_duration'><b>Video Duration: </b><span id='video_duration_" + id_no + "'" + "</span></p>" +
                "<p id='video_link_description_" + id_no + "' class='video_link_description'><b>Description: </b>" + description + "</p>" +
                "<p><span id='read_more_button_" + id_no + "' class='read_more_button'>" + read_more_button_text + "</span></p>" +
            
                "<div class='divider'></div>" +
                "<p class='word_character_counts'>" +
                    "Title: <span id='video_link_title_word_count_" + id_no + "'>" + calculateWordCount(video.title.replaceAll("<br>", " ")) + "</span> words | " +
                    "Description: <span id='video_link_description_word_count_" + id_no + "'>" + calculateWordCount(video.description.replaceAll("<br>", " ")) + "</span> words" +
                "</p>" +
            "</div>";

        if (is_admin) {
            video_link_html +=
            "<div class='element_buttons_wrapper'>" +
                "<input id='edit_element_button_video_link_wrapper_" + id_no + "' class='edit_element_button white_button leftmost_button' type='button' value='Edit'></input>" +
                "<input id='delete_element_button_video_link_wrapper_" + id_no + "' class='delete_element_button white_button middle_button' type='button' value='Delete'></input>" +
                "<input id='move_element_up_button_video_link_wrapper_" + id_no + "' class='move_element_up_button white_button middle_button' type='button' value='Move Up'></input>" +
                "<input id='move_element_down_button_video_link_wrapper_" + id_no + "' class='move_element_down_button white_button rightmost_button' type='button' value='Move Down'></input>" +
            "</div>";
        }

        video_link_html +=
            "<video id='temp_video_" + id_no + "' class='temp_video'>" +
                "<source id='temp_video_source_" + id_no + "' src='" + video.video_src + "'></source>" +
            "</video>" +
        "</fieldset>"
    }

    return video_link_html;
}

function addNewVideoElementAndEditor(parent_element_db_id) {
    return $.get("/get_random_id", function(random_id) {
        let new_video = {
            _id: "video_link_" + random_id,
            video_src: "",
            title: "",
            description: "",
            questions: [],
            feedback: [],
            notify: []
        }

        addNewElementToLocalDB(parent_element_db_id, new_video);
        let new_video_html = getVideoLink(new_video) + getVideoLinkEditor(new_video) + getAddNewElementDiv("video_link_" + random_id);
        $("#add_new_element_wrapper_" + parent_element_db_id).after(new_video_html);
        $("#add_new_element_dropdown_" + parent_element_db_id).val("choose_element_type");
        $("#video_link_editor_wrapper_" + random_id).css("display", "inline-block")
        $("#video_link_wrapper_" + random_id).css("display", "none");
        //$("#save_edit_element_button_video_link_wrapper_" + random_id).prop("disabled", true);
        $("#video_link_editor_wrapper_" + random_id)[0].scrollIntoView({
            behavior: "smooth",
            block: "nearest"
        });
        
        if (!open_editors.includes("video_link_editor_wrapper_" + random_id)) {
            open_editors.push("video_link_wrapper_" + random_id);
        }

        setThumbnailHeight();
        setElementEventHandlers();
        enableAndDisableMoveElementButtons();
        getPageStats(current_page, false);
    })
}

function addEventListenersToTempVideos() {
    $(".temp_video").each(function() {
        let temp_vid = document.getElementById($(this).attr("id"))
        let ready_state = temp_vid.readyState;

        if (ready_state > 0) {
            displayVideoDuration($(this).attr("id"));
        }
        else {
            $(this)[0].addEventListener('loadedmetadata', function() {
                displayVideoDuration($(this).attr("id"));
            })
        }
    })
}

function displayVideoDuration(temp_video_id) {
    let id_no = temp_video_id.split("temp_video_")[1];
    let duration = convertMillisecondsToHoursMinutesSeconds($("#" + temp_video_id)[0].duration);
    $("#video_duration_" + id_no).html(duration);
}

function setVideoClickEvent() {
    $(".video_link_thumbnail_wrapper").unbind("click");
    $(".video_link_thumbnail_wrapper").click(function() {
        if (!$(this).attr("id").includes("template")) {
            let id_no = $(this).attr("id").split("video_link_thumbnail_wrapper_")[1];

            let current_element = current_page.top_element;
            let found = false;

            while (current_element !== null && !found) {
                if (current_element._id === "video_link_" + id_no) {
                    found = true;
                    current_video = current_element;
                }

                current_element = current_element.child;
            }

            if (found) {
                let video_html = 
                "<video id='video_lecture' controls style='background-color: black'>" +
                    "<source src='" + current_video.video_src + "' type='video/mp4'>" +
                    "Your browser does not support the video tag." +
                "</video>"
                $("#video_lecture").replaceWith(video_html);
                $("#video_title").html(current_video.title);
                $("#video_description").html(current_video.description);
                addAllChatMessages(current_video);
                $("#video_window_wrapper").css("display", "inline-block");
                $("#video_lecture")[0].play();
                $("#video_lecture")[0].ontimeupdate = setMessageDisplayType
            }
            else {
                setAlert("Video not found", "bad", 3000);
            }
        }
    })
}

// Move element handlers

function setMoveElementButtons() {
    $(".move_element_up_button").unbind("click");
    $(".move_element_down_button").unbind("click");

    $(".move_element_up_button").click(function() {
        let wrapper_id = $(this).attr("id").split("move_element_up_button_")[1];
        let element_db_id = getDatabaseIdFromWrapper(wrapper_id);
        moveElement(element_db_id, "up");
    })

    $(".move_element_down_button").click(function() {
        let wrapper_id = $(this).attr("id").split("move_element_down_button_")[1];
        let element_db_id = getDatabaseIdFromWrapper(wrapper_id);
        moveElement(element_db_id, "down");
    })
}

function moveElement(element_moving_db_id, direction) {
    let data = {
        course_id: course._id,
        page_id: current_page._id,
        direction: direction,
        element_moving_id: element_moving_db_id
    }

    $.post("/move_page_element", data, function(res) {
        console.log(res);
        if (res.errors.length > 0) {
            setAlert(res.errors[res.errors.length - 1].error_message, "bad", 3000);
        }
        else {
            let previous_element = null;
            let current_element = current_page.top_element;
            let found = false;
            
            if (direction === "up") {
                while (current_element !== null && !found) {
                    if (current_element.child !== null && current_element.child._id === element_moving_db_id) {
                        found = true;
                        let element_moving_up = current_element.child;
                        let element_moving_down = current_element;
                        element_moving_down.child = element_moving_up.child || null;
                        element_moving_up.child = element_moving_down;

                        if (element_moving_down._id === current_page.top_element._id) {
                            current_page.top_element = element_moving_up;
                            setNewParentElement(element_moving_up._id, current_page._id);
                        }
                        else {
                            previous_element.child = element_moving_up;
                            setNewParentElement(element_moving_up._id, previous_element._id);
                        }
                    }

                    previous_element = current_element;
                    current_element = current_element.child || null;
                }
            }
            // If moving element down
            else {
                while (current_element !== null && !found) {
                    if (current_element._id === element_moving_db_id) {
                        found = true;
                        // If the element moving down is not the bottom element, move it down one place
                        if (current_element.child !== null) {
                            let element_moving_down = JSON.parse(JSON.stringify(current_element));
                            let element_moving_up = JSON.parse(JSON.stringify(current_element.child));
                            element_moving_down.child = element_moving_up.child || null;
                            element_moving_up.child = element_moving_down;

                            if (element_moving_down._id === current_page.top_element._id) {
                                current_page.top_element = element_moving_up;
                            }
                            else {
                                previous_element.child = element_moving_up;
                            }

                            setNewParentElement(element_moving_down._id, element_moving_up._id);
                        }
                    }
            
                    previous_element = current_element;
                    current_element = current_element.child;
                }
            }
        }
        enableAndDisableMoveElementButtons();
    })
}


/*function moveElementUp(element_moving_up_id) {
    // If element moving up is the top element, disable its move up button
    if (current_page.top_element._id === element_moving_up_id) {
        enableAndDisableMoveElementButtons();
        return;
    }
    // If the element moving up is not the top element and the top element has no child
    else if (current_page.top_element.child === null) {
        console.log("Cannot move unknown element");
        return;
    }
    // If the element moving up is the top element's child, move it up one place
    else if (current_page.top_element.child._id === element_moving_up_id) {
        let element_moving_down = JSON.parse(JSON.stringify(current_page.top_element));
        let element_moving_up = JSON.parse(JSON.stringify(current_page.top_element.child));
        element_moving_down.child = element_moving_up.child;
        element_moving_up.child = element_moving_down;
        current_page.top_element = element_moving_up;

        setNewParentElement(element_moving_up._id, current_page._id);
        return;
    }

    // If the element moving up is not the top element or its child, move it up one place
    let previous_element = current_page.top_element;
    let current_element = previous_element.child;
    let found = false;
    
    while (current_element !== null && !found) {
        if (current_element.child !== null && current_element.child._id === element_moving_up_id) {
            found = true;
            let element_moving_up = current_element.child;
            let element_moving_down = current_element;
            element_moving_down.child = element_moving_up.child;
            element_moving_up.child = element_moving_down;
            previous_element.child = element_moving_up;

            setNewParentElement(element_moving_up._id, previous_element._id);
        }

        previous_element = current_element;
        current_element = current_element.child;
    }

    // If the element moving up was not found, send error message to the console
    if (!found) {
        console.log("Element not found");
    }
}*/

/*function moveElementDown(element_moving_down_id) {
    // If the element moving down is the top element and it has no child, disable the top element's move down button
    if (current_page.top_element._id === element_moving_down_id && current_page.top_element.child === null) {
        $("#move_element_down_button_" + getWrapperIdFromDatabaseId(current_page.top_element._id).prop("disabled", true));
        console.log("The top element has no child element so cannot be moved down");
        return;
    }
    // If the element moving down is the top element and it has a child, move it down one place
    else if (current_page.top_element._id === element_moving_down_id) {
        let element_moving_down = JSON.parse(JSON.stringify(current_page.top_element));
        let element_moving_up = JSON.parse(JSON.stringify(current_page.top_element.child));
        element_moving_down.child = element_moving_up.child;
        current_page.top_element = element_moving_up;
        current_page.top_element.child = element_moving_down;

        setNewParentElement(current_page.top_element.child._id, current_page.top_element._id);
        return;
    }

    let previous_element = current_page.top_element;
    let current_element = current_page.top_element.child;
    let found = false;

    while (current_element !== null && !found) {
        if (current_element._id === element_moving_down_id) {
            found = true;
            // If the element moving down is not the bottom element, move it down one place
            if (current_element.child !== null) {
                let element_moving_down = JSON.parse(JSON.stringify(current_element));
                let element_moving_up = JSON.parse(JSON.stringify(current_element.child));
                element_moving_down.child = element_moving_up.child;
                element_moving_up.child = element_moving_down;
                previous_element.child = element_moving_up;

                setNewParentElement(element_moving_down._id, element_moving_up._id);
            }
            // If the element moving down is the bottom element, disable its move down button
            else {
                $("#move_element_down_button_" + current_element._id).prop("disabled", true);
                console.log("Cannot move bottom element down");
            }
        }

        previous_element = current_element;
        current_element = current_element.child;
    }

    // If the element moving down hasn't been found, send error message to console
    if (!found) {
        console.log("Element not found");
    }
}*/

function enableAndDisableMoveElementButtons() {
    // Set top element's move up button as disabled
    $("#move_element_up_button_" + getWrapperIdFromDatabaseId(current_page.top_element._id)).prop("disabled", true);

    // If the top element doesn't have a child, disable the top element's move down button
    if (current_page.top_element.child === null) {
        $("#move_element_down_button_" + getWrapperIdFromDatabaseId(current_page.top_element._id)).prop("disabled", true);
    }
    // If the top element does have a child, enable the top element's move down button
    else {
        $("#move_element_down_button_" + getWrapperIdFromDatabaseId(current_page.top_element._id)).prop("disabled", false);
    }

    // Set the move up and down button for each element after the top element
    let current_element = current_page.top_element.child;
    while (current_element !== null) {
        // Enable the move up button
        $("#move_element_up_button_" + getWrapperIdFromDatabaseId(current_element._id)).prop("disabled", false);
        // If the element does not have a child, disable the element's down button
        if (current_element.child === null) {
            $("#move_element_down_button_" + getWrapperIdFromDatabaseId(current_element._id)).prop("disabled", true);
        }
        // If the element does have a child, enable the element's down button
        else {
            $("#move_element_down_button_" + getWrapperIdFromDatabaseId(current_element._id)).prop("disabled", false);
        }

        current_element = current_element.child;
    }
}

function setNewParentElement(child_element_id, parent_element_id) {
    let child_element_wrapper_id = getWrapperIdFromDatabaseId(child_element_id);
    let child_element_editor_id = getEditorIdFromDatabaseId(child_element_id);
    let child_element_add_new_element_id = getAddNewElementIdFromDatabaseId(child_element_id);
    let parent_element_add_new_element_id = getAddNewElementIdFromDatabaseId(parent_element_id);

    let child_element_html = $("#" + child_element_wrapper_id)[0].outerHTML +
        $("#" + child_element_editor_id)[0].outerHTML +
        $("#" + child_element_add_new_element_id)[0].outerHTML;

    $("#" + child_element_wrapper_id).remove();
    $("#" + child_element_editor_id).remove();
    $("#" + child_element_add_new_element_id).remove();

    $("#" + parent_element_add_new_element_id).after(child_element_html);
    $("#" + child_element_wrapper_id)[0].scrollIntoView({
        behavior: "smooth",
        block: "nearest"
    });

    setElementEventHandlers();
    enableAndDisableMoveElementButtons();
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

// Local database handlers

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
}

function removeElementFromDB(element_id) {
    if (element_id === current_page.top_element._id) {
        current_page.top_element = current_page.top_element.child || null;
    }

    if (current_page.top_element !== null) {
        let previous_element = current_page.top_element;
        let current_element = current_page.top_element.child || null;
        let found = false;

        while (current_element !== null && !found) {
            if (current_element._id === element_id) {
                found = true;
                previous_element.child = current_element.child || null;
            }

            previous_element = current_element;
            current_element = current_element.child;
        }
    }
}

// Edit/delete element button handlers

function setEditElementButtons() {
    $(".edit_element_button").unbind("click");

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
        else if (wrapper_id.includes("video_link")) {
            setVideoLinkEditorValues(wrapper_id);
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

        // If a video link is being edited, set its thumbnail height now that it's visible
        if (wrapper_id.includes("video_link")) {
            setThumbnailHeight();
        }
    })
}

function setDeleteElementButtons() {
    $(".delete_element_button").unbind("click");
    $(".delete_element_button").click(function() {
        console.log("delete element button CLICK");
        let wrapper_id = $(this).attr("id").split("delete_element_button_")[1];
        let id_no = "";
        let element_type = "";

        if (wrapper_id.includes("image")) {
            id_no = wrapper_id.split("image_wrapper_")[1];
            element_type = "image";
        }
        else if (wrapper_id.includes("text_block")) {
            id_no = wrapper_id.split("text_block_wrapper_")[1];
            element_type = "text block";
        }
        else if (wrapper_id.includes("video_link")) {
            id_no = wrapper_id.split("video_link_wrapper_")[1];
            element_type = "video link";
        }

        let element_db_id = getDatabaseIdFromWrapper(wrapper_id);

        let confirm_window_html = 
        "<h3>Deleting Page Element</h3>" +
        "<div class='divider'></div>" +
        "<p class='confirm_window_text'>Are you sure you want to delete this " + element_type + "?</p>" +
        "<button id='confirm_element_deletion_button_" + element_db_id + "' class='leftmost_button'>Yes</button>" +
        "<button id='cancel_element_deletion_button' class='rightmost'>No</button>";

        $("#confirm_window").html(confirm_window_html);
        $("#confirm_window_wrapper").css("display", "inline-block");

        $("#confirm_element_deletion_button_" + element_db_id).click(function() {
            console.log("Confirm element deletion button CLICK");
            let element_db_id = $(this).attr("id").split("confirm_element_deletion_button_")[1];
            console.log("element_db_id: " + element_db_id);
            deleteElement(element_db_id);
        })

        $("#cancel_element_deletion_button").unbind("click");
        $("#cancel_element_deletion_button").click(function() {
            $("#confirm_window_wrapper").css("display", "none");
        })
    })
}

function deleteElement(element_db_id) {
    let data = {
        course_id: course._id,
        page_id: current_page._id,
        element_id: element_db_id
    }

    $.post("/delete_page_element", data, function(res) {
        if (res.errors.length > 0) {
            // Show the last error
            setAlert(res.errors[res.errors.length - 1].error_message, "bad", 3000);
        }
        else {
            console.log("no errors");
            console.log("updated pages:");
            console.log(res.updated_pages);
            removeElementFromDB(element_db_id);
            $("#" + getWrapperIdFromDatabaseId(element_db_id)).remove();
            $("#" + getEditorIdFromDatabaseId(element_db_id)).remove();
            $("#" + getAddNewElementIdFromDatabaseId(element_db_id)).remove();

            if (current_page.top_element !== null) {
                enableAndDisableMoveElementButtons();
            }

            let element_type = "";
            if (element_db_id.includes("image")) {
                element_type = "Image";
            }
            else if (element_db_id.includes("text_block")) {
                element_type = "Text block";
            }
            else if (element_db_id.includes("video_link")) {
                element_type = "Video";
            }

            $("#confirm_window_wrapper").css("display", "none");
            setAlert(element_type + " deleted", "good", 3000);
            getPageStats(current_page, false);
        }
    })
}

// Add new element

function getAddNewElementDiv(id) {
    let add_new_element_html =
    "<fieldset id='add_new_element_wrapper_" + id + "' class='add_new_element_wrapper'>" +
        "<legend class='legend'>Add Page Element</legend>" +
        "<div class='add_new_element_dropdown_input_wrapper'>" +
            "<select id='add_new_element_dropdown_" + id + "' class='add_new_element_dropdown'>" +
                "<option value='choose_element_type'>Choose Element Type</option>" +
                "<option value='text_block'>Text Block</option>" +
                "<option value='image'>Image</option>" +
                "<option value='video'>Video</option>" +
            "</select>" +
            "<input type='button' id='add_new_element_button_" + id + "' class='add_new_element_button white_button' value='Add New Element'>" +
        "</div>" +
        "<p id='add_new_element_error_message_" + id + "' class='page_error_message'>* Please choose an element type to add</p>" +
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
            else if (new_element_type === "video") {
                addNewVideoElementAndEditor(anchor_element_db_id);
            }
        }
    })
}

// Set element/editor event handlers

function setElementEventHandlers() {
    setTextInputHandlers();
    setImageEditors();
    addEventListenersToTempVideos();
    setThumbnailHeight();
    setVideoFileDropdown();
    setVideoClickEvent();
    setReadMoreButtons();
    setEditElementButtons();
    setSaveEditElementButtons();
    setCancelEditElementButtons();
    setDeleteElementButtons();
    setMoveElementButtons();
    setAddNewElementHandlers();
}

// ID getters

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
    else if (db_id.includes("video_link")) {
        let id_no = db_id.split("video_link_")[1];
        return "video_link_wrapper_" + id_no;
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
    else if (wrapper_id.includes("video_link")) {
        let splitter = "";

        if (wrapper_id.includes("editor")) {
            splitter = "video_link_editor_wrapper_";
        }
        else {
            splitter = "video_link_wrapper_";
        }

        let id_no = wrapper_id.split(splitter)[1];
        return "video_link_" + id_no;
    }

    return null;
}

function getBottomElementDBId() {
    let current_element = current_page.top_element;
    while (current_element !== null) {
        if (current_element.child === null) {
            return current_element._id
        }

        current_element = current_element.child;
    }
}