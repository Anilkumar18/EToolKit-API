import VariableModel from "../../../db/models/variables.model";
import * as variableQuery from "../../../db/queries/variable.query";
import * as preDefineLogicQueries from "../../../db/queries/preDefinedLogic.query";
import * as excelDataQueries from "../../../db/queries/excelData.query";
import { serverLog } from "../../../utils/logger";

export default class variableController {

    static async create(req, res) {
        try {
            const {
                name,
                label,
                type,
                valueType
            } = req.body;

            const variableModelData = new VariableModel({
                name,
                label,
                type,
                valueType
            });

            await variableQuery.saveData(variableModelData);

            res.status(status_codes.CREATED).send(Response.sendResponse(status_codes.CREATED, custom_message.InfoMessage.createVariable, [], []));
        } catch (err) {
            console.log(err);
            res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
        }
    }


    static async getVariable(req, res) {
        try {
            const {
                nodeType
            } = req.query;

            let variableList;

            switch (nodeType) {
                case "MultiOption":
                    variableList = await variableController.getFileVariables();
                    break;
                case "ManualInput":
                    variableList = await variableQuery.findAll({ valueType: "Number", isActive: true, isDeleted: false, type: "System" });
                    break;
                case "Procedure":
                    variableList = await variableQuery.findAll({ valueType: "Number", isActive: true, isDeleted: false, type: "Organization" });
                    break;
                default:
                    break;
            }

            res.status(status_codes.OK).send(Response.sendResponse(status_codes.OK, custom_message.InfoMessage.getVariable, variableList, []));
        } catch (err) {
            console.log(err);
            res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
        }
    }

    static async getFileVariables() {
        let files = await excelDataQueries.find({ isActive : true, isDeleted : false }, { fileName: 1 });

        let newArray = []

        await files.forEach(file => {
            let fileVariableObj = {
                _id: file._id,
                variableName: file.fileName,
            }
            newArray.push(fileVariableObj);
        });

        return newArray;
    }

    static async variableList(req, res) {
        try {

            const { logic } = req.params;

            const preDefineLogic = await preDefineLogicQueries.findOne({ logic: logic, isActive: true, isDeleted: false });

            const variables = await variableQuery.findAllAndProject({ _id: { $in: preDefineLogic.variableId }, isActive: true, isDeleted: false }, { _id: 1, name: 1, label: 1, valueType: 1, category: 1, isSingle: 1 });

            res.status(status_codes.OK).send(Response.sendResponse(status_codes.OK, custom_message.InfoMessage.getVariable, variables, []));

        } catch (err) {
            serverLog.error(`[${req.originalUrl}] [${req.method}], [${status_codes.INTERNAL_SERVER_ERROR}] {error : ${err}}`);
            console.log(err);
            res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
        }
    }

    static async operatorList(req, res) {
        try {
            const arithmeticOperator = ["+", "-", "/", "*", "(", ")"];
            const logicalOperator = ["==", ">", "<", ">=", "<=", "!="];

            if (req.query.nodeType == "Conditional") {
                res.status(status_codes.OK).send(Response.sendResponse(status_codes.OK, custom_message.InfoMessage.getOperatorList, logicalOperator, []));
            }

            if (req.query.nodeType == "Procedure") {
                res.status(status_codes.OK).send(Response.sendResponse(status_codes.OK, custom_message.InfoMessage.getOperatorList, arithmeticOperator, []));
            }

        } catch (err) {
            serverLog.error(`[${req.originalUrl}] [${req.method}], [${status_codes.INTERNAL_SERVER_ERROR}] {error : ${err}}`);
            console.log(err);
            res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
        }
    }
}