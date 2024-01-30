import express from "express";
import multer from "multer";
import path from "path";
import {
  addAdminStaff,
  editAdminStaffMember,
  forgotPassword,
  getMasjeedTimings,
  updateMasjeedDetails,
  updateTimingRow,
  verifyEmailOTPSend,
} from "../controllers/adminController.js";

export const adminRouter = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads");
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const upload = multer({ storage: storage });

adminRouter.get("/getmasjeedtimings/:id", getMasjeedTimings);

adminRouter.post("/forgetpassword", forgotPassword);

adminRouter.post("/adminotpverfiysend", verifyEmailOTPSend);

adminRouter.put("/updateTimingRow", updateTimingRow);

adminRouter.put(
  "/updatemasjeeddetails",
  upload.single("file"),
  updateMasjeedDetails
);

adminRouter.post("/addadminstaff", addAdminStaff);

adminRouter.put("/editadminstaffmember/:id", editAdminStaffMember);
