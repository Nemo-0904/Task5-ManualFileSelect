const mongoose = require('mongoose');
require('dotenv').config(); // Load environment variables from .env

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI); // Uses environment variable
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`MongoDB Connection Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
