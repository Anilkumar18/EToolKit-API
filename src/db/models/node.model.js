import mongoose from "mongoose";
import timestamps from "mongoose-timestamp";

const nodeSchema = mongoose.Schema({
    label: {
        type: String
    },
    type: {
        type: String,
        enum: ["Decision", "ProcessData", "PredefinedLogic", "ManualInput", "StaticLoop", "MultiAns", "Report", "Start", "End", "Comment", "MultiOption", "PassData", "LookUp", "Document", "DatePicker", "TableView", "TableViewInput", "ChartView"]
        // enum: ["Decision", "ProcessData", "PredefinedLogic", "ManualInput", "FileInput", "StaticLoop", "MultiAns", "Report", "Start", "Step", "End", "Triangle", "Rectangle", "StoreData", "FinalReadOut", "MultiProcess", "Comment", "MultiOption", "PassData", "lookup"]
    },
    isLeaf: {
        type: Boolean
    },
    isRoot: {
        type: Boolean
    },
    questionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "questions"
    },
    decisionTreeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "decisionTrees"
    },
    belongFromProcess: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "preDefinedLogics"
    },
    metaData: {
        label: {
            type: String
        },
        variableName: {
            type: String
        },
        heading: {
            type: String
        },
        isGridLayout: {
            type: Boolean
        },
        fileId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "excel_data"
        },
        templateId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "report_templates"
        },
        localVariableName: {
            type: String
        },
        displayColumnName: {
            type: String
        },
        columnName: {
            type: String
        },
        groupByColumn: {
            type: String
        },
        function: {
            type: String
        },
        value: {
            type: String
        },
        type: {
            type: String
        },
        distinctColumn: {
            type: String
        },
        isDistinct: {
            type: Boolean,
            default: false
        },
        category: {
            type: String
        },
        name: {
            type: String
        },
        expression: {
            type: String
        },
        procedure: {
            type: String
        },
        equation: {
            type: String
        },
        variableLabel: {
            type: String
        },
        question: {
            type: String
        },
        fileName: {
            type: String
        },
        isSingle: {
            type: Boolean
        },
        lookupVariableName: {
            type: String
        },
        isFetchFromLookup : {
            type : Boolean
        },
        associateLoopId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "loop_types"
        },
        singleVariableName: {
            type: String
        },
        variableMapping: [{
            variableName: {
                type: String
            },
            localVariableName: {
                type: String
            }
        }],
        inputs: [{
            label: {
                type: String
            },
            localVariableName: {
                type: String
            },
            variableLabel: {
                type: String
            },
            showFilter: {
                type: Boolean
            },
            fileVariableSelection: {
                type: Boolean
            },
            constraints: {
                type: String,
                enum: ["not_null", "any"],
                default: "not_null"
            },
            variableName: {
                type: String
            },
            variableValue: {
                type: String
            },
            fileValue: {
                outerOperation: {
                    type: String
                },
                identityValue: {
                    type: Array
                },
                fileName: {
                    type: String
                },
                fileId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "excel_data"
                },
                multiIdentityColRow: [{
                    operation: {
                        type: String
                    },
                    operationalFields: [{
                        identityCol: {
                            type: String
                        },
                        identityColRow: {
                            type: String
                        },
                        equation: {
                            type: String
                        },
                        text: {
                            type: String
                        }
                    }]
                }]
            },
            inputType: {
                type: String
            }
        }]
    },
    nodeKey: {
        type: String
    },
    links: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "conditions"
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
    collection: "nodes",
});

nodeSchema.plugin(timestamps);

const NodeModel = mongoose.model("nodes", nodeSchema);

export default NodeModel;