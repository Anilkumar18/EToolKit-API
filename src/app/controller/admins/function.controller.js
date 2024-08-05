import FunctionModel from "../../../db/models/functions.model";
import * as functionQuery from "../../../db/queries/function.query";

export default class functionController {

    static async create(req, res) {
        try {
            const {
                name
            } = req.body;

            const functionModelData = new FunctionModel({
                name
            })

            await functionQuery.saveData(functionModelData);

            res.status(status_codes.CREATED).send(Response.sendResponse(status_codes.CREATED, custom_message.InfoMessage.createFunction, [], []));
        } catch (err) {
            console.log(err);
            res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
        }
    }

    static async getFunction(req, res) {
        try {
            const functionList = await functionQuery.findAll({
                isActive: true
            });

            res.status(status_codes.OK).send(Response.sendResponse(status_codes.OK, custom_message.InfoMessage.getFunction, functionList, []));
        } catch (err) {
            console.log(err);
            res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
        }
    }
}