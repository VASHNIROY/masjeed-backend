export const createPrayerTimingsTable = `
    CREATE TABLE IF NOT EXISTS prayertimingstable(
    id INT AUTO_INCREMENT PRIMARY KEY,
    masjeedid INT,
    day INT,
    month INT,
    fajr VARCHAR(255),
    shouruq VARCHAR(255),
    dhuhr VARCHAR(255),
    asr VARCHAR(255),
    maghrib VARCHAR(255),
    isha VARCHAR(255),
    fajriqamah VARCHAR(255),
                dhuhriqamah VARCHAR(255),
                asriqamah VARCHAR(255),
                maghribiqamah VARCHAR(255),
               ishaiqamah VARCHAR(255),
                jumahadhan VARCHAR(255),
                jumahkhutbaduration VARCHAR(255)
    );
`;
