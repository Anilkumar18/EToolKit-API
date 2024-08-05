import mongoose from "mongoose";
import timestamps from "mongoose-timestamp";

const questionSchema = mongoose.Schema({
    text: {
        type: String,
        default: ""
    },
    assumptions: {
        type: String,
        default: ""
    },
    screen_tagline: {
        type: String,
        default: ""
    },
    description: {
        type: String,
        default: ""
    },
    summery_report: {
        type: String,
        enum: ["", "pdf", "csv"],
        default: ""
    },
    icon_logo: {
        type: String,
        default: ""
    },
    topicId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "topics"
    },
    isActive: {
        type: Boolean, // true = active, false = inActive
        default: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users"
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users"
    }
}, {
    collection: "questions",
});

questionSchema.plugin(timestamps);

const QuestionModel = mongoose.model("questions", questionSchema);

export default QuestionModel;