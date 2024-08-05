import mongoose from "mongoose";
import timestamps from "mongoose-timestamp";

const organizationUserSchema = mongoose.Schema({
    roles: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "roles"
    }],
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "organizations"
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users"
    },
    isActive: {
        type: Boolean, // true = active, false = inActive
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
    collection: "organizationUsers"
});

organizationUserSchema.plugin(timestamps);

const OrganizationUserModel = mongoose.model("organizationUsers", organizationUserSchema);

export default OrganizationUserModel;