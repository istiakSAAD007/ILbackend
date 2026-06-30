import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../configs/prisma.js";
import { ENV } from "../utils/env.js";

const tokenGen = (id, role) => {
  return jwt.sign({ id, role }, ENV.JWT_SECRET, { expiresIn: "3d" });
};

// register user
export const register = async (req, res) => {
  const { email, password, firstName, lastName, location, role } = req.body;
  try {
    if (!email || !password || !firstName || !lastName || !location) {
      return res.status(400).json({ error: "Missing fields." });
    }

    const assignedRole = role === "RECRUITER" ? "RECRUITER" : "CANDIDATE";

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "Email is already registered." });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          password: passwordHash,
          role: assignedRole,
        },
      });

      await tx.profile.create({
        data: {
          userId: user.id,
          firstName,
          lastName,
          location,
        },
      });

      return user;
    });

    return res.status(201).json({
      success: true,
      message: "Account registered successfully.",
      user: { id: newUser.id, email: newUser.email, role: newUser.role },
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// login user
export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Email and password are required." });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || user.isBlocked) {
      return res.status(401).json({ error: "User not found!" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      ENV.JWT_SECRET,
      {
        expiresIn: "1d",
      },
    );

    // set token inside http-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      message: "Login successful.",
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// logout
export const logout = (req, res) => {
  res.clearCookie("token");
  return res.status(200).json({ message: "Logged out successfully." });
};
