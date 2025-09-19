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

const app = express();
// Allow requests from your Vite dev server
app.use(
    cors({
        origin: "http://localhost:5173",
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
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
}, {
    timestamps: true
});

const Category = mongoose.model("Category", CategorySchema);

// Routes
app.get("/categories", async (req, res) => {
    const {
        view = "visible"
    } = req.query;

    const filter =
        view === "hidden" ? {
            hidden: true
        } :
        view === "all" ? {} : {
            hidden: false
        };

    const categories = await Category.find(filter).sort({
        createdAt: 1
    });
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

app.patch("/categories/:id", async (req, res) => {
    const {
        id
    } = req.params;
    const {
        name,
        hidden
    } = req.body;

    const update = {};
    if (typeof name === "string") update.name = name.trim();
    if (typeof hidden === "boolean") update.hidden = hidden;

    const category = await Category.findByIdAndUpdate(id, update, {
        new: true
    });
    if (!category) return res.status(404).json({
        error: "Not found"
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