import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../configs/prisma.js";
import { ENV } from "../utils/env.js";

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
          firstName,
          lastName,
          role: assignedRole,
        },
      });

      await tx.profile.create({
        data: {
          userId: user.id,
          location,
        },
      });

      return user;
    });

    return res.status(201).json({
      success: true,
      message: "Account registered successfully.",
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error("Registration Error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

// login user
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Email and password are required." });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || user.isBlocked) {
      return res
        .status(401)
        .json({ error: "Account not found!." });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, ENV.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    return res
      .status(500)
      .json({ error: "Internal server error during login." });
  }
};

// logout
export const logout = (req, res) => {
  res.clearCookie("token");
  return res.status(200).json({ message: "Logged out successfully." });
};
