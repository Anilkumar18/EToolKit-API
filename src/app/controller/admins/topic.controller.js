import TopicModel from '../../../db/models/topic.model';
import {
    serverLog
} from '../../../utils/logger';
import * as topicQuery from '../../../db/queries/topic.query';


export default class topicController {

    static async createTopic(req, res) {
        try {

            serverLog.info(`[${req.originalUrl}] [${req.method}] [loggedInUser : ${req.headers.id}], {request_payload : ${JSON.stringify(req.body)}}`);

            var topicRes = await topicQuery.findOne({ name: { '$regex': req.body.name, $options: 'i' }, isActive: true, type: 'topic' });

            if (!topicRes) {

                const topic = new TopicModel({
                    name: req.body.name,
                    createdBy: req.headers.id,
                    updatedBy: req.headers.id,
                    type: 'topic'
                });

                await topicQuery.saveData(topic);
                serverLog.info(`[${req.originalUrl}] [${req.method}] [loggedInUser : ${req.headers.id}], {response : topic "${req.body.name}" created successfully}`);

                res.status(status_codes.CREATED).send(Response.sendResponse(status_codes.CREATED, custom_message.InfoMessage.topicCreated, [], []));

            } else {
                res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.topicAlreadyExist, [], []));
            }

        } catch (err) {
            serverLog.error(`[${req.originalUrl}] [${req.method}], [${status_codes.INTERNAL_SERVER_ERROR}] {error : ${err}}`);
            console.log(err);
            res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
        }
    }

    static async updateTopic(req, res) {
        try {
            const topicId = req.params.id;
            serverLog.info(`[${req.originalUrl}] [${req.method}] [loggedInUser : ${req.headers.id}], {request_payload : ${JSON.stringify(req.body)}}`);

            var topicRes = await topicQuery.findOne({ _id: { $ne: topicId }, name: { '$regex': req.body.name, $options: 'i' } });

            if (!topicRes) {

                const topic = await topicQuery.findById(topicId);

                await topicQuery.findByIdAndUpdate(topicId, {
                    name: req.body.name ? req.body.name : topic.name,
                    updatedBy: req.headers.id
                }, {
                    new: true
                });

                serverLog.info(`[${req.originalUrl}] [${req.method}] [${status_codes.OK}] [loggedInUser : ${req.headers.id}], {response : topic "${topic._id}" updated successfully}`);

                res.status(status_codes.OK).send(Response.sendResponse(status_codes.OK, custom_message.InfoMessage.topicUpdated, [], []));

            } else {
                res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.topicAlreadyExist, [], []));
            }

        } catch (err) {
            serverLog.error(`[${req.originalUrl}] [${req.method}], [${status_codes.INTERNAL_SERVER_ERROR}] {error : ${err}}`);
            console.log(err);
            res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
        }
    }

    static async topicList(req, res) {
        try {
            serverLog.info(`[${req.originalUrl}] [${req.method}] [loggedInUser : ${req.headers.id}], {request_payload : NO PAYLOAD}`);

            const topicList = await topicQuery.findAllAndAggregate({
                isActive: true
            }, {
                type: "topic"
            });

            serverLog.info(`[${req.originalUrl}] [${req.method}] [${status_codes.OK}] [loggedInUser : ${req.headers.id}], {response : ${JSON.stringify(topicList)}}`);
            res.status(status_codes.OK).send(Response.sendResponse(status_codes.OK, custom_message.InfoMessage.topicGet, topicList, []));
        } catch (err) {
            serverLog.error(`[${req.originalUrl}] [${req.method}], [${status_codes.INTERNAL_SERVER_ERROR}] {error : ${err}}`);
            console.log(err);
            res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
        }
    }

    static async topicDetails(req, res) {
        try {
            const {
                topicId
            } = req.query;
            let topicInfo;
            let topic;
            let response;

            if (!topicId) {
                topicInfo = await topicQuery.findOne({ name: "General Toolbox", isActive: true, type: "topic" });
                topic = topicInfo._id;
            }

            response = await topicQuery.findByIdAndAggregate(topicId ? topicId : topic);

            if (response.length == 0) {
                response = [{
                    _id: topicInfo._id,
                    name: topicInfo.name,
                    subTopics: []
                }]
            }

            serverLog.info(`[${req.originalUrl}] [${req.method}] [loggedInUser : ${req.headers.id}], {request_payload : req to get details of topic having Id ${topicId ? topicId : topic}}`);

            serverLog.info(`[${req.originalUrl}] [${req.method}] [${status_codes.OK}] [loggedInUser : ${req.headers.id}], {response : ${JSON.stringify(response)}}`);
            res.status(status_codes.OK).send(Response.sendResponse(status_codes.OK, custom_message.InfoMessage.topicGet, response, []));

        } catch (err) {
            serverLog.error(`[${req.originalUrl}] [${req.method}], [${status_codes.INTERNAL_SERVER_ERROR}] {error : ${err}}`);
            console.log(err);
            res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
        }
    }

    static async deleteTopic(req, res) {
        try {
            serverLog.info(`[${req.originalUrl}] [${req.method}] [loggedInUser : ${req.headers.id}], {request_payload : "req to delete topic having Id : ${req.params.id}"}`);
            const topicId = req.params.id;

            const findSubTopics = await topicQuery.findOne({
                parentTopic: topicId,
                isActive: true
            });
            if (findSubTopics) {
                serverLog.error(`[${req.originalUrl}] [${req.method}] [${status_codes.BAD_REQUEST}] [loggedInUser : ${req.headers.id}], {response : "admin is trying to delete topic(${topicId}) and that topic contains sub topics"}`);
                res.status(status_codes.BAD_REQUEST).send(Response.sendResponse(status_codes.BAD_REQUEST, custom_message.errorMessage.canNotDeleteTopic, [], []));
            } else {
                await topicQuery.deleteById(topicId, {
                    isActive: false,
                    updatedBy: req.headers.id
                }, {
                    new: true
                });
                serverLog.info(`[${req.originalUrl}] [${req.method}] [${status_codes.OK}] [loggedInUser : ${req.headers.id}], {response : "Topic(${topicId} is deleted successfully)"}`);

                res.status(status_codes.OK).send(Response.sendResponse(status_codes.OK, custom_message.InfoMessage.deleteTopic, [], []));

            }
        } catch (err) {
            serverLog.error(`[${req.originalUrl}] [${req.method}], [${status_codes.INTERNAL_SERVER_ERROR}] {error : ${err}}`);
            console.log(err);
            res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
        }
    }
}