const mongoose = require('mongoose')

const ReplySchema = new mongoose.Schema({
    author_id: {
        type: String,
        required: true,
        trim: true
    },
    replying_to: {
        type: String,
        required: true,
        trim: true
    },
    vote_count: {
        type: Number,
        required: true
    },
    text: {
        type: String,
        required: true,
        trim: true
    },
    posting_time: {
        type: Number,
        required: true
    },
    highlighted: {
        type: Boolean,
        required: true,
        default: false
    },
    upvotes: {
        type: [String],
        required: true
    },
    downvotes: {
        type: [String],
        required: true
    }
})

const CommentSchema = new mongoose.Schema({
    author_id: {
        type: String,
        required: true,
        trim: true
    },
    text: {
        type: String,
        required: true,
        trim: true
    },
    timestamp: {
        type: Number,
        required: true
    },
    vote_count: {
        type: Number,
        required: true
    },
    posting_time: {
        type: Number,
        required: true
    },
    highlighted: {
        type: Boolean,
        required: true,
        default: false
    },
    replies: {
        type: [ReplySchema],
        required: true
    },
    upvotes: {
        type: [String],
        required: true
    },
    downvotes: {
        type: [String],
        required: true
    },
    notify: {
        type: [String],
        required: true
    }
})

const VideoSchema = new mongoose.Schema({
    video_path: {
        type: String,
        required: true,
        trim: true
    },
    questions: {
        type: [CommentSchema],
        required: true
    },
    feedback: {
        type: [CommentSchema],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    students_not_receiving_question_notifications: {
        type: [String],
        required: true
    }
})

const videoModel = mongoose.model("videos", VideoSchema, "videos");
videoModel.createIndexes().catch((error => {
    console.log(error);
}));
module.exports = videoModel;