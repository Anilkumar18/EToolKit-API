"use strict";

import ExcelDataModel from "../models/excelData.model";

export const create = async function (createPattern) {

    return ExcelDataModel.create(createPattern).then(createRes => {
        return createRes;
    }).catch(err => {
        throw err;
    });
}

export const insertMany = async function (insertPattern) {

    return ExcelDataModel.insertMany(insertPattern).then(insertRes => {
        return insertRes;
    }).catch(err => {
        throw err;
    });
}

export const updateOne = async function (findPattern, updatePattern) {

    return ExcelDataModel.updateOne(findPattern, {
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

    return ExcelDataModel.updateMany(findPattern, updatePattern).then(updateRes => {
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

    return ExcelDataModel.findOneAndUpdate(findPattern, updatePattern, options).then(updatedData => {
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

    return ExcelDataModel.findOneAndUpdate(findPattern, updatePattern, options).then(updatedData => {
        return updatedData;
    }).catch(err => {
        throw err;
    });
}

export const findOne = async function (findPattern, selectPattern = "", populatePattern = null) {

    var query = ExcelDataModel.findOne(findPattern, selectPattern);

    if (populatePattern) {
        query.populate(populatePattern);
    }

    return query.then(resultData => {
        return resultData;
    }).catch(err => {
        throw err;
    });
}

export const findFilter = async function name(findPattern,filter) {
    let query = ExcelDataModel.aggregate([
        {
            $match: findPattern
        },
        {
            $project: {
                compositeKeyName:1,
                compositeKeyOptions:1,
                fileHeaders:1,
                fileName:1,
                isCompositeUnique:1,
                isCompositive:1,
                totalPages:1,
                uniqueKeyColumns:1,
                _id:1,
                fileData: 1,
                fileData: {
                    $ifNull: [
                        filter,
                        [],
                    ]
                }                
            },
        },
    ])
    return query.then(resultData => {
        return resultData[0];
    }).catch(err => {
        throw err;
    });
}

export const find = async function (findPattern, selectPattern = "", populatePattern = null, sortPattern = null) {

    var query = ExcelDataModel.find(findPattern, selectPattern)
        .populate({
            path: 'createdBy',
            model : "users",
            select : "firstName lastName"
        });

    if (populatePattern) {
        query.populate(populatePattern);
    }
    // if (sortPattern) {
    //     query.sort(sortPattern)
    // }

    return query.then(resultData => {
        return resultData;
    }).catch(err => {
        throw err;
    });
}

export const deleteOne = async function (deletePattern) {

    return ExcelDataModel.deleteOne(deletePattern).then(deleteRes => {
        return deleteRes;
    }).catch(err => {
        throw err;
    });
}

export const deleteMany = async function (deletePattern) {

    return ExcelDataModel.deleteMany(deletePattern).then(deleteRes => {
        return deleteRes;
    }).catch(err => {
        throw err;
    });
}

export const countDocuments = async function (findPattern) {

    return ExcelDataModel.countDocuments(findPattern).then((count) => {
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

    return ExcelDataModel.paginate(query, options).then(async (paginatedData) => {
        return paginatedData;
    }).catch(err => {
        throw err;
    });
}

export const getAggregatePaginatedData = async function (queryPattern, sortPattern, page_no, limit) {

    var query = ExcelDataModel.aggregate(queryPattern);
    var options = {
        sort: sortPattern,
        page: page_no,
        limit: limit
    };

    return ExcelDataModel.aggregatePaginate(query, options).then(resultData => {
        return resultData;
    }).catch(err => {
        throw err;
    });
}

export const aggregateFindOne = async function (queryPattern, sortPattern) {

    var query = ExcelDataModel.aggregate(queryPattern);
    var options = {
        sort: sortPattern,
        page: 1,
        limit: 1
    };

    return ExcelDataModel.aggregatePaginate(query, options).then(resultData => {
        return resultData.docs.length > 0 ? resultData.docs[0] : null;
    }).catch(err => {
        throw err;
    });
}

export const findById = (id, project) =>
    ExcelDataModel.findById(id, project);

export const findExcelData = (condition, project) => {
    return ExcelDataModel.find(condition, project);
}