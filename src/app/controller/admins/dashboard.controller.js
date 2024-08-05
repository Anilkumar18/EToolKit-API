import { spawnSync, execSync } from "child_process";
import {
    serverLog
} from "../../../utils/logger";
import * as topicQueries from "../../../db/queries/topic.query";
import * as userQueries from "../../../db/queries/user.query";
import * as transactionQueries from "../../../db/queries/userTransaction.query";
import moment from "moment";


export default class dashboardController {

    static async getDashboard(req, res) {
        try {

            serverLog.info(`[${req.originalUrl}] [${req.method}] [loggedInUser : ${req.headers.id}], {request_payload : []}`);

            const findAdmin = await userQueries.findById(req.headers.id);

            if (findAdmin.isAdmin) {

                let topicDetails = await topicQueries.findOne({ name : "General Toolbox", isActive : true });

                const topicCount = await topicQueries.countDocs({
                    type: 'subTopic',
                    isActive: true,
                    parentTopic : topicDetails._id
                });

                const userCount = await userQueries.countDocs({
                    isAdmin: false,
                    isActiveUser: true,
                    isDeletedUser: false
                });

                // this field is used to get distinct records from that field
                const distinctionField = 'questionId';

                const reports = await transactionQueries.findDistinct({
                    reportUrl: {
                        $exists: true
                    }
                }, distinctionField);

                const response = {
                    topicCount,
                    userCount,
                    reportCount: reports.length
                };

                serverLog.info(`[${req.originalUrl}] [${req.method}] [${status_codes.OK}] [loggedInUser : ${req.headers.id}], {response : ${JSON.stringify(response)}}`);
                res.status(status_codes.OK).send(Response.sendResponse(status_codes.OK, custom_message.InfoMessage.dashboardDetails, response, []));

            } else {
                serverLog.error(`[${req.originalUrl}] [${req.method}] [${status_codes.UNAUTHORISED}] [loggedInUser : ${req.headers.id}], {error_message : ${custom_message.errorMessage.unAuthorized}}`);
                res.status(status_codes.UNAUTHORISED).send(Response.sendResponse(status_codes.UNAUTHORISED, custom_message.errorMessage.unAuthorized, [], []));
            }

        } catch (err) {
            serverLog.error(`[${req.originalUrl}] [${req.method}] [${status_codes.INTERNAL_SERVER_ERROR}], {error : ${err}}`);
            res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
        }
    }

    static async dumpDatabase(req, res) {
        try {

            const dumpMongoUri = req.body.dumpMongoUri || "";
            const dumpDbName = req.body.dumpDbName || "";
            const dumpDbFolderPath = req.body.dumpDbFolderPath || "";

            if (dumpMongoUri && dumpDbName && dumpDbFolderPath) {

                try {

                    const mongodumpCmd = `mongodump --forceTableScan --out=${dumpDbFolderPath} --uri="` + dumpMongoUri + `"`;
                    spawnSync(mongodumpCmd, { shell: true });

                    const srcPath = dumpDbFolderPath + "/" + dumpDbName;
                    const desPath = dumpDbFolderPath + "/" + dumpDbName + "-" + moment(new Date()).format("D-M-Y-h-m-a");
                    const renameCmd = `mv ${srcPath} ${desPath}`;
                    spawnSync(renameCmd, { shell: true });

                    const resMsg = "Database backup has done successfully at path " + desPath;
                    res.status(status_codes.OK).send(Response.sendResponse(status_codes.OK, resMsg, [], []));

                } catch (err) {
                    const resMsg = err.toString();
                    res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, resMsg, [], []));
                }

            } else {

                const resMsg = "All params are required.";
                res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, resMsg, [], []));
            }

        } catch (err) {
            serverLog.error(`[${req.originalUrl}] [${req.method}], [${status_codes.INTERNAL_SERVER_ERROR}] {error : ${err}}`);
            res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
        }
    }

    static async restoreDatabase(req, res) {
        try {

            const restoreMongoUri = req.body.restoreMongoUri || "";
            const restoreDbName = req.body.restoreDbName || "";
            const restoreDbFolderPath = req.body.restoreDbFolderPath || "";

            if (restoreMongoUri && restoreDbName && restoreDbFolderPath) {

                const mongorestoreCmd = `mongorestore --uri="` + restoreMongoUri + `" --db=${restoreDbName} ${restoreDbFolderPath}`;
                spawnSync(mongorestoreCmd, { shell: true });

                const resMsg = "Database restore has done successfully.";
                res.status(status_codes.OK).send(Response.sendResponse(status_codes.OK, resMsg, [], []));

            } else {

                const resMsg = "All params are required.";
                res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, resMsg, [], []));
            }

        } catch (err) {
            serverLog.error(`[${req.originalUrl}] [${req.method}], [${status_codes.INTERNAL_SERVER_ERROR}] {error : ${err}}`);
            res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
        }
    }
}