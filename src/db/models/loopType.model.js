import mongoose from "mongoose";
import timestamps from "mongoose-timestamp";

const loopTypeSchema = mongoose.Schema({
    name: {
        type: String
    },
    slug: {
        type: String,
        enum: ["parcelRater", "ltlRater", "tlRater", "fleetRater", "portRater"]
    },
    variables: [{
        variableId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "variables"
        },
        type: {
            type: String,
            enum: ["predefinedLogicLoop", "loop"]
        }
    }],
    isActive: {
        type: Boolean, // true = active, false = inActive
        default: true
    },
    isDeleted: {
        type: Boolean, // true = active, false = inActive
        default: false
    },
}, {
    collection: "loop_types",
});

loopTypeSchema.plugin(timestamps);

const LoopTypeModel = mongoose.model("loop_types", loopTypeSchema);

export default LoopTypeModel;