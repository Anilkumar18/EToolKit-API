import {
    serverLog
} from '../../../utils/logger';
import * as decisionTreeQuery from '../../../db/queries/decisionTree.query';
import * as nodeQuery from '../../../db/queries/node.query';
import * as linkQuery from '../../../db/queries/link.query';
import * as preDefineLogicQueries from '../../../db/queries/preDefinedLogic.query';
import * as expressionVariableQueries from '../../../db/queries/expressionVariable.query';
import * as variableQueries from '../../../db/queries/variable.query';
import * as loopTypeQueries from "../../../db/queries/loopType.query";
import NodeModel from '../../../db/models/node.model';
import DecisionTreeModel from '../../../db/models/decisionTree.model';
import decisionTreeController from './decisionTree.controller';
import LinkModel from '../../../db/models/link.model';
import PreDefinedLogicModel from '../../../db/models/perDefineLogic.model';


export default class processController {

    static async create(req, res) {
        try {
            const {
                processId,
                linkDataArray,
                nodeDataArray
            } = req.body;

            serverLog.info(`[${req.originalUrl}] [${req.method}] [loggedInUser : ${req.headers.id}], {request_payload : ${JSON.stringify(req.body)}}`);

            //check for empty tree
            if (nodeDataArray.length == 0) {
                //throw error that please define tree
                serverLog.error(`[${req.originalUrl}] [${req.method}] [loggedInUser : ${req.headers.id}], {error_message : User is trying to add empty tree}`);
                res.status(status_codes.BAD_REQUEST).send(Response.sendResponse(status_codes.BAD_REQUEST, custom_message.errorMessage.emptyTree, [], []));
            }

            //check available decision tree for requested question
            const decisionTree = await decisionTreeQuery.findOne({
                processId: processId,
                isDeleted: false
            });

            if (decisionTree) {
                //returning error for tree is already available for this question
                serverLog.error(`[${req.originalUrl}] [${req.method}] [loggedInUser : ${req.headers.id}], {error_message : Decision Tree already available for this question : ${JSON.stringify(processId)}}`);
                res.status(status_codes.BAD_REQUEST).send(Response.sendResponse(status_codes.BAD_REQUEST, custom_message.errorMessage.treeExist, [], []));
            } else {

                //find root node for decisionTree.
                const rootNode = await decisionTreeController.findNodeForTree(nodeDataArray, 'Start');

                //find leaf nodes for decisionTree.
                const leafNode = await decisionTreeController.findLeafNodeForTree(linkDataArray, nodeDataArray);

                //removing root and leaf node so that we can save root and leaf independently
                const removeRootAndLeaf = await decisionTreeController.removeRootAndLeaf(nodeDataArray, rootNode, leafNode);

                if (removeRootAndLeaf.length == 0) {
                    serverLog.error(`[${req.originalUrl}] [${req.method}] [loggedInUser : ${req.headers.id}], {error_message : User is trying to add empty tree}`);
                    return res.status(status_codes.BAD_REQUEST).send(Response.sendResponse(status_codes.BAD_REQUEST, custom_message.errorMessage.notCreateTreeWithStartAndEndNode, [], []));
                }

                //save nodes to DB
                const nodeDataToProcess = {
                    tree: {
                        nodeDataArray: nodeDataArray,
                        linkDataArray: linkDataArray
                    },
                    processId: processId,
                    userId: req.headers.id,
                    rootNode,
                    leafNode,
                    removeRootAndLeaf
                };

                // const decisionTreeId = await processController.createDecisionTree(treeData);
                const createNodes = await processController.processNode(nodeDataToProcess);

                if (!createNodes) {
                    serverLog.error(`[${req.originalUrl}] [${req.method}] [loggedInUser : ${req.headers.id}], {error_message : Equation is not valid}`);
                    return res.status(status_codes.BAD_REQUEST).send(Response.sendResponse(status_codes.BAD_REQUEST, custom_message.errorMessage.notValidEquation, [], []));
                }

                //save links to DB
                const linkDataToProcess = {
                    userId: req.headers.id,
                    linkDataArray: linkDataArray,
                    decisionTreeId: createNodes.decisionTreeId,
                    processId
                }
                await processController.processLinks(linkDataToProcess);

                await preDefineLogicQueries.findByIdAndUpdate(processId, {
                    isDecisionTreeAssigned: true
                }, {
                    new: true
                })

                serverLog.info(`[${req.originalUrl}] [${req.method}] [${status_codes.CREATED}] [loggedInUser : ${req.headers.id}], {response_message : Decision tree created successfully!}`)

                res.status(status_codes.CREATED).send(Response.sendResponse(status_codes.CREATED, custom_message.InfoMessage.decisionTreeCreated, [], []));
            }
        } catch (err) {
            serverLog.error(`[${req.originalUrl}] [${req.method}], [${status_codes.INTERNAL_SERVER_ERROR}] {error : ${err}}`);
            res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
        }
    }

