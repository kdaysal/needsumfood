// backend/server.js
import express from "express"
import mongoose from "mongoose"
import cors from "cors"
import dotenv from "dotenv"
import crypto from "crypto"
import { fileURLToPath } from "url"
import path from "path"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({
    path: path.join(__dirname, ".env"),
})

const app = express()

const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:4173",
    "https://kdaysal.github.io",
]

app.use(
    cors({
        origin: (origin, cb) => {
            if (!origin || allowedOrigins.includes(origin)) return cb(null, true)
            return cb(new Error("Not allowed by CORS"))
        },
        methods: ["GET", "POST", "PATCH", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization"],
    }),
)

app.use(express.json())

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret"
if (!process.env.JWT_SECRET) {
    console.warn("JWT_SECRET not set; using insecure fallback secret for development purposes only.")
}

const TOKEN_EXPIRY_SECONDS = 60 * 60 * 24 * 7
const GUEST_TOKEN_EXPIRY_SECONDS = 60 * 60 * 24 * 3
const GUEST_USERNAME = "Guest User"
const MIN_USERNAME_LENGTH = 3
const MAX_USERNAME_LENGTH = 32
const MIN_PASSWORD_LENGTH = 3
const MAX_PASSWORD_LENGTH = 128
const PASSWORD_SALT_BYTES = 16
const PASSWORD_HASH_ITERATIONS = 120_000
const PASSWORD_HASH_LENGTH = 64
const PASSWORD_HASH_ALGO = "sha512"

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.error(err))

const UserSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            trim: true,
            minlength: MIN_USERNAME_LENGTH,
            maxlength: MAX_USERNAME_LENGTH,
        },
        usernameLower: {
            type: String,
            required: true,
            unique: true,
        },
        passwordHash: {
            type: String,
            required: true,
        },
    },
    { timestamps: true },
)

UserSchema.pre("validate", function (next) {
    if (typeof this.username === "string") {
        const trimmed = this.username.trim()
        this.username = trimmed
        this.usernameLower = trimmed.toLowerCase()
    }
    next()
})

const CategorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        hidden: {
            type: Boolean,
            default: false,
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
            index: true,
        },
    },
    { timestamps: true },
)

const ItemSchema = new mongoose.Schema(
    {
        categoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        hidden: {
            type: Boolean,
            default: false,
        },
        need: {
            type: Boolean,
            default: true,
        },
        notes: {
            type: String,
            default: "",
        },
        location: {
            type: String,
            default: "",
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
            index: true,
        },
    },
    { timestamps: true },
)

const User = mongoose.model("User", UserSchema)
const Category = mongoose.model("Category", CategorySchema)
const Item = mongoose.model("Item", ItemSchema)

const sanitizeString = (value) => (typeof value === "string" ? value.trim() : value)

const hashPassword = (password) => {
    const salt = crypto.randomBytes(PASSWORD_SALT_BYTES).toString("hex")
    const derived = crypto
        .pbkdf2Sync(password, salt, PASSWORD_HASH_ITERATIONS, PASSWORD_HASH_LENGTH, PASSWORD_HASH_ALGO)
        .toString("hex")
    return `${PASSWORD_HASH_ITERATIONS}:${salt}:${derived}`
}

const verifyPassword = (password, storedHash) => {
    if (typeof storedHash !== "string") return false
    const [iterationsStr, salt, originalHash] = storedHash.split(":")
    const iterations = Number.parseInt(iterationsStr, 10)

    if (!salt || !originalHash || !Number.isFinite(iterations) || iterations <= 0) {
        return false
    }

    const derived = crypto
        .pbkdf2Sync(password, salt, iterations, PASSWORD_HASH_LENGTH, PASSWORD_HASH_ALGO)
        .toString("hex")

    const originalBuffer = Buffer.from(originalHash, "hex")
    const derivedBuffer = Buffer.from(derived, "hex")

    if (originalBuffer.length !== derivedBuffer.length) {
        return false
    }

    return crypto.timingSafeEqual(originalBuffer, derivedBuffer)
}

