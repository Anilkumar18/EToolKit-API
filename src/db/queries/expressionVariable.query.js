import ExpressionVariableModel from "../models/expressionVariable.model";


export const saveData = (data) =>
    ExpressionVariableModel.create(data);

export const findAll = (condition) =>
    ExpressionVariableModel.find(condition);

export const findOne = (condition, project) =>
    ExpressionVariableModel.findOne(condition, project);

export const findAllAndProject = (condition, project) =>
    ExpressionVariableModel.find(condition, project);

export const insertMany = (data) =>
    ExpressionVariableModel.insertMany(data);

export const updateAll = (condition, data, options) =>
    ExpressionVariableModel.updateMany(condition, data, options);

export const findById = (id) =>
    ExpressionVariableModel.findById(id)