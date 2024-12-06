import { createClient } from "matrix-js-sdk";
import axios from "axios";

// Function to get access token from Matrix server
const getAccessToken = async () => {
    try {
        const response = await axios.post('https://matrix.org/_matrix/client/r0/login', {
            type: 'm.login.password',
            user: 'nehall', // Replace with your Matrix username
            password: 'Hello@1234freo', // Replace with your Matrix password
        });

        const accessToken = response.data.access_token;
        console.log("Access Token:", accessToken); // Log the access token
        return accessToken;
    } catch (error) {
        console.error("Error during authentication:", error);
        return null;
    }
};

// Initialize Matrix client
let client = null;

const initializeClient = async () => {
    const accessToken = await getAccessToken();

    if (!accessToken) {
        console.error("Failed to get access token.");
        return;
    }

    client = createClient({
        baseUrl: "https://matrix.org",  // The Matrix server's base URL
        accessToken: "syt_bmVoYWxs_zpsLAYSiOgThVXtqFYbl_2EPxX0", // Use the obtained access token
        userId: "@nehall:matrix.org", // Replace with your user ID
    });

    client.startClient();

    client.once("sync", function (state) {
        if (state === "PREPARED") {
            console.log("Matrix Client is ready!");
            fetchMessages(); // Fetch messages after sync is prepared
        }
    });
};

// Function to fetch messages from Matrix
const fetchMessages = async () => {
    if (!client) {
        console.error("Matrix client is not initialized.");
        return;
    }

    try {
        const rooms = await client.getRooms();
        console.log("Rooms:", rooms); // Log the rooms to check if they're available

        const messages = rooms.flatMap(room =>
            room.timeline.map(event => ({
                contact: event.sender,
                content: event.getContent().body,
                platform: "Matrix",
            }))
        );
        console.log("Messages:", messages); // Log the fetched messages
    } catch (error) {
        console.error("Error fetching messages:", error);
    }
};

// Wait for the client to initialize
initializeClient().catch(error => {
    console.error("Error initializing Matrix client:", error);
});

export default client;
