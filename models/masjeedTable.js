export const createMasjeedTable = `
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
            status INT,
        prayerdetails VARCHAR(255) NOT NULL
  );`;