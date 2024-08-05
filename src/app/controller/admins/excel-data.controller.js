"use strict";

import {
    serverLog
} from '../../../utils/logger';
import * as multiSelectorQuery from '../../../db/queries/multiSelector.query';
import MultiSelectorModel from "../../../db/models/multiSelector.model";

export default class excelDataController {

    static async addMultiSelectorProperties(req, res) {
        try {
            const {
                property,
                label
            } = req.body;
            serverLog.info(`[${req.originalUrl}] [${req.method}], {request_payload : ${JSON.stringify(req.body)}}`);

            const multiSelectorModelData = new MultiSelectorModel({
                property,
                label
            });

            await multiSelectorQuery.saveData(multiSelectorModelData);

            serverLog.info(`[${req.originalUrl}] [${req.method}] [${status_codes.CREATED}], {response_message : "MultiSelector properties added successfully!"}`)
            res.status(status_codes.CREATED).send(Response.sendResponse(status_codes.CREATED, custom_message.InfoMessage.multiSelectorCreated, [], []));
        } catch (err) {
            serverLog.error(`[${req.originalUrl}] [${req.method}], [${status_codes.INTERNAL_SERVER_ERROR}] {error : ${err}}`);
            res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
        }
    }

    static async getMultiSelectors(req, res) {
        try {
            serverLog.info(`[${req.originalUrl}] [${req.method}], {request_message : "In get multiSelector api"}`);

            const multiSelectorData = await multiSelectorQuery.findAll({
                isDeleted: false
            });

            serverLog.info(`[${req.originalUrl}] [${req.method}] [${status_codes.OK}], {response : ${JSON.stringify(multiSelectorData)}}`)
            res.status(status_codes.OK).send(Response.sendResponse(status_codes.OK, custom_message.InfoMessage.multiSelectorList, multiSelectorData, []));

        } catch (err) {
            serverLog.error(`[${req.originalUrl}] [${req.method}] [${status_codes.INTERNAL_SERVER_ERROR}], {error : ${err}}`);
            res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
        }
    }
}