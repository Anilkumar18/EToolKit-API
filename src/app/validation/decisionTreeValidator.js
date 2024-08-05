import Joi from "joi";

export const createDecisionTree = Joi.object({
    linkDataArray: Joi.array().min(1).messages({
        "any.required": "links are required",
        "array.min": "Please provide links, it can not be empty"
    }),
    questionId: Joi.string().required().messages({
        "string.required": "Question is required",
        "any.empty": "Question can not be null"
    }),
    nodeDataArray: Joi.array().min(1).required().messages({
        "any.required": "Nodes are required",
        "array.min": "Please provide nodes, it can not be empty"
    })
});

export const updateQuestion = Joi.object({
    text: Joi.string().messages({
    })
})

export const updateDecisionTree = Joi.object({
    linkDataArray: Joi.array().min(1).messages({
        "any.required": "links are required",
        "array.min": "Please provide links, it can not be empty"
    }),
    questionId: Joi.string().required().messages({
        "string.required": "Question is required",
        "any.empty": "Question can not be null"
    }),
    nodeDataArray: Joi.array().min(1).required().messages({
        "any.required": "Nodes are required",
        "array.min": "Please provide nodes, it can not be empty"
    })
});