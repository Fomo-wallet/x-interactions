import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import tweetsRoutes from "./routes/tweets";

dotenv.config();

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

// Register routes
app.use("/api", tweetsRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

export default app;
