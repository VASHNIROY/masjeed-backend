export const messageTable = `
    CREATE TABLE IF NOT EXISTS message(
        id INT AUTO_INCREMENT PRIMARY KEY,
        masjeedid INT,
        title VARCHAR(555),
        description VARCHAR(555) NOT NULL,
        type VARCHAR(255),
        status INT,
        startdate DATETIME,
        expirydate DATETIME,
        enddate DATETIME,
        FOREIGN KEY (masjeedid) REFERENCES masjeed(id)
    )`;
