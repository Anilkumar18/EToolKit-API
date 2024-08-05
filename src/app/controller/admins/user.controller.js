import UsersModel from '../../../db/models/user.model';
import {
    serverLog
} from '../../../utils/logger';
import * as userQuery from '../../../db/queries/user.query';
import AuthUtil from '../../../utils/auth';


export default class userController {

    static async createUser(req, res) {
        try {

            serverLog.info(`[${req.originalUrl}] [${req.method}] [loggedInUser : ${req.headers.id}], {request_payload : ${JSON.stringify(req.body)}}`);

            var findPattern = {
                email: req.body.email.toLowerCase(),
                isDeletedUser: false
            };

            var userdata = await userQuery.findOne(findPattern);

            if (userdata) {

                res.status(status_codes.BAD_REQUEST).send(Response.sendResponse(status_codes.BAD_REQUEST, custom_message.InfoMessage.userEmailAlreadyExist, [], []));

            } else {

                const user = new UsersModel({
                    firstName: req.body.firstName,
                    lastName: req.body.lastName,
                    countryCode: req.body.countryCode,
                    phone: req.body.phone,
                    email: req.body.email.toLowerCase(),
                    designation: req.body.designation,
                    password: AuthUtil.encryptPassword(req.body.password),
                    userRole: req.body.userRole,
                    createdBy: req.headers.id,
                    isActiveUser: true,
                    organizationId: req.body.organizationId
                });

                await userQuery.saveData(user);
                serverLog.info(`[${req.originalUrl}] [${req.method}] [loggedInUser : ${req.headers.id}], {response : user "${req.body.firstName}" created successfully}`);

                res.status(status_codes.CREATED).send(Response.sendResponse(status_codes.CREATED, custom_message.InfoMessage.userCreated, [], []));
            }

        } catch (err) {
            serverLog.error(`[${req.originalUrl}] [${req.method}], [${status_codes.INTERNAL_SERVER_ERROR}] {error : ${err}}`);
            res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
        }
    }

    static async userList(req, res) {
        try {
            serverLog.info(`[${req.originalUrl}] [${req.method}] [loggedInUser : ${req.headers.id}], {request_payload : NO PAYLOAD}`);

            var page = req.query.page || 1;
            var limit = 20;

            // Search Pattern
            var matchPattern = {
                userRole: {
                    $in: ["executive"]
                },
                isActiveUser: true,
                isDeletedUser: false,
            };

            // Selected Fields
            var selectedFields = ['firstName', 'lastName', 'userRole', 'email', 'designation', 'countryCode', 'phone', 'profilePicture', 'profileThumbnail', 'createdAt'];

            var projectPattern = {};
            selectedFields.forEach(item => {
                projectPattern[item] = "$" + item
            });

            // Query Building
            var queryPattern = [];
            queryPattern.push({
                $match: matchPattern
            });
            queryPattern.push({
                $project: projectPattern
            });

            // Set sorting order
            var sortPattern = {
                createdAt: -1
            };

            const paginatedData = await userQuery.getAggregatePaginatedData(queryPattern, sortPattern, page, limit);

            serverLog.info(`[${req.originalUrl}] [${req.method}] [${status_codes.OK}] [loggedInUser : ${req.headers.id}], {response : ${JSON.stringify(paginatedData)}}`);
            res.status(status_codes.OK).send(Response.sendResponse(status_codes.OK, custom_message.InfoMessage.userGet, paginatedData, []));
        } catch (err) {
            serverLog.error(`[${req.originalUrl}] [${req.method}], [${status_codes.INTERNAL_SERVER_ERROR}] {error : ${err}}`);
            console.log(err);
            res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
        }
    }

