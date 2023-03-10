const mongoose = require('mongoose');

const FlashCardSchema = new mongoose.Schema({
    question: {
        type: String,
        trim: true,
        required: true
    },
    answer: {
        type: String,
        trim: true,
        required: true
    },
    author: {
        type: String,
        trim: true,
        required: true
    },
    course_source: {
        type: [String]
    }
})

module.exports = FlashCardSchema;