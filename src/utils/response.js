class Response {
  static sendResponse(code, message, data, error) {
    var response = {};
    response.code = code;
    response.message = message;
    response.data = data;
    response.error = error;
    return response;
  }
}

module.exports = Response;
