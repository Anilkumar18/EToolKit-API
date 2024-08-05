import mongoose from "mongoose";
import timestamps from "mongoose-timestamp";

const functionSchema = mongoose.Schema({
    name: {
        type: String
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
    collection: "functions",
});

functionSchema.plugin(timestamps);

const FunctionModel = mongoose.model("functions", functionSchema);

export default FunctionModel;