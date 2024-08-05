import FunctionModel from "../models/functions.model";


export const saveData = (data) =>
    FunctionModel.create(data);

export const findAll = (condition) =>
    FunctionModel.find(condition);