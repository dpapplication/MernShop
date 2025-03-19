
const mongoose = require('mongoose') ;

const ServiceSchema= new mongoose.Schema({
  nom: { type: String, required: true },
  prix: { type: Number, required: true },
})

module.exports = mongoose.model('service',ServiceSchema)