    static async processNode(data) {
        try {
            serverLog.info(`[processNode -> processController], { request : ${JSON.stringify(data)} }`);

            let addLeafNode;
            let addNodes;
            const addRootNodeAndCreateTree = await processController.createRootNodeAndTree(data.rootNode, false, true, data.userId, data.processId, data.tree);

            addLeafNode = (data.leafNode.length > 0) ? await processController.createNode(data.leafNode, true, false, data.userId, data.processId, addRootNodeAndCreateTree.decisionTreeId) : [];

            addNodes = (data.leafNode.length > 0) ? await processController.createNode(data.removeRootAndLeaf, false, false, data.userId, data.processId, addRootNodeAndCreateTree.decisionTreeId) : [];

            if (!addNodes && !addNodes.length == 0) {
                return false;
            }

            const response = {
                rootNode: (addRootNodeAndCreateTree.rootNode.length > 0) ? addRootNodeAndCreateTree.rootNode : [],
                decisionTreeId: addRootNodeAndCreateTree.decisionTreeId,
                leafNode: (addLeafNode.length > 0) ? addLeafNode : [],
                otherNode: (addNodes.length > 0) ? addNodes : []
            }
            serverLog.info(`[processNode -> processController], { return : ${JSON.stringify(response)}}`);
            return response;
        } catch (err) {
            serverLog.error(`[{function : "processNode" from "processController" controller}], [{Error : ${err}}]`);
            throw err;
        }
    }

    static async createRootNodeAndTree(rootNode, isLeaf, isRoot, userId, processId, body) {
        try {
            serverLog.info(`[createRootNodeAndTree -> processController], { request : ${JSON.stringify(rootNode)}, ${userId}, ${processId}, ${JSON.stringify(body)} }`);

            const createNode = await processController.createNode(rootNode, isLeaf, isRoot, userId, processId, "");

            const decisionTreeData = new DecisionTreeModel({
                nodeId: createNode[0]._id,
                belongFromProcess: processId,
                tree: JSON.stringify(body),
                createdBy: userId,
                updatedBy: userId
            });

            serverLog.info(`[createRootNodeAndTree -> processController], { message : root node ${createNode[0]._id} created by user ${userId} }`);

            // create decision tree
            const decisionTree = await decisionTreeQuery.saveData(decisionTreeData);

            //add decision tree to root node
            await nodeQuery.findByIdAndUpdate(createNode[0]._id, {
                decisionTreeId: decisionTree._id
            }, {
                new: true
            });

            let response = {
                decisionTreeId: decisionTree._id,
                rootNode: createNode
            }

            serverLog.info(`[createRootNodeAndTree -> processController], { return_message : decision tree ${decisionTree._id} created by user ${userId} }`);
            return response;
        } catch (err) {
            serverLog.error(`[{function : "createRootNodeAndTree" from "processNode" from "processController" controller}], [{Error : ${err}}]`);
            throw err;
        }
    }

    static async createNode(nodeArray, isLeaf, isRoot, userId, processId, decisionTreeId) {
        try {
            serverLog.info(`[createNode -> processController], { request : ${JSON.stringify(nodeArray)}, ${isLeaf}, ${processId}, ${userId} }`);
            let saveDataArray = [];

            for (let node of nodeArray) {

                let nodeModelData;

                // this will validate equation from procedure node
                if (node.category == 'Procedure') {
                    let procedureData = await processController.addEquation(node, decisionTreeId, userId);
                    if (procedureData == "WrongEquation" || procedureData == "InvalidAssignmentVariable" || procedureData == "WrongPattern" || procedureData == "AlreadyUsedVariable") {
                        await decisionTreeQuery.findByIdAndUpdate(decisionTreeId, {
                            isDeleted: true,
                            isActive: false
                        }, {
                            new: true
                        });
                        await nodeQuery.updateAll({
                            decisionTreeId
                        }, {
                            isDeleted: true,
                            isActive: false
                        }, {
                            new: true
                        })
                        return false;
                    }
                }

                // this will validate conditional node that contains equation
                if (node.category == "Conditional" && node.metaData.type == "equation") {

                    let conditionalEquationData = await processController.validateConditionalData(node, decisionTreeId);
                    if (conditionalEquationData == "WrongEquation") {
                        await decisionTreeQuery.findByIdAndUpdate(decisionTreeId, {
                            isDeleted: true,
                            isActive: false
                        }, {
                            new: true
                        });
                        await nodeQuery.updateAll({
                            decisionTreeId
                        }, {
                            isDeleted: true,
                            isActive: false
                        }, {
                            new: true
                        })
                        return false;
                    }
                }

                if (decisionTreeId != "" && decisionTreeId) {
                    nodeModelData = new NodeModel({
                        label: node.text,
                        type: node.name,
                        isLeaf: isLeaf,
                        isRoot: isRoot,
                        belongFromProcess: processId,
                        decisionTreeId: decisionTreeId,
                        nodeKey: node.key,
                        createdBy: userId,
                        updatedBy: userId,
                        metaData: node.metaData ? node.metaData : ""
                    })
                } else {
                    nodeModelData = new NodeModel({
                        label: node.text,
                        type: node.name,
                        isLeaf: isLeaf,
                        isRoot: isRoot,
                        belongFromProcess: processId,
                        nodeKey: node.key,
                        createdBy: userId,
                        updatedBy: userId,
                        metaData: node.metaData ? node.metaData : ""
                    })
                }
                let savedNode = await nodeQuery.saveData(nodeModelData);
                saveDataArray.push(savedNode);
            }
            serverLog.info(`[createNode -> processController], { return : ${JSON.stringify(saveDataArray)} }`);
            return saveDataArray;
        } catch (err) {
            serverLog.error(`[{function : "createNode" from "processNode" from "processController" controller}], [{Error : ${err}}]`);
            throw err;
        }
    }

