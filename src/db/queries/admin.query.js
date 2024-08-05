import UsersModel from "../models/user.model";

export const createAdmin = (admin) =>
    UsersModel.create(admin);


export const findAdmin = (condition) =>
    UsersModel.findOne(condition)


export const updateOne = async function (findPattern, updatePattern) {

    return UsersModel.updateOne(findPattern, updatePattern).then(updateRes => {
        return updateRes;
    }).catch(err => {
        throw err;
    });
}