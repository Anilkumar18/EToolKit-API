import UserTransactionInputModel from "../models/userTransactionInput.model";

export const findOne = (condition) =>
    UserTransactionInputModel.findOne(condition).lean();

export const saveData = (data) =>
    UserTransactionInputModel.create(data);

export const findByIdAndUpdate = (id, data, options) =>
    UserTransactionInputModel.findByIdAndUpdate(id, data, options);

export const findAll = (condition) =>
    UserTransactionInputModel.find(condition)

export const findAllAndProject = (condition, project) =>
    UserTransactionInputModel.find(condition, project);

export const updateMany = (condition, data, options) =>
    UserTransactionInputModel.updateMany(condition, data, options);

export const insertAll = (data) =>
    UserTransactionInputModel.insertMany(data)

export const upsertOne = async function (findPattern, updatePattern, selectPattern = "") {

    var options = {
        new: true,
        runValidators: true,
        select: selectPattern,
        upsert: true,
        setDefaultsOnInsert: true
    };

    return UserTransactionInputModel.findOneAndUpdate(findPattern, updatePattern, options).then(updatedData => {
        return updatedData;
    }).catch(err => {
        throw err;
    });
}