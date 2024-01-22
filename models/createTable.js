import { connection } from "../utils/db.js";
import {createSuperAdminTable} from "./superadminTable.js";
import {createMasjeedTable} from "./masjeedTable.js";
import { createAdminTable } from "./adminTable.js";
import { createPrayerTimingsTable } from "./prayerTimingsTable.js";

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
];

export const createTables = () => {
  for (const table of tableToCreate) {
    connection.query(table.sql, (err) => {
      if (err) throw err;
      console.log(`${table.tableName} table created successfully!`);
    });
  }
};
