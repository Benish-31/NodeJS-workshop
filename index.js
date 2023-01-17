const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const port = 8080;
const sqlite = require("sqlite3").verbose();
const bcrypt = require("bcryptjs");
const db = new sqlite.Database(
  "./database.db",
  sqlite.OPEN_READWRITE,
  (err) => {
    if (err) return console.error(err);
  }
);

app.use(bodyParser.json());

// Middleware to require API key as password to create tweets on user account.
const authenticateKey = async (req, res, next) => {
  try {
    const name = req.body.name;
    let api_key = req.header("x-api-key"); //Add API key to headers

    if (!api_key) {
      res.status(403).send({
        error: { code: 403, message: "You not allowed. API-KEY required" },
      });
    }

    const user = await db("users").first("*").where({ name: name });

    // const user = await db("SELECT * FROM `users` where `name`=?", [name]);

    if (user) {
      const validPass = await bcrypt.compare(api_key, user.password);
      if (validPass) {
        res.status(200).json("Valid Username and pass!");
        next();
      } else {
        res.status(403).json("Wrong password!");
      }
    } else {
      res.status(404).json("User not found!");
    }
  } catch (error) {
    // console.log(e); // Uncomment if needed for debug
    res.status(500).json("Something broke!");
  }
};

// Task 1: Retrieve all tweets.
app.get("/tweets", async (req, res, next) => {
  const sql = "SELECT * FROM `tweets` ORDER BY `createdAt` DESC";
  try {
    await db.all(sql, (err, rows) => {
      res.send(rows);
    });
  } catch (error) {
    res.status(400).send({ code: 400, message: error });
  }
});

// Task 2: Retrieve profile of a user.
app.get("/users/:id", async (req, res, next) => {
  try {
    const id = req.body.id;
    const sql = "SELECT * FROM `users` WHERE `id`=?";
    await db.all(sql, [id], (err, rows) => {
      res.send(rows);
    });
  } catch (error) {
    res.status(400).send({ code: 400, message: error });
  }
});

// Task 3: Retrieve all tweets of a specified user
app.get("/users/:id/tweets", async (req, res, next) => {
  try {
    const id = req.body.id;
    const sql = "SELECT * FROM tweets WHERE `author`=?";
    await db.all(sql, [id], (err, rows) => {
      res.send(rows);
    });
  } catch (error) {
    res.status(400).send({ code: 400, message: error });
  }
});

// Task 4: Create a new tweet
app.post("/tweets", async (req, res, next) => {
  try {
    const { author, content } = req.body;
    if (!author) return res.status(400).send({ errorCode: "AUTHOR_MISSING" });
    if (!content) return res.status(400).send({ errorCode: "CONTENT_MISSING" });
    let date = new Date();

    const user = await db("users").first("*").where({ name: author });
    // const user = await db("SELECT * FROM `users` where `name`=?", [name]);
    if (user) {
      const sql =
        "INSERT INTO `tweets`(`author`,`content`,`createdAt`) VALUES (?,?,?)";
      await db.run(sql, [author, content, date]);
      res.send({ code: 201, status: "ok", success: true });
    } else {
      res.send({ code: 400, status: "ok", success: false });
    }
  } catch (error) {
    res.status(400).send({ code: 400, message: error });
  }
});

// Task 5: Delete a tweet
app.delete("/tweets/:id", async (req, res, next) => {
  try {
    const id = req.body.id;
    const sql = "DELETE FROM `tweets` WHERE `id`=?";
    await db.run(sql, [id], (err) => {
      res.send({ status: "ok", success: true });
    });
  } catch (error) {
    res.status(400).send({ code: 400, message: error });
  }
});

// Task 6: Require to pass password as API key for the author to create a tweet
app.post("/tweets", authenticateKey, async (req, res, next) => {
  try {
    const { author, content } = req.body;
    if (!author) return res.status(400).send({ errorCode: "AUTHOR_MISSING" });
    if (!content) return res.status(400).send({ errorCode: "CONTENT_MISSING" });
    let date = new Date();

    const user = await db("users").first("*").where({ name: author });
    // const user = await db("SELECT * FROM `users` where `name`=?", [name]);

    if (user) {
      const sql =
        "INSERT INTO `tweets`(`author`,`content`,`createdAt`) VALUES (?,?,?)";
      await db.run(sql, [author, content, date]);
      res.send({ code: 201, status: "ok", success: true });
    } else {
      res.send({ code: 400, status: "ok", success: false });
    }
  } catch (error) {
    res.status(400).send({ code: 400, message: error });
  }
});

// BONUS: Create a user profile
app.post("/users", (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name) return res.status(400).send({ errorCode: "NAME_MISSING" });
    if (!email) return res.status(400).send({ errorCode: "EMAIL_MISSING" });
    if (!password)
      return res.status(400).send({ errorCode: "PASSWORD_MISSING" });

    const hash = bcrypt.hash(password, 10);

    const sql = "INSERT INTO `users`(`name`,`email`,`password`) VALUES (?,?,?)";

    db.run(sql, [name, email, hash], (err, row) => {
      if (err) {
        // res.status(400).send({ code: 400, message: err });
        if (err.code == "SQLITE_CONSTRAINT") {
          res.status(403);
          res.status({ status: "error", message: "User already exists" });
        } else {
          res.status(500);
          res.send({ status: "error", message: "Something  went wrong" });
        }
        console.error(err.code);
      } else {
        res.status(201).json("All good!");
      }
    });
  } catch (e) {
    res.status(400).json("Something broke!");
  }
});

// BONUS: Show all users
app.get("/users", async (req, res, next) => {
  try {
    const sql = "SELECT * FROM `users`";
    await db.all(sql, (err, rows) => {
      res.send(rows);
    });
  } catch (error) {
    res.status(400).send({ code: 400, message: error });
  }
});

// Task 7: User add users to friends list
app.post("/users/:id/friends", async (req, res, next) => {
  try {
    const id = req.body.id;
    const sql = "INSERT INTO `friends`(`friend_id`) VALUES (?)";

    await db.run(sql, [id]);
    res.send({ code: 201, status: "ok", success: true });
  } catch (error) {
    res.status(400).send({ code: 400, message: error });
  }
});

// Task 7: User delete users from friends list
app.delete("/users/:id/friends", async (req, res, next) => {
  try {
    const id = req.body;
    const sql = "DELETE FROM `friends` WHERE `friend_id`=?";
    await db.run(sql, [id], (err, rows) => {
      res.send({ code: 202, status: "ok", success: true });
    });
  } catch (error) {
    res.status(400).send({ code: 400, message: error });
  }
});

// Task 7: User see his friends list
app.get("/users/:id/friends", async (req, res, next) => {
  try {
    const id = req.body.id;
    // const sql = "SELECT * from `friends` WHERE `friend_id`=?";
    const sql =
      "SELECT u.* FROM `friends`AS`f`LEFT JOIN`users`AS`u`ON u.id=f.friend2_id WHERE f.friend1_id=?";
    await db.all(sql, [id], (err, rows) => {
      res.send(rows);
    });
  } catch (error) {
    res.status(400).send({ code: 400, message: error });
  }
});

app.listen(port, function (err) {
  if (err) {
    console.error("Failure to launch server");
    return;
  }
  console.log(`Listening on port ${port}`);
});
