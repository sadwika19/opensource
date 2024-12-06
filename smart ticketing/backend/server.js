const express = require('express');
const fs = require('fs');
const cors = require('cors');
const app = express();
const port = 3000;

// Middleware to parse JSON data in requests
app.use(express.json());

// Enable CORS for frontend access
app.use(cors({
    origin: 'http://localhost:3000',  // Allow only this origin
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// File paths (data storage)
const eventsFilePath = './events.json';
const dataFilePath = './data.json';

// Helper functions to read and write data from/to files
const readData = (filePath) => {
    try {
        const rawData = fs.readFileSync(filePath);
        return JSON.parse(rawData);
    } catch (err) {
        return {}; // Return empty object if the file doesn't exist
    }
};

const writeData = (filePath, data) => {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

// Endpoint to create a new event
app.post('/events', (req, res) => {
    const { eventName } = req.body;

    if (!eventName) {
        return res.status(400).json({ message: 'Event name is required.' });
    }

    let eventsData = readData(eventsFilePath);

    // Check if the event already exists
    if (eventsData[eventName]) {
        return res.status(400).json({ message: 'Event already exists.' });
    }

    // Create a new event with no registrations initially
    eventsData[eventName] = { registrations: [] };

    // Save the event to the events.json file
    writeData(eventsFilePath, eventsData);

    // Initialize the data.json to track the total registrations
    let data = readData(dataFilePath);
    data[eventName] = 0;
    writeData(dataFilePath, data);

    res.status(201).json({ message: `Event "${eventName}" created successfully.` });
});

// Endpoint to register a user for an event
app.post('/register', (req, res) => {
    const { name, email, event } = req.body;

    if (!name || !email || !event) {
        return res.status(400).json({ message: 'Name, email, and event are required.' });
    }

    let eventsData = readData(eventsFilePath);

    // Check if the event exists
    if (!eventsData[event]) {
        return res.status(400).json({ message: 'Event not found.' });
    }

    // Check if the user is already registered for this event
    if (eventsData[event].registrations.some(user => user.email === email)) {
        return res.status(400).json({ message: 'User already registered for this event.' });
    }

    // Register the user for the event
    eventsData[event].registrations.push({ name, email });

    // Save the updated event data to events.json
    writeData(eventsFilePath, eventsData);

    // Update the total number of registrations in data.json
    let data = readData(dataFilePath);
    data[event] = eventsData[event].registrations.length;
    writeData(dataFilePath, data);

    res.status(201).json({ message: `Successfully registered ${name} for ${event}.` });
});

// Endpoint to get a list of events
app.get('/events', (req, res) => {
    const eventsData = readData(eventsFilePath);
    res.status(200).json(eventsData);
});

// Endpoint to get total registration count for each event
app.get('/event-registrations', (req, res) => {
    const data = readData(dataFilePath);
    res.status(200).json(data);
});

// Endpoint to delete an event
app.delete('/events/:eventName', (req, res) => {
    const { eventName } = req.params;

    let eventsData = readData(eventsFilePath);
    let data = readData(dataFilePath);

    // Check if the event exists
    if (!eventsData[eventName]) {
        return res.status(404).json({ message: 'Event not found.' });
    }

    // Delete the event from events.json
    delete eventsData[eventName];
    writeData(eventsFilePath, eventsData);

    // Remove event from data.json
    delete data[eventName];
    writeData(dataFilePath, data);

    res.status(200).json({ message: `Event "${eventName}" deleted successfully.` });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