    static async processLinks(data) {
        try {
            serverLog.info(`[processLinks -> processController], { request : ${JSON.stringify(data.linkDataArray)}, ${data.userId}, ${data.processId}, ${data.decisionTreeId} }`);
            await processController.createLink(data.linkDataArray, data.userId, data.processId, data.decisionTreeId);
            serverLog.info(`[processLinks -> processController], { return_message : return true after created links for all nodes }`);
            return true;
        } catch (err) {
            serverLog.error(`[{function : "processLinks" from "create" method of "processController" controller}], [{Error : ${err}}]`);
            throw err;
        }
    }

    static async createLink(linkDataArray, userId, processId, decisionTreeId) {
        try {


            serverLog.info(`[createLink -> processController], { request : ${JSON.stringify(linkDataArray)}, ${userId}, ${processId} }`);

            for (const link of linkDataArray) {

                let findNextNode = await nodeQuery.findOne({
                    nodeKey: link.to,
                    isDeleted: false,
                    belongFromProcess: processId,
                    decisionTreeId: decisionTreeId
                }, {
                    _id: 1
                });

                const linkModelData = new LinkModel({
                    label: link.text,
                    nextNode: findNextNode._id,
                    decisionTreeId: decisionTreeId,
                    createdBy: userId,
                    updatedBy: userId,
                    linkKey: link.key
                });
                const saveLinkData = await linkQuery.saveData(linkModelData);
                await processController.addLinksToNode(saveLinkData, link.from, processId, decisionTreeId);
            }
            serverLog.info(`[createLink -> processController], { return_message : created all links }`);
            return;
        } catch (err) {
            serverLog.error(`[{function : "createLink" from "processLink" from "create" method of "processController" controller}], [{Error : ${err}}]`);
            throw err;
        }
    }

    static async addLinksToNode(saveLinkData, from, processId, decisionTreeId) {
        try {
            serverLog.info(`[addLinksToNode -> processController], { request : ${JSON.stringify(saveLinkData)}, ${from}, ${processId} }`);
            let findNode = await nodeQuery.findOneWithAllData({
                nodeKey: from,
                isActive: true,
                belongFromProcess: processId,
                decisionTreeId
            });
            if (findNode && findNode.links) {

                await nodeQuery.findByIdAndUpdate(findNode._id, {
                    $push: {
                        links: saveLinkData._id
                    }
                }, {
                    new: true
                });

            } else {

                await nodeQuery.findByIdAndUpdate(findNode._id, {
                    links: [saveLinkData._id]
                }, {
                    new: true
                });

            }
            serverLog.info(`[addLinksToNode -> processController], { return_message : added saved condition to its node for question "${processId}" }`);
            return;
        } catch (err) {
            serverLog.error(`[{function : "addLinksToNode" from "createLink" from "processLink" from "create" method of "processController" controller}], [{Error : ${err}}]`);
            throw err;
        }
    }

