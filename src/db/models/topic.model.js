import mongoose from "mongoose";
import timestamps from "mongoose-timestamp";

const topicSchema = mongoose.Schema({
    name: {
        type: String
    },
    isActive: {
        type: Boolean, // true = active, false = inActive
        default: true
    },
    type: {
        type: String,
        enum: ["topic", "subTopic"]
    },
    tagLine : {
        type : String
    },
    question : {
        type : String
    },
    solution : {
        type : String
    },
    tool_image : {
        type : String,
        default: ""
    },
    parentTopic: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "topics"
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
    collection: "topics",
});

topicSchema.plugin(timestamps);

const TopicModel = mongoose.model("topics", topicSchema);

export default TopicModel;