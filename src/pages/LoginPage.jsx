// src/pages/LoginPage.jsx
import React, { useEffect, useMemo, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext.jsx"
import styles from "./LoginPage.module.css"

const MIN_LENGTH = 3
const MAX_USERNAME_LENGTH = 32
const MAX_PASSWORD_LENGTH = 128

function LoginPage() {
    const { login, register, continueAsGuest, isAuthenticated } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const [mode, setMode] = useState("login")
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [status, setStatus] = useState("idle")

    const destination = useMemo(() => {
        if (location.state?.from?.pathname) {
            return location.state.from.pathname
        }
        return "/landing"
    }, [location.state])

    useEffect(() => {
        if (isAuthenticated) {
            navigate(destination, { replace: true })
        }
    }, [isAuthenticated, navigate, destination])

    const isLoading = status !== "idle"

    const resetError = () => setError("")

    const validateCredentials = () => {
        const trimmedUsername = username.trim()
        const trimmedPassword = password.trim()

        if (trimmedUsername.length < MIN_LENGTH || trimmedPassword.length < MIN_LENGTH) {
            return `Username and password must be at least ${MIN_LENGTH} characters.`
        }

        if (trimmedUsername.length > MAX_USERNAME_LENGTH) {
            return `Username must be ${MAX_USERNAME_LENGTH} characters or fewer.`
        }

        if (trimmedPassword.length > MAX_PASSWORD_LENGTH) {
            return `Password must be ${MAX_PASSWORD_LENGTH} characters or fewer.`
        }

        return null
    }

    const handleSubmit = async (event) => {
        event.preventDefault()
        resetError()

        const validationMessage = validateCredentials()
        if (validationMessage) {
            setError(validationMessage)
            return
        }

        try {
            setStatus("loading")
            if (mode === "login") {
                await login(username.trim(), password.trim())
            } else {
                await register(username.trim(), password.trim())
            }
            navigate(destination, { replace: true })
        } catch (err) {
            setError(err?.message ?? "Something went wrong. Please try again.")
        } finally {
            setStatus("idle")
        }
    }

    const handleGuestAccess = async () => {
        resetError()
        try {
            setStatus("loading")
            await continueAsGuest()
            navigate("/landing", { replace: true })
        } catch (err) {
            setError("Unable to start a guest session. Please try again.")
        } finally {
            setStatus("idle")
        }
    }

    const handleModeChange = (nextMode) => {
        setMode(nextMode)
        resetError()
    }

    return (
        <div className={styles.wrapper}>
            <div className={styles.card}>
                <header className={styles.header}>
                    <h1 className={styles.brand}>NeedSumFood</h1>
                    <h2 className={styles.title}>
                        {mode === "login" ? "Welcome back" : "Create your account"}
                    </h2>
                    <p className={styles.subtitle}>
                        {mode === "login"
                            ? "Sign in to access your personalized pantry."
                            : "Register to keep your pantry organized everywhere."}
                    </p>
                </header>

                <div className={styles.modeToggle}>
                    <button
                        type="button"
                        onClick={() => handleModeChange("login")}
                        className={`${styles.modeButton} ${mode === "login" ? styles.modeActive : ""}`}
                        disabled={isLoading}
                    >
                        Login
                    </button>
                    <button
                        type="button"
                        onClick={() => handleModeChange("register")}
                        className={`${styles.modeButton} ${mode === "register" ? styles.modeActive : ""}`}
                        disabled={isLoading}
                    >
                        Register
                    </button>
                </div>

                <form className={styles.form} onSubmit={handleSubmit}>
                    <div className={styles.field}>
                        <label className={styles.label} htmlFor="username">
                            Username
                        </label>
                        <input
                            id="username"
                            type="text"
                            autoComplete="username"
                            className={styles.input}
                            placeholder="Enter username"
                            value={username}
                            onChange={(event) => {
                                setUsername(event.target.value)
                                resetError()
                            }}
                            disabled={isLoading}
                        />
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label} htmlFor="password">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            autoComplete={mode === "login" ? "current-password" : "new-password"}
                            className={styles.input}
                            placeholder="Enter password"
                            value={password}
                            onChange={(event) => {
                                setPassword(event.target.value)
                                resetError()
                            }}
                            disabled={isLoading}
                        />
                    </div>

                    {error && (
                        <p className={styles.error} role="alert">
                            {error}
                        </p>
                    )}

                    <button type="submit" className={styles.submitButton} disabled={isLoading}>
                        {mode === "login" ? "Login" : "Create account"}
                    </button>
                </form>

                <div className={styles.divider}>or</div>

                <button
                    type="button"
                    onClick={handleGuestAccess}
                    className={styles.guestButton}
                    disabled={isLoading}
                >
                    Continue as Guest
                </button>

                <p className={styles.note}>
                    Usernames and passwords must be at least {MIN_LENGTH} characters long.
                </p>
            </div>
        </div>
    )
}

export default LoginPage
