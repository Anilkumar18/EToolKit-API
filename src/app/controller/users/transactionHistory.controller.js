import * as userTransactionQueries from "../../../db/queries/userTransaction.query";
import * as questionQueries from "../../../db/queries/question.query";
import * as userQueries from "../../../db/queries/user.query";
import * as decisionTreeQueries from "../../../db/queries/decisionTree.query";
import * as linkQueries from "../../../db/queries/link.query";
import * as transactionInputQueries from "../../../db/queries/userTransactionInput.query";
import * as variableQueries from "../../../db/queries/variable.query";
import mongoose from 'mongoose';
import {
    serverLog
} from "../../../utils/logger";

export default class transactionHistoryController {

    static async getQuestionList(req, res) {
        try {
            const {
                userId,
                isCompleted
            } = req.query;

            let completedFilters = [];
            if (isCompleted && isCompleted != "") {
                if (isCompleted.includes(true)) {
                    completedFilters.push(false);
                }
                if (isCompleted.includes(false)) {
                    completedFilters.push(true);
                }
            } else {
                completedFilters.push(false);
            }

            serverLog.info(`[${req.originalUrl}] [${req.method}] [loggedInUser : ${req.headers.id}], {request_payload : {userId : ${JSON.stringify(userId)}}}`);

            const transactionData = await userTransactionQueries.findAllAndAggregate([{
                    '$match': {
                        $and: [{
                                'createdBy': mongoose.Types.ObjectId(userId)
                            },
                            {
                                'isActive': {
                                    '$in': completedFilters
                                }
                            }
                        ]
                    }
                }, {
                    '$sort': {
                        'createdAt': -1
                    }
                }, {
                    '$group': {
                        '_id': {
                            'questionId': '$questionId'
                        },
                        'count': {
                            '$sum': 1
                        },
                        'doc': {
                            '$first': '$$ROOT'
                        }
                    }
                }, {
                    '$replaceRoot': {
                        'newRoot': {
                            '$mergeObjects': [
                                '$doc', {
                                    'count': '$count'
                                }
                            ]
                        }
                    }
                }, {
                    '$lookup': {
                        'from': 'users',
                        'localField': 'createdBy',
                        'foreignField': '_id',
                        'as': 'userDetails'
                    }
                }, {
                    '$unwind': {
                        'path': '$userDetails'
                    }
                }, {
                    '$lookup': {
                        'from': 'questions',
                        'localField': 'questionId',
                        'foreignField': '_id',
                        'as': 'questionDetails'
                    }
                }, {
                    '$unwind': {
                        'path': '$questionDetails'
                    }
                }, {
                    '$lookup': {
                        'from': 'topics',
                        'localField': 'questionDetails.topicId',
                        'foreignField': '_id',
                        'as': 'subTopic'
                    }
                }, {
                    '$unwind': {
                        'path': '$subTopic'
                    }
                },
                // {
                //     '$graphLookup': {
                //         'from': 'topics',
                //         'startWith': '$questionDetails.topicId',
                //         'connectFromField': 'parentTopic',
                //         'connectToField': '_id',
                //         'as': 'topicDetails'
                //     }
                // }, {
                //     '$addFields': {
                //         'topic': {
                //             '$reduce': {
                //                 'input': '$topicDetails',
                //                 'initialValue': false,
                //                 'in': {
                //                     '$cond': [{
                //                         '$eq': [
                //                             '$$this.type', 'topic'
                //                         ]
                //                     }, '$$this', '$$value']
                //                 }
                //             }
                //         }
                //     }
                // },
                {
                    '$project': {
                        'question': '$questionDetails.text',
                        'createdBy': '$userDetails.firstName',
                        'updatedBy': '$userDetails.firstName',
                        'topic': '$subTopic.name',
                        'reportUrl': {
                            '$ifNull': [
                                '$reportUrl', ''
                            ]
                        },
                        "createdAt": 1,
                        'updatedAt': '$questionDetails.updatedAt',
                        "icon_logo": '$questionDetails.icon_logo',
                        'transactionId': '$_id',
                        'isCompleted': {
                            '$cond': {
                                'if': {
                                    '$eq': [
                                        '$isActive', true
                                    ]
                                },
                                'then': false,
                                'else': true
                            }
                        },
                        'questionId': '$questionId',
                        'count': 1
                    }
                }, {
                    "$sort": {
                        "createdAt": -1
                    }
                }
            ]);

            serverLog.info(`[${req.originalUrl}] [${req.method}] [${status_codes.OK}] [loggedInUser : ${req.headers.id}], {response : ${JSON.stringify(transactionData)}}`);

            res.status(status_codes.OK).send(Response.sendResponse(status_codes.OK, "User history details get successfully", transactionData, []));
        } catch (err) {
            console.log("Error :-", err);
            serverLog.error(`[${req.originalUrl}] [${req.method}], [${status_codes.INTERNAL_SERVER_ERROR}] {error : ${err}}`);
            res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
        }
    }

