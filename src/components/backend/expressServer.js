import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from './routes/authentication.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json()); // Parses incoming JSON requests. 

// Routes:
app.use("/api/auth", authRoutes);

app.listen(PORT, () => {
    console.log(`EXPRESS Server is running on port ${PORT}`);
});