    static async addEquation(node, decisionTreeId, userId) {
        try {
            serverLog.info(`[addEquation -> processController], { request : ${JSON.stringify(node)}, ${userId}, ${decisionTreeId} }`);

            let equation = node.metaData.equation;
            const divideStringByEqualTo = equation.split("="); // divide equation for assignment variable
            let pattern = /^[^=]+[=]?[^=]+$/; // only one = is allowed per equation

            let checkAvailableVariables = await variableQueries.findOne({
                name: divideStringByEqualTo[0],
                isActive: true,
                isDeleted: false
            });

            // check equation is valid or not
            if (/[-+=*/%()]+/g.test(divideStringByEqualTo[0]) || !isNaN(divideStringByEqualTo[0]) || !/^[a-zA-Z0-9()*/+:.=-]+$/g.test(equation)) {
                return "WrongEquation";
            }

            // check if assignment variable is organization variable or not
            if (checkAvailableVariables) {
                return "InvalidAssignmentVariable"
            }

            // check equation pattern is valid or not
            if (!pattern.test(equation)) {
                return "WrongPattern"
            }

            //get all variable from equation
            const variableArray = equation.match(/(((\w+:)+\w+)|(\w+))/g);

            //process all variable. and if variable is not organization/system variable then create expression variable
            let saveVariableArray = [];
            for (const variable of variableArray) {

                if (isNaN(variable)) {
                    let findVariable = await expressionVariableQueries.findOne({
                        variableName: variable,
                        isActive: true,
                        decisionTreeId
                    });

                    //check for variable is available or not
                    if (!findVariable) {

                        let checkAvailableVariable = await variableQueries.findOne({
                            name: variable,
                            isActive: true,
                            isDeleted: false
                        });

                        if (!checkAvailableVariable && variable == divideStringByEqualTo[0]) {
                            let variableDetails = {
                                variableName: variable,
                                variableScope: 'userLevel',
                                expression: divideStringByEqualTo[1],
                                decisionTreeId,
                                createdBy: userId,
                                updatedBy: userId,
                                isProcessVariable: true
                            };

                            if (node.metaData.variableLabel) {
                                variableDetails['variableLabel'] = node.metaData.variableLabel;
                            }
                            saveVariableArray.push(variableDetails);
                        }

                    } else {
                        if (findVariable.variableName == divideStringByEqualTo[0]) {
                            return "AlreadyUsedVariable";
                        }
                    }
                }

            }
            await expressionVariableQueries.insertMany(saveVariableArray);
            serverLog.info(`[addEquation -> processController], { return_message : return true after create variables for equation }`);
            return true;
        } catch (err) {
            serverLog.error(`[{function : "addEquation" from "createNode" from "processNode" from "decisionTreeController" controller}], [{Error : ${err}}]`);
            throw err;
        }
    }


    static async validateConditionalData(node, decisionTreeId) {
        try {
            serverLog.info(`[validateConditionalData -> processController], { request : ${JSON.stringify(node)} }`);

            let equation = node.metaData.equation;
            const regexConditional = /[<>=!]=?/;
            const splitString = (input) => input.split(regexConditional);
            const variableArray = splitString(equation);
            // const variableArray = equation.match(/(((\w+:)+\w+)|(\w+))/g);
            const pattern = /^[A-Za-z: ]*(<=|>=|<|>|!=|==)?[A-Za-z0-9.: ]*$/;;

            // equation is first parameter can not allow to be number only
            if (!/(?!^\d+$)^.+$/.test(variableArray[0])) {
                return "WrongEquation";
            }

            // variable length can not be more than 2
            if (variableArray.length > 2) {
                return "WrongEquation";
            }

            // equation must be the matching with valid pattern
            if (!pattern.test(equation)) {
                return "WrongEquation";
            }

            // process all variables from array. and also replacement done by its value
            // for (const variable of variableArray) {
            //     if (isNaN(variable)) {
            //         let checkForGlobalVariable = await variableQueries.findOne({
            //             name: variable,
            //             isActive: true,
            //             isDeleted: false
            //         });
            //         if (!checkForGlobalVariable) {
            //             let checkForUserVariable = await expressionVariableQueries.findOne({
            //                 variableName: variable,
            //                 isActive: true,
            //                 isDeleted: false,
            //                 decisionTreeId
            //             })
            //             if (!checkForUserVariable) {
            //                 return "WrongEquation";
            //             }
            //         }
            //     }
            // }

            serverLog.info(`[validateConditionalData -> processController], { return_message : return after validating conditional node equation }`);
            return;
        } catch (err) {
            serverLog.error(`[{function : "validateConditionalData" from "processNode" from "decisionTreeController" controller}], [{Error : ${err}}]`);
            throw err;
        }
    }


