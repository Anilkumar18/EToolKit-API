import fs from 'fs';
import {
    _,
    forEach
} from 'lodash';
import {
    serverLog
} from "../../../utils/logger";
import * as decisionTreeQuery from "../../../db/queries/decisionTree.query";
import * as reportTemplateQuery from "../../../db/queries/reportTemplate.query";
import * as nodeQuery from "../../../db/queries/node.query";
import * as linkQuery from "../../../db/queries/link.query";
import * as userTransactionQuery from "../../../db/queries/userTransaction.query";
import * as userTransactionInputQuery from "../../../db/queries/userTransactionInput.query";
import * as userQuery from "../../../db/queries/user.query";
import * as organizationQuery from "../../../db/queries/organization.query";
import * as expressionVariableQueries from '../../../db/queries/expressionVariable.query';
import * as variableQueries from '../../../db/queries/variable.query';
import UserTransactionModel from "../../../db/models/userTransaction.model";
import UserTransactionInputModel from "../../../db/models/userTransactionInput.model";
import * as predefinedLogicQuery from "../../../db/queries/preDefinedLogic.query";
import treeLogicsNewController from "./treeLogicsNew.controller";
import * as excelDataQueries from "../../../db/queries/excelData.query";
import HTMLtreeLogicsController from './HTMLTreeLogicsNew.controller';

export default class userTransactionController {

    /**
     ** This api return next node from particular link for particular decision tree
     * @static
     * @param {*} req
     * @param {*} res
     * @memberof userTransactionController
     */
    static async traversalData(req, res) {

// console.log(req,"reqqqqqqqqqqqqqqqqqqqqqqqqqq.traversal data")


        try {
            const {
                questionId,
                linkId,
                transactionId
            } = req.query;

            serverLog.info(`[${req.originalUrl}] [${req.method}] [loggedInUser : ${req.headers.id}], {request_payload : ${JSON.stringify(req.query)}}`);

            const decisionTree = await decisionTreeQuery.findOne({
                questionId,
                isDeleted: false
            });

            if (decisionTree) {

                if (!linkId) {
                    // traverse root node if link is not provided

                    serverLog.info(`[${req.originalUrl}] [${req.method}] [loggedInUser : ${req.headers.id}], { message : user requested root node for question "${questionId}".}`);

                    const rootNode = await nodeQuery.findById(decisionTree.nodeId);
                    console.log(rootNode,"root nodeeeeeee")
                    const linksFromRootNode = await userTransactionController.findConditions(rootNode.links);
                    console.log(linksFromRootNode,"linksFromRootNode")
                    const linkDetails = await linkQuery.findById(linksFromRootNode[0]._id);
                    console.log(linkDetails,"linkDetailslinkDetails")
                    // check for node that, is expression of process data and condition data node is valid or not
                    let node = await userTransactionController.checkForNode(linkDetails.nextNode, linksFromRootNode[0]._id, transactionId, req.headers.id, decisionTree._id);
                    console.log(node,"nodeeeeeeeeeeeeeeeeeeeeee")
                    //if node type is product, state, site and service level then this function return its data
                    let getNodeData;
                    if (node.type == "MultiOption" || node.type == "PassData") {

                        getNodeData = await userTransactionController.getNodeDetail(node, req.headers.id, transactionId);
                        
                        let {fileDisplayColumn, fileGroupByDisplayName} = await treeLogicsNewController.getExcelFileDisplayName(node.metaData.localVariableName, node.metaData.displayColumnName, node);
                        node.metaData.fileDisplayColumn =fileDisplayColumn ||""
                        node.metaData.fileGroupByDisplayName =fileGroupByDisplayName ||""
                        
                        const getVariable = await expressionVariableQueries.findOne({
                            decisionTreeId: decisionTree._id,
                            variableName: node.metaData.isSingle || node.metaData.isFetchFromLookup ? node.metaData.singleVariableName : node.metaData.localVariableName,
                            isActive: true
                        });
                        node.metaData.variableId = getVariable._id
                    }

                    // find particular node's conditions
                    const links = await userTransactionController.findConditions(node.links);

                    if (node.type == 'ManualInput') {
                        for (let i in node.metaData.inputs) {
                            const getVariable = await expressionVariableQueries.findOne({
                                decisionTreeId: decisionTree._id,
                                variableName: node.metaData.inputs[i].localVariableName,
                                isActive: true
                            });
                            node.metaData.inputs[i].variableId = getVariable._id;
                        }
                    }

                    if (node.type == 'Report') node.metaData.reportUrl = await userTransactionController.saveReportUrlInternally(transactionId)

                    const responseData = {
                        fromLink: (node.fromLink) ? node.fromLink : "",
                        _id: node._id,
                        label: node.label,
                        isRoot: node.isRoot,
                        isLeaf: node.isLeaf,
                        type: node.type,
                        links: links,
                        metaData: node.metaData ? node.metaData : {},
                        data: getNodeData,
                        transactionPercentage: 0
                    }

                    if (node.heading) responseData['heading'] = node.heading;

                    serverLog.info(`[${req.originalUrl}] [${req.method}] [${status_codes.CREATED}] [loggedInUser : ${req.headers.id}], { message : "response sent for node", response : ${JSON.stringify(responseData)}}`)

                    res.status(status_codes.OK).send(Response.sendResponse(status_codes.OK, custom_message.InfoMessage.nodeDetails, responseData, []));
                } else {
                    // get traverse data of other nodes for this question and decision tree

                    const linkDetails = await linkQuery.findById(linkId);


                    console.log(linkDetails,"iffffffffffffffffffffffffffff elseeeeeeeeeeeeeeeeeee")

                    // check for node that, is expression of process data and condition data node is valid or not
                    let node = await userTransactionController.checkForNode(linkDetails.nextNode, linkId, transactionId, req.headers.id, decisionTree._id);
                    //if node type is product, state, site and service level then this function return its data
                   console.log(node,"nodeeeeeeeeee")
                    let getNodeData;
                    if (node.type == "MultiOption" || node.type == "PassData") {

                        getNodeData = await userTransactionController.getNodeDetail(node, req.headers.id, transactionId);
                        let {fileDisplayColumn, fileGroupByDisplayName} = await treeLogicsNewController.getExcelFileDisplayName(node.metaData.localVariableName, node.metaData.displayColumnName, node);
                        node.metaData.fileDisplayColumn =fileDisplayColumn ||"";
                        node.metaData.fileGroupByDisplayName =fileGroupByDisplayName ||"";
                            
                        
                        const getVariable = await expressionVariableQueries.findOne({
                            decisionTreeId: decisionTree._id,
                            variableName: node.metaData.isSingle || node.metaData.isFetchFromLookup ? node.metaData.singleVariableName : node.metaData.localVariableName,
                            isActive: true
                        });
                        node.metaData.variableId = getVariable._id
console.log(getVariable,"getVariablegetVariablegetVariable")
                    }

                    console.log(node.type,"node.typeeeeeeeeeeeeee")

                    // find particular node's conditions
                    const links = await userTransactionController.findConditions(node.links);

                    if (node.type == 'ManualInput') {
                        for (let i in node.metaData.inputs) {
                            const getVariable = await expressionVariableQueries.findOne({
                                decisionTreeId: decisionTree._id,
                                variableName: node.metaData.inputs[i].localVariableName,
                                isActive: true
                            });
                            node.metaData.inputs[i].variableId = getVariable._id;
                        }
                    }

                    if (node.type == 'Report') node.metaData.reportUrl = await userTransactionController.saveReportUrlInternally(transactionId);

                    const nodeCount = await nodeQuery.count({
                        decisionTreeId: decisionTree._id,
                        isActive: true
                    });
                    console.log("transactionId::::::::::", transactionId);
                    const getTransactionNodeCount = await userTransactionQuery.countTransactionByAggregate(transactionId);
                    console.log("getTransactionNodeCount::::::::::", getTransactionNodeCount);
                    const percentage = getTransactionNodeCount && getTransactionNodeCount[0] && getTransactionNodeCount[0].docCount !== undefined
                                      ? (getTransactionNodeCount[0].docCount * 100) / nodeCount
                                      : 0;

                    const responseData = {
                        fromLink: (node.fromLink) ? node.fromLink : "",
                        _id: node._id,
                        label: node.label,
                        isRoot: node.isRoot,
                        isLeaf: node.isLeaf,
                        type: node.type,
                        links: links,
                        metaData: node.metaData ? node.metaData : {},
                        data: getNodeData,
                        transactionPercentage: Math.round(percentage)
                    }

                    if (node.heading) responseData['heading'] = node.heading;

                    serverLog.info(`[${req.originalUrl}] [${req.method}] [${status_codes.CREATED}] [loggedInUser : ${req.headers.id}], { message : "response sent for node", response : ${JSON.stringify(responseData)}}`)

                    res.status(status_codes.OK).send(Response.sendResponse(status_codes.OK, custom_message.InfoMessage.nodeDetails, responseData, []));
                }

            } else {
                serverLog.error(`[${req.originalUrl}] [${req.method}], [${status_codes.NOTFOUND}] {error : "decision tree not found for question : ${questionId}"}`);
                res.status(status_codes.NOTFOUND).send(Response.sendResponse(status_codes.NOTFOUND, custom_message.errorMessage.treeNotFound, [], []));
            }
        } catch (err) {
            serverLog.error(`[${req.originalUrl}] [${req.method}], [${status_codes.INTERNAL_SERVER_ERROR}] {error : ${err}}`);
            console.log(err);
            res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
        }
    }

