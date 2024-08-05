import mongoose from "mongoose";
import timestamps from "mongoose-timestamp";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";

const userTransactionInputSchema = mongoose.Schema({
    userTransactionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "userTransactions"
    },
    variableId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "expression_variables"
    },
    variableName: {
        type: String
    },
    value: {
        type: String
    },
    valueReference : {
        type: String
    },
    valueType: {
        type: String
    },
    variableLabel: {
        type: String
    },
    metaData: {
        type: String
    },
    isFetchFromLookup : {
        type : Boolean
    },
    displayColumn : {
        type : String
    },
    columnName : {
        type : String
    },
    fileId : {
        type: mongoose.Schema.Types.ObjectId,
        ref: "excel_data"
    },
    nodeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "nodes"
    },
    isParseFromProcess: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean, // true = active, false = inActive
        default: true
    },
    isDeleted: {
        type: Boolean, // true = active, false = inActive
        default: false
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users"
    }
}, {
    collection: "userTransactionInputs",
});

userTransactionInputSchema.plugin(timestamps);
userTransactionInputSchema.plugin(aggregatePaginate);

const UserTransactionInputModel = mongoose.model("userTransactionInputs", userTransactionInputSchema);

export default UserTransactionInputModel;