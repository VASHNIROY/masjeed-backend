import express from "express";
import {
  forgotPassword,
  getMasjeedTimings,
  updateMasjeedDetails,
  updateTimingRow,
  verifyEmailOTPSend,
} from "../controllers/adminController.js";

export const adminRouter = express.Router();

adminRouter.get("/getmasjeedtimings/:id", getMasjeedTimings);

adminRouter.post("/forgetpassword", forgotPassword);

adminRouter.post("/adminotpverfiysend", verifyEmailOTPSend);

adminRouter.put("/updateTimingRow", updateTimingRow);

adminRouter.put("/updatemasjeeddetails/:id", updateMasjeedDetails);

