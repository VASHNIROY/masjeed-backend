import ErrorHandler from "../utils/ErrorHandler.js";
import { connection } from "../utils/db.js";
import CatchAsyncError from "./catchAsyncError.js";
import jwt from "jsonwebtoken";

export const isAuthenticatedSuperAdmin = CatchAsyncError(
  async (req, res, next) => {
    const autorizationHeader = req.headers.authorization;
    if (!autorizationHeader) {
      return next(new ErrorHandler("Please provide an access token", 400));
    }
    const access_token = autorizationHeader.split(" ")[1];
    if (!access_token) {
      return next(
        new ErrorHandler("Please login to access this resource", 400)
      );
    }

    try {
      const decoded = jwt.verify(access_token, "uK8Tgvho1Y");
      console.log("decode", decoded);
      if (!decoded) {
        return next(new ErrorHandler("Access token is not valid", 400));
      }
      connection.query(
        "SELECT * FROM superadmin WHERE email = ?",
        [decoded.email],
        (error, results) => {
          if (error) {
            return next(
              new ErrorHandler("Error while fetching staff data", 500)
            );
          }
          if (results.length === 0) {
            return next(new ErrorHandler("User not found", 404));
          }
          console.log("results", results);
          const user = results[0];
          req.user = user;
          next();
        }
      );
    } catch (error) {
      return next(new ErrorHandler("Error while verifying access token", 400));
    }
  }
);

export const isAuthenticatedAdmin = CatchAsyncError(async (req, res, next) => {
  const authorizationHeader = req.headers.authorization;
  if (!authorizationHeader) {
    return next(new ErrorHandler("Please provide an access token", 400));
  }
  const access_token = authorizationHeader.split(" ")[1];
  if (!access_token) {
    return next(new ErrorHandler("Please login to access this resource", 400));
  }

  try {
    const decoded = jwt.verify(access_token, "uK8Tgvho1Y");
    if (!decoded) {
      return next(new ErrorHandler("Access token is not valid", 400));
    }

    // Query the user data from your MySQL database
    connection.query(
      "SELECT * FROM admin WHERE email = ?",
      [decoded.email],
      (error, results) => {
        if (error) {
          return next(new ErrorHandler("Error while fetching staff data", 500));
        }

        if (results.length === 0) {
          return next(new ErrorHandler("user not found", 404));
        }

        const user = results[0];
        req.user = user;
        next();
      }
    );
  } catch (error) {
    return next(new ErrorHandler("Error while verifying access token", 400));
  }
});
