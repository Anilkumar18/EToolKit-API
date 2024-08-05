import mongoose from "mongoose";
import timestamps from "mongoose-timestamp";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";

const multiSelectorSchema = mongoose.Schema({
    property: {
        type: String
    },
    label: {
        type: String
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    collection: "multiSelectors",
});

multiSelectorSchema.plugin(timestamps);
multiSelectorSchema.plugin(aggregatePaginate);

const MultiSelectorModel = mongoose.model("multiSelectors", multiSelectorSchema);

export default MultiSelectorModel;