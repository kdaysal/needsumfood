import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import {
    fileURLToPath
} from "url";
import path from "path";

const __filename = fileURLToPath(
    import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly tell dotenv where to look
dotenv.config({
    path: path.join(__dirname, ".env")
});

console.log("Loaded MONGO_URI:", process.env.MONGO_URI); // sanity check

console.log("Loaded MONGO_URI:", process.env.MONGO_URI);


const app = express();
// Allow requests from your Vite dev server
app.use(
    cors({
        origin: "http://localhost:5173",
        methods: ["GET", "POST", "PUT", "DELETE"],
        allowedHeaders: ["Content-Type"],
    })
);
app.use(express.json());

// MongoDB connection
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.error(err));

// Schema + Model
const CategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    hidden: {
        type: Boolean,
        default: false
    },
});

const Category = mongoose.model("Category", CategorySchema);

// Routes
app.get("/categories", async (req, res) => {
    const categories = await Category.find();
    res.json(categories);
});

app.post("/categories", async (req, res) => {
    const {
        name
    } = req.body;
    const category = new Category({
        name
    });
    await category.save();
    res.json(category);
});

app.put("/categories/:id/hide", async (req, res) => {
    const {
        id
    } = req.params;
    const category = await Category.findByIdAndUpdate(id, {
        hidden: true
    }, {
        new: true
    });
    res.json(category);
});

app.delete("/categories/:id", async (req, res) => {
    const {
        id
    } = req.params;
    await Category.findByIdAndDelete(id);
    res.json({
        success: true
    });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));