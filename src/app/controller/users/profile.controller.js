import { serverLog } from "../../../utils/logger";
import * as userQuery from '../../../db/queries/user.query';
import * as organizationQueries from '../../../db/queries/organization.query';
import AuthUtil from '../../../utils/auth';
import adminOrganizationController from "../admins/organization.controller";


export default class profileController {

    static async getProfileDetails(req, res) {
        try {

            serverLog.info(`[${req.originalUrl}] [${req.method}] [loggedInUser : ${req.headers.id}], {request_payload : []}`);

            // Get user data
            var findPattern = { _id: req.headers.id };
            var selectPattern = "firstName lastName countryCode phone designation userRole organizationId";
            var populatePattern = "organizationId";
            var populateFields = "companyName";

            var userData = await userQuery.findOne(findPattern, selectPattern, populatePattern, populateFields);

            if (userData) {

                res.status(status_codes.CREATED).send(Response.sendResponse(status_codes.OK, custom_message.InfoMessage.profileGet, userData, []));

            } else {
                res.status(status_codes.UNAUTHORISED).send(Response.sendResponse(status_codes.UNAUTHORISED, custom_message.errorMessage.userNotFound, [], []));
            }

        } catch (err) {
            console.log("Error :-", err);
            serverLog.error(`[${req.originalUrl}] [${req.method}], [${status_codes.INTERNAL_SERVER_ERROR}] {error : ${err}}`);
            res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
        }
    }

    static async getProfileOrganizationDetail(req, res) {
        try {

            serverLog.info(`[${req.originalUrl}] [${req.method}] [loggedInUser : ${req.headers.id}], {request_payload : []}`);

            // Get user data
            var findPattern = { _id: req.headers.id };
            var userData = await userQuery.findOne(findPattern);

            if (userData) {

                let organizationDetails = await organizationQueries.findByIdAndPopulate(userData.organizationId);
                let newOrgDetails = JSON.parse(JSON.stringify(organizationDetails));

                let getFileDetails = await adminOrganizationController.getDetails(newOrgDetails);

                res.status(status_codes.OK).send(Response.sendResponse(status_codes.OK, custom_message.InfoMessage.Organization, getFileDetails, []));

            } else {
                res.status(status_codes.UNAUTHORISED).send(Response.sendResponse(status_codes.UNAUTHORISED, custom_message.errorMessage.userNotFound, [], []));
            }

        } catch (err) {
            console.log("Error :-", err);
            serverLog.error(`[${req.originalUrl}] [${req.method}], [${status_codes.INTERNAL_SERVER_ERROR}] {error : ${err}}`);
            res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
        }
    }

    static async changePassword(req, res) {
        try {

            serverLog.info(`[${req.originalUrl}] [${req.method}] [loggedInUser : ${req.headers.id}], {request_payload : []}`);

            const {
                oldPassword,
                newPassword
            } = req.body;

            const findUser = await userQuery.findOne({
                _id: req.headers.id,
                isDeletedUser: false
            });

            if (findUser) {
                if (AuthUtil.comparePassword(oldPassword, findUser.password)) {

                    await userQuery.updateOne({ _id: findUser._id }, {
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
            console.log("Error :-", err);
            serverLog.error(`[${req.originalUrl}] [${req.method}], [${status_codes.INTERNAL_SERVER_ERROR}] {error : ${err}}`);
            res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
        }
    }
}