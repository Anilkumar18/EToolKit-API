import mongoose from "mongoose";

// set mongoose Promise to Bluebird
mongoose.Promise = global.Promise;

// Exit application on error
mongoose.connection.on("error", (err) => {
  console.error(`MongoDB connection error: ${err}`);
  process.exit(-1);
});

/**
 * Connect to mongo db
 *
 * @returns {object} Mongoose connection
 * @public
 */
exports.connect = (envConfig, env) => {
  mongoose.set("debug", false);
  mongoose
    .connect('mongodb://localhost:27017/emate_toolkit_production', {
      useNewUrlParser: true,
      useUnifiedTopology: true, 
      useCreateIndex: true,
      useFindAndModify: false,
    })
    .then(
      () => {
        console.log("Database Connected");
      },
      (err) => {
        console.log("connection issue ", err);
      }
    );
  return mongoose.connection;
};
