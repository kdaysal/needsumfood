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
// Allow requests from your Vite dev server + GitHub Pages
const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:4173",
    "https://kdaysal.github.io",
];

app.use(
    cors({
        origin: (origin, cb) => {
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

// Schemas + Models
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

const ItemSchema = new mongoose.Schema({
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: true
    },
    name: {
        type: String,
        required: true
    },
    hidden: {
        type: Boolean,
        default: false
    },
    need: {
        type: Boolean,
        default: true
    },
    notes: {
        type: String,
        default: ""
    },
    location: {
        type: String,
        default: ""
    },
}, {
    timestamps: true
});

const Category = mongoose.model("Category", CategorySchema);
const Item = mongoose.model("Item", ItemSchema);

// Routes

// Categories
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
        name: typeof name === "string" ? name.trim() : name,
    });
    await category.save();
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

    try {
        const update = {};
        if (typeof name === "string") update.name = name.trim();
        if (typeof hidden === "boolean") update.hidden = hidden;

        const category = await Category.findByIdAndUpdate(id, update, {
            new: true
        });
        if (!category) return res.status(404).json({
            error: "Category not found"
        });

        res.json(category);
    } catch (err) {
        console.error("Error updating category:", err);
        res.status(500).json({
            error: "Failed to update category"
        });
    }
});

app.delete("/categories/:id", async (req, res) => {
    const {
        id
    } = req.params;
    await Category.findByIdAndDelete(id);
    await Item.deleteMany({
        categoryId: id
    });
    res.json({
        success: true
    });
});

// Items
app.get("/items/:categoryId", async (req, res) => {
    const {
        categoryId
    } = req.params;

    try {
        const category = await Category.findById(categoryId);
        if (!category) return res.status(404).json({
            error: "Category not found"
        });

        const items = await Item.find({
            categoryId
        }).sort({
            createdAt: 1
        });
        res.json({
            category,
            items
        });
    } catch (err) {
        console.error("Error fetching items:", err);
        res.status(500).json({
            error: "Failed to fetch items"
        });
    }
});

app.post("/items/:categoryId", async (req, res) => {
    const {
        categoryId
    } = req.params;
    const {
        name
    } = req.body;

    try {
        const item = new Item({
            categoryId,
            name: typeof name === "string" ? name.trim() : name,
        });
        await item.save();
        res.json(item);
    } catch (err) {
        console.error("Error creating item:", err);
        res.status(500).json({
            error: "Failed to create item"
        });
    }
});

app.patch("/items/:id", async (req, res) => {
    const {
        id
    } = req.params;
    const {
        name,
        hidden,
        need,
        notes,
        location
    } = req.body;

    try {
        const update = {};
        if (typeof name === "string") update.name = name.trim();
        if (typeof hidden === "boolean") update.hidden = hidden;
        if (typeof need === "boolean") update.need = need;
        if (typeof notes === "string") update.notes = notes.trim();
        if (typeof location === "string") update.location = location.trim();

        const item = await Item.findByIdAndUpdate(id, update, {
            new: true
        });
        if (!item) return res.status(404).json({
            error: "Item not found"
        });

        res.json(item);
    } catch (err) {
        console.error("Error updating item:", err);
        res.status(500).json({
            error: "Failed to update item"
        });
    }
});

app.delete("/items/:id", async (req, res) => {
    const {
        id
    } = req.params;
    await Item.findByIdAndDelete(id);
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
