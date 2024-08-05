import mongoose from "mongoose";
import timestamps from "mongoose-timestamp";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";

const excelDataSchema = mongoose.Schema({
    fileName: {
        type: String
    },
    fileHeaders: {
        type: Array
    },
    uniqueKeyColumns: {
        type: Array
    },
    fileData: {
        type: [Object]
    },
    displayNameHeaders: {
        type: Object
    },
    hasSampleFile : {
        type : Boolean,
        default : false
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
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users"
    },
    isCompositeUnique: {
        type: Boolean, // true = active, false = inActive
        default: false
    },
    compositeKeyName: {
        type: String 
    },
    compositeKeyOptions: {
        type: Array
    },
    isCompositive: {
        type: Boolean, // true = active, false = inActive
        default: false
    },
}, {
    collection: "excel_data",
    strict: false
});

excelDataSchema.plugin(timestamps);
excelDataSchema.plugin(aggregatePaginate);

const ExcelDataModel = mongoose.model("excel_data", excelDataSchema);

export default ExcelDataModel;