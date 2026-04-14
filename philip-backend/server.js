require("dotenv").config();
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// REGISTER
app.post("/api/auth/register", async (req, res) => {
  try {
    const { first_name, last_name, email, phone_number, password } = req.body;

    const hashed = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (first_name, last_name, email, phone_number, password_hash)
       VALUES ($1,$2,$3,$4,$5) RETURNING user_id`,
      [first_name, last_name, email, phone_number, hashed]
    );

    res.json({ success: true, user_id: result.rows[0].user_id });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// LOGIN
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await pool.query(
      "SELECT * FROM users WHERE email=$1",
      [email]
    );

    if (user.rows.length === 0)
      return res.status(401).json({ error: "User not found" });

    const valid = await bcrypt.compare(password, user.rows[0].password_hash);
    if (!valid)
      return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { user_id: user.rows[0].user_id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));