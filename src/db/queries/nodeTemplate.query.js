import NodeTemplateModel from "../models/nodeTemplate.model";

export const findOne = (condition) =>
    NodeTemplateModel.findOne(condition);