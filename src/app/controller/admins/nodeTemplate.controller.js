import * as nodeTemplateQuery from '../../../db/queries/nodeTemplate.query'

export default class nodeTemplateController {

    static async getTemplate(req, res) {
        try {
            const {
                nodeType
            } = req.query;

            const nodeTemplate = await nodeTemplateQuery.findOne({
                type: nodeType
            });

            res.status(status_codes.OK).send(Response.sendResponse(status_codes.OK, custom_message.InfoMessage.getTemplateDetail, nodeTemplate, []));

        } catch (err) {
            console.log(err);
            res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
        }
    }
}