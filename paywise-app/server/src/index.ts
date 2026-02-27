import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(express.json());

mongoose.connect(process.env.MONGO_URI as string, {
  family: 4,
})
  .then(() => console.log("MongoDB connected"))
  .catch(err => {
    console.error("MongoDB connection failed:", err);
    process.exit(1);
  });

app.get("/", (req, res) => {
  res.send("Paywise API running");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});