    static async update(req, res) {
        try {
            const {
                processId,
                linkDataArray,
                nodeDataArray
            } = req.body;

            serverLog.info(`[${req.originalUrl}] [${req.method}] [loggedInUser : ${req.headers.id}], {request_payload : ${JSON.stringify(req.body)}}`);

            //check for empty tree
            if (nodeDataArray.length == 0) {
                //throw error that please define tree
                serverLog.error(`[${req.originalUrl}] [${req.method}] [loggedInUser : ${req.headers.id}], {error_message : User is trying to add empty tree}`);
                res.status(status_codes.BAD_REQUEST).send(Response.sendResponse(status_codes.BAD_REQUEST, custom_message.errorMessage.emptyTree, [], []));
            }

            const decisionTree = await decisionTreeQuery.findOne({
                belongFromProcess: processId,
                isActive: true,
                isDeleted: false
            });

            // if decision tree is available than remove all previous data and then create new one
            if (decisionTree) {
                await nodeQuery.findAllAndUpdate({
                    decisionTreeId: decisionTree._id,
                    isActive: true,
                    isDeleted: false
                }, {
                    isActive: false,
                    isDeleted: true
                }, {
                    new: true
                });
                await linkQuery.findAllAndUpdate({
                    decisionTreeId: decisionTree._id,
                    isActive: true,
                    isDeleted: false
                }, {
                    isActive: false,
                    isDeleted: true
                }, {
                    new: true
                });
                await expressionVariableQueries.updateAll({
                    decisionTreeId: decisionTree._id,
                    isActive: true,
                    isDeleted: false
                }, {
                    isActive: false,
                    isDeleted: true
                }, {
                    new: true
                });

                //find root node for decisionTree.
                const rootNode = await decisionTreeController.findNodeForTree(nodeDataArray, 'Start');

                //find leaf nodes for decisionTree.
                const leafNode = await decisionTreeController.findLeafNodeForTree(linkDataArray, nodeDataArray);

                //removing root and leaf node so that we can save root and leaf independently
                const removeRootAndLeaf = await decisionTreeController.removeRootAndLeaf(nodeDataArray, rootNode, leafNode);

                const nodeDataToProcess = {
                    tree: {
                        nodeDataArray: nodeDataArray,
                        linkDataArray: linkDataArray
                    },
                    processId: processId,
                    userId: req.headers.id,
                    rootNode,
                    leafNode,
                    removeRootAndLeaf,
                    decisionTreeId: decisionTree._id
                };

                const createNodes = await processController.processUpdateNode(nodeDataToProcess);

                //save links to DB
                const linkDataToProcess = {
                    userId: req.headers.id,
                    linkDataArray: linkDataArray,
                    decisionTreeId: createNodes.decisionTreeId,
                    processId
                }
                await processController.processLinks(linkDataToProcess)

                serverLog.info(`[${req.originalUrl}] [${req.method}] [${status_codes.OK}] [loggedInUser : ${req.headers.id}], {response_message : Decision tree updated successfully!}`)

                res.status(status_codes.OK).send(Response.sendResponse(status_codes.OK, custom_message.InfoMessage.updateDecisionTree, [], []));
            } else {
                serverLog.error(`[${req.originalUrl}] [${req.method}] [loggedInUser : ${req.headers.id}], {error_message : Decision Tree not available for this process : ${JSON.stringify(processId)}}`);
                res.status(status_codes.BAD_REQUEST).send(Response.sendResponse(status_codes.BAD_REQUEST, custom_message.errorMessage.treeNotExist, [], []));
            }
        } catch (err) {
            serverLog.error(`[${req.originalUrl}] [${req.method}] [${status_codes.INTERNAL_SERVER_ERROR}], {error : ${err}}`);
            res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
        }
    }

    static async processUpdateNode(data) {
        try {
            serverLog.info(`[processUpdateNode -> processController] { request : ${JSON.stringify(data)} }`);

            let addLeafNode;
            let addNodes;
            const addRootNodeAndCreateTree = await processController.updateRootNodeAndTree(data.rootNode, false, true, data.userId, data.processId, data.tree, data.decisionTreeId);

            addLeafNode = (data.leafNode.length > 0) ? await processController.createNode(data.leafNode, true, false, data.userId, data.processId, data.decisionTreeId) : [];

            addNodes = (data.leafNode.length > 0) ? await processController.createNode(data.removeRootAndLeaf, false, false, data.userId, data.processId, data.decisionTreeId) : [];

            const response = {
                rootNode: (addRootNodeAndCreateTree.rootNode.length > 0) ? addRootNodeAndCreateTree.rootNode : [],
                decisionTreeId: data.decisionTreeId,
                leafNode: (addLeafNode.length > 0) ? addLeafNode : [],
                otherNode: (addNodes.length > 0) ? addNodes : []
            }
            serverLog.info(`[processUpdateNode -> processController] { return : ${JSON.stringify(response)}}`);
            return response;
        } catch (err) {
            serverLog.error(`[{function : "processUpdateNode" from "updateDecisionTree" from "processController" controller}], [{Error : ${err}}]`);
            throw err;
        }
    }