    /**
     * *This method is process expression if nodeType = processData or nodeType = Decision(Having equation)
     * traversalData
     * @static
     * @param {*} nodeId
     * @param {*} linkId
     * @param {*} transactionId
     * @param {*} userId
     * @returns node
     * @memberof userTransactionController
     */
    static async checkForNode(nodeId, linkId, transactionId, userId, decisionTreeId) {
        try {
            serverLog.info(`[checkForNode] { request : ${nodeId} }`);
            let node = await nodeQuery.findById(nodeId).lean();
            let linkInformation = await linkQuery.findById(linkId);

            if (node.type == 'ProcessData') {
                //transaction information
                const transactionInformation = {
                    linkLabel: (linkInformation.label) ? linkInformation.label : "",
                    nodeLabel: node.label,
                    isRoot: node.isRoot,
                    isLeaf: node.isLeaf
                };

                // information of link which is used to get next node
                const fromLinkInfo = {
                    fromLinkId: linkId,
                    fromLinkKey: (linkInformation.linkKey) ? linkInformation.linkKey : ""
                }

                // string equation from node
                let equation = node.metaData.equation;

                // divide equation for assignment variable
                const divideStringByEqualTo = equation.split("=");
                let equationToCompute = divideStringByEqualTo[1];
                //get all variable from equation
                let variableArray = equation.match(/(((\w+:)+\w+)|(\w+))/g);

                // remove assignment variable from variable list
                const index = variableArray.indexOf(divideStringByEqualTo[0]);
                if (index > -1) { // only splice array when item is found
                    variableArray.splice(index, 1); // 2nd parameter means remove one item only
                }

                //replacing all variable with its value
                for (const variable of variableArray) {
                    if (isNaN(variable)) {
                        let value = "";
                        if (variable.indexOf(':') > -1) {
                            const fileVariableArray = variable.split(':');
                            value = await treeLogicsNewController.getExcelFileFieldValue(...fileVariableArray);
                        } else {
                            const userInput = await userTransactionInputQuery.findOne({
                                variableName: variable,
                                userTransactionId: transactionId,
                                isActive: true,
                                isDeleted: false,
                                isParseFromProcess: false
                            });

                            //logic to get display column from data
                            let displayColumn;
                            if (userInput.displayColumn) {
                                displayColumn = userInput.displayColumn.split(" ");
                                if (displayColumn.includes("_id")) displayColumn.splice(displayColumn.indexOf("_id"), 1);
                            }

                            // get Numeric value
                            if (userInput.value) {
                                if (typeof JSON.parse(userInput.value) === 'object' && JSON.parse(userInput.value).length === 1) value = JSON.parse(userInput.value)[0][displayColumn]
                                else value = JSON.parse(userInput.value)
                            }
                        }
                        // if(value < 0) ? 
                        equationToCompute = equationToCompute.replace(new RegExp("\\b" + variable + "\\b"), !isNaN(value) ? `(${value})` : 0);

                        // equationToCompute = equationToCompute.replace(new RegExp("\\b" + variable + "\\b"), (userInput.variableName == 'serviceLevel') ? JSON.parse(userInput.value)[0] : JSON.parse(userInput.value));
                    }

                }
                const computation = eval(equationToCompute);
                const variableModelData = new UserTransactionInputModel({
                    userTransactionId: transactionId,
                    variableName: divideStringByEqualTo[0],
                    value: JSON.stringify(computation),
                    valueType: 'Number',
                    createdBy: userId,
                    variableLabel: node.metaData.variableLabel
                });

                await userTransactionInputQuery.saveData(variableModelData);

                await userTransactionQuery.findByIdAndUpdate(transactionId, {
                    $push: {
                        traverseNodes: transactionInformation,
                        fromLink: fromLinkInfo
                    }
                }, {
                    new: true
                });

                let findLink = await linkQuery.findById(node.links[0]);

                //recursive function to check next node is process node or conditional node or not
                let info = await userTransactionController.checkForNode(findLink.nextNode, findLink._id, transactionId, userId);

                info.fromLink = info.fromLink == undefined ? findLink._id : info.fromLink;

                return info;

            } else if (node.type === "LookUp") {
                const transactionInformation = {
                    linkLabel: (linkInformation.label) ? linkInformation.label : "",
                    nodeLabel: node.label,
                    isRoot: node.isRoot,
                    isLeaf: node.isLeaf
                };

                // information of link which is used to get next node
                const fromLinkInfo = {
                    fromLinkId: linkId,
                    fromLinkKey: (linkInformation.linkKey) ? linkInformation.linkKey : ""
                }

                const inputs = node.metaData.inputs;

                //This will traverse lookup node
                const userTransactionInputs = await userTransactionController.processLookupNode(inputs, transactionId, userId, decisionTreeId);

                await userTransactionInputQuery.insertAll(userTransactionInputs);

                await userTransactionQuery.findByIdAndUpdate(transactionId, {
                    $push: {
                        traverseNodes: transactionInformation,
                        fromLink: fromLinkInfo
                    }
                }, {
                    new: true
                });

                let findLink = await linkQuery.findById(node.links[0]);
                //recursive function to check next node is process node or conditional node or not
                let info = await userTransactionController.checkForNode(findLink.nextNode, findLink._id, transactionId, userId);

                info.fromLink = info.fromLink == undefined ? findLink._id : info.fromLink;

                return info;

            } else if (node.type == "Decision" && node.metaData.type == "equation") { // check for decision node and equation

                //extract variables from equation
                let equation = node.metaData.equation;
                const regexConditional = /[<>=!]=?/;
                const splitString = (input) => input.split(regexConditional);
                const variableArray = splitString(equation);
                // let variableArray = equation.match(/(((\w+:)+\w+)|(\w+))/g);

                // save node to transaction
                const transactionInformation = {
                    linkLabel: (linkInformation.label) ? linkInformation.label : "",
                    nodeLabel: node.label,
                    isRoot: node.isRoot,
                    isLeaf: node.isLeaf
                };

                // information of link which is used to get next node
                const fromLinkInfo = {
                    fromLinkId: linkId,
                    fromLinkKey: (linkInformation.linkKey) ? linkInformation.linkKey : ""
                }

                //process all variable and replace its value
                for (const variable of variableArray) {
                    if (isNaN(variable)) {
                        let value;
                        if (variable.indexOf(':') > -1) {
                            const fileVariableArray = variable.split(':');
                            value = await treeLogicsNewController.getExcelFileFieldValue(...fileVariableArray);
                        } else {
                            const userInput = await userTransactionInputQuery.findOne({
                                variableName: variable,
                                userTransactionId: transactionId,
                                isActive: true,
                                isDeleted: false,
                                isParseFromProcess: false
                            });
                            if(typeof JSON.parse(userInput.value) === 'object') {
                                const transactionValue = JSON.parse(userInput.value)[0];
                                const key = Object.keys(transactionValue)[0];
                                value = transactionValue[key];
                            } else value = userInput.value;
                        }
                        equation = equation.replace(new RegExp("\\b" + variable + "\\b"), JSON.parse(value));
                    }
                }

                // evaluation of expression
                const computation = eval(equation);

                await userTransactionQuery.findByIdAndUpdate(transactionId, {
                    $push: {
                        traverseNodes: transactionInformation,
                        fromLink: fromLinkInfo
                    }
                }, {
                    new: true
                });

                let linkFromDecisionNode = await linkQuery.findAndProject({
                    _id: {
                        $in: node.links
                    }
                }, {
                    label: 1,
                    nextNode: 1
                });


                if (computation) {
                    // need to process next node from Yes/yes/YES link
                    const information = await linkFromDecisionNode.find(element => element.label.toLowerCase() == 'yes' || element.label.toLowerCase() == 'true');

                    const info = await userTransactionController.checkForNode(information.nextNode, information._id, transactionId, userId);

                    info["fromLink"] = info.fromLink == undefined ? information._id : info.fromLink;
                    return info;
                }

                if (!computation) {
                    // need to process next node from No/no/NO link
                    const information = await linkFromDecisionNode.find(element => element.label.toLowerCase() == 'no' || element.label.toLowerCase() == 'false');

                    const info = await userTransactionController.checkForNode(information.nextNode, information._id, transactionId, userId);

                    info["fromLink"] = info.fromLink == undefined ? information._id : info.fromLink;

                    return info;
                }
            } else if (node.type == "PredefinedLogic") {
                // save node to transaction
                const transactionInformation = {
                    linkLabel: (linkInformation.label) ? linkInformation.label : "",
                    nodeLabel: node.label,
                    isRoot: node.isRoot,
                    isLeaf: node.isLeaf
                };

                // information of link which is used to get next node
                const fromLinkInfo = {
                    fromLinkId: linkId,
                    fromLinkKey: (linkInformation.linkKey) ? linkInformation.linkKey : ""
                }

                const variableToStore = [];
                // assign value to variable used in predefined logic decision tree
                if (node.metaData.variableMapping.length > 0) {
                    // console.log("node.metaData.variableMapping", node.metaData.variableMapping)
                    for (const mappedVariable of node.metaData.variableMapping) {
                        let userTransactionInputForVariable;

                        //check if variable name is contains combined variable or not
                        if (mappedVariable.localVariableName.includes(",")) {
                            const variables = mappedVariable.localVariableName.split(",");
                            for (const localVariable of variables) {
                                const transactionInput = await userTransactionInputQuery.findOne({
                                    variableName: localVariable,
                                    userTransactionId: transactionId,
                                    isActive: true
                                });
                                if (transactionInput) userTransactionInputForVariable = transactionInput;
                            }
                        } else userTransactionInputForVariable = await userTransactionInputQuery.findOne({
                            variableName: mappedVariable.localVariableName,
                            userTransactionId: transactionId,
                            isActive: true
                        });

                        let variableLabel;
                        if (node.belongFromProcess) {

                            const decisionTreeForProcess = await decisionTreeQuery.findOneAndProject({
                                belongFromProcess: node.belongFromProcess,
                                isActive: true
                            }, {
                                _id: 1
                            })
                            const expressionVariableForProcess = await expressionVariableQueries.findOne({
                                variableName: mappedVariable.variableName,
                                decisionTreeId: decisionTreeForProcess._id,
                                isActive: true
                            }, {
                                variableLabel: 1
                            })
                            if (!expressionVariableForProcess) {
                                const loopVariableForProcess = await variableQueries.findAllAndProject({
                                    type: "LoopVariable",
                                    name: mappedVariable.variableName,
                                    isActive: true
                                }, {
                                    label: 1
                                });
                                variableLabel = loopVariableForProcess ? loopVariableForProcess.label : "";
                            } else {
                                variableLabel = expressionVariableForProcess.variableLabel;
                            }
                        }

                        const variable = {
                            variableName: mappedVariable.variableName,
                            value: userTransactionInputForVariable.value,
                            isParseFromProcess: true,
                            userTransactionId: transactionId,
                            metaData: userTransactionInputForVariable.metaData ? userTransactionInputForVariable.metaData : "",
                            valueType: userTransactionInputForVariable.valueType,
                            createdBy: userId
                        };
                        if (userTransactionInputForVariable.displayColumn) variable["displayColumn"] = userTransactionInputForVariable.displayColumn;
                        if (userTransactionInputForVariable.fileId) variable["fileId"] = userTransactionInputForVariable.fileId;
                        if (userTransactionInputForVariable.variableLabel || variableLabel) variable['variableLabel'] = userTransactionInputForVariable.variableLabel ? userTransactionInputForVariable.variableLabel : variableLabel;
                        if (userTransactionInputForVariable.valueReference) variable['valueReference'] = userTransactionInputForVariable.valueReference;

                        variableToStore.push(variable);
                    }
                    await userTransactionInputQuery.insertAll(variableToStore);
                }

                // transact predefined logic decision tree
                const process = await predefinedLogicQuery.findOne({
                    _id: node.belongFromProcess,
                    isActive: true
                });
                if (process) await userTransactionController.executePreDefinedProcessTree(process._id, transactionId, userId);

                await userTransactionQuery.findByIdAndUpdate(transactionId, {
                    $push: {
                        traverseNodes: transactionInformation,
                        fromLink: fromLinkInfo
                    }
                }, {
                    new: true
                });

                let findLink = await linkQuery.findById(node.links[0]);

                //recursive function to check next node is process node or conditional node or not
                let info = await userTransactionController.checkForNode(findLink.nextNode, findLink._id, transactionId, userId);

                info.fromLink = info.fromLink == undefined ? findLink._id : info.fromLink;
                return info;

            } else {
                node.fromLink = linkId;
                return node;
            }
        } catch (err) {
            serverLog.error(`[{function : "checkForNode" from "traversalData" from "userTransactionController" controller}], [{Error : ${err}}]`);
            throw err;
        }
    }

