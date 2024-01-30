import express from "express";
import multer from "multer";
import path from "path";

import {
  addMasjeed,
  databaseCities,
  databaseCountries,
  databaseMasjeeds,
  databaseStates,
  todaySchedule,
} from "../controllers/webControllers.js";

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

export const webRouter = express.Router();

webRouter.post("/addmasjeed", upload.single("file"), addMasjeed);

webRouter.get("/getTodaySchedule/:id", todaySchedule);

webRouter.get("/getCountries", databaseCountries);

webRouter.post("getStates", databaseStates);

webRouter.post("/getCities", databaseCities);

webRouter.post("/getwebmasjeeds", databaseMasjeeds);
