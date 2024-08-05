import * as reportTemplateQuery from '../../../db/queries/reportTemplate.query'

export default class reportTemplateController {

    static async getTemplatesList(req, res) {
        try {

            let findPattern = {
                isActive: true,
                isDeleted: false,
            };

            const reportTemplateList = await reportTemplateQuery.find(findPattern, "name");

            res.status(status_codes.OK).send(Response.sendResponse(status_codes.OK, custom_message.InfoMessage.getReportTemplateList, reportTemplateList, []));

        } catch (err) {
            console.log(err);
            res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
        }
    }
}