    static async processLookupNode(inputs, transactionId, userId, decisionTreeId) {
        const userTransactionInputs = [];
        for (const input of inputs) {
            let userTransactionInput;
            const findVariable = await expressionVariableQueries.findOne({
                variableName: input.localVariableName,
                isActive: true,
                isDeleted: false,
                decisionTreeId
            }, {
                variableLabel: 1
            })
            if (!input.fileVariableSelection) {
                userTransactionInput = {
                    userTransactionId: transactionId,
                    variableName: input.localVariableName,
                    value: JSON.stringify(input.variableValue),
                    valueType: input.inputType,
                    createdBy: userId,
                    isParseFromProcess: false
                };
            } else {
                if (input.fileValue.outerOperation === "AND" || input.fileValue.outerOperation === "OR") {
                    const getConditionalValue = await userTransactionController.processConditionalLookup(input.fileValue, transactionId, false);
                    userTransactionInput = {
                        userTransactionId: transactionId,
                        variableName: input.localVariableName,
                        value: JSON.stringify(getConditionalValue),
                        valueType: (typeof getConditionalValue === 'object' && getConditionalValue.length) ? 'Array' : isNaN(getConditionalValue) ? 'String' : "Number",
                        createdBy: userId,
                        isParseFromProcess: false
                    };
                }
                // if (input.fileValue.outerOperation === "" || !input.fileValue.outerOperation) {
                //     console.log("In null outer operation==========================>=======================")
                //     // getExcelFileFieldValueAndReturnMultipleFields
                //     const file = await excelDataQueries.findById(input.fileValue.fileId, {
                //         fileName: 1
                //     });
                //     const dataList = await treeLogicsNewController.getExcelFileDataList(file.fileName);
                //     const requiredFields = input.fileValue.identityValue;
                //     console.log("requiredFields==========================================>", requiredFields);
                //     const getValue = await userTransactionController.addLookupValue(input.fileValue.multiIdentityColRow[0].operationalFields[0], transactionId, dataList, requiredFields);
                //     userTransactionInput = {
                //         userTransactionId: transactionId,
                //         variableName: input.localVariableName,
                //         value: JSON.stringify(getValue),
                //         valueType: (typeof getValue === 'object' && getValue.length) ? 'Array' : isNaN(getValue) ? 'String' : "Number",
                //         createdBy: userId,
                //         isParseFromProcess: false
                //     };
                // }
                if (input.fileValue.outerOperation === "" || !input.fileValue.outerOperation) {
                    const getConditionValue = await userTransactionController.processConditionalLookup(input.fileValue, transactionId, true);
                    userTransactionInput = {
                        userTransactionId: transactionId,
                        variableName: input.localVariableName,
                        value: JSON.stringify(getConditionValue),
                        valueType: (typeof getConditionValue === 'object' && getConditionValue.length) ? 'Array' : isNaN(getConditionValue) ? 'String' : "Number",
                        createdBy: userId,
                        isParseFromProcess: false
                    };
                }
            }
            if (input.fileValue.identityValue) userTransactionInput['displayColumn'] = input.fileValue.identityValue.join(" ");
            if (findVariable) userTransactionInput['variableLabel'] = findVariable.variableLabel;
            userTransactionInputs.push(userTransactionInput);
        }
        return userTransactionInputs;
    }

    // static async processConditionalLookup(fileValue, transactionId) {
    //     const file = await excelDataQueries.findById(fileValue.fileId, {
    //         fileName: 1
    //     });
    //     const requiredFields = fileValue.identityValue;
    //     const dataList = await treeLogicsNewController.getExcelFileDataList(file.fileName);
    //     const value = await userTransactionController.processMultiValue(fileValue.multiIdentityColRow, dataList, fileValue.outerOperation, requiredFields, transactionId);
    //     return value;
    // }

    static async processConditionalLookup(fileValue, transactionId, isOuterOperationNull) {
        const file = await excelDataQueries.findById(fileValue.fileId, {
            fileName: 1
        });
        const requiredFields = fileValue.identityValue;
        const dataList = await treeLogicsNewController.getExcelFileDataList(file.fileName);
        const value = await userTransactionController.processMultiValue(fileValue.multiIdentityColRow, dataList, fileValue.outerOperation, requiredFields, transactionId, isOuterOperationNull);
        return value;
    }

    static async processMultiValue(multiIdentityColRow, dataList, outerOperation, requiredFields, transactionId, isOuterOperationNull) {
        const mainData = [];
        requiredFields.push('_id');
        for (const conditions of multiIdentityColRow) {
            if (conditions.operation === "" || conditions.operationalFields.length === 1) {
                let result = await userTransactionController.addLookupValue(conditions.operationalFields[0], transactionId, dataList, requiredFields);
                if (result.length) {
                    const dataToReturn = [];
                    for (const item of result) {
                        const projectedObj = {};
                        for (const reqField of requiredFields) {
                            projectedObj[reqField] = item[reqField];
                        }
                        dataToReturn.push(projectedObj);
                    }
                    result = dataToReturn;
                }
                mainData.push(result);
            }
            if (conditions.operation === "AND") {
                let andResult = await userTransactionController.processAndOperation(dataList, conditions.operationalFields[0], requiredFields, transactionId, conditions.operationalFields);
                if (andResult.length) {
                    const dataToReturn = [];
                    for (const item of andResult) {
                        const projectedObj = {};
                        for (const reqField of requiredFields) {
                            projectedObj[reqField] = item[reqField];
                        }
                        dataToReturn.push(projectedObj);
                    }
                    andResult = dataToReturn;
                }
                mainData.push(andResult)
            }
            if (conditions.operation === "OR") {
                let orResult = await userTransactionController.processOrCondition(dataList, requiredFields, transactionId, conditions.operationalFields);
                if (orResult.length) {
                    const dataToReturn = [];
                    for (const item of orResult) {
                        const projectedObj = {};
                        for (const reqField of requiredFields) {
                            projectedObj[reqField] = item[reqField];
                        }
                        dataToReturn.push(projectedObj);
                    }
                    orResult = dataToReturn;
                }
                mainData.push(orResult);
            }
        }
        if (outerOperation === "OR") {
            const finalData = await userTransactionController.flatAndRemoveDuplicate(mainData);
            finalData.forEach(obj => delete obj._id);
            return finalData;
        }
        if (outerOperation === "AND") {
            if (mainData.length === 1) {
                const firstData = mainData[0];
                firstData.forEach(obj => delete obj._id);
                return firstData;
            }
            const referenceData = mainData;
            const newData = userTransactionController.getIntersection({
                key: "_id"
            }, ...referenceData);
            const finalAndData = [];
            for (const data of newData) {
                const andData = mainData[0].filter(entry => entry._id === data._id);
                finalAndData.push(andData);
            }
            const flatData = finalAndData.flat()
            flatData.forEach(obj => delete obj._id);
            return flatData;
        }
        if (isOuterOperationNull) {
            const flatData = mainData.flat();
            flatData.forEach(obj => delete obj._id);
            return flatData;
        }
    }

    static getIntersectMap(arr, map, key) {
        const returnMap = new Map()
        for (let i = 0; i < arr.length; i++) {
            if (!map.size) {
                returnMap.set(arr[i][key], i)
            } else {
                if (map.has(arr[i][key]) && !returnMap.has(arr[i][key])) returnMap.set(arr[i][key], i)
            }
        }
        return returnMap;
    }

    static getIntersection(option) {
        const initialMap = new Map();
        const key = option.key;
        let arrays;
        if (Array.from(arguments)) arrays = Array.from(arguments).slice(1);
        let resultMap;
        if (arrays) resultMap = arrays.reduce(function _(acc, currentValue) {
            return userTransactionController.getIntersectMap(currentValue, acc, key)
        }, initialMap);
        return Array.from(resultMap.keys()).map(res => {
            return {
                [key]: res,
            };
        });
    }

    // recursive find query on data
    static async processAndOperation(dataList, currentOperationalField, requiredFields, transactionId, operationalFields) {
        operationalFields.shift();
        const value = await userTransactionController.addLookupValue(currentOperationalField, transactionId, dataList, requiredFields);
        if (operationalFields.length) return await userTransactionController.processAndOperation(value, operationalFields[0], requiredFields, transactionId, operationalFields);
        else return value;
    }

    static async processOrCondition(dataList, requiredFields, transactionId, operationalFields) {
        const allValueArray = [];
        for (const operationalField of operationalFields) {
            const data = await userTransactionController.addLookupValue(operationalField, transactionId, dataList, requiredFields);
            allValueArray.push(data);
        }
        const finalOrData = userTransactionController.flatAndRemoveDuplicate(allValueArray)
        return finalOrData;
    }

    static async flatAndRemoveDuplicate(allValueArray) {
        const flatArray = allValueArray.flat(1);
        const ids = flatArray.map(({
            _id
        }) => _id);
        const finalOrData = flatArray.filter(({
            _id
        }, index) => !ids.includes(_id, index + 1));
        return finalOrData;
    }

    static async addLookupValue(operationalFields, transactionId, dataList, requiredFields) {
        const conditionField = operationalFields.identityCol;
        const comparisonType = operationalFields.equation;
        let comparisonValue = (operationalFields.identityColRow === "text") ? operationalFields.text : operationalFields.identityColRow;

        if (/\{.*\}/.test(comparisonValue)) {
            let variableName = comparisonValue.match(/(?<=\{)(.*?)(?=\})/g)
            const commaExists = variableName.some(element => element.includes(','));
            if (commaExists) {
                variableName= variableName[0].split(',')
            } else {
                variableName = variableName[0]
            }
            const transactionInput = await userTransactionInputQuery.findOne({
                userTransactionId: transactionId,
                variableName: variableName,
                isActive: true,
                isDeleted: false
            });
            const transactionDisplayColumn = transactionInput.displayColumn.split(" ");
            comparisonValue =
                (typeof JSON.parse(transactionInput.value) === 'object' && JSON.parse(transactionInput.value).length > 0) ?
                JSON.parse(transactionInput.value)[0][transactionDisplayColumn[0]] :
                transactionInput.value;
        };
        return await treeLogicsNewController.getExcelFileFieldValueAndReturnMultipleFields(dataList, conditionField, comparisonValue, requiredFields, comparisonType);
    }

    static async executePreDefinedProcessTree(processId, transactionId, userId) {
        try {
            const decisionTree = await decisionTreeQuery.findOne({
                belongFromProcess: processId,
                isActive: true
            });
            const rootNodeId = decisionTree.nodeId;
            await userTransactionController.traverseWholeTree(rootNodeId, transactionId, userId);
            return true;
        } catch (err) {
            serverLog.error(`[{function : "executePreDefinedProcessTree" from "checkForNode" from "traversalData" from "userTransactionController" controller}], [{Error : ${err}}]`);
            throw err;
        }
    }

