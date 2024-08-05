import { serverLog } from "../../../utils/logger";
import * as adminQuery from '../../../db/queries/admin.query';
import AuthUtil from '../../../utils/auth';

export default class profileController {

    static async changePassword(req, res) {
        try {

            serverLog.info(`[${req.originalUrl}] [${req.method}] [loggedInUser : ${req.headers.id}], {request_payload : []}`);

            const {
                oldPassword,
                newPassword
            } = req.body;

            const findAdmin = await adminQuery.findAdmin({
                _id: req.headers.id,
                isAdmin: true
            });

            if (findAdmin) {
                if (AuthUtil.comparePassword(oldPassword, findAdmin.password)) {

                    await adminQuery.updateOne({ _id: findAdmin._id }, {
                        password: AuthUtil.encryptPassword(newPassword)
                    });

                    serverLog.info(`[${req.originalUrl}] [${req.method}] [${status_codes.CREATED}] [loggedInUser : ${req.headers.id}], {response : "Password has been changed successfully!"}`);

                    res.status(status_codes.CREATED).send(Response.sendResponse(status_codes.CREATED, custom_message.InfoMessage.changePasswordSuccess, [], []));

                } else {
                    res.status(status_codes.BAD_REQUEST).send(Response.sendResponse(status_codes.BAD_REQUEST, custom_message.errorMessage.incorrectOldPassword, [], []));
                }
            } else {
                res.status(status_codes.UNAUTHORISED).send(Response.sendResponse(status_codes.UNAUTHORISED, custom_message.errorMessage.notFound, [], []));
            }

        } catch (err) {
            serverLog.error(`[${req.originalUrl}] [${req.method}], [${status_codes.INTERNAL_SERVER_ERROR}] {error : ${err}}`);
            res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
        }
    }
}