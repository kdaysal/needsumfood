// backend/server.js
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
const allowedOrigins = [
    "http://localhost:5173", // dev
    "https://kdaysal.github.io", // GitHub Pages (prod)
];

app.use(
    cors({
        origin: (origin, cb) => {
            // allow non-browser tools (like curl) and listed origins
            if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
            return cb(new Error("Not allowed by CORS"));
        },
        methods: ["GET", "POST", "PATCH", "DELETE"],
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

// Get categories, filtered by view (visible, hidden, all)
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

// Create new category
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

// Update category (rename or toggle hidden)
app.patch("/categories/:id", async (req, res) => {
    const {
        id
    } = req.params;
    const {
        name,
        hidden
    } = req.body;

    try {
        const update = {};
        if (typeof name === "string") update.name = name.trim();
        if (typeof hidden === "boolean") update.hidden = hidden;

        const category = await Category.findByIdAndUpdate(id, update, {
            new: true
        });

        if (!category) {
            return res.status(404).json({
                error: "Category not found"
            });
        }

        res.json(category);
    } catch (err) {
        console.error("Error updating category:", err);
        res.status(500).json({
            error: "Failed to update category"
        });
    }
});

// Delete category
app.delete("/categories/:id", async (req, res) => {
    const {
        id
    } = req.params;
    await Category.findByIdAndDelete(id);
    res.json({
        success: true
    });
});

// Health check
app.get("/health", (req, res) => {
    res.json({
        ok: true
    });
});

// Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));