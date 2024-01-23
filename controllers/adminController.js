import CatchAsyncError from "../middleware/catchAsyncError.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import { connection } from "../utils/db.js";

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
      }
      res.json({ success: true, message: "Fetched Timings", data: results });
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});
