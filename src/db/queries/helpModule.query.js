
import HelpModuleModel from "../models/help.model";

export const findByIdAndUpdate = async function (findPattern, updatePattern, selectPattern = "") {

    var options = {
        new: true,
        runValidators: true,
        select: selectPattern
    };

    return HelpModuleModel.findByIdAndUpdate(findPattern, updatePattern, options).then(updatedData => {
        return updatedData;
    }).catch(err => {
        throw err;
    });
}

export const findOne = async function (findPattern, selectPattern = "", populatePattern = null) {

    var query = HelpModuleModel.findOne(findPattern, selectPattern);

    if (populatePattern) {
        query.populate(populatePattern);
    }

    return query.then(resultData => {
        return resultData;
    }).catch(err => {
        throw err;
    });
}

export const findAll = async function (findPattern, selectPattern = "", populatePattern = null, sortPattern = null) {

    var query = HelpModuleModel.find(findPattern, selectPattern)
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

export const create = async function (createPattern) {

    return HelpModuleModel.create(createPattern).then(createRes => {
        return createRes;
    }).catch(err => {
        throw err;
    });
}