const base64UrlEncode = (buffer) =>
    buffer
        .toString("base64")
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")

const base64UrlEncodeObject = (value) => base64UrlEncode(Buffer.from(JSON.stringify(value)))

const base64UrlDecode = (value) => {
    const padLength = (4 - (value.length % 4)) % 4
    const padded = value + "=".repeat(padLength)
    const normalized = padded.replace(/-/g, "+").replace(/_/g, "/")
    return Buffer.from(normalized, "base64")
}

const signToken = (payload, expiresInSeconds) => {
    const header = { alg: "HS256", typ: "JWT" }
    const issuedAt = Math.floor(Date.now() / 1000)
    const exp = issuedAt + expiresInSeconds
    const tokenPayload = { ...payload, iat: issuedAt, exp }

    const encodedHeader = base64UrlEncodeObject(header)
    const encodedPayload = base64UrlEncodeObject(tokenPayload)
    const data = `${encodedHeader}.${encodedPayload}`

    const signatureBuffer = crypto.createHmac("sha256", JWT_SECRET).update(data).digest()
    const signature = base64UrlEncode(signatureBuffer)

    return `${data}.${signature}`
}

const verifyToken = (token) => {
    const parts = token.split(".")
    if (parts.length !== 3) {
        throw new Error("Invalid token structure")
    }

    const [encodedHeader, encodedPayload, signature] = parts
    const data = `${encodedHeader}.${encodedPayload}`

    const expectedSignatureBuffer = crypto.createHmac("sha256", JWT_SECRET).update(data).digest()
    const providedSignatureBuffer = base64UrlDecode(signature)

    if (
        providedSignatureBuffer.length !== expectedSignatureBuffer.length ||
        !crypto.timingSafeEqual(providedSignatureBuffer, expectedSignatureBuffer)
    ) {
        throw new Error("Invalid token signature")
    }

    let header
    let payload
    try {
        header = JSON.parse(base64UrlDecode(encodedHeader).toString("utf8"))
        payload = JSON.parse(base64UrlDecode(encodedPayload).toString("utf8"))
    } catch (err) {
        throw new Error("Invalid token payload")
    }

    if (header.alg !== "HS256" || header.typ !== "JWT") {
        throw new Error("Unsupported token header")
    }

    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        throw new Error("Token expired")
    }

    return payload
}

const createUserToken = (user) =>
    signToken(
        {
            userId: user._id.toString(),
            username: user.username,
            role: "user",
        },
        TOKEN_EXPIRY_SECONDS,
    )

const createGuestToken = () =>
    signToken(
        {
            role: "guest",
            username: GUEST_USERNAME,
        },
        GUEST_TOKEN_EXPIRY_SECONDS,
    )

const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Authorization header missing" })
    }

    const token = authHeader.slice("Bearer ".length)

    try {
        const payload = verifyToken(token)
        if (payload.role === "guest") {
            req.user = { role: "guest", username: GUEST_USERNAME }
            return next()
        }

        if (!payload.userId) {
            return res.status(401).json({ error: "Invalid token payload" })
        }

        req.user = {
            role: "user",
            userId: payload.userId,
            username: payload.username,
        }
        return next()
    } catch (err) {
        console.error("Token verification failed:", err)
        return res.status(401).json({ error: "Invalid or expired token" })
    }
}

const ownerFilterForUser = (user) => (user.role === "guest" ? { owner: null } : { owner: user.userId })

const ensureCategoryOwnership = async (categoryId, user) => {
    const filter = { _id: categoryId, ...ownerFilterForUser(user) }
    return Category.findOne(filter)
}

