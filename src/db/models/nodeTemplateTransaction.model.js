import mongoose from "mongoose";
import timestamps from "mongoose-timestamp";

const nodeTemplateTransactionSchema = mongoose.Schema({
    NodeTemplateId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "nodeTemplates"
    },
    templateType: {
        type: String
    },
    variableName: {
        type: String
    },
    function: {
        type: String
    },
    value: {
        type: String
    },
    name: {
        type: String
    },
    expression: {
        type: String
    },
    equation: {
        type: String
    },
    question: {
        type: String
    },
    equationData: [{
        type: { type: String },
        value: { type: String }
    }],
    fileName: {
        type: String
    },
    server: {
        type: String
    },
    frequency: {
        type: String
    },
    projectOrInitiative: {
        type: String
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
    collection: "nodeTemplateTransactions",
});

nodeTemplateTransactionSchema.plugin(timestamps);

const NodeTemplateTransactionModel = mongoose.model("nodeTemplateTransactions", nodeTemplateTransactionSchema);

export default NodeTemplateTransactionModel;