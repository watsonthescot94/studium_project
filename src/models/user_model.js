const mongoose = require('mongoose')

const HighlightedCommentNotifications = new mongoose.Schema({
    _id: {
        type: String
    },
    course_id: {
        type: String
    },
    page_id: {
        type: String
    },
    video_link_id: {
        type: String
    },
    message_tab: {
        type: String
    },
    highlighted_comment: {
        type: String
    },
    date: {
        type: Number
    },
    read: {
        type: Boolean
    }
})

const NewRepliesNotificationSchema = new mongoose.Schema({
    _id: {
        type: String
    },
    course_id: {
        type: String
    },
    page_id: {
        type: String
    },
    video_link_id: {
        type: String
    },
    message_tab: {
        type: String
    },
    comment_being_replied_to: {
        type: String
    },
    new_replies: {
        type: []
    },
    read: {
        type: Boolean
    }
})

const NewQuestionOrFeedbackNotificationSchema = new mongoose.Schema({
    _id: {
        type: String
    },
    course_id: {
        type: String
    },
    page_id: {
        type: String
    },
    video_link_id: {
        type: String
    },
    message_tab: {
        type: String
    },
    new_comments: {
        type: []
    },
    read: {
        type: Boolean
    }
})

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        trim: true,
        required: true,
        unique: true,
        index: true
    },
    username: {
        type: String,
        trim: true,
        required: true,
        unique: true
    },
    forename: {
        type: String,
        trim: true,
        required: true
    },
    surname: {
        type: String,
        trim: true,
        required: true
    },
    password: {
        type: String,
        trim: true,
        required: true
    },
    avatar_path: {
        type: String,
        trim: true,
        default: "/images/default_avatar.jpg",
        required: true
    },
    created: {
        type: Date,
        default: Date.now,
        required: true
    },
    enrolled_in: {
        type: [String],
        required: true,
        default: []
    },
    courses_in_charge_of: {
        type: [String],
        required: true,
        default: []
    },
    notifications: {
        new_question_notifications: {
            type: [NewQuestionOrFeedbackNotificationSchema]
        },
        new_feedback_notifications: {
            type: [NewQuestionOrFeedbackNotificationSchema]
        },
        new_replies: {
            type: [NewRepliesNotificationSchema]
        },
        watched_comment_new_replies: {
            type: [NewRepliesNotificationSchema]
        },
        highlighted_comment_notifications: {
            type: [HighlightedCommentNotifications]
        }
    },
    templates: {
        type: [Object],
        required: true,
        default: []
    }
})

const userModel = mongoose.model("User", UserSchema, "users");
userModel.createIndexes().catch((error => {
    console.log(error);
}));
module.exports = userModel;