import express from "express";
import mysql2 from "mysql2";
import multer from "multer";
import path from "path";
import fs from "fs/promises";

const app = express();

const port = process.env.PORT || 3009;

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads");
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  },
});

const upload = multer({ storage: storage });

// Create a MySQL database connection
const db = mysql2.createConnection({
  host: "localhost",
  user: "root",
  password: "root1234",
  database: "masjeed",
});

// Connect to the MySQL database
db.connect((err) => {
  if (err) {
    console.error("Error connecting to MySQL database:", err);
    return;
  }
  console.log("Connected to MySQL database");

  // Create a 'users' table
  const createMasjeedTable = `
  CREATE TABLE IF NOT EXISTS masjeed(
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(1000) NOT NULL,
      address VARCHAR(1000) NOT NULL,
      email VARCHAR(255) NOT NULL,
      postalcode INT,
      city VARCHAR(255),
      state VARCHAR(255),
      country VARCHAR(255),
      phonenumber INT,
      prayerdetails VARCHAR(255)
  );
`;

  db.query(createMasjeedTable, (err) => {
    if (err) {
      console.error("Error creating masjeed table:", err);
    } else {
      console.log("masjeed table created");
    }
  });
});

app.get("/getmasjeeds", (req, res) => {
  const selectMasjeedQuery = `SELECT * FROM masjeed WHERE postalcode = ?`;
  //   const { postalcode } = req.body;
  console.log(req   );

  db.query(selectMasjeedQuery, [postalcode], (err, results) => {
    if (err) {
      console.error("Error getting masjeeds:", err);
      res.status(500).json({ error: "Internal Server Error" });
      return;
    }

    res.json({ masjeeds: results });
  });
});

app.post("/addmasjeed", upload.single("file"), async (req, res) => {
  const addMasjeedQuery = `INSERT INTO masjeed (name,address,email,postalcode,city,state,country,phonenumber,prayerdetails) VALUES (?,?,?,?,?,?,?,?,?)`;

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

  let excelPath = null;

  if (req.file) {
    // Save the file to the "uploads" folder
    const uploadPath = path.join(__dirname, "../uploads");
    await fs.mkdir(uploadPath, { recursive: true });

    const ext = path.extname(req.file.originalname);
    const fileName = Date.now() + ext;
    excelPath = path.join(uploadPath, fileName);
    await fs.rename(req.file.path, excelPath);
  }

  const prayerdetails = `Path: ${excelPath}`;
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
      prayerdetails,
    ],
    (err, result) => {
      if (err) {
        console.log("Error inserting Masjeed", err);
        res.status(500).json({ error: "Internal Server Error" });
      } else {
        console.log("Masjeed Inserted Successfully");
        res.status(200).json({ message: "Masjeed Inserted Successfully" });
      }
    }
  );
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
