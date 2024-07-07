const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();

app.use(express.json());
app.use(cors());

const contactsRouter = require("./routes/api/contacts");
const usersRouter = require("./routes/api/users");

app.use("/api/contacts", contactsRouter);
app.use("/api/users", usersRouter);

app.use((_, res) => {
  res.status(404).json({
    status: "error",
    code: 404,
    message: "Use api on routes: /api/contacts or /api/users",
    data: "Not found",
  });
});

app.use((err, _, res, __) => {
  console.error(err.stack);
  res.status(500).json({
    status: "fail",
    code: 500,
    message: err.message || "Internal Server Error",
    data: "Internal Server Error",
  });
});

const uriDb = process.env.DB_HOST;
const PORT = process.env.PORT || 3000;

mongoose
  .connect(uriDb, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Database connection successful");
    app.listen(PORT, () => {
      console.log(`Server running on port: ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB Atlas:", error.message);
    process.exit(1);
  });