    // this will automatically process decision tree created for predefined logic
    static async traverseWholeTree(nodeId, transactionId, userId) {
        try {

            let nodeDetails = await nodeQuery.findById(nodeId);
            // let getLinkDetails = await linkQuery.findAndProject({ _id : {$in : nodeDetails.links} });

            if (nodeDetails.type == "ProcessData") {
                // string equation from node
                let equation = nodeDetails.metaData.equation;

                // divide equation for assignment variable
                const divideStringByEqualTo = equation.split("=");
                let equationToCompute = divideStringByEqualTo[1];
                //get all variable from equation
                let variableArray = equation.match(/(((\w+:)+\w+)|(\w+))/g);

                // remove assignment variable from variable list
                const index = variableArray.indexOf(divideStringByEqualTo[0]);
                if (index > -1) { // only splice array when item is found
                    variableArray.splice(index, 1); // 2nd parameter means remove one item only
                }

                //replacing all variable with its value
                for (const variable of variableArray) {
                    if (isNaN(variable)) {
                        if (variable.indexOf(':') > -1) {
                            const fileVariableArray = variable.split(':');

                            const value = await treeLogicsNewController.getExcelFileFieldValue(...fileVariableArray);
                            equationToCompute = equationToCompute.replace(new RegExp("\\b" + variable + "\\b"), JSON.parse(value))
                        } else {

                            const userInput = await userTransactionInputQuery.findOne({
                                variableName: variable,
                                userTransactionId: transactionId,
                                isActive: true,
                                isDeleted: false
                            });

                            equationToCompute = equationToCompute.replace(new RegExp("\\b" + variable + "\\b"), (userInput.variableName == 'serviceLevel') ? `(${JSON.parse(userInput.value)[0]})` : `(${JSON.parse(userInput.value)})`);
                        }

                    }

                }

                const computation = eval(equationToCompute);
                const variableModelData = new UserTransactionInputModel({
                    userTransactionId: transactionId,
                    variableName: divideStringByEqualTo[0],
                    value: JSON.stringify(computation),
                    valueType: 'Number',
                    createdBy: userId,
                    isParseFromProcess: true,
                    variableLabel: nodeDetails.metaData.variableLabel
                });

                await userTransactionInputQuery.saveData(variableModelData);

                const findLink = await linkQuery.findById(nodeDetails.links[0]);

                //recursive function to traverse all nodes for process
                return await userTransactionController.traverseWholeTree(findLink.nextNode, transactionId, userId);

            } else if (nodeDetails.type === "LookUp") {
                // 
                const inputs = nodeDetails.metaData.inputs;

                const userTransactionInputs = await userTransactionController.processLookupNode(inputs, transactionId, userId);

                await userTransactionInputQuery.insertAll(userTransactionInputs);

                const findLink = await linkQuery.findById(nodeDetails.links[0]);

                //recursive function to traverse all nodes for process
                return await userTransactionController.traverseWholeTree(findLink.nextNode, transactionId, userId);

            } else if (nodeDetails.type == "Decision" && nodeDetails.metaData.type == "equation") {
                //extract variables from equation
                let equation = nodeDetails.metaData.equation;
                const regexConditional = /[<>=!]=?/;
                const splitString = (input) => input.split(regexConditional);
                const variableArray = splitString(equation);
                // const variableArray = equation.match(/(((\w+:)+\w+)|(\w+))/g);

                //process all variable and replace its value
                for (const variable of variableArray) {
                    if (isNaN(variable)) {
                        let value;
                        if (variable.indexOf(':') > -1) {
                            const fileVariableArray = variable.split(':');
                            value = await treeLogicsNewController.getExcelFileFieldValue(...fileVariableArray);
                        } else {
                            const userInput = await userTransactionInputQuery.findOne({
                                variableName: variable,
                                userTransactionId: transactionId,
                                isActive: true,
                                isDeleted: false
                            });
                            if(typeof JSON.parse(userInput.value) === 'object') {
                                const transactionValue = JSON.parse(userInput.value)[0];
                                const key = Object.keys(transactionValue)[0];
                                value = transactionValue[key];
                            } else value = userInput.value;
                        }
                        equation = equation.replace(new RegExp("\\b" + variable + "\\b"), JSON.parse(value));
                    }
                }

                // evaluation of expression
                const computation = eval(equation);

                const linkFromDecisionNode = await linkQuery.findAndProject({
                    _id: {
                        $in: nodeDetails.links
                    }
                }, {
                    label: 1,
                    nextNode: 1
                });


                if (computation) {
                    // need to process next node from Yes/yes/YES link

                    const information = await linkFromDecisionNode.find(element => element.label.toLowerCase() == 'yes' || element.label.toLowerCase() == 'true');

                    const traverseNextNode = await userTransactionController.traverseWholeTree(information.nextNode, transactionId, userId)
                    return traverseNextNode;

                }

                if (!computation) {
                    // need to process next node from No/no/NO link

                    const information = await linkFromDecisionNode.find(element => element.label.toLowerCase() == 'no' || element.label.toLowerCase() == 'false');

                    const traverseNextNode = await userTransactionController.traverseWholeTree(information.nextNode, transactionId, userId)
                    return traverseNextNode;
                }
            } else if (nodeDetails.type == "StaticLoop") {
                // need to call function that will call loop nodes
                const variableToStore = [];
                // assign value to variable used in predefined logic decision tree
                if (nodeDetails.metaData.variableMapping.length > 0) {
                    for (const mappedVariable of nodeDetails.metaData.variableMapping) {
                        const userTransactionInputForVariable = await userTransactionInputQuery.findOne({
                            variableName: mappedVariable.localVariableName,
                            userTransactionId: transactionId,
                            isActive: true
                        });

                        let variableLabel;
                        if (nodeDetails.belongFromProcess) {

                            const decisionTreeForProcess = await decisionTreeQuery.findOneAndProject({
                                belongFromProcess: nodeDetails.belongFromProcess,
                                isActive: true
                            }, {
                                _id: 1
                            })
                            const expressionVariableForProcess = await expressionVariableQueries.findOne({
                                variableName: mappedVariable.variableName,
                                decisionTreeId: decisionTreeForProcess._id,
                                isActive: true
                            }, {
                                variableLabel: 1
                            })
                            if (!expressionVariableForProcess) {
                                const loopVariableForProcess = await variableQueries.findAllAndProject({
                                    type: "LoopVariable",
                                    name: mappedVariable.variableName,
                                    isActive: true
                                }, {
                                    label: 1
                                });
                                variableLabel = loopVariableForProcess.label;
                            } else {
                                variableLabel = expressionVariableForProcess.variableLabel;
                            }
                        }

                        const variable = {
                            variableName: mappedVariable.variableName,
                            value: userTransactionInputForVariable.value,
                            isParseFromProcess: true,
                            userTransactionId: transactionId,
                            metaData: userTransactionInputForVariable.metaData ? userTransactionInputForVariable.metaData : "",
                            valueType: userTransactionInputForVariable.valueType,
                            createdBy: userId
                        };

                        if (userTransactionInputForVariable.displayColumn) variable["displayColumn"] = userTransactionInputForVariable.displayColumn;
                        if (userTransactionInputForVariable.fileId) variable["fileId"] = userTransactionInputForVariable.fileId;
                        if (userTransactionInputForVariable.variableLabel || variableLabel) variable['variableLabel'] = userTransactionInputForVariable.variableLabel ? userTransactionInputForVariable.variableLabel : variableLabel;
                        if (userTransactionInputForVariable.valueReference) variable['valueReference'] = userTransactionInputForVariable.valueReference;

                        variableToStore.push(variable);
                    }
                    await userTransactionInputQuery.insertAll(variableToStore);
                }
                // this will call static loop function if associate loop id is available in metadata
                if (nodeDetails.metaData.associateLoopId && nodeDetails.metaData.associateLoopId != "") {
                    //function
                    const params = {
                        userId,
                        transactionId,
                        loopTypeId: nodeDetails.metaData.associateLoopId
                    };

                    await treeLogicsNewController.executeLoopProcess(params);
                }
                const findLink = await linkQuery.findById(nodeDetails.links[0]);

                //recursive function to traverse all nodes for process
                return await userTransactionController.traverseWholeTree(findLink.nextNode, transactionId, userId);

            } else if (nodeDetails.type == "End") {
                return true;
            } else {
                const findLink = await linkQuery.findById(nodeDetails.links[0]);

                return await userTransactionController.traverseWholeTree(findLink.nextNode, transactionId, userId);
            }
        } catch (err) {
            serverLog.error(`[{function : "traverseWholeTree" from "executePreDefinedProcessTree" from "checkForNode" from "traversalData" from "userTransactionController" controller}], [{Error : ${err}}]`);
            throw err;
        }
    }

    /**
     * *This function gives listing of node file variable if node type is MultiOption Or PassData
     *
     * @static
     * @param {*} node
     * @returns
     * @memberof userTransactionController
     */
    static async getNodeDetail(node, userId, transactionId) {
        try {
            serverLog.info(`[getNodeDetail] { request : ${JSON.stringify(node)} }`);

            if (node.type == "MultiOption") {
                let fileVariableDetails;
                if (node.metaData.isFetchFromLookup) fileVariableDetails = await treeLogicsNewController.getLookupDataFromVariable(node.metaData.lookupVariableName.match(/(?<=\{)(.*?)(?=\})/g)[0], node.metaData.displayColumnName, transactionId);
                else fileVariableDetails = await treeLogicsNewController.getExcelFileDataList(node.metaData.localVariableName, node.metaData.displayColumnName);

                return await userTransactionController.selectOrganizationData(node, userId, fileVariableDetails);

            } else if (node.type == "PassData") {
                let fileVariableDetails;
                if (node.metaData.isFetchFromLookup) fileVariableDetails = await treeLogicsNewController.getLookupDataFromVariable(node.metaData.lookupVariableName.match(/(?<=\{)(.*?)(?=\})/g)[0], node.metaData.displayColumnName, transactionId);
                else fileVariableDetails = await treeLogicsNewController.getExcelFileDataList(node.metaData.localVariableName, node.metaData.displayColumnName);

                if (node.metaData.localVariableName == 'Products' || node.metaData.localVariableName == 'States') return await userTransactionController.selectOrganizationData(node, userId, fileVariableDetails);
                else {
                    fileVariableDetails.forEach(function (element) {
                        element.isSelected = true;
                    });
                    if (node.metaData.groupByColumn && node.metaData.groupByColumn != "") return await treeLogicsNewController.groupByDataList(fileVariableDetails, node.metaData.groupByColumn);
                    else return fileVariableDetails;
                }
            } else {
                return [];
            }
        } catch (err) {
            serverLog.error(`[{function : "getNodeDetail" from "traversalData" from "userTransactionController" controller}], [{Error : ${err}}]`);
            throw err;
        }
    }

    static async selectOrganizationData(node, userId, fileVariableDetails) {
        const [getFileId, userOrganizationId] = await Promise.all([
            excelDataQueries.findOne({
                fileName: node.metaData.localVariableName
            }, {
                _id: 1,
                fileName: 1
            }),
            userQuery.findOne({
                _id: userId
            }, {
                organizationId: 1
            }),
        ]);

        if (!getFileId) {
            fileVariableDetails.forEach(function (element) {
                element.isSelected = false;
            });
        } else {
            const organizationDetails = await organizationQuery.findById(userOrganizationId.organizationId);

            const result = organizationDetails.metaData.find(metaData => metaData.fileName == getFileId.fileName);

            if (result && result.value.length) {
                let newArr = [];
                fileVariableDetails.forEach(function (element) {
                    let res = result.value.includes(String(element._id));
                    if (res) {
                        element.isSelected = res;
                        newArr.push(element);
                    } else {
                        element.isSelected = res;
                        newArr.push(element);
                    }
                });
                fileVariableDetails = newArr;

            } else {
                fileVariableDetails.forEach(function (element) {
                    element.isSelected = false;
                });
            }
        }

        if (node.metaData.groupByColumn && node.metaData.groupByColumn != "") {
            if (node.metaData.isDistinct) return await treeLogicsNewController.groupByDataList(fileVariableDetails, node.metaData.groupByColumn, node.metaData.distinctColumn);
            return await treeLogicsNewController.groupByDataList(fileVariableDetails, node.metaData.groupByColumn);
        } else {
            if (node.metaData.isDistinct) return treeLogicsNewController.removeDuplicatesFromData(fileVariableDetails, node.metaData.distinctColumn)
            return fileVariableDetails;
        }
    }

    /**
     * *This method is used to get links for particular node
     *
     * @static
     * @param {*} conditionArray
     * @returns
     * @memberof userTransactionController
     */
    static async findConditions(conditionArray) {
        try {
            serverLog.info(`[findConditions] { request : ${JSON.stringify(conditionArray)} }`);
            if (conditionArray.length > 0) {

                let conditions = await linkQuery.findAndProject({
                    _id: {
                        $in: conditionArray
                    }
                }, {
                    _id: 1,
                    label: 1,
                    createdAt: 1
                })
                serverLog.info(`[findConditions] { return : ${JSON.stringify(conditions)}}`);
                return conditions;
            } else {
                serverLog.info(`[findConditions] { return : "condition not found or empty array passed"}`);
                return [];
            }
        } catch (err) {
            serverLog.error(`[{function : "findConditions" from "traversalData" from "userTransactionController" controller}], [{Error : ${err}}]`);
            throw err;
        }
    }

