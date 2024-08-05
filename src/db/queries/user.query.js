import UsersModel from "../models/user.model";

export const getUserDetails = (userId) => UsersModel.findById(userId);

export const findById = (id) =>
    UsersModel.findById(id);

export const saveData = (data) => UsersModel.create(data);

export const findByIdAndUpdate = (condition, data, options) => UsersModel.findByIdAndUpdate(condition, data, options);

export const deleteOne = (condition) => UsersModel.deleteOne(condition);

export const findOne = (findPattern, selectPattern = "", populatePattern = null, populateFields = "") => {

    var query = UsersModel.findOne(findPattern, selectPattern);

    if (populatePattern) {
        query.populate(populatePattern, populateFields);
    }

    return query.then(resultData => {
        return resultData;
    }).catch(err => {
        throw err;
    });
}

export const getAggregatePaginatedData = (queryPattern, sortPattern, page_no, limit) => {

    var query = UsersModel.aggregate(queryPattern);
    var options = {
        sort: sortPattern,
        page: page_no,
        limit: limit
    };

    return UsersModel.aggregatePaginate(query, options).then(resultData => {
        return resultData;
    }).catch(err => {
        throw err;
    });
}

export const aggregateFindOne = (queryPattern, sortPattern) => {

    var query = UsersModel.aggregate(queryPattern);
    var options = {
        sort: sortPattern,
        page: 1,
        limit: 1
    };

    return UsersModel.aggregatePaginate(query, options).then(resultData => {
        return resultData.docs.length > 0 ? resultData.docs[0] : null;
    }).catch(err => {
        throw err;
    });
}

export const updateOne = async function (findPattern, updatePattern) {

    return UsersModel.updateOne(findPattern, updatePattern).then(updateRes => {
        return updateRes;
    }).catch(err => {
        throw err;
    });
}

export const countDocs = (condition) =>
    UsersModel.countDocuments(condition);