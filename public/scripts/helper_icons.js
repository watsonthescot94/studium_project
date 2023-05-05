var helper_icons_displayed = true;

$(function() {
    setHelperIconEventHandlers();
    setHelperIconDisplayButtonClickHandler();
})

function setHelperIconEventHandlers() {
    $(".helper_icon").unbind("mouseenter");
    $(".helper_icon").mouseenter(function() {
        $(this).parent().children(".helper_icon_text_wrapper").css("display", "block");
        $(this).parent().children(".helper_icon_text_wrapper").css("z-index", "20");
        $(this).css("z-index", "21");
    })

    $(".helper_icon").unbind("mouseleave");
    $(".helper_icon").mouseleave(function() {
        $(this).parent().children(".helper_icon_text_wrapper").css("display", "none");
        $(this).parent().children(".helper_icon_text_wrapper").css("z-index", "1");
        $(this).css("z-index", "2");
    })
}

function setHelperIconDisplayButtonClickHandler() {
    $("#bottom_banner_helper_icon_display_button").unbind("click");
    $("#bottom_banner_helper_icon_display_button").click(function() {
        helper_icons_displayed = !helper_icons_displayed;

        if (helper_icons_displayed) {
            $(".helper_icon_wrapper").css("display", "flex");
            $(this).html("Hide Helper Icons");
        }
        else {
            $(".helper_icon_wrapper").css("display", "none");
            $(this).html("Display Helper Icons");
        }
    })
}