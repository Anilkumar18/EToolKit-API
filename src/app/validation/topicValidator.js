import Joi from "joi";

export const createTopic = Joi.object({
    name: Joi.string().required().messages({
        "string.required": "Topic name is required",
        "any.empty": "Topic name can not be null"
    })
});

export const updateTopic = Joi.object({
    name: Joi.string().messages({
    })
})