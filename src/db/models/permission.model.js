import mongoose from "mongoose";
import timestamps from "mongoose-timestamp";

const permissionSchema = mongoose.Schema({
    name: {
        type: String
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
    collection: "permissions"
});

permissionSchema.plugin(timestamps);

const PermissionModel = mongoose.model("permissions", permissionSchema);

export default PermissionModel;