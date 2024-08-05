const mongoose = require('mongoose');

const DataSchema = new mongoose.Schema({
  date: {
    type: string,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  amount: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('Data', DataSchema);
