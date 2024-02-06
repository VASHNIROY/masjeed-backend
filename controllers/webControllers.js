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
      adminname,
      address,
      email,
      postalcode,
      city,
      state,
      country,
      phonenumber,
      masjeedname,
    } = req.body;

    if (!filename) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    const verifyEmailQuery = `SELECT email FROM masjeed WHERE email = ?`;

    connection.query(verifyEmailQuery, [email], (error, results) => {
      if (error) {
        return next(new ErrorHandler(error.message, 500));
      }

      if (results.length > 0) {
        return next(new ErrorHandler("Email already exists", 400));
      }

      const addMasjeedQuery = `INSERT INTO masjeed (adminname,masjeedname,status,address,email,postalcode,city,state,country,phonenumber,prayerdetails) VALUES (?,?,?,?,?,?,?,?,?,?,?)`;

      connection.query(
        addMasjeedQuery,
        [
          adminname,
          masjeedname,
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
    });
  } catch (error) {
    console.log("Error:", error);
    return next(new ErrorHandler(error.message, 400));
  }
});

// export const todaySchedule = CatchAsyncError(async (req, res, next) => {
//   try {
//     const masjeedid = req.params.id;
//     // Fetch filename from the database
//     const selectQuery = "SELECT * FROM prayertimingstable WHERE masjeedid = ?";

//     connection.query(selectQuery, [masjeedid], (selectError, results) => {
//       if (selectError) {
//         console.error(
//           "Error fetching prayerdetails from the database:",
//           selectError
//         );
//         return next(new ErrorHandler("Internal Server Error", 500));
//       }

//       // Get today's date
//       const today = new Date();
//       const todayMonth = today.getMonth() + 1; // Month is 0-indexed in JavaScript
//       const todayDay = today.getDate();
//       // Filter data for today's month and day

//       const todaySchedule = results.filter((row) => {
//         return row.month == todayMonth && row.day == todayDay;
//       });

//       res.json({ todaySchedule });
//     });
//   } catch (error) {
//     console.log("Error:", error);
//     return next(new ErrorHandler(error.message, 400));
//   }
// });

export const todaySchedule = CatchAsyncError(async (req, res, next) => {
  try {
    const masjeedid = req.params.id;
    // Fetch filename from the database
    const selectQuery = "SELECT * FROM prayertimingstable WHERE masjeedid = ?";

    connection.query(selectQuery, [masjeedid], (selectError, results) => {
      if (selectError) {
        console.error(
          "Error fetching prayer details from the database:",
          selectError
        );
        return next(new ErrorHandler("Internal Server Error", 500));
      }

      // Get today's date
      const today = new Date();
      const todayMonth = today.getMonth() + 1; // Month is 0-indexed in JavaScript
      const todayDay = today.getDate();
      // Filter data for today's month and day

      console.log(results, todayMonth, todayDay, "kapil");

      const todayTimeSchedule = results.filter(
        (row) => row.month == todayMonth && row.day == todayDay
      );

      console.log(todaySchedule, "ram");

      const todayTimings = [
        ...todayTimeSchedule.map((row) => ({
          id: "1",
          name: "fajr",
          starttime: row.fajr,
          endtime: calculateEndTime(row.fajr, row.fajriqamah),
        })),
        ...todayTimeSchedule.map((row) => ({
          id: "2",
          name: "dhuhr",
          starttime: row.dhuhr,
          endtime: calculateEndTime(row.dhuhr, row.dhuhriqamah),
        })),
        ...todayTimeSchedule.map((row) => ({
          id: "3",
          name: "asr",
          starttime: row.asr,
          endtime: calculateEndTime(row.asr, row.asriqamah),
        })),
        ...todayTimeSchedule.map((row) => ({
          id: "4",
          name: "maghrib",
          starttime: row.maghrib,
          endtime: calculateEndTime(row.maghrib, row.maghribiqamah),
        })),
        ...todayTimeSchedule.map((row) => ({
          id: "5",
          name: "isha",
          starttime: row.isha,
          endtime: calculateEndTime(row.isha, row.ishaiqamah),
        })),
      ];

      res.json({ todayTimings });
    });
  } catch (error) {
    console.log("Error:", error);
    return next(new ErrorHandler(error.message, 400));
  }
});

