const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const port = 8080;
const sqlite = require("sqlite3").verbose();
let sql;
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
      res.status(404).send({
        error: {
          code: 404,
          message: "Wrong Password.",
        },
      });
    }
  } else {
    res.status(403).send({
      error: { code: 403, message: "You not allowed. API-KEY required" },
    });
  }
};

// Task 1: Retrieve all tweets.
app.get("/tweets", (req, res, next) => {
  sql = "SELECT * FROM `tweets` ORDER BY `createdAt` DESC";
  try {
    db.all(sql, (err, rows) => {
      if (err) return res.json({ status: 300, success: false, error: err });

      return res.json({ status: 200, data: rows, success: true });
    });
  } catch (error) {
    return res.json({
      status: 400,
      success: false,
    });
  }
});

// Task 2: Retrieve profile of a user.
app.get("/users/:id", async (req, res, next) => {
  try {
    sql = "SELECT * FROM `users` WHERE `id`=?";
    db.all(sql, [req.params.id], (err, rows) => {
      if (err) return res.json({ status: 300, success: false, error: err });

      return res.json({ status: 200, data: rows, success: true });
    });
  } catch {
    return res.json({
      status: 400,
      success: false,
    });
  }
});

// Task 3: Retrieve all tweets of a specified user
app.get("/users/:id/tweets", (req, res, next) => {
  try {
    sql = "SELECT * FROM tweets WHERE `author`=?";
    db.all(sql, [req.params.id], (err, rows) => {
      if (err) return res.json({ status: 300, success: false, error: err });

      return res.json({ status: 200, data: rows, success: true });
    });
  } catch {
    return res.json({
      status: 400,
      success: false,
    });
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
    sql = "INSERT INTO `tweets`(`author`,`content`,`createdAt`) VALUES (?,?,?)";
    db.run(sql, [req.body.author, req.body.content, date], (err) => {
      if (err) return res.json({ status: 300, success: false, error: err });

      console.log(
        "successful input ",
        req.body.author,
        req.body.content,
        req.body.createdAt
      );
    });
    return res.json({
      status: 200,
      success: true,
    });
  } catch (error) {
    return res.json({
      status: 400,
      success: false,
    });
  }
});

// Task 5: Delete a tweet
app.delete("/tweets/:id", (req, res, next) => {
  try {
    sql = "DELETE FROM `tweets` WHERE `id`=?";
    db.run(sql, [req.params.id], (err) => {
      if (err) return res.json({ status: 300, success: false, error: err });

      console.log("successful deleted");
    });

    return res.json({
      status: 200,
      success: true,
    });
  } catch (error) {
    return res.json({
      status: 400,
      success: false,
    });
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
    sql = "INSERT INTO `tweets`(`author`,`content`,`createdAt`) VALUES (?,?,?)";
    db.run(sql, [req.body.author, req.body.content, date], (err) => {
      if (err) return res.json({ status: 300, success: false, error: err });

      console.log(
        "successful input ",
        req.body.author,
        req.body.content,
        req.body.createdAt
      );
    });
    return res.json({
      status: 200,
      success: true,
    });
  } catch (error) {
    return res.json({
      status: 400,
      success: false,
    });
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

    sql = "INSERT INTO `users`(`name`,`email`,`password`) VALUES (?,?,?)";
    db.run(sql, [req.body.name, req.body.email, req.body.password], (err) => {
      if (err) return res.json({ status: 300, success: false, error: err });

      console.log(
        "successful input ",
        req.body.name,
        req.body.email,
        req.body.password
      );
    });
    return res.json({
      status: 200,
      success: true,
    });
  } catch (error) {
    return res.json({
      status: 400,
      success: false,
    });
  }
});

// BONUS: Show all users
app.get("/users", (req, res, next) => {
  try {
    sql = "SELECT * FROM `users`";
    db.all(sql, (err, rows) => {
      if (err) return res.json({ status: 300, success: false, error: err });

      return res.json({ status: 200, data: rows, success: true });
    });
  } catch (error) {
    return res.json({
      status: 400,
      success: false,
    });
  }
});

// Task 7: User add users to friends list
app.post("/users/:id/friends", (req, res, next) => {
  try {
    sql = "INSERT INTO `friends_list`(`friend_id`, `friend_name`) VALUES (?,?)";

    db.run(sql, [req.params.id, req.body.name], (err, rows) => {
      if (err) return res.json({ status: 300, success: false, error: err });

      console.log("successful input ", req.body.name);

      return res.json({ status: 200, data: rows, success: true });
    });
  } catch {
    return res.json({
      status: 400,
      success: false,
    });
  }
});

// Task 7: User delete users from friends list
app.delete("/users/:id/friends/:name", (req, res, next) => {
  try {
    sql = "DELETE FROM `friends_list` WHERE `friend_id`=? AND `friend_name`=?";
    db.run(sql, [req.params.id, req.params.name], (err, rows) => {
      if (err) return res.json({ status: 300, success: false, error: err });

      return res.json({ status: 200, data: rows, success: true });
    });
  } catch {
    return res.json({
      status: 400,
      success: false,
    });
  }
});

// Task 7: User see his friends list
app.get("/users/:id/friends", (req, res, next) => {
  try {
    sql = "SELECT * from `friends_list` WHERE `friend_id`=?";
    db.all(sql, [req.params.id], (err, rows) => {
      if (err) return res.json({ status: 300, success: false, error: err });

      return res.json({ status: 200, data: rows, success: true });
    });
  } catch {
    return res.json({
      status: 400,
      success: false,
    });
  }
});

app.listen(port, function (err) {
  if (err) {
    console.error("Failure to launch server");
    return;
  }
  console.log(`Listening on port ${port}`);
});
