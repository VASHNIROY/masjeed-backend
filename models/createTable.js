import { connection } from "../utils/db.js";
import { createSuperAdminTable } from "./superadminTable.js";
import { createMasjeedTable } from "./masjeedTable.js";
import { createAdminTable } from "./adminTable.js";
import { createPrayerTimingsTable } from "./prayerTimingsTable.js";
import { adminStaffTable } from "./adminStaffTable.js";
import { messageTable } from "./messageTable.js";

const tableToCreate = [
  { tableName: "Super Admin", sql: createSuperAdminTable },
  {
    tableName: "Admin Table",
    sql: createAdminTable,
  },
  {
    tableName: "Masjeed Table",
    sql: createMasjeedTable,
  },
  {
    tableName: "Prayer Timings Table",
    sql: createPrayerTimingsTable,
  },
  {
    tableName: "Admin Staff",
    sql: adminStaffTable,
  },
  {
    tableName: "Message Table",
    sql: messageTable,
  },
];

export const createTables = () => {
  for (const table of tableToCreate) {
    connection.query(table.sql, (err) => {
      if (err) throw err;
      console.log(`${table.tableName} table created successfully!`);
    });
  }
};