    /**
     * *This api is used to start traversal for any decision tree
     *
     * @static
     * @param {*} req
     * @param {*} res
     * @memberof userTransactionController
     */
    static async startTransaction(req, res) {
        try {
            const {
                questionId
            } = req.body;
            serverLog.info(`[${req.originalUrl}] [${req.method}] [loggedInUser : ${req.headers.id}], {request_payload : ${JSON.stringify(req.body)}}`);

            //find decision tree from question.
            const findDecisionTree = await decisionTreeQuery.findOne({
                questionId,
                isDeleted: false
            });
            if (findDecisionTree) {

                //add root node as a default transaction.
                let rootNode = await nodeQuery.findById(findDecisionTree.nodeId);

                const transactionModelData = new UserTransactionModel({
                    questionId,
                    traverseNodes: [{
                        linkLabel: "",
                        nodeLabel: rootNode.label,
                        isRoot: rootNode.isRoot,
                        isLeaf: rootNode.isLeaf
                    }],
                    fromLink: [],
                    decisionTreeId: findDecisionTree._id,
                    createdBy: req.headers.id,
                    updatedBy: req.headers.id
                });

                //save users transaction
                const savedTransactionData = await userTransactionQuery.saveData(transactionModelData);
                serverLog.info(`[${req.originalUrl}] [${req.method}] [${status_codes.CREATED}] [loggedInUser : ${req.headers.id}], { message : "saved root node for transaction : ${savedTransactionData._id} and decision tree : ${findDecisionTree._id}" }`)

                let userDetails = await userQuery.findById(req.headers.id);

                let organizationDetails = await organizationQuery.findById(userDetails.organizationId);

                let variableDataArray = [];
                //save organization data to the user inputs
                const userInputsForECommerce = {
                    userTransactionId: savedTransactionData._id,
                    variableName: "eCommerceRevenuePercentage",
                    value: organizationDetails.eCommerceRevenuePercentage,
                    valueType: 'Number',
                    createdBy: req.headers.id
                };
                variableDataArray.push(userInputsForECommerce)

                const userInputsForTraditionalRetailUnit = {
                    userTransactionId: savedTransactionData._id,
                    variableName: "traditionalRetailUnit",
                    value: organizationDetails.traditionalRetailUnit,
                    valueType: 'Number',
                    createdBy: req.headers.id
                };
                variableDataArray.push(userInputsForTraditionalRetailUnit)

                const userInputsFortraditionalRetailRevenuePercentage = {
                    userTransactionId: savedTransactionData._id,
                    variableName: "traditionalRetailRevenuePercentage",
                    value: organizationDetails.traditionalRetailRevenuePercentage,
                    valueType: 'Number',
                    createdBy: req.headers.id
                };
                variableDataArray.push(userInputsFortraditionalRetailRevenuePercentage)

                const userInputsForeCommerceUnit = {
                    userTransactionId: savedTransactionData._id,
                    variableName: "eCommerceUnit",
                    value: organizationDetails.eCommerceUnit,
                    valueType: 'Number',
                    createdBy: req.headers.id
                };
                variableDataArray.push(userInputsForeCommerceUnit)

                const userInputsForOverAllRevenue = {
                    userTransactionId: savedTransactionData._id,
                    variableName: "overAllRevenue",
                    value: organizationDetails.overAllRevenue,
                    valueType: 'Number',
                    createdBy: req.headers.id
                };
                variableDataArray.push(userInputsForOverAllRevenue)

                await userTransactionInputQuery.insertAll(variableDataArray);


                res.status(status_codes.CREATED).send(Response.sendResponse(status_codes.CREATED, custom_message.InfoMessage.savedTransaction, {
                    transactionId: savedTransactionData._id
                }, []));
            } else {
                serverLog.error(`[${req.originalUrl}] [${req.method}] [${status_codes.NOTFOUND}] [loggedInUser : ${req.headers.id}], { response : "cant find decision tree for question(${JSON.stringify(questionId)})"}`)

                res.status(status_codes.NOTFOUND).send(Response.sendResponse(status_codes.NOTFOUND, custom_message.errorMessage.treeNotFound, [], []));
            }
        } catch (err) {
            serverLog.error(`[${req.originalUrl}] [${req.method}], [${status_codes.INTERNAL_SERVER_ERROR}] {error : ${err}}`);
            console.log(err);
            res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
        }
    }

    /**
     * !This function is not used as of now
     * This function is created to traverse next node from the root node
     * @static
     * @param {*} linkIds
     * @param {*} transactionId
     * @memberof userTransactionController
     */
    static async traverseNextNodeFromRoot(linkIds, transactionId) {
        try {
            let linkId = linkIds[0];

            const linkDetails = await linkQuery.findById(linkId);

            const nodeDetails = await nodeQuery.findById(linkDetails.nextNode);

            let transactionData = {
                linkLabel: (linkDetails.label) ? linkDetails.label : "",
                nodeLabel: nodeDetails.label,
                isRoot: nodeDetails.isRoot,
                isLeaf: nodeDetails.isLeaf
            };

            await userTransactionQuery.findByIdAndUpdate(transactionId, {
                $push: {
                    traverseNodes: transactionData
                }
            }, {
                new: true
            });

        } catch (err) {
            serverLog.error(`[{function : "traverseNextNodeFromRoot" from "startTransaction" from "userTransactionController" controller}], [{Error : ${err}}]`);
            throw err;
        }
    }


    /**
     * *This api will add node to the database as it was traversed by user
     *
     * @static
     * @param {*} req
     * @param {*} res
     * @memberof userTransactionController
     */
    static async addTransaction(req, res) {

        console.log(req,"reqqqqqqqqqqqqqqqqqqqqqqqqq")


        try {
            const {
                fromLink,
                toNode,
                transactionId,
                metaData
            } = req.body;

            console.log(req.body,"reqqqqqqqqq.bodyyyyyyyyyyyyyyyyyyyyyy")
            let displayColumn = "";
            serverLog.info(`[${req.originalUrl}] [${req.method}] [loggedInUser : ${req.headers.id}], {request_payload : ${JSON.stringify(req.body)}}`);

            let node = await nodeQuery.findById(toNode);
            const linkInformation = await linkQuery.findById(fromLink);

            // this is entry to database as this node is traversed
            const transactionInformation = {
                linkLabel: (linkInformation.label) ? linkInformation.label : "",
                nodeLabel: node.label,
                isRoot: node.isRoot,
                isLeaf: node.isLeaf
            };

            // this is link information from which that node was traversed
            const fromLinkInfo = {
                fromLinkId: fromLink,
                fromLinkKey: (linkInformation.linkKey) ? linkInformation.linkKey : ""
            }

            // if node's metadata is available then save variable to DB
            if (metaData && Object.keys(metaData).length > 0) {
                if (node.type == 'ManualInput') {
                    for (const variable of metaData.inputs) {
                        const data = await userTransactionController.processVariables(variable, transactionId, req.headers.id, node.type, displayColumn);
                        if (data && data === "not_null_error") return res.status(status_codes.BAD_REQUEST).send(Response.sendResponse(status_codes.BAD_REQUEST, custom_message.errorMessage.notNullError, [], []));
                    }
                } else {
                    if (node.type == 'MultiOption' || node.type == 'PassData') displayColumn = node.metaData.displayColumnName;
                    await userTransactionController.processVariables(metaData, transactionId, req.headers.id, node.type, displayColumn, node.metaData.columnName ? node.metaData.columnName : "");
                }
            }

            await userTransactionQuery.findByIdAndUpdate(transactionId, {
                $push: {
                    traverseNodes: transactionInformation,
                    fromLink: fromLinkInfo
                }
            }, {
                new: true
            });

            serverLog.info(`[${req.originalUrl}] [${req.method}] [${status_codes.CREATED}] [loggedInUser : ${req.headers.id}], { message : "saved node for transaction ${transactionId}" }`)

            res.status(status_codes.CREATED).send(Response.sendResponse(status_codes.CREATED, custom_message.InfoMessage.savedTransaction, {
                transactionId
            }, []));

        } catch (err) {
            serverLog.error(`[${req.originalUrl}] [${req.method}], [${status_codes.INTERNAL_SERVER_ERROR}] {error : ${err}}`);
            console.log(err);
            res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
        }
    }

    static async processVariables(metaData, transactionId, userId, nodeType, displayColumn, columnName = "") {
        try {

            serverLog.info(`[processVariables] [loggedInUser : ${userId}], { request : {transactionId : ${JSON.stringify(transactionId)}} {metaData : ${metaData}}}`);
            if (nodeType == "ManualInput") {
                if (metaData.variableName) {
                    const findVariable = await expressionVariableQueries.findById(metaData.variableId);

                    if (findVariable.constraints) {
                        if (findVariable.constraints == "not_null" && !metaData.value) {
                            return "not_null_error";
                        }
                    }

                    const userInputs = {
                        userTransactionId: transactionId,
                        variableName: metaData.variableName,
                        value: JSON.stringify(metaData.value),
                        valueType: findVariable.valueType,
                        variableId: findVariable._id,
                        createdBy: userId
                    };
                    if (findVariable.variableLabel) userInputs['variableLabel'] = findVariable.variableLabel;

                    const userInputModelData = new UserTransactionInputModel(userInputs);
                    await userTransactionInputQuery.saveData(userInputModelData);
                }
            }

            if (nodeType == "TableView") {
                 if (metaData.type == "Simple Forecast"){

                                const userInputs = {
                                    userTransactionId: transactionId,
                                    variableName: "reportSummary",
                                    value: metaData.inputs,
                                    variableLabel: metaData.name,
                                    valueType: 'String',
                                    createdBy: userId
                                };

                                const userInputModelData = new UserTransactionInputModel(userInputs);
                                await userTransactionInputQuery.saveData(userInputModelData);
                            }
                            }


            if (nodeType == "MultiOption" || nodeType == "PassData") {
                const findVariable = await expressionVariableQueries.findById(metaData.variableId);
                let userInputsForFiles;
                if (metaData.variableName && !metaData.isFetchFromLookup) {
                    let value;
                    if (displayColumn) {
                        const values = await treeLogicsNewController.getExcelFileDataList(metaData.variableName, displayColumn);
                        value = treeLogicsNewController.filterDataListByItemIds(values, metaData.value);
                    } else value = metaData.value;

                    userInputsForFiles = {
                        userTransactionId: transactionId,
                        variableId: findVariable._id,
                        variableName: findVariable.variableName ? findVariable.variableName : metaData.variableName,
                        displayColumn: displayColumn,
                        columnName: columnName,
                        fileId: findVariable.fileId,
                        value: value.length ? JSON.stringify(value) : JSON.stringify(metaData.value),
                        valueReference: JSON.stringify(metaData.value),
                        valueType: 'Array',
                        createdBy: userId
                    };
                }
                if (metaData.variableName && metaData.isFetchFromLookup) {
                    userInputsForFiles = {
                        userTransactionId: transactionId,
                        variableId: findVariable._id,
                        variableName: findVariable.variableName ? findVariable.variableName : metaData.variableName,
                        displayColumn: displayColumn,
                        columnName: columnName,
                        value: JSON.stringify(metaData.value),
                        valueReference: JSON.stringify(metaData.value),
                        valueType: 'Array',
                        createdBy: userId,
                        isFetchFromLookup: metaData.isFetchFromLookup
                    };
                }

                if (findVariable.variableLabel) userInputsForFiles['variableLabel'] = findVariable.variableLabel;
                const userInputModelDataForProduct = new UserTransactionInputModel(userInputsForFiles);
                await userTransactionInputQuery.saveData(userInputModelDataForProduct);
            }

            serverLog.info(`[processVariables] [loggedInUser : ${userId}], {message : "returning from this function"}`);
            return;

        } catch (err) {
            serverLog.error(`[{function : "processVariables" from "addTransaction" from "userTransactionController" controller}], [{Error : ${err}}]`);
            throw err;
        }
    }


    /**
     * *This api will complete current transaction
     *
     * @static
     * @param {*} req
     * @param {*} res
     * @memberof userTransactionController
     */
    static async completeTransaction(req, res) {
        try {
            const {
                transactionId
            } = req.body;

            serverLog.info(`[${req.originalUrl}] [${req.method}] [loggedInUser : ${req.headers.id}], {request_payload : ${JSON.stringify(req.query)}}`);

            await userTransactionQuery.findByIdAndUpdate(transactionId, {
                isActive: false
            }, {
                new: true
            });

            serverLog.info(`[${req.originalUrl}] [${req.method}] [loggedInUser : ${req.headers.id}], [${status_codes.OK}] {message : "Transaction (${transactionId}) completed by request of edit transaction"`);
            res.status(status_codes.OK).send(Response.sendResponse(status_codes.OK, custom_message.InfoMessage.completedTransaction, [], []));

        } catch (err) {
            serverLog.error(`[${req.originalUrl}] [${req.method}], [${status_codes.INTERNAL_SERVER_ERROR}] {error : ${err}}`);
            console.log(err);
            res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
        }
    }

