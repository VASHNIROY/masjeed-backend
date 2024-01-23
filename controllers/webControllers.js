import ErrorHandler from "../utils/ErrorHandler.js";
import { connection } from "../utils/db.js";
import CatchAsyncError from "../middleware/catchAsyncError.js";
import { fileURLToPath } from "url";

import xlsx from "xlsx";
import path from "path";

import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const addMasjeed = CatchAsyncError(async (req, res, next) => {
  try {
    const filename = req.file ? req.file.filename : null;

    const {
      name,
      address,
      email,
      postalcode,
      city,
      state,
      country,
      phonenumber,
    } = req.body;

    if (!filename) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    const addMasjeedQuery = `INSERT INTO masjeed (name,status,address,email,postalcode,city,state,country,phonenumber,prayerdetails) VALUES (?,?,?,?,?,?,?,?,?,?)`;

    connection.query(
      addMasjeedQuery,
      [
        name,
        0,
        address,
        email,
        postalcode,
        city,
        state,
        country,
        phonenumber,
        filename,
      ],
      (insertError) => {
        if (insertError) {
          console.error(
            "Error inserting filename into the database:",
            insertError
          );
          return next(new ErrorHandler("Internal Server Error", 500));
        }

        console.log("Masjeed inserted into the database");
        res
          .status(200)
          .json({ success: true, message: "File uploaded successfully" });
      }
    );
  } catch (error) {
    console.log("Error:", error);
    return next(new ErrorHandler(error.message, 400));
  }
});

export const todaySchedule = CatchAsyncError(async (req, res, next) => {
  try {
    const masjeedid = req.params.id;
    // Fetch filename from the database
    const selectQuery = "SELECT prayerdetails FROM masjeed WHERE id = ?";

    connection.query(selectQuery, [masjeedid], (selectError, results) => {
      if (selectError) {
        console.error(
          "Error fetching prayerdetails from the database:",
          selectError
        );
        return next(new ErrorHandler("Internal Server Error", 500));
      }

      if (results.length === 0) {
        return next(new ErrorHandler("File not found", 404));
      }

      const filename = results[0].prayerdetails;
      // Read the Excel file
      const filePath = path.join(__dirname, "../uploads", filename);
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      // Parse Excel data
      const excelData = xlsx.utils.sheet_to_json(sheet, {
        raw: false,
        range: 11,
      });

      // Get today's date
      const today = new Date();
      const todayMonth = today.getMonth() + 1; // Month is 0-indexed in JavaScript
      const todayDay = today.getDate();
      // Filter data for today's month and day

      const todaySchedule = excelData.filter((row) => {
        return row.Month == todayMonth && row.Day == todayDay;
      });

      res.json({ excelData });
    });
  } catch (error) {
    console.log("Error:", error);
    return next(new ErrorHandler(error.message, 400));
  }
});
