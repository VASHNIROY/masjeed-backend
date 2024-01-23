import express from "express";
import multer from "multer";
import bodyParser from "body-parser";
import cors from "cors";

import { webRouter } from "./routes/webRoutes.js";
import ErrorMiddleware from "./middleware/error.js";
import { superadminrouter } from "./routes/superAdminRoutes.js";
import { adminRouter } from "./routes/adminRoutes.js";

export const app = express();
app.use(express.json());
app.use(express.static("uploads"));
app.use(cors());
app.use(bodyParser.json());

app.use("/api/v1", webRouter, superadminrouter, adminRouter);

app.get("/test", (req, res, next) => {
  res.status(200).json({
    success: true,
    message: "API is Working",
  });
});

app.use(ErrorMiddleware);
