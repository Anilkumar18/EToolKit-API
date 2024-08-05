import * as reportTemplateQuery from '../../../db/queries/reportTemplate.query';
import * as loopTypeQuery from '../../../db/queries/loopType.query';

export default class reportTemplateController {

    static async getTemplatesList(req, res) {
        try {

            let findPattern = {
                isActive: true,
                isDeleted: false,
            };

            const reportTemplateList = await reportTemplateQuery.find(findPattern, "displayLabel");

            res.status(status_codes.OK).send(Response.sendResponse(status_codes.OK, custom_message.InfoMessage.getReportTemplateList, reportTemplateList, []));

        } catch (err) {
            console.log(err);
            res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
        }
    }

    static async updateTemplate(req, res) {
        try {
            const {
                displayLabel,
                reportTemplateId
            } = req.body;

            await reportTemplateQuery.findOneAndUpdate({ _id : reportTemplateId, isActive : true }, { displayLabel });

            res.status(status_codes.OK).send(Response.sendResponse(status_codes.OK, custom_message.InfoMessage.updateReportTemplate, [], []));
        } catch (err) {
            res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
        }
    }

    static async getLoopTypesList(req, res) {
        try {

            let findPattern = {
                isActive: true,
                isDeleted: false,
            };

            const loopTypesList = await loopTypeQuery.find(findPattern, "name");

            res.status(status_codes.OK).send(Response.sendResponse(status_codes.OK, custom_message.InfoMessage.dataGet, loopTypesList, []));

        } catch (err) {
            console.log(err);
            res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
        }
    }
}