const express = require('express');

const cors = require('cors');

const swaggerUi = require('swagger-ui-express');

const mongoose = require('mongoose');

const swaggerSpec = require('./config/swagger');

const userRoutes = require('./routes/userRoutes');

const authRoutes = require('./routes/authRoutes');

const eventRoutes = require('./routes/eventRoutes');

const registrationRoutes = require('./routes/registrationRoutes');

const messageRoutes = require('./routes/messageRoutes');

const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(cors());

app.use(express.json());

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api/auth', authRoutes);

app.use('/api/events', eventRoutes);

app.use('/api/registrations', registrationRoutes);

app.use('/api/announcements', messageRoutes);

app.use('/api/users', userRoutes);

app.get('/', (req, res) => {
    res.json({ message: "EventPulse API is running" });
});

app.get('/health', (req, res) => {
    const dbStatus = mongoose.connection.readyState === 1
        ? 'connected'
        : 'disconnected';

    res.status(200).json({
        status: 'ok',
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime(),
        database: dbStatus
    });
});

app.use(errorHandler);

module.exports = app;