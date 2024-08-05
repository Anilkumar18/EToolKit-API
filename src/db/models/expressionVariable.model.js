import mongoose from "mongoose";
import timestamps from "mongoose-timestamp";

const expressionVariableSchema = mongoose.Schema({
    variableName: {
        type: String,
        require: true
    },
    variableScope: {
        type: String,
        enum: ['userLevel', 'organizationLevel', 'systemLevel'],
        require: true
    },
    valueType: {
        type: String,
        enum: ['Number', 'String', 'Array', 'Object', "Date", "File"],
        // require : true
    },
    fileId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "excel_data"
    },
    constraints: {
        type: String
    },
    variableLabel: {
        type: String
    },
    fileVariableSelection: {
        type: Boolean
    },
    variableValue: {
        type: String
    },
    expression: {
        type: String
    },
    decisionTreeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "decisionTrees"
    },
    isActive: {
        type: Boolean, // true = active, false = inActive
        default: true
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    isProcessVariable: {
        type: Boolean,
        default: false
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
    collection: "expression_variables",
});

expressionVariableSchema.plugin(timestamps);

const ExpressionVariableModel = mongoose.model("expression_variables", expressionVariableSchema);

export default ExpressionVariableModel;