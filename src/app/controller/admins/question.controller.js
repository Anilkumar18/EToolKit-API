import QuestionModel from '../../../db/models/question.model';
import {
    serverLog
} from '../../../utils/logger';
import * as questionQueries from '../../../db/queries/question.query';
import * as decisionTreeQueries from '../../../db/queries/decisionTree.query';
import * as nodeQueries from '../../../db/queries/node.query';
import * as linkQueries from '../../../db/queries/link.query';
import * as expressionVariableQueries from '../../../db/queries/expressionVariable.query';
import decisionTreeController from './decisionTree.controller';
import * as helpSectionQuery from "../../../db/queries/helpModule.query";
export default class questionController {

    static async create(req, res) {

        console.log(req.body,"reqqqqqqqqqqqqqqqqqqq.bodyyyyyyyyyyyyyyyyy")
        try {
            const {
                text,
                assumptions,
                screen_tagline,
                description,
                summery_report,
                icon_logo,
                topicId
            } = req.body;

            serverLog.info(`[${req.originalUrl}] [${req.method}] [loggedInUser : ${req.headers.id}], {request_payload : ${JSON.stringify(req.body)}}`);

            const questionRes = await questionQueries.findOne({
                text: text,
                topicId: topicId,
                isActive: true
            });

            if (!questionRes) {

                const question = new QuestionModel({
                    text,
                    assumptions,
                    screen_tagline,
                    description,
                    summery_report,
                    icon_logo,
                    topicId,
                    createdBy: req.headers.id,
                    updatedBy: req.headers.id
                });

                const queryData = await questionQueries.saveData(question);
                if (queryData) {
                    if (req.file) {
                        let { originalname, filename } = req.file;
                        let fileUrl = config.uploadHelpFileUrl + filename;
                        const createData= {
                            label: text,
                            pageName: screen_tagline,
                            fileName: originalname,
                            questionId: queryData._id,
                            fileUrl
                        }
                        await helpSectionQuery.create(createData)
                    }
                }
                serverLog.info(`[${req.originalUrl}] [${req.method}] [${status_codes.CREATED}] [loggedInUser : ${req.headers.id}], {response_message : "Question "${text}" is created successfully!"}`);

                res.status(status_codes.CREATED).send(Response.sendResponse(status_codes.CREATED, custom_message.InfoMessage.questionCreated, [], []));

            } else {   
                serverLog.error(`[${req.originalUrl}] [${req.method}] [${status_codes.INTERNAL_SERVER_ERROR}] [loggedInUser : ${req.headers.id}], {error_message : ${custom_message.errorMessage.questionAlreadyExist}}`);
                res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.questionAlreadyExist, [], []));
            }

        } catch (err) {
            serverLog.error(`[${req.originalUrl}] [${req.method}] [${status_codes.INTERNAL_SERVER_ERROR}], {error : ${err}}`);
            res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
        }
    }

    static async update(req, res) {
        try {

            const {
                text,
                assumptions,
                screen_tagline,
                description,
                summery_report,
                icon_logo,
            } = req.body;

            serverLog.info(`[${req.originalUrl}] [${req.method}] [loggedInUser : ${req.headers.id}], {request_payload : update question with data : "${JSON.stringify(req.body)}" and having id : ${req.params.id}}`);

            const questionRes = await questionQueries.findOne({
                _id: req.params.id,
            });

            if (questionRes) {
                const questionExist = await questionQueries.findOne({
                    _id: {
                        $ne: req.params.id
                    },
                    text: text,
                    topicId: questionRes.topicId,
                    isActive: true
                });

                if (!questionExist) {
                    const findQuestion = await questionQueries.findById(req.params.id);
                    const updatePattern = {
                        text: text,
                        assumptions: assumptions,
                        screen_tagline: screen_tagline,
                        description: description,
                        summery_report: summery_report,
                        updatedBy: req.headers.id
                    };
                    if (icon_logo && icon_logo != "") updatePattern["icon_logo"] = icon_logo;

                    await questionQueries.findByIdAndUpdate(req.params.id, updatePattern, {
                        new: true
                    });

                    if (req.params.id) {
                        let query = { label: text };
                        let helpModuleFileExist = await helpSectionQuery.findOne({ questionId : req.params.id });
                        if (helpModuleFileExist) {
                            if (req.file) {
                                let { originalname, filename } = req.file;
                                let fileUrl = config.uploadHelpFileUrl + filename;
                                query= {
                                    ...query,
                                    fileName: originalname,
                                    fileUrl
                                }
                            }
                            await helpSectionQuery.findByIdAndUpdate(helpModuleFileExist._id, query, { new: true })
                        }else{
                            let createData = {
                                label: text,
                                pageName: screen_tagline,
                                questionId: req.params.id,
                            }
                            if (req.file) {
                                let { originalname, filename } = req.file;
                                let fileUrl = config.uploadHelpFileUrl + filename;
                                createData= {
                                    ...createData,
                                    fileName: originalname,
                                    fileUrl
                                }
                            }
                            await helpSectionQuery.create(createData)
                        }
                    }
                    serverLog.info(`[${req.originalUrl}] [${req.method}] [${status_codes.OK}] [loggedInUser : ${req.headers.id}], {response_message : "Question("${findQuestion._id}") updated successfully!"}`);
                    res.status(status_codes.OK).send(Response.sendResponse(status_codes.OK, custom_message.InfoMessage.questionUpdated, [], []));
                } else {
                    serverLog.error(`[${req.originalUrl}] [${req.method}] [${status_codes.INTERNAL_SERVER_ERROR}] [loggedInUser : ${req.headers.id}], {error_message : ${custom_message.errorMessage.questionAlreadyExist}}`);
                    res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.questionAlreadyExist, [], []));
                }

            } else {
                serverLog.error(`[${req.originalUrl}] [${req.method}] [${status_codes.INTERNAL_SERVER_ERROR}] [loggedInUser : ${req.headers.id}], {error_message : ${custom_message.errorMessage.notFound}}`);
                res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.notFound, [], []));
            }

        } catch (err) {
            serverLog.error(`[${req.originalUrl}] [${req.method}] [${status_codes.INTERNAL_SERVER_ERROR}], {error : ${err}}`);
            res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
        }
    }

    static async delete(req, res) {
        try {

            serverLog.info(`[${req.originalUrl}] [${req.method}] [loggedInUser : ${req.headers.id}], {request_payload : request to delete question having id ${req.params.id}}`);

            await questionQueries.findByIdAndUpdate(req.params.id, {
                isActive: false,
                updatedBy: req.headers.id
            }, {
                new: true
            });

            await decisionTreeQueries.findOneAndUpdate({
                questionId: req.params.id
            }, {
                isActive: false,
                isDeleted: true
            }, {
                new: true
            });

            serverLog.info(`[${req.originalUrl}] [${req.method}] [${status_codes.OK}] [loggedInUser : ${req.headers.id}], {response_message : "Question("${req.params.id}") deleted successfully!"}`);

            res.status(status_codes.OK).send(Response.sendResponse(status_codes.OK, custom_message.InfoMessage.questionDeleted, [], []));
        } catch (err) {
            serverLog.error(`[${req.originalUrl}] [${req.method}] [${status_codes.INTERNAL_SERVER_ERROR}], {error : ${err}}`);
            res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
        }
    }

    static async clone(req, res) {
        try {
            const {
                text,
                toolId,
                topicId
            } = req.body;

            const checkTool = await questionQueries.findOne({
                text,
                topicId,
                isActive: true
            });
            if (checkTool) {
                serverLog.info(`[${req.originalUrl}] [${req.method}] [${status_codes.BAD_REQUEST}] [loggedInUser : ${req.headers.id}], {error_message : "Tool is already available"}`)
                return res.status(status_codes.BAD_REQUEST).send(Response.sendResponse(status_codes.BAD_REQUEST, custom_message.errorMessage.questionAlreadyExist, [], []));
            }

            const toolDetail = await questionQueries.findById(toolId);
            if (toolDetail) {
                const decisionTreeDetails = await decisionTreeQueries.findOne({
                    questionId: toolId,
                    isActive: true
                });
                if (decisionTreeDetails) {
                    //save question first
                    const questionData = {
                        text,
                        assumptions: toolDetail.assumptions ? toolDetail.assumptions : "",
                        screen_tagline: toolDetail.screen_tagline ? toolDetail.screen_tagline : "",
                        description: toolDetail.description ? toolDetail.description : "",
                        summery_report: toolDetail.summery_report ? toolDetail.summery_report : "",
                        icon_logo: toolDetail.icon_logo ? toolDetail.icon_logo : "",
                        topicId: topicId,
                        createdBy: req.headers.id,
                        updatedBy: req.headers.id
                    };
                    const question = new QuestionModel(questionData);
                    const savedQuestion = await questionQueries.saveData(question);
                    questionData["_id"] = savedQuestion._id;

                    //create decisionTree
                    const tree = JSON.parse(decisionTreeDetails.tree);
                    tree["questionId"] = savedQuestion._id;
                    const {
                        questionId,
                        linkDataArray,
                        nodeDataArray
                    } = tree;

                    //find root node for decisionTree.
                    const rootNode = await decisionTreeController.findNodeForTree(nodeDataArray, 'Start');

                    //find leaf nodes for decisionTree.
                    const leafNode = await decisionTreeController.findLeafNodeForTree(linkDataArray, nodeDataArray);

                    //removing root and leaf node so that we can save root and leaf independently
                    const removeRootAndLeaf = await decisionTreeController.removeRootAndLeaf(nodeDataArray, rootNode, leafNode);

                    //save nodes to DB
                    const nodeDataToProcess = {
                        tree: {
                            nodeDataArray: nodeDataArray,
                            linkDataArray: linkDataArray
                        },
                        questionId,
                        userId: req.headers.id,
                        rootNode,
                        leafNode,
                        removeRootAndLeaf
                    }
                    const createNodes = await decisionTreeController.processNode(nodeDataToProcess);

                    //save links to DB
                    const linkDataToProcess = {
                        userId: req.headers.id,
                        linkDataArray: linkDataArray,
                        decisionTreeId: createNodes.decisionTreeId,
                        questionId
                    }
                    await decisionTreeController.processLinks(linkDataToProcess)
                    const selectPattern = "pageName label fileName fileUrl questionId createdBy updatedBy";
                    const filesList = await helpSectionQuery.findOne({questionId: toolId}, selectPattern, null, {});
                    if (filesList) {
                        const createData= {
                            label: text,
                            pageName: toolDetail.screen_tagline,
                            fileName: filesList.fileName,
                            questionId: questionData["_id"],
                            fileUrl: filesList.fileUrl
                        }
                        await helpSectionQuery.create(createData)
                    }
                    serverLog.info(`[${req.originalUrl}] [${req.method}] [${status_codes.CREATED}] [loggedInUser : ${req.headers.id}], {response : Tool cloned successfully!}`);

                    res.status(status_codes.CREATED).send(Response.sendResponse(status_codes.CREATED, custom_message.InfoMessage.cloneTool, questionData, []));
                }
            }
        } catch (err) {
            serverLog.error(`[${req.originalUrl}] [${req.method}] [${status_codes.INTERNAL_SERVER_ERROR}], {error : ${err}}`);
            res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
        }
    }
}