import mongoose from "mongoose";
import timestamps from "mongoose-timestamp";

const treeTraversalSchema = mongoose.Schema({
    questionExecutiveId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users"
    },
    decisionNode: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "nodes"
    },
    rootNode: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "nodes"
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
    collection: "treeTraversal",
});

treeTraversalSchema.plugin(timestamps);

const TreeTraversalModel = mongoose.model("treeTraversal", treeTraversalSchema);

export default TreeTraversalModel;