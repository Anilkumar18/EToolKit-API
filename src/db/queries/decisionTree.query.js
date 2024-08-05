import DecisionTreeModel from "../models/decisionTree.model";


export const saveData = (data) =>
    DecisionTreeModel.create(data);

export const findOne = (condition) =>
    DecisionTreeModel.findOne(condition);

export const findOneAndProject = (condition, project) =>
    DecisionTreeModel.findOne(condition, project)

export const findByIdAndUpdate = (id, data, options) =>
    DecisionTreeModel.findByIdAndUpdate(id, data, options);

export const findOneAndUpdate = (condition, data, options) =>
    DecisionTreeModel.findOneAndUpdate(condition, data, options);