import UserTransactionModel from "../models/userTransaction.model";
import mongoose from 'mongoose'

export const findOne = (condition) =>
    UserTransactionModel.findOne(condition);

export const saveData = (data) =>
    UserTransactionModel.create(data);

export const findByIdAndUpdate = (id, data, options) =>
    UserTransactionModel.findByIdAndUpdate(id, data, options);

export const findAll = (condition) =>
    UserTransactionModel.find(condition).sort({createdAt : -1});

export const findById = (id) =>
    UserTransactionModel.findById(id)

export const findDistinct = (condition, distinctionField) =>
    UserTransactionModel.find(condition).distinct(distinctionField);

export const findAllAndAggregate = (aggregationPipe) =>
    UserTransactionModel.aggregate(aggregationPipe);

export const count = (condition) =>
    UserTransactionModel.countDocuments(condition)

export const countTransactionByAggregate = (transactionId) =>
    UserTransactionModel.aggregate([
        {
            "$match" : {
                $and : [
                    { _id : mongoose.Types.ObjectId(transactionId) },
                    { isActive : true }
                ]
            }
        },
        {
            "$project" : {
                docCount : {
                    "$size" : "$traverseNodes"
                }
            }
        }
    ])