import express from "express";
import {
  approveMasjeed,
  masjeedsList,
  superAdminLogin,
  superAdminRegistration,
} from "../controllers/superAdminController.js";
import { isAuthenticatedSuperAdmin } from "../middleware/auth.js";

export const superadminrouter = express.Router();

superadminrouter.post("/superadminregistration", superAdminRegistration);

superadminrouter.post("/superadminlogin", superAdminLogin);

superadminrouter.get("/getmasjeeds", isAuthenticatedSuperAdmin, masjeedsList);

superadminrouter.get(
  "/approvemasjeed/:id",
  isAuthenticatedSuperAdmin,
  approveMasjeed
);