    static async updateRootNodeAndTree(rootNode, isLeaf, isRoot, userId, processId, body, decisionTreeId) {
        try {
            serverLog.info(`[updateRootNodeAndTree -> processController], { request : ${JSON.stringify(rootNode)}, ${userId}, ${processId}, ${JSON.stringify(body)} }`);

            const createNode = await processController.createNode(rootNode, isLeaf, isRoot, userId, processId, "");

            serverLog.info(`[updateRootNodeAndTree -> processController], { message : root node ${createNode[0]._id} created by user ${userId} }`);

            // create decision tree
            const decisionTree = await decisionTreeQuery.findByIdAndUpdate(decisionTreeId, {
                nodeId: createNode[0]._id,
                updatedBy: userId,
                tree: JSON.stringify(body)
            }, {
                new: true
            });

            //add decision tree to root node
            await nodeQuery.findByIdAndUpdate(createNode[0]._id, {
                decisionTreeId: decisionTree._id
            }, {
                new: true
            });

            let response = {
                decisionTreeId: decisionTree._id,
                rootNode: createNode
            }

            serverLog.info(`[updateRootNodeAndTree -> processController], { return_message : decision tree ${decisionTree._id} updated by user ${userId} }`);
            return response;
        } catch (err) {
            serverLog.error(`[{function : "updateRootNodeAndTree" from "processUpdateNode" from "processController" controller}], [{Error : ${err}}]`);
            throw err;
        }
    }


    static async addPreDefinedLogic(req, res) {
        try {
            const {
                description,
                label
            } = req.body;

            serverLog.info(`[${req.originalUrl}] [${req.method}] [loggedInUser : ${req.headers.id}], {request_payload : ${JSON.stringify(req.body)}}`);

            let logic = await processController.toCamelCase(label);

            const preDefinedLogicModelData = new PreDefinedLogicModel({
                logic,
                description: description ? description : "",
                label,
                displayLabel: label
            });

            await preDefineLogicQueries.saveData(preDefinedLogicModelData);

            serverLog.info(`[${req.originalUrl}] [${req.method}] [${status_codes.CREATED}] [loggedInUser : ${req.headers.id}], {response_message : ${custom_message.InfoMessage.preDefinedLogicCreated}}`)
            res.status(status_codes.CREATED).send(Response.sendResponse(status_codes.CREATED, custom_message.InfoMessage.preDefinedLogicCreated, [], []));
        } catch (err) {
            serverLog.error(`[${req.originalUrl}] [${req.method}] [${status_codes.INTERNAL_SERVER_ERROR}], {error : ${err}}`);
            res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
        }
    }

    static async toCamelCase(sentenceCase) {
        var out = "";
        sentenceCase.split(" ").forEach(function (el, idx) {
            var add = el.toLowerCase();
            out += (idx === 0 ? add : add[0].toUpperCase() + add.slice(1));
        });
        return out;
    }

    static async getPreDefinedLogic(req, res) {
        try {
            serverLog.info(`[${req.originalUrl}] [${req.method}] [loggedInUser : ${req.headers.id}], {request_message : "In get predefined logic api"}`);
            const preDefinedLogicData = await preDefineLogicQueries.findAll({
                isDeleted: false
            });

            serverLog.info(`[${req.originalUrl}] [${req.method}] [${status_codes.CREATED}] [loggedInUser : ${req.headers.id}], {response_message : ${custom_message.InfoMessage.preDefinedLogicCreated}}`)
            res.status(status_codes.OK).send(Response.sendResponse(status_codes.OK, custom_message.InfoMessage.preDefinedLogicList, preDefinedLogicData, []));
        } catch (err) {
            serverLog.error(`[${req.originalUrl}] [${req.method}] [${status_codes.INTERNAL_SERVER_ERROR}], {error : ${err}}`);
            res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
        }
    }

    /**
     * *This api will return decision tree that was created for pre-defined logic
     *
     * @static
     * @param {*} req
     * @param {*} res
     * @memberof decisionTreeController
     */
    static async getTreeForPredefinedLogic(req, res) {
        try {
            const {
                preDefineLogicId
            } = req.params;

            serverLog.info(`[${req.originalUrl}] [${req.method}] [loggedInUser : ${req.headers.id}], {request_payload : ${JSON.stringify(preDefineLogicId)}}`);
            const preDefineLogic = await preDefineLogicQueries.findById(preDefineLogicId);
            const decisionTree = await decisionTreeQuery.findOne({
                belongFromProcess: preDefineLogicId,
                isActive: true,
                isDeleted: false
            });

            if (decisionTree) {
                const response = {
                    logic: preDefineLogic.logic,
                    label: preDefineLogic.displayLabel ? preDefineLogic.displayLabel : preDefineLogic.label,
                    tree: JSON.parse(decisionTree.tree)
                }
                serverLog.info(`[${req.originalUrl}] [${req.method}] [${status_codes.OK}] [loggedInUser : ${req.headers.id}], {response : ${decisionTree.tree}}`)

                res.status(status_codes.OK).send(Response.sendResponse(status_codes.OK, custom_message.InfoMessage.getDecisionTree, response, []));

            } else {
                const response = {
                    logic: preDefineLogic.logic,
                    label: preDefineLogic.displayLabel ? preDefineLogic.displayLabel : preDefineLogic.label,
                }

                serverLog.info(`[${req.originalUrl}] [${req.method}] [${status_codes.OK}] [loggedInUser : ${req.headers.id}], {response : ${JSON.stringify(response)}}`)

                res.status(status_codes.OK).send(Response.sendResponse(status_codes.OK, custom_message.errorMessage.treeNotFoundForQuestion, response, []));

            }
        } catch (err) {
            serverLog.error(`[${req.originalUrl}] [${req.method}] [${status_codes.INTERNAL_SERVER_ERROR}], {error : ${err}}`);
            res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
        }
    }


