"use strict";

import staticExcelFilesModel from "../models/staticFileData.model";

export const create = async function (createPattern) {

    return staticExcelFilesModel.create(createPattern).then(createRes => {
        return createRes;
    }).catch(err => {
        throw err;
    });
}

export const updateMany = async function (findPattern, updatePattern) {

    return staticExcelFilesModel.updateMany(findPattern, updatePattern).then(updateRes => {
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

    return staticExcelFilesModel.findOneAndUpdate(findPattern, updatePattern, options).then(updatedData => {
        return updatedData;
    }).catch(err => {
        throw err;
    });
}

export const findOne = async function (findPattern, selectPattern = "", populatePattern = null) {

    var query = staticExcelFilesModel.findOne(findPattern, selectPattern);

    if (populatePattern) {
        query.populate(populatePattern);
    }

    return query.then(resultData => {
        return resultData;
    }).catch(err => {
        throw err;
    });
}

export const find = async function (findPattern, selectPattern = "", populatePattern = null, sortPattern = null) {

    var query = staticExcelFilesModel.find(findPattern, selectPattern)
        .populate({
            path: 'createdBy',
            model : "users",
            select : "firstName lastName"
        });

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

    return staticExcelFilesModel.deleteOne(deletePattern).then(deleteRes => {
        return deleteRes;
    }).catch(err => {
        throw err;
    });
}

export const deleteMany = async function (deletePattern) {

    return staticExcelFilesModel.deleteMany(deletePattern).then(deleteRes => {
        return deleteRes;
    }).catch(err => {
        throw err;
    });
}

export const countDocuments = async function (findPattern) {

    return staticExcelFilesModel.countDocuments(findPattern).then((count) => {
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

    return staticExcelFilesModel.paginate(query, options).then(async (paginatedData) => {
        return paginatedData;
    }).catch(err => {
        throw err;
    });
}

export const getAggregatePaginatedData = async function (queryPattern, sortPattern, page_no, limit) {

    var query = staticExcelFilesModel.aggregate(queryPattern);
    var options = {
        sort: sortPattern,
        page: page_no,
        limit: limit
    };

    return staticExcelFilesModel.aggregatePaginate(query, options).then(resultData => {
        return resultData;
    }).catch(err => {
        throw err;
    });
}

export const aggregateFindOne = async function (queryPattern, sortPattern) {

    var query = staticExcelFilesModel.aggregate(queryPattern);
    var options = {
        sort: sortPattern,
        page: 1,
        limit: 1
    };

    return staticExcelFilesModel.aggregatePaginate(query, options).then(resultData => {
        return resultData.docs.length > 0 ? resultData.docs[0] : null;
    }).catch(err => {
        throw err;
    });
}

export const findById = (id, project) =>
staticExcelFilesModel.findById(id, project);

export const findByIdAndUpdate = (id, updateField, options) =>
    staticExcelFilesModel.findByIdAndUpdate(id, updateField, options);