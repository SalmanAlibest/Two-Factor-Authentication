const express = require("express");
const bodyParser = require("body-parser");
const JsonDB = require("node-json-db").JsonDB;
const Config = require("node-json-db/dist/lib/JsonDBConfig").Config;
const uuid = require("uuid");
const speakEasy = require("speakeasy");

const app = express();
port = "5000";

//It will create Database
const db = new JsonDB(new Config("myDataBase", true, false, "/"));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.get("/api", (req, res) => {
  res.json({ message: "Welcome" });
});

app.post("/api/registerUser", (req, res) => {
  const id = uuid.v4();

  try {
    const path = `user/${id}`;
    const tempSecret = speakEasy.generateSecret();
    db.push(path, { path, tempSecret });
    res.json({ id, secret: tempSecret.base32 });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

app.post("/api/verifyUser", (req, res) => {
  const { userId, token } = req.body;
  try {
    const path = `user/${userId}`;
    const user = db.getData(path);
    const { base32: secret } = user.tempSecret;
    const verified = speakEasy.totp.verify({
      secret,
      encoding: "base32",
      token,
    });
    if (verified) {
      db.push(path, { path, id: userId, secret: user.tempSecret });
      res.json({ verified: true });
    } else {
      res.json({ verified: false });
    }
  } catch (e) {
    res
      .status(500)
      .json({ message: `Error While Verifiying User ${e.message}` });
  }
});

app.post("/api/validateUser", (req, res) => {
  const { userId, token } = req.body;
  try {
    // Retrieve user from database
    const path = `user/${userId}`;
    console.log("Path", path);
    const user = db.getData(path);

    console.log("User Data", user);
    const { base32: secret } = user.secret;
    // Returns true if the token matches
    const tokenValidates = speakEasy.totp.verify({
      secret,
      encoding: "base32",
      token,
      window: 1,
    });
    if (tokenValidates) {
      res.json({ validated: true });
    } else {
      res.json({ validated: false });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error retrieving user" });
  }
});

app.listen(port, () => {
  console.log(`App is running on PORT: ${port}.`);
});
