import mongoose from "mongoose";
import timestamps from "mongoose-timestamp";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";

const excelDataSchema = mongoose.Schema({
    fileName: {
        type: String,
        required: true
    },
    uniqueHeaders: {
        type: [String],
        required: true
    },
    isSystemFile : {
        type : Boolean,
    },
    isModifiableFields : {
        type : Boolean
    },
    headersTypes: [{
        columnName: {
            type: String,
            required: true
        },
        columnType: {
            type: String,
            required: true,
            default: 'string'
        },
        regexPatterm: {
            type: String,
            required: false
        },
        actualDataType : {
            type : String
        },
        returnFormat : {
            type : String
        },
        dateFormat: {
            type: String,
            required: false
        },
        isSecureField : {
            type : Boolean,
        }
    }],
    headersRows: {
        type: [String],
        required: true
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
    excelFileId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "excel_data"
    },
}, {
    collection: "static_excel_files",
});

excelDataSchema.plugin(timestamps);
excelDataSchema.plugin(aggregatePaginate);

const StaticExcelFilesModel = mongoose.model("static_excel_files", excelDataSchema);

export default StaticExcelFilesModel;