const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const port = 8080;
const sqlite = require("sqlite3").verbose();
const db = new sqlite.Database(
  "./database.db",
  sqlite.OPEN_READWRITE,
  (err) => {
    if (err) return console.error(err);
  }
);

app.use(bodyParser.json());

// Middleware to require API key as password to create tweets on user account.
const authenticateKey = (req, res, next) => {
  let api_key = req.header("x-api-key"); //Add API key to headers
  if (api_key) {
    const password = db.all(
      "SELECT `id` FROM `users` WHERE (`id`=? AND `password`=?)",
      [req.body.author, api_key]
    );
    if (password) {
      next();
    } else {
      res.status(400).send({ error: { code: 403, message: "Wrong Password" } });
    }
  } else {
    res.status(403).send({
      error: { code: 403, message: "You not allowed. API-KEY required" },
    });
  }
};

// Task 1: Retrieve all tweets.
app.get("/tweets", (req, res, next) => {
  const sql = "SELECT * FROM `tweets` ORDER BY `createdAt` DESC";
  try {
    db.all(sql, (err, rows) => {
      res.send(rows);
    });
  } catch {
    res.status(400).send({ status: "error" });
  }
});

// Task 2: Retrieve profile of a user.
app.get("/users/:id", async (req, res, next) => {
  try {
    const sql = "SELECT * FROM `users` WHERE `id`=?";
    db.all(sql, [req.params.id], (err, rows) => {
      res.send(rows);
    });
  } catch {
    res.status(400).send({ status: "error" });
  }
});

// Task 3: Retrieve all tweets of a specified user
app.get("/users/:id/tweets", (req, res, next) => {
  try {
    const sql = "SELECT * FROM tweets WHERE `author`=?";
    db.all(sql, [req.params.id], (err, rows) => {
      res.send(rows);
    });
  } catch {
    res.status(400).send({ status: "error" });
  }
});

// Task 4: Create a new tweet
app.post("/tweets", (req, res, next) => {
  try {
    if (!req.body.author)
      return res.status(400).send({ errorCode: "AUTHOR_MISSING" });
    if (!req.body.content)
      return res.status(400).send({ errorCode: "CONTENT_MISSING" });
    let date = new Date();
    const sql =
      "INSERT INTO `tweets`(`author`,`content`,`createdAt`) VALUES (?,?,?)";
    db.run(sql, [req.body.author, req.body.content, date], (err) => {
      res.send({ status: "ok" });
    });
  } catch {
    res.status(400).send({ status: "error" });
  }
});

// Task 5: Delete a tweet
app.delete("/tweets/:id", (req, res, next) => {
  try {
    const sql = "DELETE FROM `tweets` WHERE `id`=?";
    db.run(sql, [req.params.id], (err) => {
      res.send({ status: "ok", success: true });
    });
  } catch {
    res.status(400).send({ status: "error" });
  }
});

// Task 6: Require to pass password as API key for the author to create a tweet
app.post("/tweets", authenticateKey, async (req, res, next) => {
  try {
    if (!req.body.author)
      return res.status(400).send({ errorCode: "AUTHOR_MISSING" });
    if (!req.body.content)
      return res.status(400).send({ errorCode: "CONTENT_MISSING" });
    let date = new Date();
    const sql =
      "INSERT INTO `tweets`(`author`,`content`,`createdAt`) VALUES (?,?,?)";
    db.run(sql, [req.body.author, req.body.content, date], (err, rows) => {
      res.send(rows);
    });
  } catch {
    res.status(400).send({ status: "error" });
  }
});

// BONUS: Create a user profile
app.post("/users", (req, res, next) => {
  try {
    if (!req.body.name)
      return res.status(400).send({ errorCode: "NAME_MISSING" });
    if (!req.body.email)
      return res.status(400).send({ errorCode: "EMAIL_MISSING" });
    if (!req.body.password)
      return res.status(400).send({ errorCode: "PASSWORD_MISSING" });

    const sql = "INSERT INTO `users`(`name`,`email`,`password`) VALUES (?,?,?)";
    db.run(
      sql,
      [req.body.name, req.body.email, req.body.password],
      (err, rows) => {
        res.send(rows);
      }
    );
  } catch {
    res.status(400).send({ status: "error" });
  }
});

// BONUS: Show all users
app.get("/users", (req, res, next) => {
  try {
    const sql = "SELECT * FROM `users`";
    db.all(sql, (err, rows) => {
      res.send(rows);
    });
  } catch {
    res.status(400).send({ status: "error" });
  }
});

// Task 7: User add users to friends list
app.post("/users/:id/friends", (req, res, next) => {
  try {
    const sql =
      "INSERT INTO `friends_list`(`friend_id`, `friend_name`) VALUES (?,?)";

    db.run(sql, [req.params.id, req.body.name], (err, rows) => {
      res.send({ status: "ok" });
    });
  } catch {
    res.status(400).send({ status: "error" });
  }
});

// Task 7: User delete users from friends list
app.delete("/users/:id/friends/:name", (req, res, next) => {
  try {
    const sql =
      "DELETE FROM `friends_list` WHERE `friend_id`=? AND `friend_name`=?";
    db.run(sql, [req.params.id, req.params.name], (err, rows) => {
      res.send({ status: "ok" });
    });
  } catch {
    res.status(400).send({ status: "error" });
  }
});

// Task 7: User see his friends list
app.get("/users/:id/friends", (req, res, next) => {
  try {
    const sql = "SELECT * from `friends_list` WHERE `friend_id`=?";
    db.all(sql, [req.params.id], (err, rows) => {
      res.send(rows);
    });
  } catch {
    res.status(400).send({ status: "error" });
  }
});

app.listen(port, function (err) {
  if (err) {
    console.error("Failure to launch server");
    return;
  }
  console.log(`Listening on port ${port}`);
});
