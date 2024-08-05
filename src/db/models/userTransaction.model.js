import mongoose from "mongoose";
import timestamps from "mongoose-timestamp";

const userTransactionSchema = mongoose.Schema({
    questionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "questions"
    },
    status: {
        type: String,
        enum: ['inProgress', 'completed']
    },
    reportUrl: {
        type: String
    },
    traverseNodes: [{
        linkLabel: {
            type: String
        },
        nodeLabel: {
            type: String
        },
        isRoot: {
            type: Boolean
        },
        isLeaf: {
            type: Boolean
        }
    }],
    fromLink: [{
        fromLinkId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'links'
        },
        fromLinkKey : {
            type : String
        }
    }],
    isActive: {
        type: Boolean, // true = active, false = inActive
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
    }
}, {
    collection: "userTransactions",
});

userTransactionSchema.plugin(timestamps);

const UserTransactionModel = mongoose.model("userTransactions", userTransactionSchema);

export default UserTransactionModel;