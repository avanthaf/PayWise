import express, { Request, Response } from "express";
import User from "../models/User";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const router = express.Router();

router.post("/register", async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "User already exists with this email" });
    }

    const hashed = await bcrypt.hash(password, 10);
    await new User({ name, email, password: hashed }).save();

    return res.status(201).json({
      message: "User registered successfully. Redirecting to the Login Page",
    });
  } catch {
    return res.status(500).json({ message: "Something went wrong. Please try again." });
  }
});

router.get("/me", async (req: Request, res: Response) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };
    const user = await User.findById(payload.id).select("name email");

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    return res.status(200).json({ name: user.name, email: user.email });
  } catch {    return res.status(401).json({ message: "Invalid or expired session" });
  }
});

router.post("/logout", (_req: Request, res: Response) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: false,
    sameSite: "strict",
  });
  return res.status(200).json({ message: "Logged out successfully" });
});

export default router;