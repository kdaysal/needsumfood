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

// Allow requests from your Vite dev/preview and GitHub Pages
const allowedOrigins = [
    "http://localhost:5173", // Vite dev
    "http://localhost:4173", // Vite preview
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

/* ===========================
   Schemas & Models
   =========================== */

// Category
const CategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    hidden: {
        type: Boolean,
        default: false
    },
}, {
    timestamps: true
});

const Category = mongoose.model("Category", CategorySchema);

// Item (belongs to a Category)
const ItemSchema = new mongoose.Schema({
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    notes: {
        type: String,
        default: ""
    },
    location: {
        type: String,
        default: ""
    },
    status: {
        type: String,
        enum: ["need", "have"],
        default: "need"
    },
    hidden: {
        type: Boolean,
        default: false
    },
}, {
    timestamps: true
});

const Item = mongoose.model("Item", ItemSchema);

/* ===========================
   Routes — Categories
   =========================== */

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
    if (!name || !name.trim()) {
        return res.status(400).json({
            error: "Category name is required"
        });
    }
    const category = new Category({
        name: name.trim()
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

// Delete category
app.delete("/categories/:id", async (req, res) => {
    const {
        id
    } = req.params;
    await Category.findByIdAndDelete(id);
    // Optionally also delete its items:
    await Item.deleteMany({
        categoryId: id
    });
    res.json({
        success: true
    });
});

/* ===========================
   Routes — Items (per Category)
   =========================== */

// List items for a category (supports ?view=visible|hidden|all and ?status=need|have)
app.get("/categories/:id/items", async (req, res) => {
    const {
        id
    } = req.params;
    const {
        view = "visible", status
    } = req.query;

    const filter = {
        categoryId: id
    };
    if (view === "hidden") filter.hidden = true;
    else if (view !== "all") filter.hidden = false;

    if (status === "need" || status === "have") filter.status = status;

    const items = await Item.find(filter).sort({
        createdAt: 1
    });
    res.json(items);
});

// Create a new item under a category
app.post("/categories/:id/items", async (req, res) => {
    const {
        id
    } = req.params;
    const {
        name,
        notes = "",
        location = "",
        status = "need"
    } = req.body;

    if (!name || !name.trim()) {
        return res.status(400).json({
            error: "Item name is required"
        });
    }

    // Ensure category exists
    const exists = await Category.exists({
        _id: id
    });
    if (!exists) return res.status(404).json({
        error: "Category not found"
    });

    const item = await Item.create({
        categoryId: id,
        name: name.trim(),
        notes,
        location,
        status: status === "have" ? "have" : "need",
    });

    res.status(201).json(item);
});

// Update an item (rename, notes, location, status, hidden)
app.patch("/items/:itemId", async (req, res) => {
    const {
        itemId
    } = req.params;
    const {
        name,
        notes,
        location,
        status,
        hidden
    } = req.body;

    const update = {};
    if (typeof name === "string") update.name = name.trim();
    if (typeof notes === "string") update.notes = notes;
    if (typeof location === "string") update.location = location;
    if (status === "need" || status === "have") update.status = status;
    if (typeof hidden === "boolean") update.hidden = hidden;

    const item = await Item.findByIdAndUpdate(itemId, update, {
        new: true
    });
    if (!item) return res.status(404).json({
        error: "Item not found"
    });

    res.json(item);
});

// Delete an item
app.delete("/items/:itemId", async (req, res) => {
    const {
        itemId
    } = req.params;
    await Item.findByIdAndDelete(itemId);
    res.json({
        success: true
    });
});

/* ===========================
   Health
   =========================== */

app.get("/health", (req, res) => {
    res.json({
        ok: true
    });
});

/* ===========================
   Start server
   =========================== */

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));