    static async historyDetails(req, res) {
        try {
            const {
                transactionId
            } = req.params;

            serverLog.info(`[${req.originalUrl}] [${req.method}] [loggedInUser : ${req.headers.id}], {request_payload : {transactionId : ${JSON.stringify(transactionId)}}}`);

            const transactionDetails = await userTransactionQueries.findById(transactionId);

            const questionDetails = await questionQueries.findById(transactionDetails.questionId);

            const userDetails = await userQueries.findById(transactionDetails.createdBy);

            const decisionTree = await decisionTreeQueries.findOne({
                questionId: transactionDetails.questionId,
                isActive: true,
                isDeleted: false
            });
            let tree = decisionTree.tree;
            let traversedLinks = transactionDetails.fromLink

            let getTransactionDetails = await transactionHistoryController.transactionHistoryGet(tree, traversedLinks, transactionId);
            const response = {
                linkDataArray: getTransactionDetails.linkDataArray,
                nodeDataArray: getTransactionDetails.nodeDataArray,
                userId: userDetails._id,
                firstName: userDetails.firstName,
                lastName: userDetails.lastName,
                question: questionDetails.text
            }

            serverLog.info(`[${req.originalUrl}] [${req.method}] [${status_codes.OK}] [loggedInUser : ${req.headers.id}], {response : ${JSON.stringify(response)}}`);

            res.status(status_codes.OK).send(Response.sendResponse(status_codes.OK, "User history details get successfully", response, []));


        } catch (err) {
            console.log("Error :-", err);
            serverLog.error(`[${req.originalUrl}] [${req.method}], [${status_codes.INTERNAL_SERVER_ERROR}] {error : ${err}}`);
            res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
        }
    }

    static async getVariable(req, res) {
        try {
            const {
                transactionId
            } = req.params;

            const userTransactionInputs = await transactionInputQueries.findAll({
                userTransactionId: transactionId,
                isActive: true,
                isDeleted: false,
                isParseFromProcess: false
            });

            let arrangeKeyValuePair = await transactionHistoryController.getTransactionInputWithDisplayField(userTransactionInputs);

            res.status(status_codes.OK).send(Response.sendResponse(status_codes.OK, "User inputs detail get successfully", arrangeKeyValuePair, []));
        } catch (err) {
            console.log("Error :-", err);
            serverLog.error(`[${req.originalUrl}] [${req.method}], [${status_codes.INTERNAL_SERVER_ERROR}] {error : ${err}}`);
            res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
        }
    }

    static async historyList(req, res) {
        try {
            const {
                questionId,
                isCompleted
            } = req.query;

            let completedFilters = [];
            if (isCompleted && isCompleted != "") {
                if (isCompleted.includes(true)) {
                    completedFilters.push(false);
                }
                if (isCompleted.includes(false)) {
                    completedFilters.push(true);
                }
            } else {
                completedFilters.push(false);
            }

            const transactionList = await userTransactionQueries.findAllAndAggregate([{
                    $match: {
                        $and: [{
                                questionId: mongoose.Types.ObjectId(questionId)
                            },
                            {
                                createdBy: mongoose.Types.ObjectId(req.headers.id)
                            },
                            {
                                isActive: {
                                    $in: completedFilters
                                }
                            }
                        ]
                    }
                },
                {
                    '$lookup': {
                        'from': 'questions',
                        'localField': 'questionId',
                        'foreignField': '_id',
                        'as': 'questionDetails'
                    }
                }, {
                    '$unwind': {
                        'path': '$questionDetails'
                    }
                },
                {
                    $sort: {
                        createdAt: -1
                    }
                },
                {
                    $project: {
                        'question': '$questionDetails.text',
                        'transactionId': '$_id',
                        'reportUrl': {
                            '$ifNull': [
                                '$reportUrl', ''
                            ]
                        },
                        'isCompleted': {
                            '$cond': {
                                'if': {
                                    '$eq': [
                                        '$isActive', true
                                    ]
                                },
                                'then': false,
                                'else': true
                            }
                        },
                        'createdAt': 1,
                        'questionId': 1
                    }
                }
            ]);

            res.status(status_codes.OK).send(Response.sendResponse(status_codes.OK, "User history details get successfully!", transactionList, []));
        } catch (err) {
            console.log("Error :-", err);
            serverLog.error(`[${req.originalUrl}] [${req.method}], [${status_codes.INTERNAL_SERVER_ERROR}] {error : ${err}}`);
            res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
        }
    }

    static async transactionDetails(req, res) {
        try {
            const {
                transactionId
            } = req.params;

            const transactionInputs = await transactionInputQueries.findAll({
                userTransactionId: transactionId,
                isDeleted: false,
                isParseFromProcess: false
            });

            const getTransactionInputData = await transactionHistoryController.getTransactionInputWithDisplayField(transactionInputs);

            res.status(status_codes.OK).send(Response.sendResponse(status_codes.OK, "User Input Data Get Successfully!", getTransactionInputData, []));
        } catch (err) {
            console.log("Error :-", err);
            serverLog.error(`[${req.originalUrl}] [${req.method}], [${status_codes.INTERNAL_SERVER_ERROR}] {error : ${err}}`);
            res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
        }
    }


