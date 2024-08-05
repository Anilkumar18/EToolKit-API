import Joi from "joi";

export const createRootNodeForTransaction = Joi.object({
    questionId: Joi.string().required().messages({
        "string.required": "Question is required",
        "any.empty": "Question can not be null"
    })
});

export const traverseNodeForTransaction = Joi.object({
    fromLink: Joi.string().required().messages({
        "string.required": "condition not found",
        "any.empty": "BAD REQUEST"
    }),
    toNode: Joi.string().required().messages({
        "string.required": "node not found",
        "any.empty": "BAD REQUEST"
    }),
    transactionId: Joi.string().required().messages({
        "string.required": "Transaction not found",
        "any.empty": "BAD REQUEST"
    }),
    metaData : Joi.object()
})