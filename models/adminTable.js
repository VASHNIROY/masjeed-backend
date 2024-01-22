export const createAdminTable = `
    CREATE TABLE IF NOT EXISTS admin(
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        status INT,
        phonenumber VARCHAR(15),
        comment VARCHAR(1000)
    );
`;