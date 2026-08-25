const mongoose = require('mongoose');

let connectionPromise = null; 

const connectDB = async () => {
    if (mongoose.connection.readyState === 1) {
        return;
    }

    if (!connectionPromise) {
        const connectionPromise = mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000
        })

            .then((conn) => {
                console.log(`MongoDB connected : ${conn.connection.host}`);
            })

            .catch ((error) => {
                connectionPromise = null;
                console.error(`MongoDB connection failed : ${error.message}`);
                throw error;
        });
    }

    await connectionPromise;
};

module.exports = connectDB;