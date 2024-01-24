import CatchAsyncError from "../middleware/catchAsyncError.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import { connection } from "../utils/db.js";



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
        return next(new ErrorHandler("Timings Not Found", 404));x``
      }
      res.json({ success: true, message: "Fetched Timings", data: results });
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});
