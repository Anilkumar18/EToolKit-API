import SampleFileModel from "../models/sampleFile.model";

export const saveData = (data) =>
    SampleFileModel.create(data);

export const findAll = (condition) =>
    SampleFileModel.find(condition);

export const findOne = (condition) =>
    SampleFileModel.findOne(condition);

export const findAllAndProject = (condition, project) =>
    SampleFileModel.find(condition, project);

export const insertMany = (data) =>
    SampleFileModel.insertMany(data);

export const updateOne = (condition, data) =>
    SampleFileModel.updateOne(condition, data);

export const findByIdAndUpdate = (condition, data, options) =>
    SampleFileModel.findByIdAndUpdate(condition, data, options);

export const findOneAndUpdate = (condition, data, options) =>
    SampleFileModel.findOneAndUpdate(condition, data, options);