    /**
     * *This method will call internally whenever a report node is avaialble
     */
    static async saveReportUrlInternally(transactionId) {
        try {

            // Get Report Template
            var userTransData = await userTransactionQuery.findOne({
                _id: transactionId
            });
            var questionId = userTransData ? userTransData.questionId : null;

            var nodeData = await nodeQuery.findOne({
                questionId: questionId,
                isActive: true,
                type: "Report"
            });
            var reportTemplateId = nodeData && nodeData.metaData ? nodeData.metaData.templateId : null;

            var reportTemplateData = await reportTemplateQuery.findOne({
                _id: reportTemplateId
            });
            var reportTemplate = reportTemplateData ? reportTemplateData.slug : "";

            // Get user data
            var findPattern = {
                _id: userTransData.createdBy
            };
            var populatePattern = "organizationId";
            var selectPattern = "firstName lastName organizationId";

            var userData = await userQuery.findOne(findPattern, selectPattern, populatePattern);

            var userInfo = {
                userName: userData ? userData.firstName + " " + userData.lastName : "",
                organizationName: userData ? userData.organizationId.companyName : "",
                reportTemplate: reportTemplate,
            };

            // Check by report template
            if (reportTemplate) {

                if (reportTemplate == "default") {

                    const userTransInputsList = await userTransactionInputQuery.findAll({
                        userTransactionId: transactionId,
                        isParseFromProcess: true
                    });

                    var userInputsArr = userTransInputsList.filter(obj => obj.variableLabel);
                    userInputsArr = userInputsArr.map(item => {
                        return {
                            variableLabel: item.variableLabel,
                            variableName: item.variableName,
                            value: item.value,
                        }
                    });

                    // Get main json
                    let inputMainJson = {
                        defaultProcessMainJson: userInputsArr
                    };

                    // Get report url
                    let reportUrl = await treeLogicsNewController.generateReportUrl(transactionId, inputMainJson, reportTemplate, userInfo);

                    await userTransactionQuery.findByIdAndUpdate(transactionId, {
                        reportUrl
                    }, {
                        new: true
                    });

                    return reportUrl;

                } else {

                    // Get user transaction input data
                    const userTransInputsData = await userTransactionInputQuery.findOne({
                        userTransactionId: transactionId,
                        variableName: "reportSummary",
                        isActive: true
                    });

                    if (userTransInputsData) {

                        let reportSummary = JSON.parse(userTransInputsData.value);

                        if (reportTemplate == "networkComputation") {
                            userInfo["overAllRevenue"] = reportSummary.inputData.overAllRevenue;
                            userInfo["eCommercePercent"] = reportSummary.inputData.eCommercePercent;
                            userInfo["ltlPercent"] = reportSummary.inputData.ltlPercent;
                            userInfo["tlPercent"] = reportSummary.inputData.tlPercent;
                            userInfo["fleetPercent"] = reportSummary.inputData.fleetPercent;
                            userInfo["inputServiceLevel"] = reportSummary.inputData.inputServiceLevel;
                            userInfo["parcelRaterPercent"] = reportSummary.inputData.parcelRaterPercent;
                        }

                        if (reportTemplate == "portAnalysis") {
                            userInfo["comparisonType"] = reportSummary.inputData.comparisonType;
                            userInfo["selectedDate"] = reportSummary.inputData.selectedDate;
                        }

                        // Get main json
                        let inputMainJson = reportSummary.mainJson;

                        // Get report url
                        let reportUrl = await treeLogicsNewController.generateReportUrl(transactionId, inputMainJson, reportTemplate, userInfo);

                        await userTransactionQuery.findByIdAndUpdate(transactionId, {
                            reportUrl
                        }, {
                            new: true
                        });

                        return reportUrl;

                    } else {

                        console.log(custom_message.InfoMessage.reportNotFound)
                    }
                }

            } else {
                console.log(custom_message.InfoMessage.reportNotFound)
            }

        } catch (err) {
            console.log(custom_message.errorMessage.genericError)
        }
    }

