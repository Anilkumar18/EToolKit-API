import MultiSelectorModel from "../models/multiSelector.model";

export const findAll = (condition) =>
    MultiSelectorModel.find(condition);

export const saveData = (data) =>
    MultiSelectorModel.create(data);