import NodeTemplateTransactionModel from "../models/nodeTemplateTransaction.model";

export const saveData = (data) =>
    NodeTemplateTransactionModel.create(data);

export const findById = (id) =>
    NodeTemplateTransactionModel.findById(id)