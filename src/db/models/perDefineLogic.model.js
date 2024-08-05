import mongoose from "mongoose";
import timestamps from "mongoose-timestamp";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";

const preDefinedLogicSchema = mongoose.Schema({
    logic: {
        type: String
    },
    label: {
        type: String
    },
    displayLabel : {
        type: String
    },
    description : {
        type : String
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isDecisionTreeAssigned : {
        type : Boolean,
        default : false
    },
    variableId: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "variables"
    }]
}, {
    collection: "preDefinedLogics",
});

preDefinedLogicSchema.plugin(timestamps);
preDefinedLogicSchema.plugin(aggregatePaginate);

const PreDefinedLogicModel = mongoose.model("preDefinedLogics", preDefinedLogicSchema);

export default PreDefinedLogicModel;