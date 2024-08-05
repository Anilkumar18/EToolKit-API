import Joi from "joi";

export const createQuestion = Joi.object({
    text: Joi.string().required().messages({
        "string.required": "Question is required",
        "any.empty": "Question can not be empty"
    }),
    assumptions: Joi.string().required().messages({
        "string.required": "Assumptions is required",
        "any.empty": "Assumptions can not be empty"
    }),
    screen_tagline: Joi.string().required().messages({
        "string.required": "Screen tagline is required",
        "any.empty": "Screen tagline can not be empty"
    }),
    description: Joi.string().required().messages({
        "string.required": "Description is required",
        "any.empty": "Description can not be empty"
    }),
    summery_report: Joi.string().allow("").messages({
    }),
    icon_logo: Joi.string().allow("").messages({
    }),
    topicId: Joi.string().required().messages({
        "string.required": "Topic is required",
        "any.empty": "Topic can not be null"
    }),
    helpFile: Joi.string().allow(null, '')
});

export const updateQuestion = Joi.object({
    text: Joi.string().required().messages({
        "string.required": "Question is required",
        "any.empty": "Question can not be empty"
    }),
    assumptions: Joi.string().required().messages({
        "string.required": "Assumptions is required",
        "any.empty": "Assumptions can not be empty"
    }),
    screen_tagline: Joi.string().required().messages({
        "string.required": "Screen tagline is required",
        "any.empty": "Screen tagline can not be empty"
    }),
    description: Joi.string().required().messages({
        "string.required": "Description is required",
        "any.empty": "Description can not be empty"
    }),
    summery_report: Joi.string().allow("").messages({
    }),
    icon_logo: Joi.string().allow("").messages({
    }),
    helpFile: Joi.string().allow(null, '')
})