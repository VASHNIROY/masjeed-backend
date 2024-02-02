import express from "express";
import multer from "multer";
import path from "path";
import {
  addAdminStaff,
  adminLogin,
  editAdminStaffMember,
  editIqamah,
  forgotPassword,
  getIqamahDetails,
  getMasjeedDetails,
  getMasjeedTimings,
  updateMasjeedDetails,
  updateTimingRow,
  verifyEmailOTPSend,
} from "../controllers/adminController.js";
import { isAuthenticatedAdmin } from "../middleware/auth.js";

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

adminRouter.post("/adminlogin", adminLogin);

adminRouter.get("/getmasjeedtimings/:id",isAuthenticatedAdmin, getMasjeedTimings);

adminRouter.post("/forgetpassword", forgotPassword);

adminRouter.post("/adminotpverfiysend", verifyEmailOTPSend);

adminRouter.put("/updateTimingRow", isAuthenticatedAdmin, updateTimingRow);

adminRouter.put(
  "/updatemasjeeddetails",
  upload.single("file"),
  isAuthenticatedAdmin,
  updateMasjeedDetails
);

adminRouter.get("/getmasjeeddetails/:id",isAuthenticatedAdmin, getMasjeedDetails);

adminRouter.post("/addadminstaff",isAuthenticatedAdmin, addAdminStaff);

adminRouter.put("/editadminstaffmember/:id", isAuthenticatedAdmin, editAdminStaffMember);

adminRouter.put("/editIqamah/:id", isAuthenticatedAdmin, editIqamah);

adminRouter.get("/getiqamahtimigs/:id", isAuthenticatedAdmin, getIqamahDetails);
