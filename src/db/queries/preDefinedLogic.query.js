import PreDefinedLogicModel from "../models/perDefineLogic.model";

export const saveData = (data) =>
    PreDefinedLogicModel.create(data);

export const findAll = (condition) =>
    PreDefinedLogicModel.find(condition)

export const findOne = (condition) =>
    PreDefinedLogicModel.findOne(condition);

export const findById = (id) =>
    PreDefinedLogicModel.findById(id);

export const findByIdAndUpdate = (id, data, options) =>
    PreDefinedLogicModel.findByIdAndUpdate(id, data, options);

export const deleteMany = async function (deletePattern) {

    return PreDefinedLogicModel.deleteMany(deletePattern).then(deleteRes => {
        return deleteRes;
    }).catch(err => {
        throw err;
    });
}