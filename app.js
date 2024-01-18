// import express from "express";
// import mysql2 from "mysql2";

// const app = express();

// const port = process.env.PORT || 3009;

// const prayerDetails1 =

// [
//     {
//       "name": "jama",
//       "schedule": [
//         { "startdatetime": "2023-12-12T12:00:00Z", "enddatetime": "2120-02-01T18:30:00Z" }
//       ]
//     },
//     {
//       "name": "jama1",
//       "schedule": [
//         { "startdatetime": "2023-12-12T12:00:00Z", "enddatetime": "2120-02-01T18:30:00Z" }
//       ]
//     },
//     {
//       "name": "jama2",
//       "schedule": [
//         { "startdatetime": "2023-12-12T12:00:00Z", "enddatetime": "2120-02-01T18:30:00Z" }
//       ]
//     }
//   ]

// // Create a MySQL database connection
// const db = mysql2.createConnection({
//   host: "localhost",
//   user: "root",
//   password: "root1234",
//   database: "masjeed",
// });

// // Connect to the MySQL database
// db.connect((err) => {
//   if (err) {
//     console.error("Error connecting to MySQL database:", err);
//     return;
//   }
//   console.log("Connected to MySQL database");

//   // Create a 'masjeed' table
//   const createMasjeedTable = `
//   CREATE TABLE IF NOT EXISTS masjeed(
//       id INT AUTO_INCREMENT PRIMARY KEY,
//       name VARCHAR(1000) NOT NULL,
//       address VARCHAR(1000) NOT NULL,
//       email VARCHAR(255) NOT NULL,
//       postalcode INT,
//       city VARCHAR(255),
//       state VARCHAR(255),
//       country VARCHAR(255),
//       phonenumber INT,
//       prayerdetails VARCHAR(255)
//   );
// `;

//   const createPrayerTimigsTable = `
//     CREATE TABLE IF NOT EXISTS prayerTimings(
//         id INT AUTO_INCREMENT PRIMARY KEY,
//         masjeedid INT,
//         prayername VARCHAR(255),
//         starttime DATETIME,
//         endtime DATETIME
//     );
//   `;

//   db.query(createMasjeedTable, (err) => {
//     if (err) {
//       console.error("Error creating masjeed table:", err);
//     } else {
//       console.log("masjeed table created");
//     }
//   });

//   db.query(createPrayerTimigsTable, (err) => {
//     if (err) {
//       console.log("Error creating prayertimings table", err);
//     } else {
//       console.log("prayertimings table created");
//     }
//   });
// });

// app.get("/getmasjeeds", (req, res) => {
//   const selectMasjeedQuery = `SELECT * FROM masjeed WHERE postalcode = ?`;
//   //   const { postalcode } = req.body;
//   console.log(req);

//   db.query(selectMasjeedQuery, [postalcode], (err, results) => {
//     if (err) {
//       console.error("Error getting masjeeds:", err);
//       res.status(500).json({ error: "Internal Server Error" });
//       return;
//     }

//     res.json({ masjeeds: results });
//   });
// });

// app.post("/addmasjeed", async (req, res) => {
//   const addMasjeedQuery = `INSERT INTO masjeed (name,address,email,postalcode,city,state,country,phonenumber) VALUES (?,?,?,?,?,?,?,?)`;

//   const {
//     name,
//     address,
//     email,
//     postalcode,
//     city,
//     state,
//     country,
//     phonenumber,
//     prayerdata,
//   } = req.body;

//   try{

//   const masjeedInsertResult = await db.query(addMasjeedQuery, [
//     name,
//     address,
//     email,
//     postalcode,
//     city,
//     state,
//     country,
//     phonenumber,
//   ]);

//   const masjeedId = masjeedInsertResult.insertId;

//   // Handle the second query (assuming it's another query for the masjeed table)
//   // Adjust the query as needed

//   const secondQueryResult = await db.query(
//     'INSERT INTO prayertimings (masjeed_id, column1, column2) VALUES (?,?,?)',
//     [masjeedId, 'value1', 'value2']
//   );

//   // Check results or handle success as needed
//   console.log("Masjeed Inserted Successfully", masjeedInsertResult);
//   console.log("Data Inserted into Another Table Successfully", secondQueryResult);

//   res.status(200).json({ message: "Data Inserted Successfully" });

//   }catch(err){
//     console.error("Error inserting data:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }

// });

// // Start the server
// app.listen(port, () => {
//   console.log(`Server is running at http://localhost:${port}`);
// });

import express from "express";
import mysql2 from "mysql2";
import multer from "multer";
import path from "path";
import xlsx from "xlsx";
import { isToday } from "date-fns";
import { fileURLToPath } from "url";
import { dirname } from "path";
import fs from "fs-extra";
import excelToJson from "convert-excel-to-json";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3009;

