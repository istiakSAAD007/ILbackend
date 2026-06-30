import dotenv from "dotenv";

dotenv.config({
  quiet: true,
  path: ".env",
});

export const ENV = {
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  FRONTEND_URL: process.env.FRONTEND_URL,
  PORT: process.env.PORT,
};
