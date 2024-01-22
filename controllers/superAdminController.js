import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import CatchAsyncError from "../middleware/catchAsyncError.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import { connection } from "../utils/db.js";

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
});
