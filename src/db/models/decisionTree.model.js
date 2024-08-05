import mongoose from "mongoose";
import timestamps from "mongoose-timestamp";

const decisionTreeSchema = mongoose.Schema({
    label: {
        type: String
    },
    belongFromProcess : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "preDefinedLogics"
    },
    nodeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "nodes"
    },
    decisionTreeId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "decisionTrees"
    },
    questionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "questions"
    },
    isActive: {
        type: Boolean, // true = active, false = inActive
        default: true
    },
    isDeleted : {
        type : Boolean,
        default : false
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users"
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users"
    },
    tree: {        //UI tree
        type: String
    }
}, {
    collection: "decisionTrees",
});

decisionTreeSchema.plugin(timestamps);

const DecisionTreeModel = mongoose.model("decisionTrees", decisionTreeSchema);

export default DecisionTreeModel;