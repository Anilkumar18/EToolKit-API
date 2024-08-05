import mongoose from "mongoose";
import timestamps from "mongoose-timestamp";

const variableSchema = mongoose.Schema({
    label: {
        type: String
    },
    type: {
        type: String,
        enum: ["System", "Organization", "LoopVariable"]
    },
    valueType: {
        type: String,
        enum: ["String", "Array", "Number", "Object"]
    },
    category: {
        type: String
    },
    isSingle: {
        type: Boolean,
    },
    name: {
        type: String,
    },
    isActive: {
        type: Boolean, // true = active, false = inActive
        default: true
    },
    isDeleted: {
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
    collection: "variables",
});

variableSchema.plugin(timestamps);

const VariableModel = mongoose.model("variables", variableSchema);

export default VariableModel;