module.exports.joiQueryMiddleware = (schema, key) => {
    return (req, res, next) => {
        try {
            let requestBody = req.query;
            if (key) {
                requestBody = req.query[key];
            }
            const { error } = schema.validate(requestBody);
            if (error) {
                res.status(status_codes.BAD_REQUEST).send(Response.sendResponse(status_codes.BAD_REQUEST, "Validator Error", [], error));
            } else
                next();
        } catch (err) {
            res.status(status_codes.BAD_REQUEST).send(Response.sendResponse(status_codes.BAD_REQUEST, "Validator Error", [], error));
        }
    };
};
module.exports.joiBodyMiddleware = (schema, key) => {
    return (req, res, next) => {
        try {
            let requestBody = req.body;
            if (key) {
                requestBody = req.body[key];
            }
            if (!requestBody) {
                res.status(status_codes.BAD_REQUEST).send(Response.sendResponse(status_codes.BAD_REQUEST, "Please enter valid inputs", [], error));

            } else {
                console.log("validator", schema.validate(requestBody))
                const { error } = schema.validate(requestBody);
                if (error) {
                    res.status(status_codes.BAD_REQUEST).send(Response.sendResponse(status_codes.BAD_REQUEST, error.details[0].message, [], []));
                } else
                    next();
            }
        } catch (err) {
            console.log('error', err);
            res.serverError(404, { error: ErrorHandler(err) });
        }
    };
};