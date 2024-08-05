import NodeModel from "../models/node.model";

export const saveData = (data) =>
    NodeModel.create(data);

export const findOne = (condition, project) =>
    NodeModel.findOne(condition, project);

export const find = (condition, project) =>
    NodeModel.find(condition, project);

export const findOneWithAllData = (condition) =>
    NodeModel.findOne(condition);

export const findByIdAndUpdate = (id, data, options) =>
    NodeModel.findByIdAndUpdate(id, data, options);

export const findById = (id) =>
    NodeModel.findById(id);

export const findAllAndUpdate = (condition, data, options) =>
    NodeModel.updateMany(condition, data, options);

export const updateAll = (condition, data, options) =>
    NodeModel.updateMany(condition, data, options);

export const count = (condition) =>
    NodeModel.countDocuments(condition);

export const findAll = (condition) =>
    NodeModel.find(condition);

export const insertMany = (array) =>
    NodeModel.insertMany(array);