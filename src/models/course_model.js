const mongoose = require('mongoose')

const CoursePageSchema = new mongoose.Schema({
    title: {
        type: String,
        trim: true,
        required: true
    },
    description: {
        type: String,
        trim: true,
        required: true
    },
    top_element: {
        type: Object,
        required: true
    },
    created: {
        type: Date,
        default: new Date()
    },
    visible_only_to_staff: {
        type: Boolean,
        default: false
    }
})

const CourseSchema = new mongoose.Schema({
    title: {
        type: String,
        trim: true,
        required: true
    },
    description: {
        type: String,
        trim: true,
        required: true
    },
    subject: {
        type: String,
        trim: true,
        required: true
    },
    pages: {
        type: [CoursePageSchema],
        required: true,
        default: []
    },
    students: {
        type: [String],
        required: true,
        default: []
    },
    staff: {
        type: [Object],
        required: true,
        default: []
    },
    publicly_listed: {
        type: Boolean,
        default: false,
        required: true
    },
    templates_include_content: {
        type: Boolean,
        default: false,
        required: true
    },
    start_date: {
        type: Date,
        required: true
    },
    template: {
        type: Object,
        required: true,
        default: {
            set: false
        }
    },
    created: {
        type: Date,
        default: new Date(),
        required: true
    }
})

const courseModel = mongoose.model("Course", CourseSchema, "courses");
courseModel.createIndexes().catch((error => {
    console.log(error);
}));
module.exports = courseModel;