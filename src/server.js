import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { ENV } from "./utils/env.js";

const app = express();
const prisma = new PrismaClient();

app.use(cors({ origin: ENV.FRONTEND_URL }));
app.use(express.json());

