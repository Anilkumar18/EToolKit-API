"use strict";

import standardHeaderModel from "../models/standardHeader.model";

export const create = async function (createPattern) {

    return standardHeaderModel.create(createPattern).then(createRes => {
        return createRes;
    }).catch(err => {
        throw err;
    });
}

export const insertMany = async function (insertPattern) {

    return standardHeaderModel.insertMany(insertPattern).then(insertRes => {
        return insertRes;
    }).catch(err => {
        throw err;
    });
}

export const updateOne = async function (findPattern, updatePattern) {

    return standardHeaderModel.updateOne(findPattern, {
        $set: {
            updatePattern
        }
    }).then(updateRes => {
        return updateRes;
    }).catch(err => {
        throw err;
    });
}

export const updateMany = async function (findPattern, updatePattern) {

    return standardHeaderModel.updateMany(findPattern, updatePattern).then(updateRes => {
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

    return standardHeaderModel.findOneAndUpdate(findPattern, updatePattern, options).then(updatedData => {
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

    return standardHeaderModel.findOneAndUpdate(findPattern, updatePattern, options).then(updatedData => {
        return updatedData;
    }).catch(err => {
        throw err;
    });
}

export const findOne = async function (findPattern, selectPattern = "", populatePattern = null) {

    var query = standardHeaderModel.findOne(findPattern, selectPattern);

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

    var query = standardHeaderModel.find(findPattern, selectPattern)
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

    return standardHeaderModel.deleteOne(deletePattern).then(deleteRes => {
        return deleteRes;
    }).catch(err => {
        throw err;
    });
}

export const deleteMany = async function (deletePattern) {

    return standardHeaderModel.deleteMany(deletePattern).then(deleteRes => {
        return deleteRes;
    }).catch(err => {
        throw err;
    });
}

export const countDocuments = async function (findPattern) {

    return standardHeaderModel.countDocuments(findPattern).then((count) => {
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

    return standardHeaderModel.paginate(query, options).then(async (paginatedData) => {
        return paginatedData;
    }).catch(err => {
        throw err;
    });
}

export const getAggregatePaginatedData = async function (queryPattern, sortPattern, page_no, limit) {

    var query = standardHeaderModel.aggregate(queryPattern);
    var options = {
        sort: sortPattern,
        page: page_no,
        limit: limit
    };

    return standardHeaderModel.aggregatePaginate(query, options).then(resultData => {
        return resultData;
    }).catch(err => {
        throw err;
    });
}

export const aggregateFindOne = async function (queryPattern, sortPattern) {

    var query = standardHeaderModel.aggregate(queryPattern);
    var options = {
        sort: sortPattern,
        page: 1,
        limit: 1
    };

    return standardHeaderModel.aggregatePaginate(query, options).then(resultData => {
        return resultData.docs.length > 0 ? resultData.docs[0] : null;
    }).catch(err => {
        throw err;
    });
}

export const findById = (id, project) => async function() {
    return standardHeaderModel.findById(id, project).then(resultData => {
        return resultData;
    }).catch(err => {
        throw err;
    });
}