    static async userDetails(req, res) {
        try {
            serverLog.info(`[${req.originalUrl}] [${req.method}] [loggedInUser : ${req.headers.id}], {request_payload : req to get details of topic having Id ${req.params.id}}`);

            var findPattern = {
                _id: req.params.id
            };

            // Selected Fields
            var selectedFields = ['firstName', 'lastName', 'userRole', 'email', 'designation', 'countryCode', 'phone', 'profilePicture', 'profileThumbnail', 'createdAt'];

            var projectPattern = {};
            selectedFields.forEach(item => {
                projectPattern[item] = "$" + item
            });

            const userDetails = await userQuery.findOne(findPattern, projectPattern);

            serverLog.info(`[${req.originalUrl}] [${req.method}] [${status_codes.OK}] [loggedInUser : ${req.headers.id}], {response : ${JSON.stringify(userDetails)}}`);
            res.status(status_codes.OK).send(Response.sendResponse(status_codes.OK, custom_message.InfoMessage.userGet, userDetails, []));
        } catch (err) {
            serverLog.error(`[${req.originalUrl}] [${req.method}], [${status_codes.INTERNAL_SERVER_ERROR}] {error : ${err}}`);
            console.log(err);
            res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
        }
    }

    static async updateUser(req, res) {
        try {
            const userId = req.params.id;
            serverLog.info(`[${req.originalUrl}] [${req.method}] [loggedInUser : ${req.headers.id}], {request_payload : ${JSON.stringify(req.body)}}`);

            const user = await userQuery.findById(userId);

            await userQuery.findByIdAndUpdate(userId, {
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                countryCode: req.body.countryCode,
                phone: req.body.phone,
                designation: req.body.designation,
                userRole: req.body.userRole,
                updatedBy: req.headers.id
            }, {
                new: true
            });

            serverLog.info(`[${req.originalUrl}] [${req.method}] [${status_codes.OK}] [loggedInUser : ${req.headers.id}], {response : user "${user._id}" updated successfully}`);

            res.status(status_codes.OK).send(Response.sendResponse(status_codes.OK, custom_message.InfoMessage.userUpdated, [], []));

        } catch (err) {
            serverLog.error(`[${req.originalUrl}] [${req.method}], [${status_codes.INTERNAL_SERVER_ERROR}] {error : ${err}}`);
            console.log(err);
            res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
        }
    }

    static async deleteUser(req, res) {
        try {
            serverLog.info(`[${req.originalUrl}] [${req.method}] [loggedInUser : ${req.headers.id}], {request_payload : "req to delete topic having Id : ${req.params.id}"}`);
            const userId = req.params.id;

            await userQuery.findByIdAndUpdate(userId, {
                isDeletedUser: true,
                updatedBy: req.headers.id
            }, {
                new: true
            });
            serverLog.info(`[${req.originalUrl}] [${req.method}] [${status_codes.OK}] [loggedInUser : ${req.headers.id}], {response : "User(${userId} is deleted successfully)"}`);

            res.status(status_codes.OK).send(Response.sendResponse(status_codes.OK, custom_message.InfoMessage.deleteUser, [], []));

        } catch (err) {
            serverLog.error(`[${req.originalUrl}] [${req.method}], [${status_codes.INTERNAL_SERVER_ERROR}] {error : ${err}}`);
            console.log(err);
            res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
        }
    }

    static async updateUserPassword(req, res) {
        try {
            const userId = req.params.id;
            serverLog.info(`[${req.originalUrl}] [${req.method}] [loggedInUser : ${req.headers.id}], {request_payload : ${JSON.stringify(req.body)}}`);

            const user = await userQuery.findById(userId);

            await userQuery.findByIdAndUpdate(userId, {
                password: AuthUtil.encryptPassword(req.body.password),
                updatedBy: req.headers.id
            }, {
                new: true
            });

            serverLog.info(`[${req.originalUrl}] [${req.method}] [${status_codes.OK}] [loggedInUser : ${req.headers.id}], {response : user "${user._id}" updated successfully}`);

            res.status(status_codes.OK).send(Response.sendResponse(status_codes.OK, custom_message.InfoMessage.userPasswordUpdated, [], []));

        } catch (err) {
            serverLog.error(`[${req.originalUrl}] [${req.method}], [${status_codes.INTERNAL_SERVER_ERROR}] {error : ${err}}`);
            console.log(err);
            res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
        }
    }
}