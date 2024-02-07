import CatchAsyncError from "../middleware/catchAsyncError.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import { connection } from "../utils/db.js";
import nodemailerConfig from "../utils/nodemailer.js";
import jwt from "jsonwebtoken";

import bcrypt from "bcrypt";

import { fileURLToPath } from "url";

function generateOTP() {
  // Generate a 4-digit random OTP
  return Math.floor(1000 + Math.random() * 9000).toString();
}

const SECRET_KEY = "uK8Tgvho1Y";

export const adminLogin = CatchAsyncError(async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const verifyemailQuery = "SELECT * from admin WHERE email = ?";
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
        res.send({ jwt_token, message: "LoggedIn Succesfully" });
      } else {
        return next(new ErrorHandler("Invalid Password", 400));
      }
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

export const forgotPassword = CatchAsyncError(async (req, res, next) => {
  try {
    const { email } = req.body;

    connection.query(
      "SELECT * FROM admin WHERE email = ?",
      [email],
      (error, results) => {
        if (error) {
          return next(new ErrorHandler(error.message, 500)); // Handle database query error
        }

        if (results.length === 0) {
          return next(new ErrorHandler("Email not found", 404));
        }
        const user = results[0];
        // Generate and save OTP in the database (you may want to handle this securely, such as using a separate OTP table)
        const otp = generateOTP();
        // Implement a function to generate a random OTP
        connection.query(
          "UPDATE admin SET otp = ? WHERE email = ?",
          [otp, email],
          (otpUpdateError) => {
            if (otpUpdateError) {
              return next(new ErrorHandler(otpUpdateError.message, 500));
            }

            // Send an email with the OTP
            const transporter = nodemailerConfig();
            const mailOptions = {
              from: process.env.SMTP_MAIL,
              to: email,
              subject: "Forgot Password - My Masjeed",
              html: `
                <p>Dear ${user.name},</p>
                <p>We received a request to reset your password. If you didn't make this request, you can ignore this email.</p>
                <p>Your One-Time Password (OTP) is: <strong>${otp}</strong></p>
              `,
            };

            transporter.sendMail(mailOptions, (emailError, info) => {
              if (emailError) {
                return next(new ErrorHandler("Email could not be sent", 500));
              }

              res.status(200).json({
                success: true,
                message: "OTP sent to your email. Check your inbox.",
              });
            });
          }
        );
      }
    );
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

export const verifyEmailOTPSend = CatchAsyncError(async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    // Check if the provided OTP matches the stored OTP for the given email
    connection.query(
      "SELECT * FROM admin WHERE email = ? AND otp = ?",
      [email, otp],
      (error, results) => {
        if (error) {
          return next(new ErrorHandler(error.message, 500));
        }

        if (results.length === 0) {
          return next(new ErrorHandler("invalid OTP", 500));
        }

        // Update customer status to active since OTP is verified
        connection.query(
          "UPDATE admin SET otp = null WHERE email = ?",
          [email],
          (updateError) => {
            if (updateError) {
              return next(new ErrorHandler(updateError.message, 500));
            }

            res.status(200).json({
              success: true,
              message: "Email verification successful",
            });
          }
        );
      }
    );
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

export const getMasjeedTimings = CatchAsyncError(async (req, res, next) => {
  const email = req.user.email;
  try {
    const getmasjeedidQuery = `SELECT id FROM masjeed WHERE email = ? AND status = 1`;
    connection.query(getmasjeedidQuery, [email], (error, results) => {
      if (error) {
        console.log("Error fetching masjeed from Database", error);
        return next(new ErrorHandler("Internal Server Error", 500));
      }

      if (results.length === 0) {
        return next(new ErrorHandler("Masjeed Not Found", 404));
      }

      const masjeedid = results[0].id;

      const MasjeedTimingsQuery = `SELECT * FROM prayertimingstable WHERE masjeedid = ?`;
      connection.query(
        MasjeedTimingsQuery,
        [masjeedid],
        (selectErr, results) => {
          if (selectErr) {
            console.log("Error fetching timings from Database", selectErr);
            return next(new ErrorHandler("Internal Server Error", 500));
          }
          if (results.length === 0) {
            return next(new ErrorHandler("Timings Not Found", 404));
          }
          res.json({
            success: true,
            message: "Fetched Timings",
            data: results,
          });
        }
      );
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

export const updateTimingRow = CatchAsyncError(async (req, res, next) => {
  const useremail = req.user.email;
  try {
    const getmasjeedidQuery = `SELECT id FROM masjeed WHERE email = ? AND status = 1`;

    connection.query(getmasjeedidQuery, [useremail], (error, results) => {
      if (error) {
        console.log("Error fetching masjeed from Database", error);
        return next(new ErrorHandler("Internal Server Error", 500));
      }

      if (results.length === 0) {
        return next(new ErrorHandler("Masjeed Not Found", 404));
      }

      const masjeedid = results[0].id;
      const { day, month, fajr, shouruq, dhuhr, asr, maghrib, isha } = req.body;

      const updateTimingQuery = `
      UPDATE prayertimingstable
      SET fajr = ?, shouruq = ?, dhuhr = ?, asr = ?, maghrib = ?, isha = ?
      WHERE masjeedid = ? AND day = ? AND month = ?;
    `;

      connection.query(
        updateTimingQuery,
        [fajr, shouruq, dhuhr, asr, maghrib, isha, masjeedid, day, month],
        async (updateErr, updateResults) => {
          if (updateErr) {
            console.log("Error while updating timings in Database", updateErr);
            return next(new ErrorHandler("Internal Server Error", 500));
          }

          if (updateResults.affectedRows === 0) {
            return next(new ErrorHandler("Timings Not Found", 404));
          }

          // Fetch the updated row from the database
          const selectUpdatedRowQuery = `
          SELECT * FROM prayertimingstable
          WHERE masjeedid = ? AND day = ? AND month = ?;
        `;

          connection.query(
            selectUpdatedRowQuery,
            [masjeedid, day, month],
            (selectErr, selectResults) => {
              if (selectErr) {
                console.log(
                  "Error while fetching updated timings from Database",
                  selectErr
                );
                return next(new ErrorHandler("Internal Server Error", 500));
              }

              if (selectResults.length === 0) {
                return next(new ErrorHandler("Updated Timings Not Found", 404));
              }

              console.log(selectResults);

              const updatedRow = selectResults[0];

              // Send the updated row as a response
              res.json({
                success: true,
                message: "Updated Timings",
                data: updatedRow,
              });
            }
          );
        }
      );
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

export const addTimingRowToHr = CatchAsyncError(async (req, res, next) => {
  try {
    const email = req.user.email;
    const { day, month } = req.body;
    const timingData = req.body;

    const getmasjeedidQuery = `SELECT id FROM masjeed WHERE email = ? AND status = 1`;
    connection.query(getmasjeedidQuery, [email], (error, results) => {
      if (error) {
        console.log("Error fetching masjeed from Database", error);
        return next(new ErrorHandler("Internal Server Error", 500));
      }

      if (results.length === 0) {
        return next(new ErrorHandler("Masjeed Not Found", 404));
      }

      const masjeedid = results[0].id;

      const addOneHourToTiming = (timing) => {
        const [hours, minutes] = timing.split(":");
        const originalTime = new Date();
        originalTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0);

        // Adding one hour
        const updatedTime = new Date(originalTime.getTime() + 60 * 60 * 1000);

        // Formatting the updated time
        const updatedHours = updatedTime.getHours().toString().padStart(2, "0");
        const updatedMinutes = updatedTime
          .getMinutes()
          .toString()
          .padStart(2, "0");

        return `${updatedHours}:${updatedMinutes}`;
      };

      // Map through each timing in the timingData object and add one hour
      for (const key in timingData) {
        if (
          key !== "id" &&
          key !== "masjeedid" &&
          key !== "day" &&
          key !== "month"
        ) {
          timingData[key] = addOneHourToTiming(timingData[key]);
        }
      }

      const updateHrQuery = `UPDATE prayertimingstable SET  fajr = ?,shouruq = ?,
  dhuhr = ?, asr = ?, maghrib = ?,isha = ? WHERE masjeedid = ? AND day = ? AND month = ?`;

      connection.query(
        updateHrQuery,
        [
          timingData.fajr,
          timingData.shouruq,
          timingData.dhuhr,
          timingData.asr,
          timingData.maghrib,
          timingData.isha,
          masjeedid,
          day,
          month,
        ],
        (updateErr, updateResults) => {
          if (updateErr) {
            return next(new ErrorHandler("Internal Server Error", 500));
          }

          if (updateResults.affectedRows === 0) {
            return next(new ErrorHandler("Timings Not Found", 404));
          }

          const getupdaterowQuery = `SELECT * FROM prayertimingstable WHERE masjeedid = ? AND day = ? AND month = ?`;

          connection.query(
            getupdaterowQuery,
            [masjeedid, day, month],
            (selectErr, selectResults) => {
              if (selectErr) {
                return next(new ErrorHandler("Internal Server Error", 500));
              }

              if (selectResults.length === 0) {
                return next(new ErrorHandler("Updated Timings Not Found", 404));
              }

              const updatedRow = selectResults[0];

              res.json({
                success: true,
                message: "Updated Timings",
                data: updatedRow,
              });
            }
          );
        }
      );
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

export const substractTimingRowToHr = CatchAsyncError(
  async (req, res, next) => {
    try {
      const email = req.user.email;
      const { day, month } = req.body;
      const timingData = req.body;

      const getmasjeedidQuery = `SELECT id FROM masjeed WHERE email = ? AND status = 1`;
      connection.query(getmasjeedidQuery, [email], (error, results) => {
        if (error) {
          console.log("Error fetching masjeed from Database", error);
          return next(new ErrorHandler("Internal Server Error", 500));
        }

        if (results.length === 0) {
          return next(new ErrorHandler("Masjeed Not Found", 404));
        }

        const masjeedid = results[0].id;

        const addOneHourToTiming = (timing) => {
          const [hours, minutes] = timing.split(":");
          const originalTime = new Date();
          originalTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0);

          // Adding one hour
          const updatedTime = new Date(originalTime.getTime() - 60 * 60 * 1000);

          // Formatting the updated time
          const updatedHours = updatedTime
            .getHours()
            .toString()
            .padStart(2, "0");
          const updatedMinutes = updatedTime
            .getMinutes()
            .toString()
            .padStart(2, "0");

          return `${updatedHours}:${updatedMinutes}`;
        };

        // Map through each timing in the timingData object and add one hour
        for (const key in timingData) {
          if (
            key !== "id" &&
            key !== "masjeedid" &&
            key !== "day" &&
            key !== "month"
          ) {
            timingData[key] = addOneHourToTiming(timingData[key]);
          }
        }

        const updateHrQuery = `UPDATE prayertimingstable SET  fajr = ?,shouruq = ?,
    dhuhr = ?, asr = ?, maghrib = ?,isha = ? WHERE masjeedid = ? AND day = ? AND month = ?`;

        connection.query(
          updateHrQuery,
          [
            timingData.fajr,
            timingData.shouruq,
            timingData.dhuhr,
            timingData.asr,
            timingData.maghrib,
            timingData.isha,
            masjeedid,
            day,
            month,
          ],
          (updateErr, updateResults) => {
            if (updateErr) {
              return next(new ErrorHandler("Internal Server Error", 500));
            }

            if (updateResults.affectedRows === 0) {
              return next(new ErrorHandler("Timings Not Found", 404));
            }

            const getupdaterowQuery = `SELECT * FROM prayertimingstable WHERE masjeedid = ? AND day = ? AND month = ?`;

            connection.query(
              getupdaterowQuery,
              [masjeedid, day, month],
              (selectErr, selectResults) => {
                if (selectErr) {
                  return next(new ErrorHandler("Internal Server Error", 500));
                }

                if (selectResults.length === 0) {
                  return next(
                    new ErrorHandler("Updated Timings Not Found", 404)
                  );
                }

                const updatedRow = selectResults[0];

                res.json({
                  success: true,
                  message: "Updated Timings",
                  data: updatedRow,
                });
              }
            );
          }
        );
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

export const getMasjeedDetails = CatchAsyncError(async (req, res, next) => {
  try {
    const masjeedid = req.params.id;
    const email = req.user.email;
    console.log("email", email);
    const masjeedDetailsQuery = `SELECT * FROM masjeed WHERE email = ? AND status = 1`;
    connection.query(masjeedDetailsQuery, [email], (selectErr, results) => {
      if (selectErr) {
        console.log("Error fetching masjeed from Database", selectErr);
        return next(new ErrorHandler("Internal Server Error", 500));
      }
      if (results.length === 0) {
        return next(new ErrorHandler("masjeed Not Found", 404));
      }
      res.json({ success: true, message: "Fetched masjeed", data: results });
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

export const updateMasjeedDetails = CatchAsyncError(async (req, res, next) => {
  try {
    const filename = req.file ? req.file.filename : null;

    let masjeedUpdateQuery = `UPDATE masjeed SET adminname = ?, masjeedname = ?, address =?, postalcode = ?, city = ?, state = ?, country = ?, phonenumber = ?`;
    if (filename) {
      masjeedUpdateQuery += ", prayerdetails = ?";
    }

    masjeedUpdateQuery += " WHERE email = ?";

    const {
      adminname,
      masjeedname,
      address,
      postalcode,
      city,
      state,
      country,
      phonenumber,
      email,
    } = req.body;

    const uploadValues = [
      adminname,
      masjeedname,
      address,
      postalcode,
      city,
      state,
      country,
      phonenumber,
    ];

    if (filename) {
      uploadValues.push(filename);
    }

    uploadValues.push(email);

    connection.query(masjeedUpdateQuery, uploadValues, (updateErr, results) => {
      if (updateErr) {
        console.log("Error while updating masjeed in Database", updateErr);
        return next(new ErrorHandler("Internal Server Error", 500));
      }

      if (results.affectedRows === 0) {
        return next(new ErrorHandler("Masjeed Not Found", 404));
      }
      const updateadminnameQuery = `UPDATE admin SET name = ? WHERE email = ?`;

      connection.query(
        updateadminnameQuery,
        [adminname, email],
        (error, results) => {
          if (error) {
            return next(new ErrorHandler("Internal Server Error", 500));
          }

          res.json({
            success: true,
            message: "masjeed updated successfully",
          });
        }
      );
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

export const addAdminStaff = CatchAsyncError(async (req, res, next) => {
  const useremail = req.user.email;

  try {
    const getmasjeedidQuery = `SELECT masjeedid FROM masjeed WHERE email = ?`;

    connection.query(getmasjeedidQuery, [useremail], (error, results) => {
      if (error) {
        console.log("Error fetching masjeed from Database", error);
        return next(new ErrorHandler("Internal Server Error", 500));
      }

      if (results.length === 0) {
        return next(new ErrorHandler("masjeed Not Found", 404));
      }

      const masjeedid = results[0].id;

      const verifyEmailQuery = `SELECT email FROM adminstaff WHERE email = ?`;

      connection.query(verifyEmailQuery, [req.body.email], (error, results) => {
        if (error) {
          return next(new ErrorHandler(error.message, 500));
        }

        if (results.length > 0) {
          return next(new ErrorHandler("Email already exists", 400));
        }

        const { name, email, phonenumber, comment, roleid } = req.body;

        const addAdminStaffQuery = `INSERT INTO adminstaff(name, email, password, phonenumber, comment, masjeedid, roleid, status) VALUES(?, ?, ?, ?, ?, ?, ?, ?)`;

        const password = "123456";

        bcrypt.hash(password, 10, (err, hashedPassword) => {
          if (err) {
            return next(new ErrorHandler(err.message, 500));
          }
          connection.query(
            addAdminStaffQuery,
            [
              name,
              email,
              hashedPassword,
              phonenumber,
              comment,
              masjeedid,
              roleid,
              1,
            ],
            (insertErr, results) => {
              if (insertErr) {
                console.log(
                  "Error while inserting admin staff in Database",
                  insertErr
                );
                return next(new ErrorHandler("Internal Server Error", 500));
              }

              res.json({ success: true, message: "Admin Staff Added" });

              const transporter = nodemailerConfig();
              const mailOptions = {
                from: process.env.SMTP_MAIL,
                to: email,
                subject: "Welcome to Mymasjeed Staff",
                html: `
                <p>Dear ${name},</p>
                <p>We are delighted to have you as part of our community, and we want to extend a warm welcome to you.</p>
                <p>This is your email ${email} and password is 123456</p>
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
        });
      });
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

export const editAdminStaffMember = CatchAsyncError(async (req, res, next) => {
  try {
    const useremail = req.user.email;

    const getmasjeedidQuery = `SELECT id FROM masjeed WHERE email = ? AND status = 1`;

    connection.query(getmasjeedidQuery, [useremail], (error, results) => {
      if (error) {
        return next(new ErrorHandler(error.message, 500));
      }

      if (results.length === 0) {
        return next(new ErrorHandler("Masjeed Not Found", 404));
      }

      const masjeedid = results[0].id;

      const checkEmail = `SELECT email FROM adminstaff WHERE email = ? AND masjeedid = ?`;

      connection.query(checkEmail, [email, masjeedid], (error, results) => {
        if (error) {
          return next(new ErrorHandler(error.message, 500));
        }

        if (results.length > 0) {
          return next(new ErrorHandler("Email already exists", 400));
        }
        const { name, email, phonenumber, comment, roleid } = req.body;

        const editAdminStaffMember = `UPDATE adminstaff SET name = ?, phonenumber = ?, comment = ?, roleid = ? WHERE email = ? AND masjeedid = ?`;

        connection.query(
          editAdminStaffMember,
          [name, phonenumber, comment, roleid, email, masjeedid],
          (error, results) => {
            if (error) {
              return next(new ErrorHandler(error.message, 500));
            }

            if (results.affectedRows === 0) {
              return next(new ErrorHandler("Admin Staff Not Found", 404));
            }

            res.json({ success: true, message: "Admin Staff Updated" });
          }
        );
      });
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

export const getIqamahDetails = CatchAsyncError(async (req, res, next) => {
  try {
    const useremail = req.user.email;

    const getmasjeedidQuery = `SELECT id FROM masjeed WHERE email = ? AND status = 1`;

    connection.query(getmasjeedidQuery, [useremail], (error, results) => {
      if (error) {
        return next(new ErrorHandler(error.message, 500));
      }

      if (results.length === 0) {
        return next(new ErrorHandler("Masjeed Not Found", 404));
      }

      const masjeedid = results[0].id;
      const getIqamahDetailsQuery = `SELECT  fajriqamah,
      dhuhriqamah,
      asriqamah,
      maghribiqamah,
      ishaiqamah,
      jumahadhan,
      jumahkhutbaduration FROM prayertimingstable WHERE masjeedid = ?`;

      connection.query(getIqamahDetailsQuery, [masjeedid], (error, results) => {
        if (error) {
          return next(new ErrorHandler(error.message, 500));
        }

        res.json({ success: true, data: results[0] });
      });
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

export const editIqamah = CatchAsyncError(async (req, res, next) => {
  const useremail = req.user.email;
  try {
    const getmasjeedidQuery = `SELECT id FROM masjeed WHERE email = ? AND status = 1;`;

    connection.query(getmasjeedidQuery, [useremail], (error, results) => {
      if (error) {
        return next(new ErrorHandler(error.message, 500));
      }

      if (results.length === 0) {
        return next(new ErrorHandler("Masjeed Not Found", 404));
      }

      const masjeedid = results[0].id;
      const {
        fajriqamah,
        dhuhriqamah,
        asriqamah,
        maghribiqamah,
        ishaiqamah,
        jumahadhan,
        jumahiqamah,
      } = req.body;

      const updateiqamahQuery = `UPDATE prayertimingstable SET fajriqamah = ?, dhuhriqamah = ?, asriqamah = ?, maghribiqamah = ?, ishaiqamah = ?, jumahadhan = ?, jumahkhutbaduration = ? WHERE masjeedid = ?`;

      connection.query(
        updateiqamahQuery,
        [
          fajriqamah,
          dhuhriqamah,
          asriqamah,
          maghribiqamah,
          ishaiqamah,
          jumahadhan,
          jumahiqamah,
          masjeedid,
        ],
        (error, results) => {
          if (error) {
            return next(new ErrorHandler(error.message, 500));
          }

          res.json({ success: true, message: "Iqamah Updated" });
        }
      );
    });
  } catch (error) {
    return next(new ErrorHandler("Internal Server Error", 500));
  }
});

export const addmessage = CatchAsyncError(async (req, res, next) => {
  try {
    const useremail = req.user.email;

    let filename = req.file ? req.file.filename : null;

    if (!filename) {
      filename = req.body.description;
    }

    const { title, startdate, expirydate, status, type, enddate } = req.body;

    console.log(req.body, filename, "kapil");

    const getmasjeedidQuery = `SELECT id FROM masjeed WHERE email = ? AND status = 1`;

    connection.query(getmasjeedidQuery, [useremail], (error, results) => {
      if (error) {
        return next(new ErrorHandler(error.message, 500));
      }

      if (results.length === 0) {
        return next(new ErrorHandler("Masjeed Not Found", 404));
      }

      const masjeedid = results[0].id;

      const addMessageQuery = `INSERT INTO message (masjeedid, title, description, startdate, expirydate, status, type, enddate) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

      // Handle datetime with string
      const startdate1 = startdate ? new Date(startdate) : null;
      const enddate1 = enddate ? new Date(enddate) : null;
      const expirydate1 = expirydate ? new Date(expirydate) : null;

      connection.query(
        addMessageQuery,
        [
          masjeedid,
          title,
          filename,
          startdate1,
          expirydate1,
          status,
          type,
          enddate1,
        ],
        (error, results) => {
          if (error) {
            return next(new ErrorHandler(error.message, 500));
          }

          res.json({ success: true, message: "Message Added" });
        }
      );
    });
  } catch (error) {
    return next(new ErrorHandler("Internal Server Error", 500));
  }
});

export const getmessages = CatchAsyncError(async (req, res, next) => {
  try {
    const useremail = req.user.email;

    const getmasjeedidQuery = `SELECT id FROM masjeed WHERE email = ? AND status = 1`;

    connection.query(getmasjeedidQuery, [useremail], (error, results) => {
      if (error) {
        console.log("entered");
        return next(new ErrorHandler("Internal Server Error", 500));
      }

      if (results.length === 0) {
        return next(new ErrorHandler("Masjeed Not Found", 404));
      }

      const masjeedid = results[0].id;

      const getmasjeedmessagesQuery = `SELECT * FROM message WHERE masjeedid = ?`;

      connection.query(
        getmasjeedmessagesQuery,
        [masjeedid],
        (error, results) => {
          if (error) {
            return next(new ErrorHandler("Internal Server Error", 500));
          }

          if (results.length === 0) {
            return next(new ErrorHandler("Messages Not Found", 404));
          }

          res.json({
            success: true,
            message: "Messages Fetched",
            data: results,
          });
        }
      );
    });
  } catch (error) {
    return next(new ErrorHandler("Internal Server Error", 500));
  }
});

// export const addmessage = CatchAsyncError(async (req, res, next) => {
//   try {
//     const useremail = req.user.email;

//     let filename = req.file ? req.file.filename : null;

//     if (!filename) {
//       filename = req.body.description;
//     }

//     const { title, startdate, expirydate, status, type, enddate } = req.body;
//     console.log(req.body,filename,"kapil")

//     const getmasjeedidQuery = `SELECT id FROM masjeed WHERE email = ? AND status = 1`;

//     connection.query(getmasjeedidQuery, [useremail], (error, results) => {
//       if (error) {
//         return next(new ErrorHandler(error.message, 500));
//       }

//       if (results.length === 0) {
//         return next(new ErrorHandler("Masjeed Not Found", 404));
//       }

//       const masjeedid = results[0].id;

//       const addMessageQuery = `INSERT INTO message (masjeedid, title, description, startdate, expirydate, status, type, enddate) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

//       const startdate1 = startdate === "null" ? JSON.parse(startdate) : enddate;
//       const enddate1 = enddate === "null" ? JSON.parse(enddate) : enddate;

//       const expirydate1 =
//         expirydate === "null" ? JSON.parse(expirydate) : expirydate;

//       connection.query(
//         addMessageQuery,
//         [
//           masjeedid,
//           title,
//           filename,
//           startdate1,
//           expirydate1,
//           status,
//           type,
//           enddate1,
//         ],
//         (error, results) => {
//           if (error) {
//             return next(new ErrorHandler(error.message, 500));
//           }

//           res.json({ success: true, message: "Message Added" });
//         }
//       );
//     });
//   } catch (error) {
//     return next(new ErrorHandler("Internal Server Error", 500));
//   }
// });
