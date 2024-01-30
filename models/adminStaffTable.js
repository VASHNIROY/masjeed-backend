export const adminStaffTable = `
    CREATE TABLE IF NOT EXISTS adminstaff(
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255),
        email VARCHAR(255) NOT NULL,
        password VARCHAR(255),
        status INT,
        phonenumber VARCHAR(15),
        comment VARCHAR(1000),
        masjeedid INT,     
        roleid INT NOT NULL   
    )
`;
