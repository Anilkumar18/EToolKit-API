"use strict";

import ReportTemplateModel from "../models/reportTemplate.model";

export const create = async function (createPattern) {

    return ReportTemplateModel.create(createPattern).then(createRes => {
        return createRes;
    }).catch(err => {
        throw err;
    });
}

export const insertMany = async function (insertPattern) {

    return ReportTemplateModel.insertMany(insertPattern).then(insertRes => {
        return insertRes;
    }).catch(err => {
        throw err;
    });
}

export const updateOne = async function (findPattern, updatePattern) {

    return ReportTemplateModel.updateOne(findPattern, updatePattern).then(updateRes => {
        return updateRes;
    }).catch(err => {
        throw err;
    });
}

export const updateMany = async function (findPattern, updatePattern) {

    return ReportTemplateModel.updateMany(findPattern, updatePattern).then(updateRes => {
        return updateRes;
    }).catch(err => {
        throw err;
    });
}

export const findOneAndUpdate = async function (findPattern, updatePattern, selectPattern = "") {

    var options = {
        new: true,
        select: selectPattern
    };

    return ReportTemplateModel.findOneAndUpdate(findPattern, updatePattern, options).then(updatedData => {
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

    return ReportTemplateModel.findOneAndUpdate(findPattern, updatePattern, options).then(updatedData => {
        return updatedData;
    }).catch(err => {
        throw err;
    });
}

export const findOne = async function (findPattern, selectPattern = "", populatePattern = null) {

    var query = ReportTemplateModel.findOne(findPattern, selectPattern);

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

    var query = ReportTemplateModel.find(findPattern, selectPattern);

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

    return ReportTemplateModel.deleteOne(deletePattern).then(deleteRes => {
        return deleteRes;
    }).catch(err => {
        throw err;
    });
}

export const deleteMany = async function (deletePattern) {

    return ReportTemplateModel.deleteMany(deletePattern).then(deleteRes => {
        return deleteRes;
    }).catch(err => {
        throw err;
    });
}

export const countDocuments = async function (findPattern) {

    return ReportTemplateModel.countDocuments(findPattern).then((count) => {
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

    return ReportTemplateModel.paginate(query, options).then(async (paginatedData) => {
        return paginatedData;
    }).catch(err => {
        throw err;
    });
}