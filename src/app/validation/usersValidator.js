import Joi from 'joi'

export const registerSchema = Joi.object({
  email: Joi.string().email({ minDomainSegments: 2 }).required().messages({
    "any.empty": "Please enter valid email",
    "any.required": "Email is required",
    "string.email": "Email must be a valid string",
  }),
  password: Joi.string().min(8).max(64).required().messages({
    "string.min": "Password length must be greater then 8",
    "string.max": "Password length must be less or equal to 64",
    "any.required": "Password is required",
  }),
  firstName: Joi.string().min(1).max(32).required().messages({
    "string.min": "first-name character length must be greater then 1",
    "string.max": "first-name character length must be less or equal to 32",
    "any.required": "first-name is required",
  }),
  lastName: Joi.string().min(1).max(32).required().messages({
    "string.min": "last-name character length must be greater then 1",
    "string.max": "last-name character length must be less or equal to 32",
    "any.required": "last-name is required",
  }),
  countryCode: Joi.string().max(4).required().messages({
    "string.max": "country-code must be valid string",
    "string.required": "country-code is required",
  }),
  phone: Joi.string().max(12).required().messages({
    "string.max": "phone-number must be valid",
    "string.required": "phone-number is required",
  }),
});

export const loginSchema = Joi.object({
  email: Joi.string().email({ minDomainSegments: 2 }).messages({
    "string.email": "Email must be a valid string"
  }),
  password: Joi.string().min(8).max(64).messages({
    "string.min": "Password length must be greater then 8",
    "string.max": "Password length must be less or equal to 64"
  }),
  firstName: Joi.string().min(1).max(32).messages({
    "string.min": "first-name character length must be greater then 1",
    "string.max": "first-name character length must be less or equal to 32",
  }),
  lastName: Joi.string().min(1).max(32).messages({
    "string.min": "last-name character length must be greater then 1",
    "string.max": "last-name character length must be less or equal to 32",
  }),
  loginWith: Joi.string().valid('email', 'gmail', 'apple', 'linkedin').required().messages({
    "any.only": "Your login type is invalid",
    "any.required": "Login type is missing"
  }),
  profilePicture: Joi.any(),
  appleUserId: Joi.string()
});

export const forgetPasswordSchema = Joi.object({
  email: Joi.string().email({ minDomainSegments: 2 }).required().messages({
    "any.empty": "Please enter valid email",
    "any.required": "Email is required",
    "string.email": "Email must be a valid string",
  }),
});

export const resetPasswordSchema = Joi.object({
  password: Joi.string().min(8).max(64).required().messages({
    "string.min": "Password length must be greater then 8",
    "string.max": "Password length must be less or equal to 64",
    "any.required": "Password is required",
  }),
  token: Joi.string(),
});

export const changePasswordSchema = Joi.object({
  newPassword: Joi.string().min(8).max(64).required().messages({
    "string.min": "Password length must be greater then 8",
    "string.max": "Password length must be less or equal to 64",
    "any.required": "Password is required",
  }),
});

export const updateUserSchema = Joi.object({
  firstName: Joi.string().min(1).max(32).messages({
    "string.min": "first-name character length must be greater then 1",
    "string.max": "first-name character length must be less or equal to 32",
  }),
  lastName: Joi.string().min(1).max(32).messages({
    "string.min": "last-name character length must be greater then 1",
    "string.max": "last-name character length must be less or equal to 32",
  }),
});


export const createUser = Joi.object({
  firstName: Joi.string().min(1).max(32).required().messages({
    "string.min": "first-name character length must be greater then 1",
    "string.max": "first-name character length must be less or equal to 32",
    "any.required": "first-name is required",
  }),
  lastName: Joi.string().min(1).max(32).required().messages({
    "string.min": "last-name character length must be greater then 1",
    "string.max": "last-name character length must be less or equal to 32",
    "any.required": "last-name is required",
  }),
  countryCode: Joi.string().max(4).required().messages({
    "string.max": "country-code must be valid string",
    "string.required": "country-code is required",
  }),
  phone: Joi.string().max(12).required().messages({
    "string.max": "phone-number must be valid",
    "string.required": "phone-number is required",
  }),
  email: Joi.string().email({ minDomainSegments: 2 }).required().messages({
    "any.empty": "Please enter valid email",
    "any.required": "Email is required",
    "string.email": "Email must be a valid string",
  }),
  designation: Joi.string().min(3).max(32).required().messages({
    "string.min": "user title character length must be greater then 3",
    "string.max": "user title character length must be less or equal to 32",
    "any.required": "user title is required",
  }),
  userRole: Joi.array().required().messages({
    "any.required": "User role is required",
  }),
  password: Joi.string().min(8).max(64).required().messages({
    "string.min": "Password length must be greater then 8",
    "string.max": "Password length must be less or equal to 64",
    "any.required": "Password is required",
  }),
  organizationId: Joi.string()
});

export const updateUser = Joi.object({
  firstName: Joi.string().min(1).max(32).required().messages({
    "string.min": "first-name character length must be greater then 1",
    "string.max": "first-name character length must be less or equal to 32",
    "any.required": "first-name is required",
  }),
  lastName: Joi.string().min(1).max(32).required().messages({
    "string.min": "last-name character length must be greater then 1",
    "string.max": "last-name character length must be less or equal to 32",
    "any.required": "last-name is required",
  }),
  countryCode: Joi.string().max(4).required().messages({
    "string.max": "country-code must be valid string",
    "string.required": "country-code is required",
  }),
  phone: Joi.string().max(12).required().messages({
    "string.max": "phone-number must be valid",
    "string.required": "phone-number is required",
  }),
  designation: Joi.string().min(3).max(32).required().messages({
    "string.min": "user title character length must be greater then 3",
    "string.max": "user title character length must be less or equal to 32",
    "any.required": "user title is required",
  }),
  userRole: Joi.array().required().messages({
    "any.required": "User role is required",
  }),
});

export const resetUserPasswordSchema = Joi.object({
  password: Joi.string().min(8).max(64).required().messages({
    "string.min": "Password length must be greater then 8",
    "string.max": "Password length must be less or equal to 64",
    "any.required": "Password is required",
  }),
});
