export const createPrayerTimingsTable = `
    CREATE TABLE IF NOT EXISTS prayertimingstable(
    id INT AUTO_INCREMENT PRIMARY KEY,
    masjeedid INT,
    day INT NOT NULL,
    month INT NOT NULL,
    fajr VARCHAR(255) NOT NULL,
    shouruq VARCHAR(255) NOT NULL,
    dhuhr VARCHAR(255) NOT NULL,
    asr VARCHAR(255) NOT NULL,
    maghrib VARCHAR(255) NOT NULL,
    isha VARCHAR(255) NOT NULL
    );
`;