    static async transactionHistoryGet(tree, links, transactionId) {
        try {

            serverLog.info(`[transactionHistoryGet] { request : ${JSON.stringify(tree)}, ${JSON.stringify(links)}}`);
            let nodeKeyArr = [];
            let jsonTree = JSON.parse(tree)
            let linkDataInfo = jsonTree.linkDataArray;
            for (const link of links) {
                let linkDetails = await linkQueries.findById(link.fromLinkId);
                var foundIndex = linkDataInfo.findIndex(x => x.key == linkDetails.linkKey);
                if (foundIndex > -1) {
                    let newLinkData = linkDataInfo[foundIndex];
                    newLinkData.selected = true;
                    nodeKeyArr.push(newLinkData.to);
                    linkDataInfo[foundIndex] = newLinkData;
                }
            }

            await transactionHistoryController.addValuesToNode(jsonTree.nodeDataArray, transactionId, nodeKeyArr);

            const response = {
                linkDataArray: linkDataInfo,
                nodeDataArray: jsonTree.nodeDataArray
            }

            serverLog.info(`[transactionHistoryGet] { return : ${JSON.stringify(response)}}`);

            return response;
        } catch (err) {
            serverLog.error(`[{function : "transactionHistoryGet" from "transactionHistoryController" controller}], [{Error : ${err}}]`);
            console.log("Error :-", err)
            throw err;
        }
    }


    static async addValuesToNode(nodeArray, transactionId, nodeKeyArr) {
        try {
            serverLog.info(`[addValuesToNode] { request : ${JSON.stringify(nodeArray)}, ${transactionId}}`);

            const transactionInputs = await transactionInputQueries.findAll({
                userTransactionId: transactionId,
                isDeleted: false
            });

            for (const transactionInput of transactionInputs) {
                let index = nodeArray.findIndex(getInput);

                function getInput(node) {
                    if (node.metaData.localVariableName) {
                        return (node.metaData.localVariableName == transactionInput.variableName) && nodeKeyArr.includes(node.key);
                    }
                }
                if (index > -1) {
                    nodeArray[index].metaData.value = JSON.parse(transactionInput.value)
                }
            }

            // this logic is only for manualInput type nodes
            var foundIndex = nodeArray.findIndex(x => x.name == 'ManualInput');

            if (foundIndex > -1) {
                nodeArray.forEach((node, index) => {

                    if (node.name == 'ManualInput') {
                        nodeArray[index].metaData.inputs.forEach((input, index2) => {
                            let findUserInput = transactionInputs.find(userInput => userInput.variableName == input.localVariableName);
                            if (findUserInput) {

                                nodeArray[index].metaData.inputs[index2].value = JSON.parse(findUserInput.value);
                            }
                        })
                    }
                })
            }

            return nodeArray;
        } catch (err) {
            serverLog.error(`[{function : "addValuesToNode" from "transactionHistoryController" controller}], [{Error : ${err}}]`);
            console.log("Error :-", err)
            throw err;
        }
    }

    static async getTransactionInputWithDisplayField(transactionInputListAsInput) {
        const transactionInputs = [];
        const listOfDisPlayColumn = [];
        const transactionInputList = await transactionInputListAsInput.filter(
            (variables, index) => index === transactionInputListAsInput.findIndex(
                other => variables.variableName === other.variableName &&
                variables.value === other.value
            ));

        // return value in million format
        const value = (val) => {
            if(isNaN(val)) return val;
            else {
                const absoluteNumber = Math.abs(Number(val));
                if(absoluteNumber >= 1.0e+6) return val < 0 ? "-" + (absoluteNumber / 1.0e+6).toFixed(2) + "M" : (absoluteNumber / 1.0e+6).toFixed(2) + "M";
                else return Math.round(val);
            }
        }

        for (const input of transactionInputList) {

            if (input.variableName != "reportSummary") {
                const data = {};
                const displayColumn = {};
                const variable = await variableQueries.findOne({
                    name: input.variableName,
                    type: "Organization"
                }, {
                    label: 1
                });

                if (variable) data[variable.label] = (input.value != '') ? value(JSON.parse(input.value)) : "";
                else {
                    if (input.displayColumn) {
                        data[(input.variableLabel) ? input.variableLabel : input.variableName] = (JSON.parse(input.value).length > 0) ? value(JSON.parse(input.value)) : "";
                        displayColumn[(input.variableLabel) ? input.variableLabel : input.variableName] = input.displayColumn;
                        listOfDisPlayColumn.push(displayColumn);
                    } else {
                        if (/^([0]?[1-9]|[1|2][0-9]|[3][0|1])[./-]([0]?[1-9]|[1][0-2])[./-]([0-9]{4}|[0-9]{2})$/.test(input.value)) data[(input.variableLabel) ? input.variableLabel : input.variableName] = (input.value != '') ? value(input.value) : "";
                        else data[(input.variableLabel) ? input.variableLabel : input.variableName] = (input.value != '') ? value(JSON.parse(input.value)) : "";
                    }
                }
                transactionInputs.push(data);
            }
        }

        return {
            displayColumn: listOfDisPlayColumn,
            item: transactionInputs
        };
    }
}