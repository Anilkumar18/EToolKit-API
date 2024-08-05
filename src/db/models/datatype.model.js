import mongoose from "mongoose";
import timestamps from "mongoose-timestamp";

const dataTypeSchema = mongoose.Schema({
    dataType: {
        type: String
    },
    isActive: {
        type: Boolean,
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
    },
}, {
    collection: "dataTypes",
});

dataTypeSchema.plugin(timestamps);

const DataTypeModel = mongoose.model("dataTypes", dataTypeSchema);

export default DataTypeModel;