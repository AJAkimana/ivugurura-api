import { Router } from "express";

const bookRoutes = Router();

bookRoutes.get("/", (req, res) => {
  res.status(200).json({ message: "Hello from books" });
});
