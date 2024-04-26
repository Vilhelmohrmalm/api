const express = require("express");
const app = express();
const mysql = require("mysql2/promise");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
// parse application/json, för att hantera att man POSTar med JSON
const bodyParser = require("body-parser");

// Inställningar av servern.
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

async function getDBConnnection() {
  // Här skapas ett databaskopplings-objekt med inställningar för att ansluta till servern och databasen.
  return await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "first",
  });
}

function val(token) {
  let decoded;
  try {
    decoded = jwt.verify(token, "halloj");
  } catch (err) {
    console.log(err); //Logga felet, för felsökning på servern.
  }
}

app.get("/", (req, res) => {
  res.send(`<h1>Doumentation EXEMPEL</h1>
  <ul><li> GET /users</li></ul>`);
});

app.get("/get", async function (req, res) {
  val(token);
  let connection = await getDBConnnection();
  let sql = `SELECT * From first_users`;
  let [results] = await connection.execute(sql);

  //res.json() skickar resultat som JSON till klienten
  res.json(results);
});

app.post("/user", async function (req, res) {
  val(token);
  try {
    let connection = await getDBConnnection();
    let sql = `...`;

    let [results] = await connection.execute(sql);
    //...
  } catch (err) {
    res.statusCode(500).send("Something went wrong!");
  }
});

app.put("/users/id", async function (req, res) {
  val(token);
  let connection = await getDBConnnection();
  //kod här för att hantera anrop…

  try {
    let sql = `UPDATE first_users
    SET name = ?, email = ?
    WHERE username = ?`;

    let [results] = await connection.execute(sql, [
      req.body.name,
      req.body.email,
      req.body.username,
    ]);
    res.json("200 OK");
  } catch (error) {
    res.json("400 bad request");
  }
});

app.post("/users", async function (req, res) {
  let auth = req.headers["authorization"];
  if (auth === undefined) {
    res.status.send(401).send("auth token missing");
  }
  let token = auth.slice(7);
  val(token);
  //req.body innehåller det postade datat
  console.log(req.body);

  let connection = await getDBConnnection();
  let sql = `INSERT INTO first_users (username, name, password)
   VALUES (?, ?, ?)`;

  const salt = await bcrypt.genSalt(10);
  const lösen = await bcrypt.hash(req.body.password, salt);

  let [results] = await connection.execute(sql, [
    req.body.username,
    req.body.name,
    lösen,
  ]);

  //results innehåller metadata om vad som skapades i databasen
  console.log(results);
  res.json(results);
});

app.post("/login", async function (req, res) {
  let connection = await getDBConnnection();
  let sql = "SELECT * FROM first_users WHERE username = ?";
  try {
    let [results] = await connection.execute(sql, [req.body.username]);
    bcrypt.compare(req.body.password, results[0].password, (err, result) => {
      if (result) {
        let token = jwt.sign(
          {
            sub: results[0].id,
            name: results[0].name,
          },
          "halloj",
          { expiresIn: "2h" }
        );
        res.json(token);
      } else {
        res.json(401);
      }
    });
  } catch (error) {
    res.json(401);
  }
});
// console.log(results[0].password);

const port = 3000;
app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
