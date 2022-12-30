const sqlite = require("sqlite3").verbose();
const db = new sqlite.Database(
  "./database.db",
  sqlite.OPEN_READWRITE,
  (err) => {
    if (err) return console.error(err);
  }
);

const Mysql = {
  sql1: `CREATE TABLE users(id INTEGER PRIMARY KEY AUTOINCREMENT, name VARCHAR(32) NOT NULL, email VARCHAR(64) NOT NULL, password VARCHAR(32) NOT NULL)`,
  sql2: `PRAGMA foreign_keys = ON`,
  sql3: `CREATE TABLE tweets(id INTEGER PRIMARY KEY AUTOINCREMENT, author INTEGER NOT NULL, content TEXT NOT NULL, createdAt TEXT NOT NULL, FOREIGN KEY(author) REFERENCES users(id))`,
  sql4: `CREATE TABLE friends_list(id INTEGER PRIMARY KEY AUTOINCREMENT, friend_id INTEGER NOT NULL, friend_name VARCHAR(32) NOT NULL, FOREIGN KEY(friend_id, friend_name) REFERENCES users(id, name))`,
};

Object.entries(Mysql).forEach(([key, value]) => {
  db.run(value);
  console.log("Run the sql", key);
});
