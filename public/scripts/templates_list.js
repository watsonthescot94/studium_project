var templates = [];
var delete_template_button_clicked = false;
var template_being_deleted_id = "";

$(function() {
    $.when(getCurrentUser().done(setBottomBanner()));
    $.when(getTemplates().done(function(res) {
        handleRetrievedTemplates(res);
    }))

    setDeleteTemplateWindowButtons();
})

function getTemplates() {
    return $.post("/get_templates");
}

function handleRetrievedTemplates(res) {
    if (res.errors.length > 0) {
        showTemplatesDisplayMessage(res.errors[res.errors.length - 1].error_message);
    }
    else {
        if (res.templates === undefined || res.templates.length === 0) {
            showTemplatesDisplayMessage("No templates to display");
            return;
        }

        templates = res.templates;
        hideTemplatesDisplayMessage();
        displayTemplates();
    }
}

function displayTemplates() {
    if (templates.length > 0) {
        showTemplatesWrapper();
    }

    let templates_html = "";

    templates.forEach(function(template, i) {
        if (i % 3 === 0) {
            let row_margin_class = "";
            if (i + 3 <= templates.length - 1) {
                row_margin_class = "not_bottom_template_listing_row";
            }

            templates_html += "<div class='template_listing_row " + row_margin_class + "'>";
        }
        
        templates_html +=
        "<div class='template_listing_wrapper'>" +
            "<div id='template_listing_" + template._id + "' class='template_listing'>" +
                "<div class='template_listing_template_title_wrapper'>" +
                    "<h3 class='template_listing_template_title'>" + template.title + "</h3>" +
                    "<p class='template_listing_template_subject'>" + template.subject + "</p>" +
                "</div>" +

                "<div>" +
                    "<div class='divider'></div>" +
                    "<div class='template_listing_template_delete_button_and_helper_icon_wrapper'>" +
                        "<button id='template_listing_template_delete_button_" + template._id + 
                            "' class='template_listing_template_delete_button red_button'>Delete</button>" + 

                        "<div class='template_listing_template_delete_button_helper_icon_wrapper helper_icon_wrapper'>" +
                            "<img class='helper_icon' src='/images/helper_icon.png'>" +

                            "<div class='template_listing_template_delete_button_helper_icon_text_wrapper helper_icon_text_wrapper helper_icon_text_wrapper_top'>" +
                                '<p class="helper_icon_text">When you click the "Delete" button, a window will be displayed ' +
                                'asking you to confirm the deletion of this saved template.' +
                                "</p>" +
                            "</div>" +
                        "</div>" +
                    "</div>" +
                "</div>" +
            "</div>" +
        "</div>";

        if ((i + 1) % 3 === 0 || i === templates.length - 1) {
            templates_html += "</div>";
        }
    })

    $("#displayed_templates").html(templates_html);
    setTemplateListingClickHandlers();
    setDeleteTemplateButtons();
    setHelperIconEventHandlers();
}

function setTemplateListingClickHandlers() {
    $(".template_listing").unbind("click");
    $(".template_listing").click(function() {
        if (delete_template_button_clicked) {
            delete_template_button_clicked = false;
            return;
        }

        let template_id = $(this).attr("id").split("template_listing_")[1];
        let source_id = "";
        for (let i = 0; i < templates.length; i++) {
            if (templates[i]._id === template_id) {
                source_id = templates[i].source_id;
            }
        }

        if (source_id === "") {
            setAlert("Could not find template", "bad", 3000);
            return;
        }

        window.location.href = "/course/" + source_id;
    })
}

function setDeleteTemplateButtons() {
    $(".template_listing_template_delete_button").unbind("click");
    $(".template_listing_template_delete_button").click(function() {
        let template_id = $(this).attr("id").split("template_listing_template_delete_button_")[1];
        template_being_deleted_id = template_id;
        delete_template_button_clicked = true;
        showDeleteTemplateWindow();
    })
}

function setDeleteTemplateWindowButtons() {
    $("#delete_template_window_confirm_button").unbind("click");
    $("#delete_template_window_confirm_button").click(function() {
        let data = {
            template_id: template_being_deleted_id
        }

        $.post("/delete_template", data, function(res) {
            console.log(res.errors);
            if (res.errors.length > 0) {
                setAlert(res.errors[res.errors.length - 1].error_message, "bad", 3000);
            }
            else {
                let i = 0;
                for (i; i < templates.length; i++) {
                    if (templates[i]._id === template_being_deleted_id) {
                        break;
                    }
                }

                templates.splice(i, 1);
                hideDeleteTemplateWindow();
                setAlert("Template deleted", "good", 3000);

                if (templates.length > 0) {
                    displayTemplates();
                }
                else {
                    showTemplatesDisplayMessage("No templates to display");
                    hideTemplatesWrapper();
                }
            }
        })
    })

    $("#delete_template_window_cancel_button").unbind("click");
    $("#delete_template_window_cancel_button").click(function() {
        hideDeleteTemplateWindow();
    })
}

function showDeleteTemplateWindow() {
    $("#delete_template_window_wrapper").css("display", "block");
}

function hideDeleteTemplateWindow() {
    $("#delete_template_window_wrapper").css("display", "none");
}

function showTemplatesWrapper() {
    $("#displayed_templates_wrapper").css("display", "block");
}

function hideTemplatesWrapper() {
    $("#displayed_templates_wrapper").css("display", "none");
}

function showTemplatesDisplayMessage(message) {
    $("#templates_display_message").html(message);
    $("#templates_display_message").css("display", "block");
}

function hideTemplatesDisplayMessage() {
    $("#templates_display_message").css("display", "none");
}