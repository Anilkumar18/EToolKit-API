import mongoose from "mongoose";
import timestamps from "mongoose-timestamp";

const nodeTemplateSchema = mongoose.Schema({
    type: {
        type: String
    },
    inputs: {
        type: String
    },
    isActive: {
        type: Boolean, // true = active, false = inActive
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
    collection: "nodeTemplates",
});

nodeTemplateSchema.plugin(timestamps);

const NodeTemplateModel = mongoose.model("nodeTemplates", nodeTemplateSchema);

export default NodeTemplateModel;