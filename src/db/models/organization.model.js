import mongoose from "mongoose";
import timestamps from "mongoose-timestamp";

const organizationSchema = mongoose.Schema({
    companyName: {
        type: String
    },
    geographicScope: {
        type: String
    },
    overAllRevenue: {
        type: Number
    },
    city: {
        type: String
    },
    metaData: [{
        variableName: { type: String, enum: ['products', 'state'] },
        fileId: { type: mongoose.Schema.Types.ObjectId },
        value: [{
            type: mongoose.Schema.Types.ObjectId
        }],
        fileName: {
            type: String
        }
    }],
    eCommerceRevenuePercentage: {
        type: Number
    },
    traditionalRetailRevenuePercentage: {
        type: Number
    },
    eCommerceUnit: {
        type: Number
    },
    traditionalRetailUnit: {
        type: Number
    },
    salesChannelUtilized: {
        type: String
    },
    iconLogo: {
        type: String,
        default: ""
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
    }
}, {
    collection: "organizations"
});

organizationSchema.plugin(timestamps);

const OrganizationModel = mongoose.model("organizations", organizationSchema);

export default OrganizationModel;