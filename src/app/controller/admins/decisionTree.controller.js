import {
    serverLog
} from '../../../utils/logger';
import * as decisionTreeQuery from '../../../db/queries/decisionTree.query';
import * as nodeQuery from '../../../db/queries/node.query';
import * as linkQuery from '../../../db/queries/link.query';
import * as questionQuery from '../../../db/queries/question.query';
import * as preDefineLogicQueries from '../../../db/queries/preDefinedLogic.query';
import * as expressionVariableQueries from '../../../db/queries/expressionVariable.query';
import * as variableQueries from '../../../db/queries/variable.query';
import NodeModel from '../../../db/models/node.model';
import DecisionTreeModel from '../../../db/models/decisionTree.model';
import LinkModel from '../../../db/models/link.model';

export default class decisionTreeController {

    /**
     * *This api will create decision tree for particular question
     *
     * @static
     * @param {*} req
     * @param {*} res
     * @returns
     * @memberof decisionTreeController
     */
    static async create(req, res, isEditMode = false) {
        try {
            const {
                questionId,
                linkDataArray,
                nodeDataArray
            } = req.body;

            serverLog.info(`[${req.originalUrl}] [${req.method}] [loggedInUser : ${req.headers.id}], {request_payload : ${JSON.stringify(req.body)}}`);

            //check for empty tree
            if (nodeDataArray.length == 0) {
                //throw error that please define tree
                serverLog.error(`[${req.originalUrl}] [${req.method}] [loggedInUser : ${req.headers.id}], {Error : User is trying to add empty tree}`);
                res.status(status_codes.BAD_REQUEST).send(Response.sendResponse(status_codes.BAD_REQUEST, custom_message.errorMessage.emptyTree, [], []));
            }

            //check available decision tree for requested question
            const decisionTree = await decisionTreeQuery.findOne({
                questionId: questionId,
                isDeleted: false
            });
            if (decisionTree) {
                //returning error for tree is already available for this question
                serverLog.error(`[${req.originalUrl}] [${req.method}] [loggedInUser : ${req.headers.id}], {Error : Decision Tree already available for this question ${questionId}`);
                res.status(status_codes.BAD_REQUEST).send(Response.sendResponse(status_codes.BAD_REQUEST, custom_message.errorMessage.treeExist, [], []));
            } else {
                //find root node for decisionTree.
                const rootNode = await decisionTreeController.findNodeForTree(nodeDataArray, 'Start');

                //find leaf nodes for decisionTree.
                const leafNode = await decisionTreeController.findLeafNodeForTree(linkDataArray, nodeDataArray);

                //removing root and leaf node so that we can save root and leaf independently
                const removeRootAndLeaf = await decisionTreeController.removeRootAndLeaf(nodeDataArray, rootNode, leafNode);

                if (removeRootAndLeaf.length == 0) {
                    serverLog.error(`[${req.originalUrl}] [${req.method}] [loggedInUser : ${req.headers.id}], {Error : User is trying to add empty tree}`);
                    return res.status(status_codes.BAD_REQUEST).send(Response.sendResponse(status_codes.BAD_REQUEST, custom_message.errorMessage.notCreateTreeWithStartAndEndNode, [], []));
                }

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
                };
                const createNodes = await decisionTreeController.processNode(nodeDataToProcess);
                if (createNodes["hasError"]) {
                    nodeDataToProcess.tree['questionId'] = questionId;
                    serverLog.error(`[${req.originalUrl}] [${req.method}] [loggedInUser : ${req.headers.id}], {Error : Equation is not valid}`);
                    const details = {
                        hasError: true,
                        tree: nodeDataToProcess.tree,
                        errors: createNodes
                    }
                    return res.status(status_codes.BAD_REQUEST).send(Response.sendResponse(status_codes.BAD_REQUEST, custom_message.errorMessage.notValidEquation, details, []));
                }

                //save links to DB
                const linkDataToProcess = {
                    userId: req.headers.id,
                    linkDataArray: linkDataArray,
                    decisionTreeId: createNodes.decisionTreeId,
                    questionId
                }
                await decisionTreeController.processLinks(linkDataToProcess)

                if (isEditMode) return;
                serverLog.info(`[${req.originalUrl}] [${req.method}] [${status_codes.CREATED}] [loggedInUser : ${req.headers.id}], {response : Decision tree created successfully!}`)
                res.status(status_codes.CREATED).send(Response.sendResponse(status_codes.CREATED, custom_message.InfoMessage.decisionTreeCreated, [], []));
            }
        } catch (err) {
            serverLog.error(`[${req.originalUrl}] [${req.method}], [${status_codes.INTERNAL_SERVER_ERROR}] {error : ${err}}`);
            res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
        }
    }


    /**
     * *This method will find nodes from tree data
     *
     * @static
     * @param {*} nodeDataArray
     * @param {*} name
     * @returns
     * @memberof decisionTreeController
     */
    static async findNodeForTree(nodeDataArray, name) {
        try {
            serverLog.info(`[findNodeForTree], { request : ${JSON.stringify(nodeDataArray)}}`);

            const isSameData = (nodeDataObj) => nodeDataObj.name === name;
            const findInNodeDataArray = (nodeDataArr, compareFunction) =>
                nodeDataArr.filter(nodeData =>
                    compareFunction(nodeData)
                );
            const filterData = findInNodeDataArray(nodeDataArray, isSameData);
            const nodes = [...filterData];
            serverLog.info(`[findNodeForTree], { return : ${JSON.stringify(nodes)}}`);
            return nodes;
        } catch (err) {
            serverLog.error(`[{function : "findNodeForTree" from "decisionTreeController" controller}], [{Error : ${err}}]`);
            throw err;
        }
    }


    /**
     * *This method will find leaf node for the tree
     *
     * @static
     * @param {*} linkDataArray
     * @param {*} nodeDataArray
     * @returns
     * @memberof decisionTreeController
     */
    static async findLeafNodeForTree(linkDataArray, nodeDataArray) {
        try {
            serverLog.info(`[findLeafNodeForTree], { request : ${JSON.stringify(linkDataArray)}, ${JSON.stringify(nodeDataArray)}}`);

            const isSameData = (nodeDataObj, linkDataObj) => nodeDataObj.key === linkDataObj.from;

            const findInNodeDataArray = (nodeDataArr, linkDataArr, compareFunction) =>
                nodeDataArr.filter(nodeData =>
                    !linkDataArr.some(linkData =>
                        compareFunction(nodeData, linkData)
                    )
                );
            const onlyInNodeData = findInNodeDataArray(nodeDataArray, linkDataArray, isSameData);
            const leafNode = [...onlyInNodeData];
            serverLog.info(`[findLeafNodeForTree], { return : ${JSON.stringify(leafNode)}}`);
            return leafNode;
        } catch (err) {
            serverLog.error(`[{function : "findLeafNodeForTree" from "decisionTreeController" controller}], [{Error : ${err}}]`);
            throw err;
        }
    }


    /**
     * *This method will remove root node and leaf node from node array
     *
     * @static
     * @param {*} nodeDataArray
     * @param {*} findRootNode
     * @param {*} findLeafNodes
     * @returns
     * @memberof decisionTreeController
     */
    static async removeRootAndLeaf(nodeDataArray, findRootNode, findLeafNodes) {
        try {
            serverLog.info(`[removeRootAndLeaf], { request : ${JSON.stringify(nodeDataArray)}, ${JSON.stringify(findRootNode)}, ${JSON.stringify(findLeafNodes)} }`);
            const afterRemovingRootNode = await decisionTreeController.removeNodeFromNodeArray(nodeDataArray, findRootNode);
            const afterRemovingLeafNode = await decisionTreeController.removeNodeFromNodeArray(afterRemovingRootNode, findLeafNodes);
            serverLog.info(`[removeRootAndLeaf], { return : after removing root and leaf node data is ${JSON.stringify(afterRemovingLeafNode)}}`);
            return afterRemovingLeafNode;
        } catch (err) {
            serverLog.error(`[{function : "removeRootAndLeaf" from "decisionTreeController" controller}], [{Error : ${err}}]`);
            throw err;
        }
    }


    /**
     * *This method is sub method of "removeRootAndLeaf" will remove node from array by comparing both
     *
     * @static
     * @param {*} arrayA
     * @param {*} arrayB
     * @returns
     * @memberof decisionTreeController
     */
    static async removeNodeFromNodeArray(arrayA, arrayB) {
        try {
            serverLog.info(`[removeNodeFromNodeArray], { request : ${JSON.stringify(arrayA)}, ${JSON.stringify(arrayB)} }`);
            const newArray = await arrayA.filter(function (objFromA) {
                return !arrayB.find(function (objFromB) {
                    return objFromA.key === objFromB.key
                })
            })
            serverLog.info(`[removeNodeFromNodeArray], { return : ${JSON.stringify(newArray)}}`);
            return newArray;
        } catch (err) {
            serverLog.error(`[{function : "removeNodeFromNodeArray" from "removeRootAndLeaf" from "decisionTreeController" controller}], [{Error : ${err}}]`);
            throw err;
        }
    }


    /**
     * *This method will process nodes and store all nodes to DB
     *
     * @static
     * @param {*} data
     * @returns
     * @memberof decisionTreeController
     */
    static async processNode(data) {
        try {
            serverLog.info(`[processNode], { request : ${JSON.stringify(data)} }`);
            let addLeafNode;
            let addNodes;

            const addRootNodeAndCreateTree = await decisionTreeController.createRootNodeAndTree(data.rootNode, false, true, data.userId, data.questionId, data.tree);

            addLeafNode = (data.leafNode.length > 0) ? await decisionTreeController.createNode(data.leafNode, true, false, data.userId, data.questionId, addRootNodeAndCreateTree.decisionTreeId) : [];

            addNodes = (data.leafNode.length > 0) ? await decisionTreeController.createNode(data.removeRootAndLeaf, false, false, data.userId, data.questionId, addRootNodeAndCreateTree.decisionTreeId) : [];
            if (addNodes["hasError"]) {
                await Promise.all([
                    decisionTreeQuery.findByIdAndUpdate(addRootNodeAndCreateTree.decisionTreeId, {
                        isDeleted: true,
                        isActive: false
                    }, {
                        new: true
                    }),
                    nodeQuery.updateAll({
                        decisionTreeId: addRootNodeAndCreateTree.decisionTreeId
                    }, {
                        isDeleted: true,
                        isActive: false
                    }, {
                        new: true
                    })
                ]);
                return addNodes;
            }

            const response = {
                // rootNode: (addRootNodeAndCreateTree.rootNode.length > 0) ? addRootNodeAndCreateTree.rootNode : [],
                decisionTreeId: addRootNodeAndCreateTree.decisionTreeId,
                // leafNode: (addLeafNode.length > 0) ? addLeafNode : [],
                // otherNode: (addNodes.length > 0) ? addNodes : []
            }
            serverLog.info(`[processNode], { return : ${response}`);
            return response;
        } catch (err) {
            serverLog.error(`[{function : "processNode" from "decisionTreeController" controller}], [{Error : ${err}}]`);
            throw err;
        }
    }


    /**
     * *This method is child method of "processNode" this will generate decision tree and also store root node for that tree
     *
     * @static
     * @param {*} rootNode
     * @param {*} isLeaf
     * @param {*} isRoot
     * @param {*} userId
     * @param {*} questionId
     * @param {*} body
     * @returns
     * @memberof decisionTreeController
     */
    static async createRootNodeAndTree(rootNode, isLeaf, isRoot, userId, questionId, body) {
        try {
            serverLog.info(`[createRootNodeAndTree], { request : ${JSON.stringify(rootNode)}, ${userId}, ${questionId}, ${JSON.stringify(body)} }`);

            const createNode = await decisionTreeController.createNode(rootNode, isLeaf, isRoot, userId, questionId, "");

            const decisionTreeData = new DecisionTreeModel({
                nodeId: createNode[0]._id,
                questionId,
                tree: JSON.stringify(body),
                createdBy: userId,
                updatedBy: userId
            });

            serverLog.info(`[createRootNodeAndTree], { message : root node ${createNode[0]._id} created by user ${userId} }`);

            // create decision tree
            const decisionTree = await decisionTreeQuery.saveData(decisionTreeData);

            //add decision tree to root node
            await nodeQuery.findByIdAndUpdate(createNode[0]._id, {
                decisionTreeId: decisionTree._id
            }, {
                new: true
            });

            const response = {
                decisionTreeId: decisionTree._id,
                rootNode: createNode
            }

            serverLog.info(`[createRootNodeAndTree], { message : decision tree ${decisionTree._id} created by user ${userId} }`);
            return response;
        } catch (err) {
            serverLog.error(`[{function : "createRootNodeAndTree" from "processNode" from "decisionTreeController" controller}], [{Error : ${err}}]`);
            throw err;
        }
    }


    /**
     * *This method will generate node entry to the particular decision tree
     *
     * @static
     * @param {*} nodeArray
     * @param {*} isLeaf
     * @param {*} isRoot
     * @param {*} userId
     * @param {*} questionId
     * @param {*} decisionTreeId
     * @returns
     * @memberof decisionTreeController
     */
    static async createNode(nodeArray, isLeaf, isRoot, userId, questionId, decisionTreeId) {
        try {
            serverLog.info(`[createNode], { request : ${JSON.stringify(nodeArray)}, ${isLeaf}, ${questionId}, ${userId} }`);
            const saveNodeDataArray = []
            const errorFields = [];
            for (const node of nodeArray) {
                let processId;
                if (node.category == 'PredefinedLogic') {
                    const process = await preDefineLogicQueries.findOne({
                        _id: node.metaData.processId,
                        isActive: true
                    });
                    processId = process._id;
                }

                // this will validate equation from procedure node
                if (node.category == 'Procedure') {
                    const procedureData = await decisionTreeController.addEquation(node, decisionTreeId, userId);
                    if (procedureData["message"]) errorFields.push(procedureData);
                }

                // this will validate conditional node that contains equation
                if (node.category == "Conditional" && node.metaData.type == "equation") {
                    const conditionalEquationData = await decisionTreeController.validateConditionalData(node, decisionTreeId);
                    if (conditionalEquationData["message"]) errorFields.push(conditionalEquationData);
                }

                // if node type is manual input then store its local variable to the expression variable
                if (node.category == "ManualInput") {
                    const variableInputs = node.metaData.inputs;
                    // let variableInputs = await node.metaData.inputs.filter(input => input.variableName == "");
                    if (variableInputs.length > 0) {
                        const localVariableToStoreInDB = [];
                        for (const localVar of variableInputs) {
                            const localVariableDetails = {
                                variableName: localVar.localVariableName,
                                variableScope: "userLevel",
                                createdBy: userId,
                                updatedBy: userId,
                                decisionTreeId: decisionTreeId,
                                valueType: localVar.inputType,
                                constraints: localVar.constraints ? localVar.constraints : 'not_null'
                            };
                            if (localVar.variableLabel) localVariableDetails['variableLabel'] = localVar.variableLabel;
                            localVariableToStoreInDB.push(localVariableDetails);
                        }
                        await expressionVariableQueries.insertMany(localVariableToStoreInDB);
                    }
                }

                if (node.category == "LookUp") {
                    const variableInputs = node.metaData.inputs;
                    // let variableInputs = await node.metaData.inputs.filter(input => input.variableName == "");
                    if (variableInputs.length > 0) {
                        const localVariableToStoreInDB = [];
                        for (const localVar of variableInputs) {
                            const localVariableDetails = {
                                variableName: localVar.localVariableName,
                                variableScope: "userLevel",
                                createdBy: userId,
                                updatedBy: userId,
                                decisionTreeId: decisionTreeId,
                                valueType: localVar.inputType,
                                constraints: localVar.constraints ? localVar.constraints : 'not_null',
                                fileVariableSelection: localVar.fileVariableSelection,
                                variableValue: localVar.fileVariableSelection ? JSON.stringify(localVar.fileValue) : localVar.variableValue
                            };

                            if (localVar.variableLabel) localVariableDetails['variableLabel'] = localVar.variableLabel;
                            localVariableToStoreInDB.push(localVariableDetails);
                        }
                        await expressionVariableQueries.insertMany(localVariableToStoreInDB);
                    }
                }

                // if node type is multi option or pass data then storing its local variable name to the expression variables
                if (node.category == "MultiOption" || node.category == "PassData") {
                    const localVariableDetails = {
                        variableName: node.metaData.localVariableName,
                        variableScope: "systemLevel",
                        createdBy: userId,
                        updatedBy: userId,
                        decisionTreeId: decisionTreeId,
                        valueType: node.metaData.inputType
                    };
                    if (node.metaData.variableLabel) localVariableDetails['variableLabel'] = node.metaData.variableLabel;
                    if (node.metaData.isSingle || node.metaData.isFetchFromLookup) localVariableDetails['variableName'] = node.metaData.singleVariableName;
                    if (node.metaData.fileId) localVariableDetails['fileId'] = node.metaData.fileId;
                    await expressionVariableQueries.saveData(localVariableDetails);
                }

                const nodeData = {
                    label: node.text,
                    type: node.name,
                    isLeaf: isLeaf,
                    isRoot: isRoot,
                    questionId: questionId,
                    nodeKey: node.key,
                    createdBy: userId,
                    updatedBy: userId,
                    metaData: node.metaData ? node.metaData : ""
                };
                if (node.metaData.processId) nodeData["belongFromProcess"] = processId;
                if (decisionTreeId) nodeData["decisionTreeId"] = decisionTreeId;

                const nodeModelData = new NodeModel(nodeData);
                saveNodeDataArray.push(nodeModelData);
            }

            //return error
            if (errorFields.length) return {
                hasError: true,
                errorFields
            };

            const savedNode = await nodeQuery.insertMany(saveNodeDataArray);
            serverLog.info(`[createNode], { return : true }`);
            return isRoot ? savedNode : true;
        } catch (err) {
            serverLog.error(`[{function : "createNode" from "processNode" from "decisionTreeController" controller}], [{Error : ${err}}]`);
            throw err;
        }
    }


    /**
     * *If node type is "conditional" node and it contain any EQUATION than this method will verify that equation.
     *
     * @static
     * @param {*} node
     * @param {*} decisionTreeId
     * @returns
     * @memberof decisionTreeController
     */
    static async validateConditionalData(node, decisionTreeId) {
        try {
            serverLog.info(`[validateConditionalData], { request : ${JSON.stringify(node)} }`);

            const equation = node.metaData.equation;
            const regexConditional = /[<>=!]=?/;
            const splitString = (input) => input.split(regexConditional);
            const variableArray = splitString(equation);
            // const variableArray = equation.match(/(((\w+:)+\w+)|(\w+))/g);
            const pattern = /^[A-Za-z: ]*(<=|>=|<|>|!=|==)?[A-Za-z0-9.: ]*$/;

            const errorDetail = {
                errorNode: {
                    key: node.key,
                    label: node.text
                }
            };

            // first parameter do not allow to be number only || variable length can not be more than 2 || equation must be the matching with valid pattern
            if (!/(?!^\d+$)^.+$/.test(variableArray[0])) errorDetail["message"] = `Left side of statement(${variableArray[0]}) is not allowed to be number`;
            if (variableArray.length > 2) errorDetail["message"] = "Multiple conditions are not allowed in single statement";
            if (!pattern.test(equation)) errorDetail["message"] = "Invalid statement defined, Please enter valid statement";

            if (errorDetail["message"]) return errorDetail;

            // process all variables from array. and also replacement done by its value
            for (const variable of variableArray) {
                if (isNaN(variable) && !variable.includes(":")) {
                    const checkForGlobalVariable = await variableQueries.findOne({
                        name: variable,
                        isActive: true,
                        isDeleted: false
                    });
                    if (!checkForGlobalVariable) {
                        const checkForUserVariable = await expressionVariableQueries.findOne({
                            variableName: variable,
                            isActive: true,
                            isDeleted: false,
                            decisionTreeId
                        })
                        if (!checkForUserVariable) {
                            errorDetail["message"] = `Please check! Variable(${variable}) is not defined in system`;
                            return errorDetail;
                        }
                    }
                }
            }

            serverLog.info(`[validateConditionalData], { return_message : "return after validating conditional node equation" }`);
            return true;
        } catch (err) {
            serverLog.error(`[{function : "validateConditionalData" from "processNode" from "decisionTreeController" controller}], [{Error : ${err}}]`);
            throw err;
        }
    }


    /**
     * *If node type is "procedure" than this method will validate its equation and store variables(if any local variable found)
     *
     * @static
     * @param {*} node
     * @param {*} decisionTreeId
     * @param {*} userId
     * @returns
     * @memberof decisionTreeController
     */
    static async addEquation(node, decisionTreeId, userId) {
        try {
            serverLog.info(`[addEquation], { request : ${JSON.stringify(node)}, ${userId}, ${decisionTreeId} }`);

            const equation = node.metaData.equation;
            const divideStringByEqualTo = equation.split("="); // divide equation for assignment variable
            const pattern = /^[^=]+[=]?[^=]+$/; // only one = is allowed per equation

            const checkAvailableVariables = await variableQueries.findOne({
                name: divideStringByEqualTo[0],
                isActive: true,
                isDeleted: false
            });

            const errorDetail = {
                errorNode: {
                    key: node.key,
                    label: node.text
                }
            };

            // check equation is valid or not
            if (!isNaN(divideStringByEqualTo[0])) errorDetail["message"] = `variable name(${divideStringByEqualTo[0]}) do not consist solely of numerical character`;
            if (/[-+=*/%()]+/g.test(divideStringByEqualTo[0])) errorDetail["message"] = `Variable name(${divideStringByEqualTo[0]}) do not consist any special character`;
            if (!/^[a-zA-Z0-9()*/+:.=-]+$/g.test(equation)) errorDetail["message"] = `Equation only consist arithmetic and assignment operators other special characters are not allowed`;
            // check if assignment variable is organization variable or not
            if (checkAvailableVariables) errorDetail["message"] = `Variable name(${divideStringByEqualTo[0]}) is reserved, Please use other variable name`;
            // check equation pattern is valid or not
            if (!pattern.test(equation)) errorDetail["message"] = `Only one assignment(=) is allowed per equation`;

            //return error
            if (errorDetail["message"]) {
                serverLog.error(`[addEquation], { return_message : ${errorDetail["message"]}`);
                return errorDetail;
            }

            //get all variable from equation
            const variableArray = equation.match(/(((\w+:)+\w+)|(\w+))/g);

            //process all variable. and if variable is not organization/system variable then create expression variable
            const saveVariableArray = [];
            for (const variable of variableArray) {
                if (isNaN(variable)) {
                    const findVariable = await expressionVariableQueries.findOne({
                        variableName: variable,
                        isActive: true,
                        decisionTreeId
                    });
                    //check for variable is available or not
                    if (!findVariable) {
                        const checkAvailableVariable = await variableQueries.findOne({
                            name: variable,
                            isActive: true,
                            isDeleted: false
                        });
                        // if (!checkAvailableVariable) {
                        //     const variableDetails = {
                        //         variableName: variable,
                        //         variableScope: 'userLevel',
                        //         expression: (variable == divideStringByEqualTo[0]) ? divideStringByEqualTo[1] : "",
                        //         decisionTreeId,
                        //         createdBy: userId,
                        //         updatedBy: userId
                        //     };
                        //     if (node.metaData.variableLabel) variableDetails['variableLabel'] = node.metaData.variableLabel;
                        //     saveVariableArray.push(variableDetails);
                        // }
                        if (!checkAvailableVariable && variable === divideStringByEqualTo[0]) {
                            const variableDetails = {
                                variableName: variable,
                                variableScope: 'userLevel',
                                expression: divideStringByEqualTo[1],
                                decisionTreeId,
                                createdBy: userId,
                                updatedBy: userId
                            };
                            if (node.metaData.variableLabel) variableDetails['variableLabel'] = node.metaData.variableLabel;
                            saveVariableArray.push(variableDetails);
                        }
                    } else {
                        if (findVariable.variableName == divideStringByEqualTo[0]) {
                            serverLog.error(`[addEquation], { return_message : "${findVariable.variableName}" is already used variable }`);
                            errorDetail["message"] = `Variable name(${findVariable.variableName}) is already in use, please use other variable name`
                            return errorDetail;
                        }
                    }
                }
            }
            await expressionVariableQueries.insertMany(saveVariableArray);
            serverLog.info(`[addEquation], { return_message : return true after create variables for equation }`);
            return true;
        } catch (err) {
            serverLog.error(`[{function : "addEquation" from "createNode" from "processNode" from "decisionTreeController" controller}], [{Error : ${err}}]`);
            throw err;
        }
    }


    /**
     * *This method will create links for decision tree
     *
     * @static
     * @param {*} data
     * @returns
     * @memberof decisionTreeController
     */
    static async processLinks(data) {
        try {
            serverLog.info(`[processLinks], { request : ${JSON.stringify(data.linkDataArray)}, ${data.userId}, ${data.questionId}, ${data.decisionTreeId} }`);
            await decisionTreeController.createLink(data.linkDataArray, data.userId, data.questionId, data.decisionTreeId);
            serverLog.info(`[processLinks], { return_message : "return true after created links for all nodes" }`);
            return true;
        } catch (err) {
            serverLog.error(`[{function : "processLinks" from "create" method of "decisionTreeController" controller}], [{Error : ${err}}]`);
            throw err;
        }
    }


    /**
     * *This method will store links to DB
     *
     * @static
     * @param {*} linkDataArray
     * @param {*} userId
     * @param {*} questionId
     * @param {*} decisionTreeId
     * @returns
     * @memberof decisionTreeController
     */
    static async createLink(linkDataArray, userId, questionId, decisionTreeId) {
        try {


            serverLog.info(`[createLink], { request : ${JSON.stringify(linkDataArray)}, ${userId}, ${questionId} }`);

            for (const link of linkDataArray) {

                const findNextNode = await nodeQuery.findOne({
                    nodeKey: link.to,
                    isDeleted: false,
                    questionId: questionId,
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
                await decisionTreeController.addLinksToNode(saveLinkData, link.from, questionId, decisionTreeId);
            }
            serverLog.info(`[createLink], { return_message : "created all links" }`);
            return;
        } catch (err) {
            serverLog.error(`[{function : "createLink" from "processLink" from "create" method of "decisionTreeController" controller}], [{Error : ${err}}]`);
            throw err;
        }
    }


    /**
     * *This method will add links to its respective nodes
     *
     * @static
     * @param {*} saveLinkData
     * @param {*} from
     * @param {*} questionId
     * @param {*} decisionTreeId
     * @returns
     * @memberof decisionTreeController
     */
    static async addLinksToNode(saveLinkData, from, questionId, decisionTreeId) {
        try {
            serverLog.info(`[addLinksToNode], { request : ${JSON.stringify(saveLinkData)}, ${from}, ${questionId} }`);
            const findNode = await nodeQuery.findOneWithAllData({
                nodeKey: from,
                isActive: true,
                questionId,
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
            serverLog.info(`[addLinksToNode], { message : added saved condition to its node for question "${questionId}" }`);
            return;
        } catch (err) {
            serverLog.error(`[{function : "addLinksToNode" from "createLink" from "processLink" from "create" method of "decisionTreeController" controller}], [{Error : ${err}}]`);
            throw err;
        }
    }


    /**
     * *This api will return whole give decision tree
     *
     * @static
     * @param {*} req
     * @param {*} res
     * @memberof decisionTreeController
     */
    static async details(req, res) {
        try {
            const {
                questionId
            } = req.params;

            serverLog.info(`[${req.originalUrl}] [${req.method}] [loggedInUser : ${req.headers.id}], {request_payload : ${JSON.stringify(questionId)}}`);

            const questionDetails = await questionQuery.findById(questionId);

            const decisionTreeData = await decisionTreeQuery.findOneAndProject({
                questionId,
                isActive: true
            }, {
                tree: 1
            });

            if (decisionTreeData) {
                const treeData = JSON.parse(decisionTreeData.tree);
                const newNodeData = [];
                for (const element of treeData.nodeDataArray) {
                    if (element.category === "PredefinedLogic") {
                        const process = await preDefineLogicQueries.findById(element.metaData.processId);
                        element.text = process.displayLabel ? process.displayLabel : element.text;
                        newNodeData.push(element);
                    } else {
                        newNodeData.push(element);
                    }
                }
                treeData["nodeDataArray"] = newNodeData;
                const data = {
                    question: questionDetails.text,
                    tree: treeData,
                    topicId: questionDetails.topicId
                };

                serverLog.info(`[${req.originalUrl}] [${req.method}] [${status_codes.OK}] [loggedInUser : ${req.headers.id}], {response : ${JSON.stringify(data)}}`)
                res.status(status_codes.OK).send(Response.sendResponse(status_codes.OK, custom_message.InfoMessage.getDecisionTree, data, []));
            } else {
                const data = {
                    question: questionDetails.text,
                    topicId: questionDetails.topicId
                }
                serverLog.info(`[${req.originalUrl}] [${req.method}] [${status_codes.OK}] [loggedInUser : ${req.headers.id}], {response : tree is not available for this question ${JSON.stringify(data)}}`)
                res.status(status_codes.OK).send(Response.sendResponse(status_codes.OK, custom_message.errorMessage.treeNotFoundForQuestion, data, []));
            }
        } catch (err) {
            serverLog.error(`[${req.originalUrl}] [${req.method}] [${status_codes.INTERNAL_SERVER_ERROR}], {error : ${err}}`);
            res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
        }
    }


    /**
     * *This api will update decision tree
     *
     * @static
     * @param {*} req
     * @param {*} res
     * @memberof decisionTreeController
     */
    static async updateDecisionTree(req, res) {
        try {
            const {
                questionId,
                linkDataArray,
                nodeDataArray
            } = req.body;

            serverLog.info(`[${req.originalUrl}] [${req.method}] [loggedInUser : ${req.headers.id}], {request_payload : ${JSON.stringify(req.body)}}`);

            //check for empty tree
            if (nodeDataArray.length == 0) {
                //throw error that please define tree
                serverLog.error(`[${req.originalUrl}] [${req.method}] [${status_codes.BAD_REQUEST}] [loggedInUser : ${req.headers.id}], {error_message : User is trying to add empty tree}`);
                res.status(status_codes.BAD_REQUEST).send(Response.sendResponse(status_codes.BAD_REQUEST, custom_message.errorMessage.emptyTree, [], []));
            }

            const decisionTree = await decisionTreeQuery.findOne({
                questionId,
                isActive: true,
                isDeleted: false
            });

            // if decision tree is available than remove all previous data and then create new one
            if (decisionTree) {
                await Promise.all([
                    nodeQuery.findAllAndUpdate({
                        decisionTreeId: decisionTree._id,
                        isActive: true,
                        isDeleted: false
                    }, {
                        isActive: false,
                        isDeleted: true
                    }, {
                        new: true
                    }),
                    linkQuery.findAllAndUpdate({
                        decisionTreeId: decisionTree._id,
                        isActive: true,
                        isDeleted: false
                    }, {
                        isActive: false,
                        isDeleted: true
                    }, {
                        new: true
                    }),
                    expressionVariableQueries.updateAll({
                        decisionTreeId: decisionTree._id,
                        isActive: true,
                        isDeleted: false
                    }, {
                        isActive: false,
                        isDeleted: true
                    }, {
                        new: true
                    })
                ]);

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
                    removeRootAndLeaf,
                    decisionTreeId: decisionTree._id
                };
                const createNodes = await decisionTreeController.processUpdateNode(nodeDataToProcess);
                if (createNodes["hasError"]) {
                    const tree = JSON.parse(decisionTree.tree);
                    // tree['questionId'] = questionId;
                    req.body['questionId'] = questionId;
                    req.body["linkDataArray"] = tree.linkDataArray;
                    req.body["nodeDataArray"] = tree.nodeDataArray;
                    await decisionTreeController.create(req, res, true);
                    nodeDataToProcess.tree['questionId'] = questionId;
                    serverLog.error(`[${req.originalUrl}] [${req.method}] [loggedInUser : ${req.headers.id}], {Error : Equation is not valid}`);
                    const details = {
                        hasError: true,
                        tree: nodeDataToProcess.tree,
                        errors: createNodes
                    }
                    return res.status(status_codes.BAD_REQUEST).send(Response.sendResponse(status_codes.BAD_REQUEST, custom_message.errorMessage.notValidEquation, details, []));
                }

                //save links to DB
                const linkDataToProcess = {
                    userId: req.headers.id,
                    linkDataArray: linkDataArray,
                    decisionTreeId: createNodes.decisionTreeId,
                    questionId
                };
                await decisionTreeController.processLinks(linkDataToProcess)
                console.log("Second time headers seting============================================================>")
                serverLog.info(`[${req.originalUrl}] [${req.method}] [${status_codes.OK}] [loggedInUser : ${req.headers.id}], {response_message : Decision tree updated successfully!}`)
                res.status(status_codes.OK).send(Response.sendResponse(status_codes.OK, custom_message.InfoMessage.updateDecisionTree, [], []));
            } else {
                serverLog.error(`[${req.originalUrl}] [${req.method}] [${status_codes.BAD_REQUEST}] [loggedInUser : ${req.headers.id}], {error_message : Decision Tree not available for this question : ${questionId}}`);
                res.status(status_codes.BAD_REQUEST).send(Response.sendResponse(status_codes.BAD_REQUEST, custom_message.errorMessage.treeNotExist, [], []));
            }
        } catch (err) {
            console.log(err)
            serverLog.error(`[${req.originalUrl}] [${req.method}] [${status_codes.INTERNAL_SERVER_ERROR}], {error : ${err}}`);
            res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
        }
    }


    /**
     * *This method will update node for decision tree
     *
     * @static
     * @param {*} data
     * @returns
     * @memberof decisionTreeController
     */
    static async processUpdateNode(data) {
        try {
            serverLog.info(`[processUpdateNode], { request : ${JSON.stringify(data)} }`);
            let addLeafNode;
            let addNodes;
            const addRootNodeAndCreateTree = await decisionTreeController.updateRootNodeAndTree(data.rootNode, false, true, data.userId, data.questionId, data.tree, data.decisionTreeId);

            addLeafNode = (data.leafNode.length > 0) ? await decisionTreeController.createNode(data.leafNode, true, false, data.userId, data.questionId, data.decisionTreeId) : [];

            addNodes = (data.leafNode.length > 0) ? await decisionTreeController.createNode(data.removeRootAndLeaf, false, false, data.userId, data.questionId, data.decisionTreeId) : [];

            if (addNodes["hasError"]) {
                await Promise.all([
                    decisionTreeQuery.findByIdAndUpdate(addRootNodeAndCreateTree.decisionTreeId, {
                        isDeleted: true,
                        isActive: false
                    }, {
                        new: true
                    }),
                    nodeQuery.updateAll({
                        decisionTreeId: addRootNodeAndCreateTree.decisionTreeId
                    }, {
                        isDeleted: true,
                        isActive: false
                    }, {
                        new: true
                    })
                ]);
                return addNodes;
            }

            const response = {
                // rootNode: (addRootNodeAndCreateTree.rootNode.length > 0) ? addRootNodeAndCreateTree.rootNode : [],
                decisionTreeId: data.decisionTreeId,
                // leafNode: (addLeafNode.length > 0) ? addLeafNode : [],
                // otherNode: (addNodes.length > 0) ? addNodes : []
            }
            serverLog.info(`[processUpdateNode], { return : ${JSON.stringify(response)}}`);
            return response;
        } catch (err) {
            serverLog.error(`[{function : "processUpdateNode" from "updateDecisionTree" from "decisionTreeController" controller}], [{Error : ${err}}]`);
            throw err;
        }
    }


    /**
     * *This method will update new root node to the tree and also update decision tree
     *
     * @static
     * @param {*} rootNode
     * @param {*} isLeaf
     * @param {*} isRoot
     * @param {*} userId
     * @param {*} questionId
     * @param {*} body
     * @param {*} decisionTreeId
     * @returns
     * @memberof decisionTreeController
     */
    static async updateRootNodeAndTree(rootNode, isLeaf, isRoot, userId, questionId, body, decisionTreeId) {
        try {
            serverLog.info(`[updateRootNodeAndTree], { request : ${JSON.stringify(rootNode)}, ${userId}, ${questionId}, ${JSON.stringify(body)} }`);

            const createNode = await decisionTreeController.createNode(rootNode, isLeaf, isRoot, userId, questionId, "");

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

            serverLog.info(`[updateRootNodeAndTree], { message : decision tree ${decisionTree._id} updated by user ${userId} }`);
            return response;
        } catch (err) {
            serverLog.error(`[{function : "updateRootNodeAndTree" from "processUpdateNode" from "decisionTreeController" controller}], [{Error : ${err}}]`);
            throw err;
        }
    }


    /**
     * *This api will delete decision tree, its node, its links and all expression variables
     *
     * @static
     * @param {*} req
     * @param {*} res
     * @memberof decisionTreeController
     */
    static async deleteDecisionTree(req, res) {
        try {
            const {
                questionId
            } = req.params;

            serverLog.info(`[${req.originalUrl}] [${req.method}] [loggedInUser : ${req.headers.id}], {request_payload : ${JSON.stringify(questionId)}}`);

            const decisionTree = await decisionTreeQuery.findOne({
                questionId,
                isActive: true,
                isDeleted: false
            });

            if (decisionTree) {
                await Promise.all([
                    //remove all nodes
                    nodeQuery.findAllAndUpdate({
                        decisionTreeId: decisionTree._id,
                        isActive: true,
                        isDeleted: false
                    }, {
                        isDeleted: true,
                        isActive: false
                    }, {
                        new: true
                    }),

                    //remove all links
                    linkQuery.findAllAndUpdate({
                        decisionTreeId: decisionTree._id,
                        isActive: true,
                        isDeleted: false
                    }, {
                        isDeleted: true,
                        isActive: false
                    }, {
                        new: true
                    }),

                    //remove all expression variables
                    expressionVariableQueries.updateAll({
                        decisionTreeId: decisionTree._id,
                        isActive: true,
                        isDeleted: false
                    }, {
                        isActive: false,
                        isDeleted: true
                    }, {
                        new: true
                    }),

                    //remove decision tree
                    decisionTreeQuery.findByIdAndUpdate(decisionTree._id, {
                        isDeleted: true,
                        isActive: false
                    }, {
                        new: true
                    })
                ]);
                // await nodeQuery.findAllAndUpdate({
                //     decisionTreeId: decisionTree._id,
                //     isActive: true,
                //     isDeleted: false
                // }, {
                //     isDeleted: true,
                //     isActive: false
                // }, {
                //     new: true
                // });

                // //remove all links
                // await linkQuery.findAllAndUpdate({
                //     decisionTreeId: decisionTree._id,
                //     isActive: true,
                //     isDeleted: false
                // }, {
                //     isDeleted: true,
                //     isActive: false
                // }, {
                //     new: true
                // });

                // //remove all expression variables
                // await expressionVariableQueries.updateAll({
                //     decisionTreeId: decisionTree._id,
                //     isActive: true,
                //     isDeleted: false
                // }, {
                //     isActive: false,
                //     isDeleted: true
                // }, {
                //     new: true
                // });

                // //remove decision tree
                // await decisionTreeQuery.findByIdAndUpdate(decisionTree._id, {
                //     isDeleted: true,
                //     isActive: false
                // }, {
                //     new: true
                // });
            }
            serverLog.info(`[${req.originalUrl}] [${req.method}] [${status_codes.OK}] [loggedInUser : ${req.headers.id}], {response_message : Decision tree deleted successfully!}`)

            res.status(status_codes.OK).send(Response.sendResponse(status_codes.OK, custom_message.InfoMessage.deleteDecisionTree, [], []));
        } catch (err) {
            serverLog.error(`[${req.originalUrl}] [${req.method}], [${status_codes.INTERNAL_SERVER_ERROR}] {error : ${err}}`);
            res.status(status_codes.INTERNAL_SERVER_ERROR).send(Response.sendResponse(status_codes.INTERNAL_SERVER_ERROR, custom_message.errorMessage.genericError, [], err));
        }
    }
}