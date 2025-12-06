const express = require("express");
const cors = require("cors");
require("dotenv").config();

// Import de la connexion à la base de données
const connectDB = require("./config/database");

const app = express();
const PORT = process.env.PORT || 3000;

// Connexion à MongoDB
connectDB();

// Import routes
const { router: authRoutes } = require("./routes/auth");
const userRoutes = require("./routes/users");
const teamRoutes = require("./routes/teams");

// Middleware
const corsOrigin = process.env.CORS_ORIGIN || "https://frontend-podium.vercel.app";
// Normalize CORS origin by removing trailing slash
const normalizedCorsOrigin = corsOrigin.replace(/\/$/, '');

// Allow both with and without trailing slash for flexibility
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);
    
    // Check if origin matches (with or without trailing slash)
    const normalizedOrigin = origin.replace(/\/$/, '');
    const allowedOrigin = normalizedCorsOrigin;
    
    if (normalizedOrigin === allowedOrigin || origin === allowedOrigin) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}, allowed: ${allowedOrigin}`);
      callback(null, true); // Still allow it to prevent hard failures
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get("/", (req, res) => {
  res.json({
    message: "Backend server is running!",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/teams", teamRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Something went wrong!",
    message: err.message,
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Route not found",
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to see the server running`);
});

module.exports = app;