    /**
     * *This api is used to download particular transaction's report
     *
     * @static
     * @param {*} req
     * @param {*} res
     * @memberof userTransactionController
     */
    static async getReportUrl(req, res) {
        try {
            const {
                transactionId
            } = req.query;

            serverLog.info(`[${req.originalUrl}] [${req.method}] [loggedInUser : ${req.headers.id}], {request_payload : ${JSON.stringify(req.query)}}`);

            // Get Report Template
            var userTransData = await userTransactionQuery.findOne({
                _id: transactionId
            });
            var questionId = userTransData ? userTransData.questionId : null;

            var nodeData = await nodeQuery.findOne({
                questionId: questionId,
                isActive: true,
                type: "Report"
            });
            var reportTemplateId = nodeData && nodeData.metaData ? nodeData.metaData.templateId : null;

            var reportTemplateData = await reportTemplateQuery.findOne({
                _id: reportTemplateId
            });
            var reportTemplate = reportTemplateData ? reportTemplateData.slug : "";

            // Get user data
            var findPattern = {
                _id: userTransData.createdBy
            };
            var populatePattern = "organizationId";
            var selectPattern = "firstName lastName organizationId";

            var userData = await userQuery.findOne(findPattern, selectPattern, populatePattern);

            var userInfo = {
                userName: userData ? userData.firstName + " " + userData.lastName : "",
                organizationName: userData ? userData.organizationId.companyName : "",
                reportTemplate: reportTemplate,
            };

            // Check by report template
            if (reportTemplate) {

                if (reportTemplate == "default") {

                    const userTransInputsList = await userTransactionInputQuery.findAll({
                        userTransactionId: transactionId,
                        isParseFromProcess: true
                    });

                    var userInputsArr = userTransInputsList.filter(obj => obj.variableName);
                    userInputsArr = userInputsArr.map(item => {
                        return {
                            variableName: item.variableName,
                            value: item.value,
                        }
                    });

                    // Get main json
                    let inputMainJson = {
                        defaultProcessMainJson: userInputsArr
                    };

                    // Get report url
                    let reportUrl = await treeLogicsNewController.generateReportUrl(transactionId, inputMainJson, reportTemplate, userInfo);

                    await userTransactionQuery.findByIdAndUpdate(transactionId, {
                        reportUrl
                    }, {
                        new: true
                    });

                    serverLog.info(`[${req.originalUrl}] [${req.method}] [loggedInUser : ${req.headers.id}], [${status_codes.OK}] {message : "report generated for transaction (${transactionId}). reportURL = ${reportUrl}"`);

                    res.status(status_codes.OK).send(Response.sendResponse(status_codes.OK, custom_message.InfoMessage.reportGenerate, reportUrl, []));

                } else {

                    // Get user transaction input data
                    const userTransInputsData = await userTransactionInputQuery.findOne({
                        userTransactionId: transactionId,
                        variableName: "reportSummary",
                        isActive: true
                    });

                    if (userTransInputsData) {

                        let reportSummary = JSON.parse(userTransInputsData.value);

                        if (reportTemplate == "networkComputation") {
                            userInfo["overAllRevenue"] = reportSummary.inputData.overAllRevenue;
                            userInfo["eCommercePercent"] = reportSummary.inputData.eCommercePercent;
                            userInfo["ltlPercent"] = reportSummary.inputData.ltlPercent;
                            userInfo["tlPercent"] = reportSummary.inputData.tlPercent;
                            userInfo["fleetPercent"] = reportSummary.inputData.fleetPercent;
                            userInfo["inputServiceLevel"] = reportSummary.inputData.inputServiceLevel;
                            userInfo["parcelRaterPercent"] = reportSummary.inputData.parcelRaterPercent;
                        }

                        if (reportTemplate == "portAnalysis") {
                            userInfo["comparisonType"] = reportSummary.inputData.comparisonType;
                            userInfo["selectedDate"] = reportSummary.inputData.selectedDate;
                        }

                        if (reportTemplate == "simpleForecast") {
                                                    userInfo["forecast"] = reportSummary;
                                                    userInfo["variableLabel"] = userTransInputsData.variableLabel;
                                                }

                        // Get main json
                        let inputMainJson = reportSummary.mainJson;

                        // Get report url
                        let reportUrl = await treeLogicsNewController.generateReportUrl(transactionId, inputMainJson, reportTemplate, userInfo);

                        await userTransactionQuery.findByIdAndUpdate(transactionId, {
                            reportUrl
                        }, {
                            new: true
                        });

                        serverLog.info(`[${req.originalUrl}] [${req.method}] [loggedInUser : ${req.headers.id}], [${status_codes.OK}] {message : "report generated for transaction (${transactionId}). reportURL = ${reportUrl}"`);

                        res.status(status_codes.OK).send(Response.sendResponse(status_codes.OK, custom_message.InfoMessage.reportGenerate, reportUrl, []));

                    } else {

                        res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.InfoMessage.reportNotFound, {}, []));
                    }
                }

            } else {
                res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.InfoMessage.reportNotFound, {}, []));
            }

        } catch (err) {
            serverLog.error(`[${req.originalUrl}] [${req.method}], [${status_codes.INTERNAL_SERVER_ERROR}] {error : ${err}}`);
            console.log(err);
            res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
        }
    }


    /**
     * *This api will provide report summery for transaction
     *
     * @static
     * @param {*} req
     * @param {*} res
     * @memberof userTransactionController
     */
    static async getReportHtml(req, res) {
        try {
            const {
                transactionId
            } = req.query;

            serverLog.info(`[${req.originalUrl}] [${req.method}] [loggedInUser : ${req.headers.id}], {request_payload : ${JSON.stringify(req.query)}}`);

            // Get Report Template
            const userTransData = await userTransactionQuery.findOne({
                _id: transactionId
            });
            const questionId = userTransData ? userTransData.questionId : null;

            const nodeData = await nodeQuery.findOne({
                questionId: questionId,
                isActive: true,
                type: "Report"
            });

            const reportTemplateData = await reportTemplateQuery.findOne({
                _id: nodeData && nodeData.metaData ? nodeData.metaData.templateId : null
            });
            var reportTemplate = reportTemplateData ? reportTemplateData.slug : "";

            // Get user data
            var findPattern = {
                _id: userTransData.createdBy
            };
            var populatePattern = "organizationId";
            var selectPattern = "firstName lastName organizationId";

            var userData = await userQuery.findOne(findPattern, selectPattern, populatePattern);

            var userInfo = {
                userName: userData ? userData.firstName + " " + userData.lastName : "",
                organizationName: userData ? userData.organizationId.companyName : "",
                reportTemplate: reportTemplate,
            };

            // Check by report template
            if (reportTemplate) {

                if (reportTemplate == "default") {

                    const userTransInputsList = await userTransactionInputQuery.findAll({
                        userTransactionId: transactionId,
                        isParseFromProcess: true
                    });

                    var userInputsArr = userTransInputsList.filter(obj => obj.variableName);
                    userInputsArr = userInputsArr.map(item => {
                        return {
                            variableName: item.variableName,
                            value: item.value,
                        }
                    });

                    // Get main json
                    let inputMainJson = {
                        defaultProcessMainJson: userInputsArr
                    };

                    // Get report html
                    let reportHtml = await treeLogicsNewController.generateReportHtml(transactionId, inputMainJson, reportTemplate, userInfo);

                    serverLog.info(`[${req.originalUrl}] [${req.method}] [loggedInUser : ${req.headers.id}], [${status_codes.OK}] {message : "report generated for transaction (${transactionId})`);

                    res.status(status_codes.OK).send(Response.sendResponse(status_codes.OK, custom_message.InfoMessage.reportGenerate, {
                        displayHtml: reportHtml,
                        reportType: reportTemplate
                    }, []));

                } else {

                    // Get user transaction input data
                    const userTransInputsData = await userTransactionInputQuery.findOne({
                        userTransactionId: transactionId,
                        variableName: "reportSummary",
                        isActive: true
                    });

                    if (userTransInputsData) {

                        let reportSummary = JSON.parse(userTransInputsData.value);

                        if (reportTemplate == "networkComputation") {
                            userInfo["overAllRevenue"] = reportSummary.inputData.overAllRevenue;
                            userInfo["eCommercePercent"] = reportSummary.inputData.eCommercePercent;
                            userInfo["ltlPercent"] = reportSummary.inputData.ltlPercent;
                            userInfo["tlPercent"] = reportSummary.inputData.tlPercent;
                            userInfo["fleetPercent"] = reportSummary.inputData.fleetPercent;
                            userInfo["inputServiceLevel"] = reportSummary.inputData.inputServiceLevel;
                            userInfo["parcelRaterPercent"] = reportSummary.inputData.parcelRaterPercent;
                        }

                        if (reportTemplate == "portAnalysis") {
                            userInfo["comparisonType"] = reportSummary.inputData.comparisonType;
                            userInfo["selectedDate"] = reportSummary.inputData.selectedDate;
                        }

                        if (reportTemplate == "simpleForecast") {
                            userInfo["forecast"] = reportSummary;
                            userInfo["variableLabel"] = userTransInputsData.variableLabel;
                        }

                        // Get main json
                        let inputMainJson = reportSummary.mainJson;

                        // Get report html
                        let reportHtml = '';

                        // if(reportTemplate == "networkComputation") {
                        reportHtml = await HTMLtreeLogicsController.generateReportHtml(transactionId, inputMainJson, reportTemplate, userInfo);
                        // } else {
                        //     reportHtml = await treeLogicsNewController.generateReportHtml(transactionId, inputMainJson, reportTemplate, userInfo);
                        // }

                        serverLog.info(`[${req.originalUrl}] [${req.method}] [loggedInUser : ${req.headers.id}], [${status_codes.OK}] {message : "report generated for transaction (${transactionId})`);

                        res.status(status_codes.OK).send(Response.sendResponse(status_codes.OK, custom_message.InfoMessage.reportGenerate, {
                            displayHtml: reportHtml,
                            reportType: reportTemplate
                        }, []));

                    } else {

                        res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.InfoMessage.reportNotFound, {}, []));
                    }
                }

            } else {
                res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.InfoMessage.reportNotFound, {}, []));
            }

        } catch (err) {
            serverLog.error(`[${req.originalUrl}] [${req.method}], [${status_codes.INTERNAL_SERVER_ERROR}] {error : ${err}}`);
            console.log(err);
            res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
        }
    }

    /**
     * *This api will re-traverse decision tree
     *
     * @static
     * @param {*} req
     * @param {*} res
     * @memberof userTransactionController
     */
    static async reTraverse(req, res) {
        try {
            const {
                transactionId
            } = req.params;
            serverLog.info(`[${req.originalUrl}] [${req.method}] [loggedInUser : ${req.headers.id}], {request_payload : ${JSON.stringify(req.params)}}`);


            const transaction = await userTransactionQuery.findById(transactionId);

            const decisionTree = await decisionTreeQuery.findOne({
                questionId: transaction.questionId,
                isActive: true,
                isDeleted: false
            });

            const transactionInputs = await userTransactionInputQuery.findAll({
                userTransactionId: transactionId,
                isDeleted: false,
                isActive: true
            });

            const getTransactionInputs = await userTransactionController.getTransactionInput(transactionInputs);

            await userTransactionQuery.findByIdAndUpdate(transactionId, {
                traverseNodes: [],
                fromLink: [],
                reportUrl: ""
            }, {
                new: true
            });

            await userTransactionInputQuery.updateMany({
                userTransactionId: transactionId,
                isDeleted: false,
                isActive: true
            }, {
                isActive: false,
                isDeleted: true
            }, {
                new: true
            })

            const inputs = {
                transactionId,
                nodeId: decisionTree.nodeId,
                userId: req.headers.id,
                reportUrl: (transaction.reportUrl) ? transaction.reportUrl : ""
            }
            await userTransactionController.reTraversalStart(inputs);

            serverLog.info(`[${req.originalUrl}] [${req.method}] [loggedInUser : ${req.headers.id}], [${status_codes.CREATED}] {response : ${JSON.stringify({ transactionId: transactionId, variableList: getTransactionInputs })} }`);

            res.status(status_codes.CREATED).send(Response.sendResponse(status_codes.CREATED, custom_message.InfoMessage.savedTransaction, {
                transactionId: transactionId,
                variableList: getTransactionInputs
            }, []));
        } catch (err) {
            serverLog.error(`[${req.originalUrl}] [${req.method}], [${status_codes.INTERNAL_SERVER_ERROR}] {error : ${err}}`);
            console.log(err);
            res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
        }
    }


    static async getTransactionInput(transactionInputListAsInput) {
        let transactionInputs = [];
        let transactionInputList = await transactionInputListAsInput.filter(
            (variables, index) => index === transactionInputListAsInput.findIndex(
                other => variables.variableName === other.variableName &&
                variables.value === other.value
            ));

        for (const input of transactionInputList) {
            if (input.variableName != "reportSummary") {
                let data = {};
                const variable = await variableQueries.findOne({
                    name: input.variableName,
                    type: "Organization"
                }, {
                    label: 1
                });

                if (variable) {
                    data[variable.label] = (input.value != '') ? JSON.parse(input.value) : "";
                    transactionInputs.push(data);
                } else {
                    if (input.displayColumn) {

                        data[input.variableName] = (JSON.parse(input.value).length > 0) ? JSON.parse(input.value) : [];
                        transactionInputs.push(data);
                    } else {

                        if (/^([0]?[1-9]|[1|2][0-9]|[3][0|1])[./-]([0]?[1-9]|[1][0-2])[./-]([0-9]{4}|[0-9]{2})$/.test(input.value)) {
                            data[input.variableName] = (input.value != '') ? input.value : "";
                            transactionInputs.push(data);
                        } else {

                            data[input.variableName] = (input.value != '') ? JSON.parse(input.value) : "";
                            transactionInputs.push(data);
                        }
                    }
                }
            }
        }
        return transactionInputs;
    }


    /**
     * *This method will remove report from server and create root node for the transaction
     *
     * @static
     * @param {*} inputs
     * @returns
     * @memberof userTransactionController
     */
    static async reTraversalStart(inputs) {
        try {

            serverLog.info(`[reTraversalStart] [loggedInUser : ${inputs.userId}], { request : ${JSON.stringify(inputs)} }`);

            if (inputs.reportUrl != "") {
                fs.unlink('/usr/src/app/src/public/reports/report_' + inputs.transactionId + '.xlsx', (err) => {
                    if (err) {
                        console.log("failed to delete file==============>", err)
                    } else {
                        console.log("file removed successfully========")
                    }
                })
            }

            let rootNode = await nodeQuery.findById(inputs.nodeId);

            const nodeData = {
                linkLabel: "",
                nodeLabel: rootNode.label,
                isRoot: rootNode.isRoot,
                isLeaf: rootNode.isLeaf
            }

            await userTransactionQuery.findByIdAndUpdate(inputs.transactionId, {
                $push: {
                    traverseNodes: nodeData
                },
                updatedBy: inputs.userId
            }, {
                new: true
            });


            let userDetails = await userQuery.findById(inputs.userId);

            let organizationDetails = await organizationQuery.findById(userDetails.organizationId);

            let variableDataArray = [];
            //save organization data to the user inputs
            const userInputsForECommerce = {
                userTransactionId: inputs.transactionId,
                variableName: "eCommerceRevenuePercentage",
                value: organizationDetails.eCommerceRevenuePercentage,
                valueType: 'Number',
                createdBy: inputs.userId
            };
            variableDataArray.push(userInputsForECommerce)
            const userInputsForTraditionalRetailUnit = {
                userTransactionId: inputs.transactionId,
                variableName: "traditionalRetailUnit",
                value: organizationDetails.traditionalRetailUnit,
                valueType: 'Number',
                createdBy: inputs.userId
            };
            variableDataArray.push(userInputsForTraditionalRetailUnit)
            const userInputsFortraditionalRetailRevenuePercentage = {
                userTransactionId: inputs.transactionId,
                variableName: "traditionalRetailRevenuePercentage",
                value: organizationDetails.traditionalRetailRevenuePercentage,
                valueType: 'Number',
                createdBy: inputs.userId
            };
            variableDataArray.push(userInputsFortraditionalRetailRevenuePercentage)
            const userInputsForeCommerceUnit = {
                userTransactionId: inputs.transactionId,
                variableName: "eCommerceUnit",
                value: organizationDetails.eCommerceUnit,
                valueType: 'Number',
                createdBy: inputs.userId
            };
            variableDataArray.push(userInputsForeCommerceUnit)
            const userInputsForOverAllRevenue = {
                userTransactionId: inputs.transactionId,
                variableName: "overAllRevenue",
                value: organizationDetails.overAllRevenue,
                valueType: 'Number',
                createdBy: inputs.userId
            };
            variableDataArray.push(userInputsForOverAllRevenue)
            await userTransactionInputQuery.insertAll(variableDataArray);

            serverLog.info(`[reTraversalStart] [loggedInUser : ${inputs.userId}], { message : returning after added start node to the transaction }`);

            return;

        } catch (err) {
            console.log(err);
            serverLog.error(`[{function : "reTraversalStart" from "reTraverse" from "userTransactionController" controller}], [{Error : ${err}}]`);
            throw err;
        }
    }

    // static async decisionNodeData(req, res) {
    //     try {
    //         const {
    //             decisionNodeId
    //         } = req.body;

    //         let nodeDetails = await nodeQuery.findById(decisionNodeId);

    //         if (nodeDetails.type == "Decision" && nodeDetails.metaData.type != "equation") {
    //             let links = await linkQuery.findAndProject({
    //                 _id: {
    //                     $in: nodeDetails.links
    //                 }
    //             }, {
    //                 _id: 1,
    //                 nextNode: 1,
    //                 label: 1,
    //                 linkKey: 1
    //             });
    //             if (links.length > 0) {
    //                 let decisionNodeResponse = [];
    //                 for (let link of links) {
    //                     let nodeFromDecisionLinks = await nodeQuery.findById(link.nextNode);
    //                     let getVariable = await expressionVariableQueries.findOne({
    //                         decisionTreeId: nodeFromDecisionLinks.decisionTreeId,
    //                         variableName: nodeFromDecisionLinks.metaData.localVariableName,
    //                         isActive: true
    //                     });

    //                     let linksFromNode = await userTransactionController.findConditions(nodeFromDecisionLinks.links)
    //                     if (nodeFromDecisionLinks.type == 'PassData') {
    //                         let list;
    //                         let fileVariableData = await treeLogicsNewController.getExcelFileDataList(nodeFromDecisionLinks.metaData.localVariableName, nodeFromDecisionLinks.metaData.displayColumnName);

    //                         if (nodeFromDecisionLinks.metaData.localVariableName == 'Products' || nodeFromDecisionLinks.metaData.localVariableName == 'States') {
    //                             list = await userTransactionController.selectOrganizationData(nodeFromDecisionLinks, req.headers.id, fileVariableData);
    //                             if (list.length === 0) {
    //                                 fileVariableData.forEach(function (element) {
    //                                     element.isSelected = true;
    //                                 });
    //                                 if (nodeFromDecisionLinks.metaData.groupByColumn && nodeFromDecisionLinks.metaData.groupByColumn != "") {
    //                                     list = await treeLogicsNewController.groupByDataList(fileVariableData, nodeFromDecisionLinks.metaData.groupByColumn);
    //                                 } else {
    //                                     list = fileVariableData;
    //                                 }
    //                             }
    //                         } else {
    //                             fileVariableData.forEach(function (element) {
    //                                 element.isSelected = true;
    //                             });
    //                             if (nodeFromDecisionLinks.metaData.groupByColumn && nodeFromDecisionLinks.metaData.groupByColumn != "") {
    //                                 list = await treeLogicsNewController.groupByDataList(fileVariableData, nodeFromDecisionLinks.metaData.groupByColumn);
    //                             } else {
    //                                 list = fileVariableData;
    //                             }
    //                         }

    //                         let response = {
    //                             fromLink: link._id,
    //                             _id: nodeFromDecisionLinks._id,
    //                             label: nodeFromDecisionLinks.label,
    //                             linkKey: link.linkKey,
    //                             linkLabel: link.label,
    //                             isRoot: nodeFromDecisionLinks.isRoot,
    //                             isLeaf: nodeFromDecisionLinks.isLeaf,
    //                             type: nodeFromDecisionLinks.type,
    //                             variableId: getVariable._id,
    //                             links: linksFromNode,
    //                             metaData: nodeFromDecisionLinks.metaData ? nodeFromDecisionLinks.metaData : {},
    //                             data: list
    //                         }
    //                         decisionNodeResponse.push(response)
    //                     }

    //                     if (nodeFromDecisionLinks.type == 'MultiOption') {

    //                         let list;
    //                         let fileVariableData = await treeLogicsNewController.getExcelFileDataList(nodeFromDecisionLinks.metaData.localVariableName, nodeFromDecisionLinks.metaData.displayColumnName);

    //                         let getFileId = await excelDataQueries.findOne({
    //                             fileName: nodeFromDecisionLinks.metaData.localVariableName
    //                         }, {
    //                             _id: 1,
    //                             fileName: 1
    //                         });

    //                         let userOrganizationId = await userQuery.findOne({
    //                             _id: req.headers.id
    //                         }, {
    //                             organizationId: 1
    //                         });

    //                         let organizationDetails = await organizationQuery.findById(userOrganizationId.organizationId);

    //                         let result = organizationDetails.metaData.find(metaData => metaData.fileName == getFileId.fileName);
    //                         if (result) {
    //                             fileVariableData.forEach(function (element) {
    //                                 let reslt = result.value.includes(String(element._id));
    //                                 element.isSelected = reslt;
    //                             });
    //                         } else {
    //                             fileVariableData.forEach(function (element) {
    //                                 element.isSelected = false;
    //                             });
    //                         }

    //                         if (nodeFromDecisionLinks.metaData.groupByColumn && nodeFromDecisionLinks.metaData.groupByColumn != "") {
    //                             list = await treeLogicsNewController.groupByDataList(fileVariableData, nodeFromDecisionLinks.metaData.groupByColumn);
    //                         } else {
    //                             list = fileVariableData;
    //                         }
    //                         let response = {
    //                             fromLink: link._id,
    //                             _id: nodeFromDecisionLinks._id,
    //                             label: nodeFromDecisionLinks.label,
    //                             isRoot: nodeFromDecisionLinks.isRoot,
    //                             linkKey: link.linkKey,
    //                             linkLabel: link.label,
    //                             isLeaf: nodeFromDecisionLinks.isLeaf,
    //                             type: nodeFromDecisionLinks.type,
    //                             variableId: getVariable._id,
    //                             links: linksFromNode,
    //                             metaData: nodeFromDecisionLinks.metaData ? nodeFromDecisionLinks.metaData : {},
    //                             data: list
    //                         }
    //                         decisionNodeResponse.push(response)
    //                     }
    //                 }
    //                 res.status(status_codes.OK).send(Response.sendResponse(status_codes.OK, custom_message.InfoMessage.nodeDetails, decisionNodeResponse, []));
    //             }
    //         }
    //     } catch (err) {
    //         serverLog.error(`[${req.originalUrl}] [${req.method}], [${status_codes.INTERNAL_SERVER_ERROR}] {error : ${err}}`);
    //         console.log(err);
    //         res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
    //     }
    // }

    static async decisionNodeData(req, res) {
        try {
            const {
                decisionNodeId,
                transactionId
            } = req.body;
            const nodeDetails = await nodeQuery.findById(decisionNodeId);

            if (nodeDetails.type == "Decision" && nodeDetails.metaData.type != "equation") {
                const links = await linkQuery.findAndProject({
                    _id: {
                        $in: nodeDetails.links
                    }
                }, {
                    _id: 1,
                    nextNode: 1,
                    label: 1,
                    linkKey: 1
                });
                if (links.length > 0) {
                    const decisionNodeResponse = [];
                    for (const link of links) {
                        let nodeFromDecisionLinks = await nodeQuery.findById(link.nextNode);
                        const getVariable = await expressionVariableQueries.findOne({
                            decisionTreeId: nodeFromDecisionLinks.decisionTreeId,
                            variableName: nodeFromDecisionLinks.metaData.isFetchFromLookup ? nodeFromDecisionLinks.metaData.singleVariableName : nodeFromDecisionLinks.metaData.localVariableName,
                            isActive: true
                        });

                        const linksFromNode = await userTransactionController.findConditions(nodeFromDecisionLinks.links)
                        if (nodeFromDecisionLinks.type == 'PassData') {
                            let list;
                            let fileVariableData;
                            if (nodeFromDecisionLinks.metaData.isFetchFromLookup) fileVariableData = await treeLogicsNewController.getLookupDataFromVariable(nodeFromDecisionLinks.metaData.lookupVariableName.match(/(?<=\{)(.*?)(?=\})/g)[0], nodeFromDecisionLinks.metaData.displayColumnName, transactionId);
                            else fileVariableData = await treeLogicsNewController.getExcelFileDataList(nodeFromDecisionLinks.metaData.localVariableName, nodeFromDecisionLinks.metaData.displayColumnName);
                            if (nodeFromDecisionLinks.metaData.localVariableName == 'Products' || nodeFromDecisionLinks.metaData.localVariableName == 'States') {
                                list = await userTransactionController.selectOrganizationData(nodeFromDecisionLinks, req.headers.id, fileVariableData);
                                if (list.length === 0) {
                                    fileVariableData.forEach(function (element) {
                                        element.isSelected = true;
                                    });
                                    if (nodeFromDecisionLinks.metaData.groupByColumn && nodeFromDecisionLinks.metaData.groupByColumn != "") {
                                        list = await treeLogicsNewController.groupByDataList(fileVariableData, nodeFromDecisionLinks.metaData.groupByColumn);
                                    } else {
                                        list = fileVariableData;
                                    }
                                }
                            } else {
                                fileVariableData.forEach(function (element) {
                                    element.isSelected = true;
                                });
                                if (nodeFromDecisionLinks.metaData.groupByColumn && nodeFromDecisionLinks.metaData.groupByColumn != "") {
                                    list = await treeLogicsNewController.groupByDataList(fileVariableData, nodeFromDecisionLinks.metaData.groupByColumn);
                                } else {
                                    list = fileVariableData;
                                }
                            }
                            let {fileDisplayColumn, fileGroupByDisplayName} = await treeLogicsNewController.getExcelFileDisplayName(nodeFromDecisionLinks.metaData.localVariableName, nodeFromDecisionLinks.metaData.displayColumnName, nodeFromDecisionLinks);
                            let metaData ={
                                fileDisplayColumn: fileDisplayColumn,
                                fileGroupByDisplayName:fileGroupByDisplayName,
                                ...nodeFromDecisionLinks.metaData
                            }
                            const response = {
                                fromLink: link._id,
                                _id: nodeFromDecisionLinks._id,
                                label: nodeFromDecisionLinks.label,
                                linkKey: link.linkKey,
                                linkLabel: link.label,
                                isRoot: nodeFromDecisionLinks.isRoot,
                                isLeaf: nodeFromDecisionLinks.isLeaf,
                                type: nodeFromDecisionLinks.type,
                                variableId: getVariable._id,
                                links: linksFromNode,
                                metaData: metaData||{},
                                data: list
                            }
                            decisionNodeResponse.push(response)
                        }

                        if (nodeFromDecisionLinks.type == 'MultiOption') {

                            let list;
                            let fileVariableData;
                            if (nodeFromDecisionLinks.metaData.isFetchFromLookup) fileVariableData = await treeLogicsNewController.getLookupDataFromVariable(nodeFromDecisionLinks.metaData.lookupVariableName.match(/(?<=\{)(.*?)(?=\})/g)[0], nodeFromDecisionLinks.metaData.displayColumnName, transactionId);
                            else fileVariableData = await treeLogicsNewController.getExcelFileDataList(nodeFromDecisionLinks.metaData.localVariableName, nodeFromDecisionLinks.metaData.displayColumnName);
                            if (!nodeFromDecisionLinks.metaData.isFetchFromLookup) {
                                const getFileId = await excelDataQueries.findOne({
                                    fileName: nodeFromDecisionLinks.metaData.localVariableName
                                }, {
                                    _id: 1,
                                    fileName: 1
                                });

                                const userOrganizationId = await userQuery.findOne({
                                    _id: req.headers.id
                                }, {
                                    organizationId: 1
                                });

                                const organizationDetails = await organizationQuery.findById(userOrganizationId.organizationId);

                                const result = organizationDetails.metaData.find(metaData => metaData.fileName == getFileId.fileName);
                                if (result) {
                                    fileVariableData.forEach(function (element) {
                                        const reslt = result.value.includes(String(element._id));
                                        element.isSelected = reslt;
                                    });
                                } else {
                                    fileVariableData.forEach(function (element) {
                                        element.isSelected = false;
                                    });
                                }
                            } else {
                                fileVariableData.forEach(function (element) {
                                    element.isSelected = false;
                                });
                            }

                            if (nodeFromDecisionLinks.metaData.groupByColumn && nodeFromDecisionLinks.metaData.groupByColumn != "") {
                                list = await treeLogicsNewController.groupByDataList(fileVariableData, nodeFromDecisionLinks.metaData.groupByColumn);
                            } else {
                                list = fileVariableData;
                            }
                            let {fileDisplayColumn, fileGroupByDisplayName} = await treeLogicsNewController.getExcelFileDisplayName(nodeFromDecisionLinks.metaData.localVariableName, nodeFromDecisionLinks.metaData.displayColumnName, nodeFromDecisionLinks);
                            let metaData ={
                                fileDisplayColumn: fileDisplayColumn,
                                fileGroupByDisplayName:fileGroupByDisplayName,
                                ...nodeFromDecisionLinks.metaData
                            }
                            const response = {
                                fromLink: link._id,
                                _id: nodeFromDecisionLinks._id,
                                label: nodeFromDecisionLinks.label,
                                isRoot: nodeFromDecisionLinks.isRoot,
                                linkKey: link.linkKey,
                                linkLabel: link.label,
                                isLeaf: nodeFromDecisionLinks.isLeaf,
                                type: nodeFromDecisionLinks.type,
                                variableId: getVariable._id,
                                links: linksFromNode,
                                metaData: metaData,
                                data: list
                            };
                            decisionNodeResponse.push(response)
                        }
                    }
                    res.status(status_codes.OK).send(Response.sendResponse(status_codes.OK, custom_message.InfoMessage.nodeDetails, decisionNodeResponse, []));
                }
            }
        } catch (err) {
            serverLog.error(`[${req.originalUrl}] [${req.method}], [${status_codes.INTERNAL_SERVER_ERROR}] {error : ${err}}`);
            console.log(err);
            res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
        }
    }
}
