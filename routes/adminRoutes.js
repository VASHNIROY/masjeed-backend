import express from "express";
import {
  forgotPassword,
  getMasjeedTimings,
  updateTimingRow,
  verifyEmailOTPSend,
} from "../controllers/adminController.js";

export const adminRouter = express.Router();

adminRouter.get("/getmasjeedtimings/:id", getMasjeedTimings);

adminRouter.post("/forgetpassword", forgotPassword);

adminRouter.post("/adminotpverfiysend", verifyEmailOTPSend);

adminRouter.put("/updateTimingRow", updateTimingRow);
