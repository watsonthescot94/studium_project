const mongoose = require('mongoose')
const flashcard = require('./flashcard_model')

const PageContentSchema = new mongoose.Schema({
    type: {
        type: String,
        trim: true,
        required: true
    },
    text: {
        type: String,
        trim: true,
        required: false
    },
    visible: {
        type: Boolean,
        trim: true,
        required: true,
        default: true
    },
    video_path: {
        type: String,
        trim: true,
        required: false
    }
})

const CoursePageSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: true
    },
    description: {
        type: String,
        trim: true,
        required: true
    },
    content: {
        type: [PageContentSchema]
    },
    flashcards: {
        type: [flashcard]
    },
    created: {
        type: Date,
        default: Date.now
    },
    visible: {
        type: Boolean,
        default: false
    }
})

const CourseSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: true
    },
    description: {
        type: String,
        trim: true,
        required: true
    },
    type: {
        type: String,
        trim: true,
        required: true
    },
    pages: {
        type: [CoursePageSchema]
    },
    students: {
        type: [String]
    },
    teachers: {
        type: [String]
    },
    moderators: {
        type: [String]
    },
    created: {
        type: Date,
        default: Date.now
    },
    classes_visible_to_public: {
        type: Boolean,
        default: true
    },
    course_visible_to_public: {
        type: Boolean,
        default: true
    }
})

const courseModel = mongoose.model("Course", CourseSchema, "courses");
courseModel.createIndexes().catch((error => {
    console.log(error);
}));
module.exports = courseModel;