app.post("/auth/register", async (req, res) => {
    const { username, password } = req.body ?? {}

    const trimmedUsername = sanitizeString(username)
    const trimmedPassword = sanitizeString(password)

    if (!trimmedUsername || trimmedUsername.length < MIN_USERNAME_LENGTH) {
        return res.status(400).json({
            error: `Username must be at least ${MIN_USERNAME_LENGTH} characters long`,
        })
    }

    if (trimmedUsername.length > MAX_USERNAME_LENGTH) {
        return res.status(400).json({
            error: `Username must be at most ${MAX_USERNAME_LENGTH} characters long`,
        })
    }

    if (!trimmedPassword || trimmedPassword.length < MIN_PASSWORD_LENGTH) {
        return res.status(400).json({
            error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`,
        })
    }

    if (trimmedPassword.length > MAX_PASSWORD_LENGTH) {
        return res.status(400).json({
            error: `Password must be at most ${MAX_PASSWORD_LENGTH} characters long`,
        })
    }

    try {
        const existing = await User.findOne({ usernameLower: trimmedUsername.toLowerCase() })
        if (existing) {
            return res.status(409).json({ error: "Username already exists" })
        }

        const passwordHash = hashPassword(trimmedPassword)
        const user = new User({
            username: trimmedUsername,
            passwordHash,
        })
        await user.save()

        const token = createUserToken(user)
        return res.json({
            token,
            user: {
                username: user.username,
                role: "user",
            },
        })
    } catch (err) {
        console.error("Error registering user:", err)
        return res.status(500).json({ error: "Failed to register user" })
    }
})

app.post("/auth/login", async (req, res) => {
    const { username, password } = req.body ?? {}

    const trimmedUsername = sanitizeString(username)
    const trimmedPassword = sanitizeString(password)

    if (!trimmedUsername || !trimmedPassword) {
        return res.status(400).json({ error: "Username and password are required" })
    }

    try {
        const user = await User.findOne({ usernameLower: trimmedUsername.toLowerCase() })
        if (!user) {
            return res.status(401).json({ error: "Invalid username or password" })
        }

        const passwordMatch = verifyPassword(trimmedPassword, user.passwordHash)
        if (!passwordMatch) {
            return res.status(401).json({ error: "Invalid username or password" })
        }

        const token = createUserToken(user)
        return res.json({
            token,
            user: {
                username: user.username,
                role: "user",
            },
        })
    } catch (err) {
        console.error("Error logging in:", err)
        return res.status(500).json({ error: "Failed to log in" })
    }
})

app.post("/auth/guest", (req, res) => {
    const token = createGuestToken()
    return res.json({
        token,
        user: {
            username: GUEST_USERNAME,
            role: "guest",
        },
    })
})

app.get("/categories", authenticate, async (req, res) => {
    const { view = "visible" } = req.query
    const baseFilter = ownerFilterForUser(req.user)

    const visibilityFilter =
        view === "hidden" ? { hidden: true } : view === "all" ? {} : { hidden: false }

    try {
        const categories = await Category.find({ ...baseFilter, ...visibilityFilter }).sort({ createdAt: 1 })
        return res.json(categories)
    } catch (err) {
        console.error("Error fetching categories:", err)
        return res.status(500).json({ error: "Failed to fetch categories" })
    }
})

app.post("/categories", authenticate, async (req, res) => {
    const { name } = req.body ?? {}
    const ownerFilter = ownerFilterForUser(req.user)

    try {
        const category = new Category({
            name: sanitizeString(name),
            owner: ownerFilter.owner ?? null,
        })
        await category.save()
        return res.json(category)
    } catch (err) {
        console.error("Error creating category:", err)
        return res.status(500).json({ error: "Failed to create category" })
    }
})

app.patch("/categories/:id", authenticate, async (req, res) => {
    const { id } = req.params
    const { name, hidden } = req.body ?? {}
    const ownerFilter = ownerFilterForUser(req.user)

    try {
        const update = {}
        if (typeof name === "string") update.name = sanitizeString(name)
        if (typeof hidden === "boolean") update.hidden = hidden

        const category = await Category.findOneAndUpdate({ _id: id, ...ownerFilter }, update, {
            new: true,
        })
        if (!category) {
            return res.status(404).json({ error: "Category not found" })
        }
        return res.json(category)
    } catch (err) {
        console.error("Error updating category:", err)
        return res.status(500).json({ error: "Failed to update category" })
    }
})

app.delete("/categories/:id", authenticate, async (req, res) => {
    const { id } = req.params
    const ownerFilter = ownerFilterForUser(req.user)

    try {
        const category = await Category.findOneAndDelete({ _id: id, ...ownerFilter })
        if (!category) {
            return res.status(404).json({ error: "Category not found" })
        }
        await Item.deleteMany({ categoryId: id })
        return res.json({ success: true })
    } catch (err) {
        console.error("Error deleting category:", err)
        return res.status(500).json({ error: "Failed to delete category" })
    }
})

app.get("/items/:categoryId", authenticate, async (req, res) => {
    const { categoryId } = req.params

    try {
        const category = await ensureCategoryOwnership(categoryId, req.user)
        if (!category) {
            return res.status(404).json({ error: "Category not found" })
        }

        const items = await Item.find({ categoryId }).sort({ createdAt: 1 })
        return res.json({ category, items })
    } catch (err) {
        console.error("Error fetching items:", err)
        return res.status(500).json({ error: "Failed to fetch items" })
    }
})

app.post("/items/:categoryId", authenticate, async (req, res) => {
    const { categoryId } = req.params
    const { name } = req.body ?? {}
    const ownerFilter = ownerFilterForUser(req.user)

    try {
        const category = await Category.findOne({ _id: categoryId, ...ownerFilter })
        if (!category) {
            return res.status(404).json({ error: "Category not found" })
        }

        const item = new Item({
            categoryId,
            name: sanitizeString(name),
            owner: ownerFilter.owner ?? null,
        })
        await item.save()
        return res.json(item)
    } catch (err) {
        console.error("Error creating item:", err)
        return res.status(500).json({ error: "Failed to create item" })
    }
})

app.patch("/items/:id", authenticate, async (req, res) => {
    const { id } = req.params
    const { name, hidden, need, notes, location } = req.body ?? {}

    try {
        const item = await Item.findById(id)
        if (!item) {
            return res.status(404).json({ error: "Item not found" })
        }

        const category = await ensureCategoryOwnership(item.categoryId, req.user)
        if (!category) {
            return res.status(404).json({ error: "Item not found" })
        }

        const update = {}
        if (typeof name === "string") update.name = sanitizeString(name)
        if (typeof hidden === "boolean") update.hidden = hidden
        if (typeof need === "boolean") update.need = need
        if (typeof notes === "string") update.notes = sanitizeString(notes)
        if (typeof location === "string") update.location = sanitizeString(location)

        const updatedItem = await Item.findByIdAndUpdate(id, update, { new: true })
        return res.json(updatedItem)
    } catch (err) {
        console.error("Error updating item:", err)
        return res.status(500).json({ error: "Failed to update item" })
    }
})

app.delete("/items/:id", authenticate, async (req, res) => {
    const { id } = req.params

    try {
        const item = await Item.findById(id)
        if (!item) {
            return res.status(404).json({ error: "Item not found" })
        }

        const category = await ensureCategoryOwnership(item.categoryId, req.user)
        if (!category) {
            return res.status(404).json({ error: "Item not found" })
        }

        await Item.findByIdAndDelete(id)
        return res.json({ success: true })
    } catch (err) {
        console.error("Error deleting item:", err)
        return res.status(500).json({ error: "Failed to delete item" })
    }
})

app.get("/health", (req, res) => {
    res.json({ ok: true })
})

const PORT = process.env.PORT || 5001
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
