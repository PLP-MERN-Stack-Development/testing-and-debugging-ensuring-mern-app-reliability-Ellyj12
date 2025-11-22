import dotenv from "dotenv";
dotenv.config(); // Load env vars immediately

import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import itemRoutes from "./routes/itemRoutes.js";
import swapRoutes from "./routes/swapRoutes.js";
import helmet from "helmet"; 
import morgan from "morgan";
import categoryRoutes from "./routes/categoryRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import { errorHandler } from "./middlewear/errorHandler.js";
import { notFound } from "./middlewear/notFound.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());

const allowedOrigins = [process.env.CLIENT_URL, "http://localhost:5173"];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());

// Routes
app.get('/health', (req, res) => {
  // You can add logic here to check DB connection state if you want
  // mongoose.connection.readyState === 1 ? ...
  res.status(200).json({ 
    status: 'UP', 
    timestamp: new Date(), 
    uptime: process.uptime() 
  });
});
app.use("/api/auth", authRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/swaps", swapRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.get("/", (req, res) => {
  res.json({ Message: "API is running..." });
});

app.use(notFound);
app.use(errorHandler);

// 2. Strict Async Startup
// Only start the server if the DB connects successfully
const startServer = async () => {
  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan("dev"));
    try {
      await connectDB();
      app.listen(PORT, () => {
        console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
      });
    } catch (error) {
      console.error("Failed to start server due to DB connection error");
      process.exit(1);
    }
  }
};

startServer();

export default app;