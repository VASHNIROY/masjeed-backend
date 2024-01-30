import CatchAsyncError from "../middleware/catchAsyncError.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import { connection } from "../utils/db.js";
import nodemailerConfig from "../utils/nodemailer.js";

import { fileURLToPath } from "url";

function generateOTP() {
  // Generate a 4-digit random OTP
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export const adminLogin = CatchAsyncError(async (req, res, next) => {
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
  const masjeedid = req.params.id;
  try {
    const MasjeedTimingsQuery = `SELECT * FROM prayertimingstable WHERE masjeedid = ?`;
    connection.query(MasjeedTimingsQuery, [masjeedid], (selectErr, results) => {
      if (selectErr) {
        console.log("Error fetching timings from Database", selectErr);
        return next(new ErrorHandler("Internal Server Error", 500));
      }
      if (results.length === 0) {
        return next(new ErrorHandler("Timings Not Found", 404));
        x``;
      }
      res.json({ success: true, message: "Fetched Timings", data: results });
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

export const updateTimingRow = CatchAsyncError(async (req, res, next) => {
  try {
    const { masjeedid, day, month, fajr, shouruq, dhuhr, asr, maghrib, isha } =
      req.body;

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
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

export const getMasjeedDetails = CatchAsyncError(async (req, res, next) => {
  try {
    const masjeedid = req.params.id;
    const masjeedDetailsQuery = `SELECT * FROM masjeed WHERE id = ?`;
    connection.query(masjeedDetailsQuery, [masjeedid], (selectErr, results) => {
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

    const masjeedUpdateQuery = `UPDATE masjeed SET adminname = ?, masjeedname = ?, address =? , postalcode = ?, city = ?, state = ?, country = ?, phonenumber = ?, prayerdetails = ? WHERE email = ?`;
    const {
      adminname,
      masjeedname,
      address,
      postalcode,
      city,
      email,
      state,
      country,
      phonenumber,
    } = req.body;

    if (!filename) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    connection.query(
      masjeedUpdateQuery,
      [
        adminname,
        masjeedname,
        address,
        postalcode,
        city,
        state,
        country,
        phonenumber,
        filename,
        email,
      ],
      (updateErr, results) => {
        if (updateErr) {
          console.log("Error while updating masjeed in Database", updateErr);
          return next(new ErrorHandler("Internal Server Error", 500));
        }

        if (results.affectedRows === 0) {
          return next(new ErrorHandler("Masjeed Not Found", 404));
        }

        res.json({ success: true, message: "masjeed updated successfully" });
      }
    );
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

export const addAdminStaff = CatchAsyncError(async (req, res, next) => {
  try {
    const verifyEmailQuery = `SELECT email FROM adminstaff WHERE email = ?`;

    connection.query(verifyEmailQuery, [req.body.email], (error, results) => {
      if (error) {
        return next(new ErrorHandler(error.message, 500));
      }

      if (results.length > 0) {
        return next(new ErrorHandler("Email already exists", 400));
      }

      const { name, email, phonenumber, comment, masjeedid, roleid } = req.body;

      const addAdminStaffQuery = `INSERT INTO adminstaff(name, email, password, phonenumber, comment, masjeedid, roleid, status) VALUES(?, ?, ?, ?, ?, ?, ?, ?)`;

      connection.query(
        addAdminStaffQuery,
        [name, email, 123456, phonenumber, comment, masjeedid, roleid, 1],
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
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

export const editAdminStaffMember = CatchAsyncError(async (req, res, next) => {
  try {
    const masjeedid = req.params.id;
    const { name, email, phonenumber, comment, roleid } = req.body;

    const checkEmail = `SELECT email FROM adminstaff WHERE email = ? AND masjeedid = ?`;

    connection.query(checkEmail, [email, masjeedid], (error, results) => {
      if (error) {
        return next(new ErrorHandler(error.message, 500));
      }

      if (results.length > 0) {
        return next(new ErrorHandler("Email already exists", 400));
      }

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
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

export const editIqamah = CatchAsyncError(async (req, res, next) => {
  try {
    const masjeedid = req.params.id;
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
  } catch (error) {
    return next(new ErrorHandler("Internal Server Error", 500));
  }
});
