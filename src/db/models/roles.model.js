import mongoose from "mongoose";
import timestamps from "mongoose-timestamp";

const roleSchema = mongoose.Schema({
    name: {
        type: String
    },
    permission: [{
        permissionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "permissions"
        }
    }],
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
    collection: "roles",
});

roleSchema.plugin(timestamps);

const RoleModel = mongoose.model("roles", roleSchema);

export default RoleModel;