    static async variableList(req, res) {
        try {
            const {
                processId
            } = req.params;

            serverLog.info(`[${req.originalUrl}] [${req.method}] [loggedInUser : ${req.headers.id}], {request_payload : ${JSON.stringify(req.params)}}`);

            const findDecisionTree = await decisionTreeQuery.findOne({
                belongFromProcess: processId,
                isActive: true
            });

            if (!findDecisionTree) {
                serverLog.error(`[${req.originalUrl}] [${req.method}], [${status_codes.NOTFOUND}] {error_message : ${custom_message.errorMessage.treeNotFoundForProcess}}`);
                return res.status(status_codes.NOTFOUND).send(Response.sendResponse(status_codes.NOTFOUND, custom_message.errorMessage.treeNotFoundForProcess, [], []));

            }

            let nodes = await nodeQuery.find({
                decisionTreeId: findDecisionTree._id,
                type: {
                    $in: ["ManualInput", "StaticLoop"]
                },
                isActive: true
            });

            let variableArray = [];

            if (nodes.length > 0) {
                for (let nodeToProcess of nodes) {

                    // logic for static loop node
                    if (nodeToProcess.type == "StaticLoop" && nodeToProcess.metaData.associateLoopId && nodeToProcess.metaData.associateLoopId != "") {
                        let loop = await loopTypeQueries.findById(nodeToProcess.metaData.associateLoopId);

                        if (loop) {
                            let variables = [];
                            for (let variable of loop.variables) {
                                if (variable.type == "predefinedLogicLoop") {
                                    variables.push(variable.variableId);
                                }
                            }
                            let variableList = await variableQueries.findAll({
                                _id: {
                                    $in: variables
                                }
                            });

                            for (let variableFromList of variableList) {
                                let variable = {
                                    name: variableFromList.name,
                                    variableLabel: (variableFromList.label) ? variableFromList.label : variableFromList.name
                                };
                                variableArray.push(variable)
                            }
                        }
                    }

                    // logic for manualInput node
                    if (nodeToProcess.type == "ManualInput") {

                        for (let input of nodeToProcess.metaData.inputs) {
                            let variable = {
                                name: input.localVariableName,
                                variableLabel: (input.variableLabel) ? input.variableLabel : input.localVariableName
                            }
                            variableArray.push(variable);
                        }
                    }
                }
            }

            serverLog.info(`[${req.originalUrl}] [${req.method}] [${status_codes.OK}] [loggedInUser : ${req.headers.id}], {response : ${JSON.stringify(variableArray)}}`)
            res.status(status_codes.OK).send(Response.sendResponse(status_codes.OK, custom_message.InfoMessage.getVariable, variableArray, []));
        } catch (err) {
            serverLog.error(`[${req.originalUrl}] [${req.method}] [${status_codes.INTERNAL_SERVER_ERROR}], {error : ${err}}`);
            res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
        }
    }

    static async staticLoopVariableList(req, res) {
        try {
            const {
                loopId
            } = req.params;
            serverLog.info(`[${req.originalUrl}] [${req.method}] [loggedInUser : ${req.headers.id}], {request_payload : ${JSON.stringify(req.params)}}`);

            let loop = await loopTypeQueries.findById(loopId);
            console.log("loop", loop)
            let variableArray = [];
            if (loop) {

                let variables = [];
                for (let variable of loop.variables) {
                    if (variable.type == "loop") {
                        variables.push(variable.variableId);
                    }
                }
                console.log(variables)
                let variableList = await variableQueries.findAll({
                    _id: {
                        $in: variables
                    }
                });
                for (let variableFromList of variableList) {
                    let variable = {
                        name: variableFromList.name,
                        variableLabel: (variableFromList.label) ? variableFromList.label : variableFromList.name
                    };
                    variableArray.push(variable)
                }
            }

            serverLog.info(`[${req.originalUrl}] [${req.method}] [${status_codes.OK}] [loggedInUser : ${req.headers.id}], {response : ${JSON.stringify(variableArray)}}`)
            res.status(status_codes.OK).send(Response.sendResponse(status_codes.OK, custom_message.InfoMessage.getVariable, variableArray, []));

        } catch (err) {
            serverLog.error(`[${req.originalUrl}] [${req.method}] [${status_codes.INTERNAL_SERVER_ERROR}], {error : ${err}}`);
            res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
        }
    }

