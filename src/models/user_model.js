const mongoose = require('mongoose')
const flashcard = require('./flashcard_model')

const ChatReplyNotificationSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true
    },
    video_id: {
        type: String,
        required: true
    },
    original_author_id: {
        type: String,
        required: true
    },
    read: {
        type: Boolean,
        default: false,
        required: true
    },
    date: {
        type: Number,
        required: true
    },
    new_replies: {
        type: [String],
        required: true
    }
})

const NewQuestionNotificationSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true
    },
    video_id: {
        type: String,
        required: true
    },
    question_askers: {
        type: [String],
        required: true
    },
    read: {
        type: Boolean,
        default: false,
        required: true
    },
    date: {
        type: Number,
        required: true
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
    surname: {
        type: String,
        trim: true,
        required: true
    },
    forename: {
        type: String,
        trim: true,
        required: true
    },
    username: {
        type: String,
        trim: true,
        required: true,
        unique: true
    },
    password: {
        type: String,
        trim: true,
        required: true
    },
    avatar_path: {
        type: String,
        trim: true,
        default: "default_avatar.jpg",
        required: true
    },
    flashcards: {
        type: [flashcard]
    },
    created: {
        type: Date,
        default: Date.now
    },
    enrolled_in: {
        type: [String]
    },
    courses_taught: {
        type: [String]
    },
    notifications: {
        chat_reply_notifications: {
            type: [Object],
            required: true
        },
        new_question_notifications: {
            type: [NewQuestionNotificationSchema],
            required: true
        }
    }
})

const userModel = mongoose.model("User", UserSchema, "users");
userModel.createIndexes().catch((error => {
    console.log(error);
}));
module.exports = userModel;