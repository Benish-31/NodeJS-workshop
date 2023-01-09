const sqlite = require("sqlite3").verbose();
const db = new sqlite.Database(
  "./database.db",
  sqlite.OPEN_READWRITE,
  (err) => {
    if (err) return console.error(err);
  }
);

const Mysql = {
  sql1: `CREATE TABLE users(id INTEGER PRIMARY KEY AUTOINCREMENT, name VARCHAR(32) NOT NULL UNIQUE, email VARCHAR(64) NOT NULL UNIQUE, password TEXT NOT NULL)`,
  sql2: `PRAGMA foreign_keys = ON`,
  sql3: `CREATE TABLE tweets(id INTEGER PRIMARY KEY AUTOINCREMENT, author INTEGER NOT NULL, content TEXT NOT NULL, createdAt TEXT NOT NULL, FOREIGN KEY(author) REFERENCES users(id))`,
  sql4: `CREATE TABLE friends(friend1_id INTEGER PRIMARY KEY AUTOINCREMENT, friend2_id INTEGER NOT NULL, FOREIGN KEY(friend2_id) REFERENCES users(id))`,
};

Object.entries(Mysql).forEach(async ([key, value]) => {
  await db.run(value);
  console.log("Run the sql", key);
});
