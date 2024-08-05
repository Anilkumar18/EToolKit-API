import Joi from "joi";

export const uploadFile = Joi.object({
    fileName: Joi.string().required().messages({
        "string.required": "File name is required",
        "any.empty": "File name can not be null"
    })
});