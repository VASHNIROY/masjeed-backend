import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import CatchAsyncError from "../middleware/catchAsyncError.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import nodemailerConfig from "../utils/nodemailer.js";
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
        res.send({ jwt_token, message: "Login Successful" });
      } else {
        return next(new ErrorHandler("Invalid Email or Password", 400));
      }
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

export const masjeedsList = CatchAsyncError(async (req, res, next) => {
  console.log("triggered");
  try {
    const getMasjeedsQuery = `SELECT * FROM masjeed WHERE status = 1`;
    connection.query(getMasjeedsQuery, (selectErr, results) => {
      console.log("triggered2");
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
    console.log("getting error");
    return next(new ErrorHandler(error.message, 400));
  }
});

export const newMasjeeds = CatchAsyncError(async (req, res, next) => {
  try {
    const getMasjeedsQuery = `SELECT * FROM masjeed WHERE status = 0`;
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

/* approved masjeeds status = 1 */
/* rejected masjeeds status = 0 */
export const approveMasjeed = CatchAsyncError(async (req, res, next) => {
  try {
    const masjeedId = req.params.id;
    const checkmasjeedStatus = `SELECT status FROM masjeed WHERE id = ?`;

    connection.query(checkmasjeedStatus, [masjeedId], (err, results) => {
      if (err) {
        return next(new ErrorHandler("Internal Server Error", 500));
      }
      if (results[0].status === 1) {
        return next(new ErrorHandler("masjeed already approved", 400));
      }
      const updateMasjeedStatusQuery = `UPDATE masjeed SET status = 1 WHERE id = ?`;

      // Update masjeed status
      connection.query(updateMasjeedStatusQuery, [masjeedId], (updateError) => {
        if (updateError) {
          console.log("Error while updating status");
          return next(new ErrorHandler("Internal Server Error", 500));
        }
        const masjeedDetailsQuery =
          "SELECT adminname,phonenumber,email FROM masjeed WHERE id = ?;";

        connection.query(
          masjeedDetailsQuery,
          [masjeedId],
          (gettingErr, masjeedDetails) => {
            if (gettingErr) {
              console.log("Error While fetching masjeed Details");
              return next(new ErrorHandler("Internal Server Error", 500));
            }

            console.log("masjeedDetails", masjeedDetails);
            if (masjeedDetails.length === 0) {
              return next(new ErrorHandler("masjeed not found", 404));
            }

            const name = masjeedDetails[0].adminname;
            const email = masjeedDetails[0].email;
            const phonenumber = masjeedDetails[0].phonenumber;
            console.log(name, email, phonenumber);

            const addadminQuery = `INSERT INTO admin(name,email,password,status,phonenumber) VALUES(?,?,?,?,?)`;
            const password = "123456";

            bcrypt.hash(password, 10, (err, hashedPassword) => {
              if (err) {
                return next(new ErrorHandler(err.message, 500));
              }
              connection.query(
                addadminQuery,
                [name, email, hashedPassword, 1, phonenumber],
                (error, succesresults) => {
                  if (error) {
                    console.log(error);
                    return next(new ErrorHandler("Internal Server Error", 500));
                  }

                  const transporter = nodemailerConfig();
                  const mailOptions = {
                    from: process.env.SMTP_MAIL,
                    to: email,
                    subject: "Welcome to Mymasjeed. Aprroved Your Request",
                    html: `
                      <p>Dear ${name},</p>
                      <p>Thank you for registering with My Masjeed. We are delighted to have you as part of our community, and we want to extend a warm welcome to you.</p>
                      <p>This is your email ${email} and password is 123456</p>
                    `,
                  };

                  transporter.sendMail(mailOptions, (emailError, info) => {
                    if (emailError) {
                      console.log(emailError);
                      return next(
                        new ErrorHandler("Email could not be sent", 500)
                      );
                    }
                  });

                  // Retrieve prayer details file path
                  const selectQuery =
                    "SELECT prayerdetails FROM masjeed WHERE id = ?";

                  connection.query(
                    selectQuery,
                    [masjeedId],
                    (selectError, results) => {
                      if (selectError) {
                        console.error(
                          "Error fetching prayerdetails from the database:",
                          selectError
                        );
                        return next(
                          new ErrorHandler("Internal Server Error", 500)
                        );
                      }

                      if (results.length === 0) {
                        return next(new ErrorHandler("File not found", 404));
                      }

                      const filename = results[0].prayerdetails;

                      // Read the Excel file
                      const filePath = path.join(
                        __dirname,
                        "../uploads",
                        filename
                      );
                      const workbook = xlsx.readFile(filePath);
                      const sheetName = workbook.SheetNames[0];
                      const sheet = workbook.Sheets[sheetName];

                      const secondsheetName = workbook.SheetNames[1];
                      const secondsheet = workbook.Sheets[secondsheetName];

                      // Parse Excel data
                      const prayertimingsData = xlsx.utils.sheet_to_json(
                        sheet,
                        {
                          raw: false,
                          range: 11,
                        }
                      );

                      // Parse Excel data
                      const iqamahData = xlsx.utils.sheet_to_json(secondsheet, {
                        raw: false,
                        range: 1,
                      });

                      const convertedData = iqamahData.map((data) => {
                        const convertedValues = {};
                        for (const key in data) {
                          const value = data[key];

                          // Exclude "Jumah Adhan" from conversion
                          if (key === "Jumah Adhan") {
                            convertedValues[key] = value;
                          } else {
                            const value = data[key];
                            const intValue = parseInt(value, 10);
                            convertedValues[key] = isNaN(intValue)
                              ? value
                              : intValue;
                          }
                        }
                        return convertedValues;
                      });

                      const commonData = convertedData[0];

                      // Merge common data
                      const mergedData = prayertimingsData.map((item) => {
                        // Merge the common data into each item using object spreading
                        return { ...item, ...commonData };
                      });

                      // Insert data into prayertimingstable
                      mergedData.forEach((row) => {
                        const {
                          Month,
                          Day,
                          "Fajr Adhan": FajrAdhan,
                          Shouruq,
                          "Dhuhr Adhan": DhuhrAdhan,
                          "Asr Adhan": AsrAdhan,
                          "Maghrib Adhan": MaghribAdhan,
                          "Isha Adhan": IshaAdhan,
                          "Fajr Iqamah": FajrIqamah,
                          "Dhuhr Iqamah": DhuhrIqamah,
                          "Asr Iqamah": AsrIqamah,
                          "Maghrib Iqamah": MaghribIqamah,
                          "Isha Iqamah": IshaIqamah,
                          "Jumah Adhan": JumahAdhan,
                          "Jumah Khutba duration": JumahKhutbaDuration,
                        } = row;

                        const insertQuery = `
                  INSERT INTO prayertimingstable (masjeedid, day, month, fajr, shouruq, dhuhr, asr, maghrib, isha,fajriqamah,
                    dhuhriqamah,
                    asriqamah,
                    maghribiqamah,
                   ishaiqamah,
                    jumahadhan,
                    Jumahkhutbaduration)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? ,?, ?, ?, ?, ?)
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

                            FajrIqamah,
                            DhuhrIqamah,
                            AsrIqamah,
                            MaghribIqamah,
                            IshaIqamah,
                            JumahAdhan,
                            JumahKhutbaDuration,
                          ],
                          (insertError) => {
                            if (insertError) {
                              console.error(
                                "Error inserting data into prayertimingstable:",
                                insertError
                              );
                              return next(
                                new ErrorHandler("Internal Server Error", 500)
                              );
                            }
                          }
                        );
                      });

                      res.json({
                        success: true,
                        message: "Accepted Successfully",
                      });
                    }
                  );
                }
              );
            });
          }
        );
      });
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

export const rejectMasjeed = CatchAsyncError(async (req, res, next) => {
  const masjeedid = req.params.id;

  try {
    const masjeedDetailsQuery =
      "SELECT adminname,email FROM masjeed WHERE id = ?;";

    connection.query(
      masjeedDetailsQuery,
      [masjeedid],
      (gettingErr, masjeedDetails) => {
        if (gettingErr) {
          console.log("Error While fetching masjeed Details");
          return next(new ErrorHandler("Internal Server Error", 500));
        }

        if (masjeedDetails.length === 0) {
          return next(new ErrorHandler("masjeed not found", 404));
        }
        const name = masjeedDetails[0].adminname;
        const email = masjeedDetails[0].email;

        const transporter = nodemailerConfig();
        const mailOptions = {
          from: process.env.SMTP_MAIL,
          to: email,
          subject: "Welcome to Mymasjeed. Rejected Your Request",
          html: `
        <p>Dear ${name},</p>
        <p>Thank you for requesting My Masjeed.Unfortunately your request has been rejected.</p>
        <p>Please contact the adminstrator for further details.</p>
      `,
        };

        transporter.sendMail(mailOptions, (emailError, info) => {
          if (emailError) {
            console.log(emailError);
            return next(new ErrorHandler("Email could not be sent", 500));
          }
        });
      }
    );

    res.json({ success: true, message: "Rejected Masjeed" });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});
