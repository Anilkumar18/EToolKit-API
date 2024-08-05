import VariableModel from "../models/variables.model";

export const saveData = (data) =>
    VariableModel.create(data);

export const findAll = (condition) =>
    VariableModel.find(condition);

export const findOne = (condition, project) =>
    VariableModel.findOne(condition, project);

export const findAllAndProject = (condition, project) =>
    VariableModel.find(condition, project);

export const insertMany = (data) =>
    VariableModel.insertMany(data);

export const updateOne = (condition, data) =>
    VariableModel.updateOne(condition, data);