// Create a MySQL database connection
const db = mysql2.createConnection({
  host: "localhost",
  user: "root",
  password: "root1234",
  database: "masjeed",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Connect to the MySQL database
db.connect((err) => {
  if (err) {
    console.error("Error connecting to MySQL database:", err);
    return;
  }
  console.log("Connected to MySQL database");

  // Create a 'files' table to store file details
  const createMasjeedTable = `
    CREATE TABLE IF NOT EXISTS masjeed(
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(1000) NOT NULL,
            address VARCHAR(1000) NOT NULL,
             email VARCHAR(255) NOT NULL,
            postalcode INT NOT NULL,
              city VARCHAR(255) NOT NULL,
             state VARCHAR(255) NOT NULL,
             country VARCHAR(255) NOT NULL,
            phonenumber INT NOT NULL,
        prayerdetails VARCHAR(255) NOT NULL
  );`;

  db.query(createMasjeedTable, (createTableErr) => {
    if (createTableErr) {
      console.error("Error creating masjeed table:", createTableErr);
    } else {
      console.log("Masjeed table created");
    }
  });
});

// Set up Multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads");
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const upload = multer({ storage: storage });

// API to upload an Excel file and store filename in the database
app.post("/addmasjeed", upload.single("file"), (req, res) => {
  const filename = req.file ? req.file.filename : null;

  const {
    name,
    address,
    email,
    postalcode,
    city,
    state,
    country,
    phonenumber,
  } = req.body;

  if (!filename) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }

  const addMasjeedQuery = `INSERT INTO masjeed (name,address,email,postalcode,city,state,country,phonenumber,prayerdetails) VALUES (?,?,?,?,?,?,?,?,?)`;

  db.query(
    addMasjeedQuery,
    [
      name,
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
        res.status(500).json({ error: "Internal Server Error" });
        return;
      }

      console.log("Masjeed inserted into the database");
      res.status(200).json({ message: "File uploaded successfully" });
    }
  );
});

// API to fetch today's schedule based on fileId
// app.get("/getTodaySchedule/:id", (req, res) => {
//   const masjeedid = req.params.id;

//   // Fetch filename from the database
//   const selectQuery = "SELECT prayerdetails FROM masjeed WHERE id = ?";
//   db.query(selectQuery, [masjeedid], (selectError, results) => {
//     if (selectError) {
//       console.error(
//         "Error fetching prayerdetails from the database:",
//         selectError
//       );
//       res.status(500).json({ error: "Internal Server Error" });
//       return;
//     }

//     if (results.length === 0) {
//       res.status(404).json({ error: "File not found" });
//       return;
//     }

//     const filename = results[0].prayerdetails;

//     // Read the Excel file
//     const filePath = path.join(__dirname, "uploads", filename);
//     const workbook = xlsx.readFile(filePath);
//     const sheetName = workbook.SheetNames[0];
//     const sheet = workbook.Sheets[sheetName];

//     // Parse Excel data
//     const excelData = xlsx.utils.sheet_to_json(sheet);

//     console.log("excelData", excelData);

//     // Filter today's schedule
//     const todaySchedule = excelData.filter((row) => {
//       const today = new Date();
//       const rowDate = new Date(row.month, row.day - 1); // Assuming day is 1-indexed
//       return isToday(rowDate) && row.FajrAdhan && row.shouruq;
//     });

//     console.log(todaySchedule);

//     // Sort today's schedule based on day and time
//     todaySchedule.sort((a, b) => {
//       const dayComparison = a.day - b.day;
//       if (dayComparison !== 0) return dayComparison;

//       const time1Comparison =
//         new Date(`1970-01-01T${a.time1}`) - new Date(`1970-01-01T${b.time1}`);
//       if (time1Comparison !== 0) return time1Comparison;

//       const time2Comparison =
//         new Date(`1970-01-01T${a.time2}`) - new Date(`1970-01-01T${b.time2}`);
//       return time2Comparison;
//     });

//     // Respond with today's schedule
//     res.json({ masjeedid, todaySchedule });
//   });
// });

app.get("/getTodaySchedule/:id", (req, res) => {
  const masjeedid = req.params.id;

  // Fetch filename from the database
  const selectQuery = "SELECT prayerdetails FROM masjeed WHERE id = ?";
  db.query(selectQuery, [masjeedid], (selectError, results) => {
    if (selectError) {
      console.error(
        "Error fetching prayerdetails from the database:",
        selectError
      );
      res.status(500).json({ error: "Internal Server Error" });
      return;
    }

    if (results.length === 0) {
      res.status(404).json({ error: "File not found" });
      return;
    }

    const filename = results[0].prayerdetails;

    // Read the Excel file
    const filePath = path.join(__dirname, "uploads", filename);
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Parse Excel data
    const excelData = xlsx.utils.sheet_to_json(sheet, {
      raw: false,
      range: 11,
    });


    // Get today's date
    const today = new Date();
    const todayMonth = today.getMonth() + 1; // Month is 0-indexed in JavaScript
    const todayDay = today.getDate();
    // Filter data for today's month and day

    const todaySchedule = excelData.filter((row) => {
      return row.Month == todayMonth && row.Day == todayDay;
    });

    // // Respond with today's schedule
    res.json({ todaySchedule });
    // res.json({ todaySchedule });
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