    // return list of process having assigned decision tree
    static async getProcessListHavingDecisionTree(req, res) {
        try {

            serverLog.info(`[${req.originalUrl}] [${req.method}] [loggedInUser : ${req.headers.id}], {request_message : "In get process list having decision tree api"}`);
            const preDefinedLogicData = await preDefineLogicQueries.findAll({
                isDeleted: false,
                isDecisionTreeAssigned: true
            });

            serverLog.info(`[${req.originalUrl}] [${req.method}] [${status_codes.OK}] [loggedInUser : ${req.headers.id}], {response : ${JSON.stringify(preDefinedLogicData)}}`)
            res.status(status_codes.OK).send(Response.sendResponse(status_codes.OK, custom_message.InfoMessage.preDefinedLogicList, preDefinedLogicData, []));
        } catch (err) {
            serverLog.error(`[${req.originalUrl}] [${req.method}], [${status_codes.INTERNAL_SERVER_ERROR}] {error : ${err}}`);
            res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
        }
    }

    static async updateProcess(req, res) {
        try {
            const {
                processId,
                label,
                description
            } = req.body;

            serverLog.info(`[${req.originalUrl}] [${req.method}] [loggedInUser : ${req.headers.id}], {request_message : "In update predefined logic api"}`);

            await preDefineLogicQueries.findByIdAndUpdate(processId, {
                displayLabel: label,
                description
            }, {
                new: true
            });

            serverLog.info(`[${req.originalUrl}] [${req.method}] [${status_codes.OK}] [loggedInUser : ${req.headers.id}], {response_message : ${custom_message.InfoMessage.processUpdate}}`)
            res.status(status_codes.OK).send(Response.sendResponse(status_codes.OK, custom_message.InfoMessage.processUpdate, [], []));
        } catch (err) {
            serverLog.error(`[${req.originalUrl}] [${req.method}] [${status_codes.INTERNAL_SERVER_ERROR}], {error : ${err}}`);
            res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
        }
    }

    static async deleteProcess(req, res) {
        try {
            const {
                processId
            } = req.params;

            serverLog.info(`[${req.originalUrl}] [${req.method}] [loggedInUser : ${req.headers.id}], {request : ${req.params}}`);

            const checkForProcessNode = await nodeQuery.findOne({
                type: "PredefinedLogic",
                belongFromProcess: processId,
                isActive: true
            });

            if (checkForProcessNode) {
                serverLog.error(`[${req.originalUrl}] [${req.method}] [${status_codes.BAD_REQUEST}], {error_message : "This process is assigned to decisionTree"}`);
                return res.status(status_codes.BAD_REQUEST).send(Response.sendResponse(status_codes.BAD_REQUEST, custom_message.errorMessage.processAssignedToDecisionTree, [], []));
            }

            let decisionTree = await decisionTreeQuery.findOneAndUpdate({
                belongFromProcess: processId,
                isActive: true,
                isDeleted: false
            }, {
                isActive: false,
                isDeleted: true
            }, {
                new: true
            });

            if (decisionTree) {
                await nodeQuery.updateAll({
                    decisionTreeId: decisionTree._id
                }, {
                    isActive: false,
                    isDeleted: true
                }, {
                    new: true
                });

                await linkQuery.findAllAndUpdate({
                    decisionTreeId: decisionTree._id,
                    isActive: true,
                    isDeleted: false
                }, {
                    isDeleted: true,
                    isActive: false
                }, {
                    new: true
                });

                await expressionVariableQueries.updateAll({
                    decisionTreeId: decisionTree._id,
                    isActive: true,
                    isDeleted: false
                }, {
                    isActive: false,
                    isDeleted: true
                }, {
                    new: true
                });
            }

            await preDefineLogicQueries.findByIdAndUpdate(processId, {
                isDeleted: true,
                isActive: false
            }, {
                new: true
            });

            serverLog.info(`[${req.originalUrl}] [${req.method}] [${status_codes.OK}] [loggedInUser : ${req.headers.id}], {response_message : ${custom_message.InfoMessage.processDelete}}`)
            res.status(status_codes.OK).send(Response.sendResponse(status_codes.OK, custom_message.InfoMessage.processDelete, [], []));
        } catch (err) {
            serverLog.error(`[${req.originalUrl}] [${req.method}] [${status_codes.INTERNAL_SERVER_ERROR}], {error : ${err}}`);
            res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
        }
    }
}