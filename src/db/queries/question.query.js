import QuestionModel from "../models/question.model";

export const findOne = (condition) =>
    QuestionModel.findOne(condition);

export const saveData = (data) =>
    QuestionModel.create(data);

export const findById = (id) =>
    QuestionModel.findById(id);

export const findByIdAndUpdate = (id, data, options) =>
    QuestionModel.findByIdAndUpdate(id, data, options);