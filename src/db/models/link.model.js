import mongoose from "mongoose";
import timestamps from "mongoose-timestamp";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";

const linkSchema = mongoose.Schema({
    label: {
        type: String
    },
    nextNode : {
        type : mongoose.Schema.Types.ObjectId,
        ref: "nodes"
    },
    isActive: {
        type: Boolean, // true = active, false = inActive
        default: true
    },
    decisionTreeId : {
        type : mongoose.Schema.Types.ObjectId,
        ref: "decisionTrees"
    },
    linkKey : {
        type : String
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
    collection: "links",
});

linkSchema.plugin(timestamps);
linkSchema.plugin(aggregatePaginate);

const LinkModel = mongoose.model("links", linkSchema);

export default LinkModel;