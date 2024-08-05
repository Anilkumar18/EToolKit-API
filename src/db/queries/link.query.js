import LinkModel from '../models/link.model';

export const saveData = (data) =>
    LinkModel.create(data);

export const findById = (id) =>
    LinkModel.findById(id);

export const findAndProject = (condition, project) =>
    LinkModel.find(condition, project);

export const findAllAndUpdate = (condition, data, options) =>
    LinkModel.updateMany(condition, data, options);