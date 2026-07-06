import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import attributeRoutes from "./routes/attributeRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import positionRoutes from "./routes/positionRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import { ENV } from "./utils/env.js";

const app = express();

// app.use(cors({ origin: ENV.FRONTEND_URL, credentials: true }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/attributes", attributeRoutes);
app.use("/api/positions", positionRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/projects", projectRoutes);

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    status: "server is running...",
    timestamp: new Date(),
  });
});

app.listen(ENV.PORT, () => {
  console.log(`Server is running on http://localhost:${ENV.PORT}`);
});
