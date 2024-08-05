import mongoose from "mongoose";
import timestamps from "mongoose-timestamp";

const sampleFileSchema = mongoose.Schema({
    originalFileName: {
        type: String
    },
    sampleFileName: {
        type: String
    },
    fileUrl : {
        type: String
    },
    isActive: {
        type: Boolean, // true = active, false = inActive
        default : true
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
    }
}, {
    collection: "sampleFile",
});

sampleFileSchema.plugin(timestamps);

const SampleFileModel = mongoose.model("sampleFile", sampleFileSchema);

export default SampleFileModel;