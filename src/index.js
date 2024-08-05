"use strict";

import express from "express";
import bodyParser from "body-parser";
import morgan from "morgan";
import cors from "cors";
import passport from "passport";
import path from "path";
import https from "https";
import fs from "fs";
import environment from "../environment";
import mongoose from "./config/mongoose";
import error from "./middleware/error";
import routes from "./app/routes/";

const csv = require('csv-parser');
import axios from 'axios';

var dir = __dirname + "/public/upload/";
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// getting application environment
const env = process.env.NODE_ENV;

// getting application config based on environment
const envConfig = environment[env];

// setting port value
const PORT = envConfig.port || 4009;

/**
 * Express instance
 * @public
 */
const app = express();

// app.use(function (req, res, next) {

//     res.setHeader('Access-Control-Allow-Origin', '*');
//     res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
//     res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
//     res.setHeader('Access-Control-Allow-Credentials', true);
//     next();
// });

if (!global.status_codes) global.status_codes = require("./utils/statusCode");

if (!global.custom_message) global.custom_message = require("./config/message");

if (!global.Response) global.Response = require("./utils/response");

if (!global.config) global.config = require("./config/config");

app.use(passport.initialize());
app.use(passport.session());

// open mongoose connection
mongoose.connect(envConfig, env);

// request logging. dev: console | production: file
app.use(morgan(envConfig.logs));

app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

app.use("/", express.static(path.join(__dirname, "/public")));
app.use("/image-nearshore", express.static(path.join(__dirname, "./views/images")));
app.use("/report", express.static(path.join(__dirname, "../src/public/reports")));
app.use("/helpPage", express.static(path.join(__dirname, "../src/public/helpModule")));
app.use("/sampleFile", express.static(path.join(__dirname, "../src/public/sampleFiles")))

// CORS configuration
app.use(cors({ origin: "*" }));

app.get("/check123", (req, res) => {
  console.log("PROTOCOL====", req.protocol);
  console.log("HOST=====", req.get("host"));
  console.log("HOSTNAME====", req.hostname);
  res.status(status_codes.OK).send(Response.sendResponse(status_codes.OK, "Server is good now !!!!!!", [], []));
});

app.get('/api/csv-data', async (req, res) => {
  const results = [];
  let isFirstRow = true;
  const url = 'http://54.82.233.151/Output/CMData.csv';
  const filePath = path.join(__dirname, 'pages', 'CMData.csv');

  try {
    // Download the file and save it locally
    const response = await axios({
      method: 'get',
      url: url,
      responseType: 'stream'
    });

    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    writer.on('finish', () => {
      console.log(`File downloaded to ${filePath}`);

      // Read the file and parse it
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => {
            if (isFirstRow) {
              isFirstRow = false;
            } else {
              if (isFirstRow) {
                    isFirstRow = false;
                  } else {
                    const updatedData = {};
                    let columnIndex = 0;
                    for (const key in data) {
                      columnIndex++;
                      if (columnIndex !== 3) {
                        updatedData[key] = data[key];
                      }
                    }
                    results.push(updatedData);
                  }
                 }
          })
        .on('end', () => {
          res.status(200).json(results);
        })
        .on('error', (err) => {
          res.status(500).json({ error: err.message });
        });
    });

    writer.on('error', (err) => {
      res.status(500).json({ error: err.message });
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// mount api routes
app.use("/", routes);
// if error is not an instanceOf APIError, convert it.
app.use(error.converter);
app.use(error.notFound);

// error handler, send stacktrace only during development
app.use(error.handler);


// process.env.PORT
app.listen(PORT, () => {
  console.log("server listen on port:-", PORT);
});

module.exports = app;
