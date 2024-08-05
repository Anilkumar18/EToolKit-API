import mongoose from "mongoose";
import timestamps from "mongoose-timestamp";

const standardHeadersSchema = mongoose.Schema({
    fileName: {
        type: String
    },
    headers: {
        type: Array
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
    collection: "standard_headers",
});

standardHeadersSchema.plugin(timestamps);

const StandardHeaderModel = mongoose.model("standard_headers", standardHeadersSchema);

export default StandardHeaderModel;