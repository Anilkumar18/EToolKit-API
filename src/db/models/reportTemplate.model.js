import mongoose from "mongoose";
import timestamps from "mongoose-timestamp";

const reportTemplateTypeSchema = mongoose.Schema({
    name: {
        type: String
    },
    slug: {
        type: String,
        enum: ["netwrokComputation", "portAnalysis", "default"]
    },
    displayLabel : {
        type : String
    },
    isActive: {
        type: Boolean, // true = active, false = inActive
        default: true
    },
    isDeleted: {
        type: Boolean, // true = active, false = inActive
        default: false
    },
}, {
    collection: "report_templates",
});

reportTemplateTypeSchema.plugin(timestamps);

const ReportTemplateTypeModel = mongoose.model("report_templates", reportTemplateTypeSchema);

export default ReportTemplateTypeModel;