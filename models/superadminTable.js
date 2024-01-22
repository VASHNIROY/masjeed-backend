export  const createSuperAdminTable = `
      CREATE TABLE IF NOT EXISTS superadmin(
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(1000) NOT NULL,
        email VARCHAR(255) NOT NULL,
        password VARCHAR(1000) NOT NULL,
        phonenumber INT NOT NULL,
        roleid INT NOT NULL
      ) ;
  `;