// src/db.js
const mongoose = require('mongoose');
//process.env.MONGO_URI
const connectDB = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/shopyassine', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB connecté');
    } catch (err) {
        console.error('Erreur de connexion à MongoDB:', err.message);
        process.exit(1);
    }
};

module.exports = connectDB;