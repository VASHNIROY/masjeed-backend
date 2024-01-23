import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import CatchAsyncError from "../middleware/catchAsyncError.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import { connection } from "../utils/db.js";

import { fileURLToPath } from "url";

import xlsx from "xlsx";
import path from "path";

import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const superAdminRegistration = CatchAsyncError(
  async (req, res, next) => {
    try {
      const { name, email, password, phonenumber } = req.body;

      const checkemailQuery = "SELECT * FROM superadmin WHERE email = ?";

      connection.query(checkemailQuery, [email], (error, results) => {
        if (error) {
          return next(new ErrorHandler(error.message, 500));
        }

        if (results.length > 0) {
          return next(new ErrorHandler("Email already exists", 400));
        }

        bcrypt.hash(password, 10, (err, hashedPassword) => {
          if (err) {
            return next(new ErrorHandler(err.message, 500));
          }

          connection.query(
            "INSERT INTO superadmin(name,email,password,phonenumber,roleid) VALUES (?,?,?,?,?)",
            [name, email, hashedPassword, phonenumber, 1],
            (error) => {
              if (error) {
                return next(new ErrorHandler(error.message, 500));
              }
              res.status(201).json({
                success: true,
                message: "Super Admin Registered Successfully",
              });
            }
          );
        });
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

const SECRET_KEY = "uK8Tgvho1Y";

export const superAdminLogin = CatchAsyncError(async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const verifyemailQuery = "SELECT * from superadmin WHERE email = ?";

    connection.query(verifyemailQuery, [email], async (error, results) => {
      if (error) {
        return next(new ErrorHandler("Database Error", 500));
      }
      if (results.length === 0) {
        return next(new ErrorHandler("Invalid User", 400));
      }
      const hashedPassword = results[0].password;
      const isPasswordMatched = await bcrypt.compare(password, hashedPassword);

      if (isPasswordMatched) {
        const payload = {
          email: results[0].email,
        };
        const jwt_token = jwt.sign(payload, SECRET_KEY);
        res.send({ jwt_token });
      } else {
        return next(new ErrorHandler("Invalid Password", 400));
      }
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

export const masjeedsList = CatchAsyncError(async (req, res, next) => {
  try {
    const getMasjeedsQuery = `SELECT * FROM masjeed`;
    connection.query(getMasjeedsQuery, (selectErr, results) => {
      if (selectErr) {
        console.log("Error fetching masjeeds from Database", selectErr);
        return next(new ErrorHandler("Internal Server Error", 500));
      }
      if (results.length === 0) {
        return next(new ErrorHandler("Masjeeds Not Found", 404));
      }
      res.json({ success: true, message: "Fetched masjeeds", data: results });
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

export const approveMasjeed = CatchAsyncError(async (req, res, next) => {
  try {
    const masjeedId = req.params.id;
    const updateMasjeedStatusQuery = `UPDATE masjeed SET status = 1 WHERE id = ?`;

    // Update masjeed status
    connection.query(updateMasjeedStatusQuery, [masjeedId], (updateError) => {
      if (updateError) {
        console.log("Error while updating status");
        return next(new ErrorHandler("Internal Server Error", 500));
      }

      // Retrieve prayer details file path
      const selectQuery = "SELECT prayerdetails FROM masjeed WHERE id = ?";

      connection.query(selectQuery, [masjeedId], (selectError, results) => {
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

        // Insert data into prayertimingstable
        excelData.forEach((row) => {
          const {
            Month,
            Day,
            "Fajr Adhan": FajrAdhan,
            Shouruq,
            "Dhuhr Adhan": DhuhrAdhan,
            "Asr Adhan": AsrAdhan,
            "Maghrib Adhan": MaghribAdhan,
            "Isha Adhan": IshaAdhan,
          } = row;

          const insertQuery = `
            INSERT INTO prayertimingstable (masjeedid, day, month, fajr, shouruq, dhuhr, asr, maghrib, isha)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;

          connection.query(
            insertQuery,
            [
              masjeedId,
              Day,
              Month,
              FajrAdhan,
              Shouruq,
              DhuhrAdhan,
              AsrAdhan,
              MaghribAdhan,
              IshaAdhan,
            ],
            (insertError) => {
              if (insertError) {
                console.error(
                  "Error inserting data into prayertimingstable:",
                  insertError
                );
                return next(new ErrorHandler("Internal Server Error", 500));
              }
            }
          );
        });

        res.json({ success: true, message: "Inserted Successfully" });
      });
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});