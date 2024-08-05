import Joi from 'joi'

export const createOrganization = Joi.object({
    // email: Joi.string().email({
    //     minDomainSegments: 2
    // }).required().messages({
    //     "any.empty": "Please enter valid email",
    //     "any.required": "Email is required",
    //     "string.email": "Email must be a valid string",
    // }),
    // password: Joi.string().min(8).max(64).required().messages({
    //     "string.min": "Password length must be greater then 8",
    //     "string.max": "Password length must be less or equal to 64",
    //     "any.required": "Password is required",
    // }),
    // firstName: Joi.string().min(1).max(32).required().messages({
    //     "string.min": "first-name character length must be greater then 1",
    //     "string.max": "first-name character length must be less or equal to 32",
    //     "any.required": "first-name is required",
    // }),
    // lastName: Joi.string().min(1).max(32).required().messages({
    //     "string.min": "last-name character length must be greater then 1",
    //     "string.max": "last-name character length must be less or equal to 32",
    //     "any.required": "last-name is required",
    // }),
    // countryCode: Joi.string().max(4).required().messages({
    //     "string.max": "country-code must be valid string",
    //     "string.required": "country-code is required",
    // }),
    // phone: Joi.string().max(12).required().messages({
    //     "string.max": "phone-number must be valid",
    //     "string.required": "phone-number is required",
    // }),
    companyName: Joi.string().required().messages({
        "string.required": "company name is required",
        "any.empty": "company name can not be null"
    }),
    geographicScope: Joi.string().required().messages({
        "string.required": "geographic scope is required",
        "any.empty": "geographic scope can not be null"
    }),
    overAllRevenue: Joi.number().required().messages({
        "string.required": "overAll Revenue is required",
        "any.empty": "overAll Revenue can not be null"
    }),
    city: Joi.string().required().messages({
        "string.required": "city is required",
        "any.empty": "city can not be null"
    }),
    // state: Joi.array().required().messages({
    //     "string.required": "state is required",
    //     "any.empty": "state can not be null"
    // }),
    // products: Joi.array().required().messages({
    //     "string.required": "products is required",
    //     "any.empty": "product can not be null"
    // }),
    eCommerceRevenuePercentage: Joi.number().required().messages({
        "string.required": "eCommerceRevenuePercentage is required",
        "any.empty": "eCommerceRevenuePercentage can not be null"
    }),
    traditionalRetailRevenuePercentage: Joi.number().required().messages({
        "string.required": "traditionalRetailRevenuePercentage is required",
        "any.empty": "traditionalRetailRevenuePercentage can not be null"
    }),
    eCommerceUnit: Joi.number().required().messages({
        "string.required": "eCommerceUnit is required",
        "any.empty": "eCommerceUnit can not be null"
    }),
    traditionalRetailUnit: Joi.number().required().messages({
        "string.required": "traditionalRetailUnit is required",
        "any.empty": "traditionalRetailUnit can not be null"
    }),
    salesChannelUtilized: Joi.string().required().messages({
        "string.required": "sales channel utilization is required",
        "any.empty": "sales channel utilization can not be null"
    }),
    iconLogo: Joi.string().allow("").messages({
    }),
    metaData : Joi.array()
});

export const updateOrganization = Joi.object({
    companyName: Joi.string().messages({}),
    geographicScope: Joi.string().messages({}),
    overAllRevenue: Joi.number().messages({}),
    city: Joi.string().messages({}),
    state: Joi.array().messages({}),
    products: Joi.array().messages({}),
    eCommerceRevenuePercentage: Joi.number().messages({}),
    traditionalRetailRevenuePercentage: Joi.number().messages({}),
    eCommerceUnit: Joi.number().messages({}),
    traditionalRetailUnit: Joi.number().messages({}),
    salesChannelUtilized: Joi.string().messages({}),
    iconLogo: Joi.string().allow("").messages({
    }),
});