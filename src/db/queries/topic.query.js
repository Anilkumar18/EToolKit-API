import TopicModel from "../models/topic.model";
import mongoose from "mongoose";


export const saveData = (data) =>
    TopicModel.create(data);

export const findById = (id) =>
    TopicModel.findById(id);

export const findByIdAndUpdate = (id, data, options) =>
    TopicModel.findByIdAndUpdate(id, data, options);

export const findAllAndPopulate = (condition) =>
    TopicModel.find(condition)
        .populate({
            model: 'users',
            path: "createdBy",
            select: "firstName lastName"
        })
        .populate({
            model: 'users',
            path: "updatedBy",
            select: "firstName lastName"
        });

export const findByIdAndPopulate = (id) =>
    TopicModel.findById(id)
        .populate({
            model: 'users',
            path: "createdBy",
            select: "firstName lastName"
        })
        .populate({
            model: 'users',
            path: "updatedBy",
            select: "firstName lastName"
        });

export const findAllAndAggregate = (condition1, condition2) =>
    TopicModel.aggregate([
        {
            $match: {
                $and: [
                    condition1,
                    condition2
                ]
            }
        },
        {
            "$addFields": {
                "parentTopicId": {
                    "$toObjectId": "$_id"
                }
            }
        },
        {
            '$lookup': {
                from: 'topics',
                let: {
                    topicId: "$parentTopicId"
                },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$isActive", true] },
                                    { $eq: ["$parentTopic", "$$topicId"] }
                                ]
                            }
                        }
                    }
                ],
                as: 'subTopics',
            }
        },
        {
            $project: {
                "name": 1,
                "createdAt": 1,
                "updatedAt": 1,
                "subTopicsCount": { "$cond": { if: { $isArray: "$subTopics" }, then: { "$size": "$subTopics" }, else: 0 } }
            }
        }
    ]);

export const findByIdAndAggregate = (id) =>
    TopicModel.aggregate([
        {
            "$match": {
                _id: mongoose.Types.ObjectId(id)
            }
        },
        {
            '$lookup': {
                from: 'topics',
                localField: '_id',
                foreignField: 'parentTopic',
                as: 'subTopics',
            }
        },
        {
            "$unwind": "$subTopics"
        },
        {
            $match: {
                "subTopics.isActive": true
            }
        },
        {
            '$lookup': {
                from: 'questions',
                let: {
                    subTopicId: "$subTopics._id"
                },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$isActive", true] },
                                    { $eq: ["$topicId", "$$subTopicId"] }
                                ]
                            }
                        }
                    }
                ],
                as: 'subTopics.questions',
            }
        },
        {
            $project: {
                _id: 1,
                name: 1,
                createdAt: 1,
                updatedAt: 1,
                "subTopics._id": 1,
                "subTopics.name": 1,
                "subTopics.updatedAt": 1,
                "subTopics.questionCount": { $size: "$subTopics.questions" }
            }
        },
        {
            $group: {
                "_id": "$_id",
                "name": { "$first": "$name" },
                "createdAt": { "$first": "$createdAt" },
                "updatedAt": { "$first": "$updatedAt" },
                "subTopics": { "$push": "$subTopics" }
            }
        }
    ]);

export const findOne = (condition) =>
    TopicModel.findOne(condition);

export const deleteById = (id, condition, options) =>
    TopicModel.findByIdAndUpdate(id, condition, options);

export const findSubTopicById = (id) =>
    TopicModel.aggregate([
        {
            "$match": {
                $and: [
                    { _id: mongoose.Types.ObjectId(id) },
                    { isActive: true }
                ]
            }
        },
        {
            "$addFields": {
                "questionTopicId": {
                    "$toObjectId": "$_id"
                }
            }
        },
        {
            '$lookup': {
                from: 'questions',
                let: {
                    questionsTopicId: "$questionTopicId"
                },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$isActive", true] },
                                    { $eq: ["$topicId", "$$questionsTopicId"] }
                                ]
                            }
                        }
                    }
                ],
                as: 'questions'
            }
        },
        {
            "$unwind": {
                "path" : "$questions",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            '$lookup': {
                from: 'users',
                localField: 'questions.updatedBy',
                foreignField: '_id',
                as: 'questions.modifiedBy'
            }
        },
        {
            "$unwind": {
                "path" : "$questions.modifiedBy",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            '$lookup': {
                from: 'helpModules',
                let: { questionId: '$questions._id' }, 
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ['$questionId', '$$questionId'] }
                        }
                    }
                ],
                as: 'questions.helpInfo'
            }
        },
        {
            "$unwind": {
                "path" : "$questions.helpInfo",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            "$project": {
                "_id": 1,
                "name": 1,
                "tagLine" : 1,
                "question" : 1,
                "solution" : 1,
                "tool_image" : 1,
                "questions" : {
                    "_id": 1,
                    "text": 1,
                    "assumptions": 1,
                    "screen_tagline": 1,
                    "description": 1,
                    "summery_report": 1,
                    "icon_logo": 1,
                    "topicId": 1,
                    "modifiedBy.firstName": 1,
                    "modifiedBy.lastName": 1,
                    "updatedAt": 1,
                    "helpInfo": 1
                }
            }
        },
        {
            "$group": {
                "_id": "$_id",
                "name": { "$first": "$name" },
                "tagLine": { "$first": "$tagLine" },
                "question": { "$first": "$question" },
                "solution": { "$first": "$solution" },
                "tool_image": { "$first": "$tool_image" },
                "questions": { "$push": "$questions" }
            }
        }
    ])


export const countDocs = (condition) =>
    TopicModel.countDocuments(condition);