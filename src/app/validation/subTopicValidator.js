import Joi from "joi";

export const createSubTopic = Joi.object({
    name: Joi.string().required().messages({
        "string.required": "Topic name is required",
        "any.empty": "Topic name can not be null"
    }),
    parentTopic: Joi.string(),
    tagLine : Joi.string().allow(""),
    question : Joi.string().allow(""),
    solution : Joi.string().allow(""),
    tool_image : Joi.string().allow("")
});

export const updateSubTopic = Joi.object({
    name: Joi.string().messages({
    }),
    tagLine : Joi.string().allow("").messages({
    }),
    question : Joi.string().allow("").messages({
    }),
    solution : Joi.string().allow("").messages({
    }),
    tool_image : Joi.string().allow("").messages({
    })
})