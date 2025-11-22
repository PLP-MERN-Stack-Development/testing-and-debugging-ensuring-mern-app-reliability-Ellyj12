import mongoose from "mongoose";

// Allow index builds in non-production environments so new indexes are created automatically.
mongoose.set("autoIndex", process.env.NODE_ENV !== "production");

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            // PRODUCTION SETTINGS
            maxPoolSize: 50,       // Max 50 connections
            minPoolSize: 10,       // Maintain 10 open connections
            serverSelectionTimeoutMS: 5000, // Fail fast (5s) if DB is down
            socketTimeoutMS: 45000, // Close idle sockets
        });

        if (process.env.NODE_ENV !== 'test') {
            console.log(`MongoDB Connected: ${conn.connection.host} ✅`);
        }
        
        return conn; // Return connection for flexibility

    } catch (error) {
        console.error(`Error: ${error.message}`);
        // CRITICAL: Exit process with failure so orchestrator (Docker/K8s) restarts it
        process.exit(1);
    }
};

export default connectDB;