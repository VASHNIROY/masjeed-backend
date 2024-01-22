import { app } from "./app.js";
import { createTables } from "./models/createTable.js";
import { connection } from "./utils/db.js";

const port = process.env.PORT || 3009;

app.listen(port, () => {
  console.log(`listening on port: ${port}`);
});

connection.connect((err) => {
  if (err) throw err;
  console.log("connected to DB");
  createTables();
});
