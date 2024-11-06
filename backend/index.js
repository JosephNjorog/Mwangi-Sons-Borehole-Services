const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Sample data to simulate a database
let serviceRequests = [];
let messages = {};

// Endpoint to create a new service request
app.post('/api/v1/service-requests', (req, res) => {
    const newRequest = {
        id: serviceRequests.length + 1,
        serviceType: req.body.serviceType,
        depth: req.body.depth,
        location: req.body.location,
        preferredDate: req.body.preferredDate,
        additionalNotes: req.body.additionalNotes,
        status: 'PENDING', // Initial status
        createdAt: new Date(),
        timeline: []
    };

    serviceRequests.push(newRequest);
    res.status(201).json({ message: 'Service request created', data: newRequest });
});

// Endpoint to fetch all service requests
app.get('/api/v1/service-requests', (req, res) => {
    res.json({ data: serviceRequests });
});

// Endpoint to fetch a specific service request by ID
app.get('/api/v1/service-requests/:id', (req, res) => {
    const requestId = parseInt(req.params.id);
    const request = serviceRequests.find(req => req.id === requestId);

    if (!request) {
        return res.status(404).json({ message: 'Service request not found' });
    }

    res.json({ data: request });
});

// Endpoint to send a message for a specific service request
app.post('/api/v1/service-requests/:id/messages', (req, res) => {
    const requestId = parseInt(req.params.id);
    const { message } = req.body;

    if (!messages[requestId]) {
        messages[requestId] = [];
    }

    messages[requestId].push({ message, timestamp: new Date() });
    res.status(201).json({ message: 'Message sent', data: messages[requestId] });
});

// Endpoint to fetch messages for a specific service request
app.get('/api/v1/service-requests/:id/messages', (req, res) => {
    const requestId = parseInt(req.params.id);
    const requestMessages = messages[requestId] || [];
    res.json({ data: requestMessages });
});

// Serve static files if needed (e.g., for frontend)
app.use(express.static(path.join(__dirname, 'public')));

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});