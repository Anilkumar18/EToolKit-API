"use strict";

import LoopTypeModel from "../models/loopType.model";

export const create = async function (createPattern) {

    return LoopTypeModel.create(createPattern).then(createRes => {
        return createRes;
    }).catch(err => {
        throw err;
    });
}

export const insertMany = async function (insertPattern) {

    return LoopTypeModel.insertMany(insertPattern).then(insertRes => {
        return insertRes;
    }).catch(err => {
        throw err;
    });
}

export const updateOne = async function (findPattern, updatePattern) {

    return LoopTypeModel.updateOne(findPattern, updatePattern).then(updateRes => {
        return updateRes;
    }).catch(err => {
        throw err;
    });
}

export const updateMany = async function (findPattern, updatePattern) {

    return LoopTypeModel.updateMany(findPattern, updatePattern).then(updateRes => {
        return updateRes;
    }).catch(err => {
        throw err;
    });
}

export const findOneAndUpdate = async function (findPattern, updatePattern, selectPattern = "") {

    var options = {
        new: true,
        runValidators: true,
        select: selectPattern
    };

    return LoopTypeModel.findOneAndUpdate(findPattern, updatePattern, options).then(updatedData => {
        return updatedData;
    }).catch(err => {
        throw err;
    });
}

export const upsertOne = async function (findPattern, updatePattern, selectPattern = "") {

    var options = {
        new: true,
        runValidators: true,
        select: selectPattern,
        upsert: true
    };

    return LoopTypeModel.findOneAndUpdate(findPattern, updatePattern, options).then(updatedData => {
        return updatedData;
    }).catch(err => {
        throw err;
    });
}

export const findOne = async function (findPattern, selectPattern = "", populatePattern = null) {

    var query = LoopTypeModel.findOne(findPattern, selectPattern);

    if (populatePattern) {
        query.populate(populatePattern);
    }

    return query.then(resultData => {
        return resultData;
    }).catch(err => {
        throw err;
    });
}

export const findById = (id) =>
    LoopTypeModel.findById(id);

export const find = async function (findPattern, selectPattern = "", populatePattern = null, sortPattern = null) {

    var query = LoopTypeModel.find(findPattern, selectPattern);

    if (populatePattern) {
        query.populate(populatePattern);
    }

    if (sortPattern) {
        query.sort(sortPattern);
    }

    return query.then(resultData => {
        return resultData;
    }).catch(err => {
        throw err;
    });
}

export const deleteOne = async function (deletePattern) {

    return LoopTypeModel.deleteOne(deletePattern).then(deleteRes => {
        return deleteRes;
    }).catch(err => {
        throw err;
    });
}

export const deleteMany = async function (deletePattern) {

    return LoopTypeModel.deleteMany(deletePattern).then(deleteRes => {
        return deleteRes;
    }).catch(err => {
        throw err;
    });
}

export const countDocuments = async function (findPattern) {

    return LoopTypeModel.countDocuments(findPattern).then((count) => {
        return count;
    }).catch(err => {
        throw err;
    });
}

export const getPaginatedData = async function (findPattern, sortPattern, page_no, limit) {

    var query = findPattern;
    var options = {
        sort: sortPattern,
        page: page_no,
        limit: limit
    };

    return LoopTypeModel.paginate(query, options).then(async (paginatedData) => {
        return paginatedData;
    }).catch(err => {
        throw err;
    });
}