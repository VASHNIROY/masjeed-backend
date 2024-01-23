import express from "express";
import { getMasjeedTimings } from "../controllers/adminController.js";

export const adminRouter = express.Router();

adminRouter.get("/getmasjeedtimings/:id", getMasjeedTimings);