function calculateEndTime(startTime, iqamah) {
  // Assuming iqamah time is given in minutes
  const startTimeParts = startTime.split(":");
  const hours = parseInt(startTimeParts[0]);
  const minutes = parseInt(startTimeParts[1]);

  const iqamahMinutes = parseInt(iqamah);

  const endMinutes = minutes + iqamahMinutes;
  const endHours = hours + Math.floor(endMinutes / 60);
  const formattedEndMinutes = endMinutes % 60;

  return `${endHours}:${formattedEndMinutes}`;
}

export const databaseCountries = CatchAsyncError(async (req, res, next) => {
  try {
    const coutriesQuery = `SELECT DISTINCT country FROM masjeed WHERE country IS NOT NULL AND status = 1 ORDER BY country ASC `;
    connection.query(coutriesQuery, (selectError, results) => {
      if (selectError) {
        console.error("Error fetching countries from the database:");
        return next(new ErrorHandler("Internal Server Error", 500));
      }
      if (results.length === 0) {
        return next(new ErrorHandler("No Countries Found", 404));
      }

      res.json({ success: true, message: "Fetched Countries", data: results });
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

export const databaseStates = CatchAsyncError(async (req, res, next) => {
  try {
    const { country } = req.query;

    const statesQuery = `SELECT DISTINCT state FROM masjeed WHERE country = ? AND state IS NOT NULL AND status = 1 ORDER BY state ASC`;

    connection.query(statesQuery, [country], (selectError, results) => {
      if (selectError) {
        console.error("Error fetching states from the database:");
        return next(new ErrorHandler("Internal Server Error", 500));
      }
      if (results.length === 0) {
        return next(new ErrorHandler("No States Found", 404));
      }
      res.json({ success: true, message: "Fetched States", data: results });
    });
  } catch (error) {
    return next(new ErrorHandler("Internal Server Error", 500));
  }
});

export const databaseCities = CatchAsyncError(async (req, res, next) => {
  try {
    const { country, state } = req.query;
    const citiesQuery = `SELECT DISTINCT city FROM masjeed WHERE country = ? AND state = ? AND city IS NOT NULL AND status = 1 ORDER BY city ASC`;
    connection.query(citiesQuery, [country, state], (selectError, results) => {
      if (selectError) {
        console.error("Error fetching cities from the database:");
        return next(new ErrorHandler("Internal Server Error", 500));
      }
      if (results.length === 0) {
        return next(new ErrorHandler("No Cities Found", 404));
      }

      res.json({ success: true, message: "Fetched Cities", data: results });
    });
  } catch (error) {
    return next(new ErrorHandler("Internal Sever Error", 500));
  }
});

export const databaseMasjeeds = CatchAsyncError(async (req, res, next) => {
  try {
    const { country, state, city } = req.query;

    const databasemasjeedsQuery = `SELECT id, masjeedname FROM masjeed WHERE country = ? AND state = ? AND city = ? AND status = 1 ORDER BY masjeedname ASC`;

    connection.query(
      databasemasjeedsQuery,
      [country, state, city],
      (selectError, results) => {
        if (selectError) {
          console.error("Error fetching masjeeds from the database:");
          return next(new ErrorHandler("Internal Server Error", 500));
        }
        if (results.length === 0) {
          return next(new ErrorHandler("No masjeeds Found", 404));
        }

        res.json({ success: true, message: "Fetched masjeeds", data: results });
      }
    );
  } catch (error) {
    return next(new ErrorHandler("Internal Server Error", 500));
  }
});
