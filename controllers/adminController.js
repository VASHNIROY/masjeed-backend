import CatchAsyncError from "../middleware/catchAsyncError.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import { connection } from "../utils/db.js";
import nodemailerConfig from "../utils/nodemailer.js";

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
      (selectErr, results) => {
        if (selectErr) {
          console.log("Error while updating timings in Database", selectErr);
          return next(new ErrorHandler("Internal Server Error", 500));
        }
        if (results.length === 0) {
          return next(new ErrorHandler("Timings Not Found", 404));
        }
        res.json({ success: true, message: "upated Timings" });
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
    const masjeedid = req.params.id;
    const masjeedUpdateQuery = `UPDATE masjeed SET adminname = ?, masjeedname = ?, address =? , email = ?, postalcode = ?, city = ?, state = ?, country = ?, phonenumber = ?, status = ?, prayerdetails = ? WHERE id = ?`;
    const {
      adminname,
      masjeedname,
      address,
      email,
      postalcode,
      city,
      state,
      country,
      phonenumber,
      status,
      prayerdetails,
    } = req.body;

    connection.query(
      masjeedUpdateQuery,
      [
        adminname,
        masjeedname,
        address,
        email,
        postalcode,
        city,
        state,
        country,
        phonenumber,
        status,
        prayerdetails,
        masjeedid,
      ],
      (updateErr, results) => {
        if (updateErr) {
          console.log("Error while updating masjeed in Database", updateErr);
          return next(new ErrorHandler("Internal Server Error", 500));
        }

        if (results.affectedRows === 0) {
          return next(new ErrorHandler("Masjeed Not Found", 404));
        }

        res.json({ success: true, message: "Updated masjeed" });
      }
    );
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});
