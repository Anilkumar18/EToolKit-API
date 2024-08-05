import TopicModel from "../../../db/models/topic.model";
import * as topicQuery from "../../../db/queries/topic.query";
import {
    serverLog
} from '../../../utils/logger';
import * as questionQuery from '../../../db/queries/question.query';

export default class subTopicController {

    static async create(req, res) {
        try {
            serverLog.info(`[${req.originalUrl}] [${req.method}] [loggedInUser : ${req.headers.id}], {request_payload : ${JSON.stringify(req.body)}}`);
            const {
                name,
                parentTopic,
                tagLine,
                question,
                solution,
                tool_image
            } = req.body;

            const subTopicRes = await topicQuery.findOne({ name: name, isActive: true, type: 'subTopic' });

            if (!subTopicRes) {

                const subTopic = new TopicModel({
                    name,
                    parentTopic,
                    tagLine : tagLine ? tagLine : "",
                    question : question ? question : "",
                    solution : solution ? solution : "",
                    tool_image : tool_image ? tool_image : "",
                    type: "subTopic",
                    createdBy: req.headers.id,
                    updatedBy: req.headers.id
                });

                await topicQuery.saveData(subTopic);

                serverLog.info(`[${req.originalUrl}] [${req.method}] [loggedInUser : ${req.headers.id}], {response_message : sub-topic "${req.body.name}" created successfully}`);

                res.status(status_codes.CREATED).send(Response.sendResponse(status_codes.CREATED, custom_message.InfoMessage.topicCreated, [], []));

            } else {
                serverLog.error(`[${req.originalUrl}] [${req.method}] [${status_codes.INTERNAL_SERVER_ERROR}] [loggedInUser : ${req.headers.id}], {error_message : ${custom_message.errorMessage.topicAlreadyExist}}`);
                res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.topicAlreadyExist, [], []));
            }

        } catch (err) {
            serverLog.error(`[${req.originalUrl}] [${req.method}] [${status_codes.INTERNAL_SERVER_ERROR}], {error : ${err}}`);
            res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
        }
    }

    static async update(req, res) {
        try {
            const subTopicId = req.params.id;
            serverLog.info(`[${req.originalUrl}] [${req.method}] [loggedInUser : ${req.headers.id}], {request_payload : ${JSON.stringify(req.body)}}`);

            const subTopicRes = await topicQuery.findOne({ _id: { $ne: subTopicId }, name: req.body.name, isActive : true });

            if (!subTopicRes) {

                const subTopic = await topicQuery.findById(subTopicId);

                await topicQuery.findByIdAndUpdate(subTopicId, {
                    name: req.body.name ? req.body.name : subTopic.name,
                    tagLine : req.body.tagLine ? req.body.tagLine : subTopic.tagLine ? subTopic.tagLine : "",
                    question : req.body.question ? req.body.question : subTopic.question ? subTopic.question : "",
                    solution : req.body.solution ? req.body.solution : subTopic.solution ? subTopic.solution : "",
                    tool_image : req.body.tool_image ? req.body.tool_image : subTopic.tool_image ? subTopic.tool_image : "",
                    updatedBy: req.headers.id
                }, {
                    new: true
                });

                serverLog.info(`[${req.originalUrl}] [${req.method}] [${status_codes.OK}] [loggedInUser : ${req.headers.id}], {response : topic "${subTopic._id}" updated successfully}`);

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

    static async details(req, res) {
        try {
            const subTopicId = req.params.id;

            serverLog.info(`[${req.originalUrl}] [${req.method}] [loggedInUser : ${req.headers.id}], {request_payload : req to get details of sub-topic having Id ${req.params.id}}`);

            let subTopicDetails = await topicQuery.findSubTopicById(subTopicId);

            if(Object.keys(subTopicDetails[0].questions[0]).length == 0) {
                subTopicDetails[0].questions = [];
            }

            serverLog.info(`[${req.originalUrl}] [${req.method}] [${status_codes.OK}] [loggedInUser : ${req.headers.id}], {response : ${JSON.stringify(subTopicDetails)}}`);
            res.status(status_codes.OK).send(Response.sendResponse(status_codes.OK, custom_message.InfoMessage.topicGet, subTopicDetails, []));

        } catch (err) {
            serverLog.error(`[${req.originalUrl}] [${req.method}], [${status_codes.INTERNAL_SERVER_ERROR}] {error : ${err}}`);
            console.log(err);
            res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
        }
    }

    static async delete(req, res) {
        try {
            const subTopicId = req.params.id;

            serverLog.info(`[${req.originalUrl}] [${req.method}] [loggedInUser : ${req.headers.id}], {request_payload : req to get details of sub-topic having Id ${req.params.id}}`);

            const findQuestionForTopic = await questionQuery.findOne({
                topicId: subTopicId,
                isActive: true
            });
            if (findQuestionForTopic) {
                serverLog.error(`[${req.originalUrl}] [${req.method}] [${status_codes.BAD_REQUEST}] [loggedInUser : ${req.headers.id}], {response : "admin is trying to delete topic(${subTopicId}) and that topic contains questions"}`);
                res.status(status_codes.BAD_REQUEST).send(Response.sendResponse(status_codes.BAD_REQUEST, custom_message.errorMessage.canNotDeleteTopic, [], []));
            } else {
                await topicQuery.findByIdAndUpdate(subTopicId, {
                    isActive: false,
                    updatedBy: req.headers.id
                }, {
                    new: true
                });
                serverLog.info(`[${req.originalUrl}] [${req.method}] [${status_codes.OK}] [loggedInUser : ${req.headers.id}], {response : "Topic(${subTopicId} is deleted successfully)"}`);

                res.status(status_codes.OK).send(Response.sendResponse(status_codes.OK, custom_message.InfoMessage.deleteTopic, [], []));
            }
        } catch (err) {
            serverLog.error(`[${req.originalUrl}] [${req.method}], [${status_codes.INTERNAL_SERVER_ERROR}] {error : ${err}}`);
            console.log(err);
            res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
        }
    }
}