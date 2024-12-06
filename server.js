import express, { json } from "express";
import cors from "cors";
import { createClient } from "matrix-js-sdk";

const app = express();
app.use(json());
app.use(cors());

const PORT = 5000;

// Mock database to store tokens (use a real DB in production)
const users = {
    nehall: { password: "Hello@1234freo", userId: "@nehall:matrix.org" },
};
const userTokens = {
    nehall: "syt_bmVoYWxs_zpsLAYSiOgThVXtqFYbl_2EPxX0", // Predefined token for the user "nehall"
}; // Maps usernames to access tokens

// Login endpoint to authenticate users and get access tokens
app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    const user = users[username];

    if (!user || user.password !== password) {
        return res.status(401).json({ error: "Invalid credentials" });
    }

    // Step 3: Check if the user already has a predefined token
    if (userTokens[username]) {
        return res.json({ accessToken: userTokens[username] }); // Skip login, return predefined token
    }

    // If no predefined token, generate a new token
    try {
        const matrixClient = createClient({
            baseUrl: "https://matrix.org",
        });

        const response = await matrixClient.login("m.login.password", { user: username, password });
        const accessToken = response.access_token;

        // Store the token for this user
        userTokens[username] = accessToken;

        res.json({ accessToken });
    } catch (error) {
        console.error("Matrix login failed:", error.message);
        res.status(500).json({ error: "Failed to authenticate with Matrix" });
    }
});

// Fetch user-specific messages
app.get("/messages", async (req, res) => {
    const token = req.headers.authorization?.split(" ")[1]; // Extract token from the authorization header

    // Step 4: Validate token
    const username = Object.keys(userTokens).find((key) => userTokens[key] === token);

    if (!username) {
        return res.status(403).json({ error: "Unauthorized: Invalid or missing token" });
    }

    const matrixClient = createClient({
        baseUrl: "https://matrix.org",
        accessToken: token, // Use the validated token
        userId: users[username].userId,
    });

    try {
        await matrixClient.startClient({ initialSyncLimit: 10 });
        await new Promise((resolve, reject) =>
            matrixClient.once("sync", (state) => (state === "PREPARED" ? resolve() : reject()))
        );

        const rooms = matrixClient.getRooms();
        const messages = rooms.flatMap((room) =>
            room.timeline.map((event) => ({
                contact: event.sender,
                content: event.getContent().body,
                platform: "Matrix",
            }))
        );

        res.json(messages);
    } catch (error) {
        console.error("Error fetching messages:", error.message);
        res.status(500).json({ error: "Failed to fetch messages" });
    } finally {
        matrixClient.stopClient();
    }
});

// Summarize messages
app.post("/summarize", (req, res) => {
    const { messages } = req.body;
    res.json({ summary: `Summary for ${messages.length} messages` });
});

// Root route
app.get("/", (req, res) => {
    res.send("DailyFixAI Backend is Running!");
});

app.listen(PORT, () => {
    console.log(`Backend running at http://localhost:${PORT}`);
});
