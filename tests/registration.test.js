require('dotenv').config({
    path: '.env.test'
});

jest.setTimeout(30000);

const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const app = require('../app');

const User = require('../models/User');
const Event = require('../models/Event');
const Category = require('../models/Category');
const Registration = require('../models/Registration');

describe('Registration API', () => {
    let attendee;
    let otherAttendee;
    let admin;
    let category;
    let event;
    let token;
    let otherToken;

    beforeAll(async () => {
        const connectDB = require('../config/db');

        await connectDB();

        const hashedPassword = await bcrypt.hash(
            'testpassword123',
            10
        );

        admin = await User.create({
            name: 'Test Admin',
            email: `admin${Date.now()}@example.com`,
            password: hashedPassword,
            role: 'admin'
        });

        attendee = await User.create({
            name: 'Test Attendee',
            email: `attendee${Date.now()}@example.com`,
            password: hashedPassword,
            role: 'attendee'
        });

        otherAttendee = await User.create({
            name: 'Other Attendee',
            email: `otherattendee${Date.now()}@example.com`,
            password: hashedPassword,
            role: 'attendee'
        });

        category = await Category.create({
            name: `Test Category ${Date.now()}`,
            description: 'Category for registration tests'
        });

        event = await Event.create({
            title: 'Registration Test Event',
            description: 'Event for registration tests',
            date: new Date(Date.now() + 86400000),
            city: 'Cairo',
            venue: 'Test Venue',
            capacity: 2,
            category: category._id,
            organizer: admin._id
        });

        const loginResponse = await request(app)
            .post('/api/auth/login')
            .send({
                email: attendee.email,
                password: 'testpassword123'
            });

        expect(loginResponse.statusCode).toBe(200);
        expect(loginResponse.body.token).toBeDefined();

        token = loginResponse.body.token;

        const otherLoginResponse = await request(app)
            .post('/api/auth/login')
            .send({
                email: otherAttendee.email,
                password: 'testpassword123'
            });

        expect(otherLoginResponse.statusCode).toBe(200);
        expect(otherLoginResponse.body.token).toBeDefined();

        otherToken = otherLoginResponse.body.token;
    }, 30000);

    afterAll(async () => {
        if (event) {
            await Registration.deleteMany({
                event: event._id
            });

            await Event.findByIdAndDelete(event._id);
        }

        if (category) {
            await Category.findByIdAndDelete(category._id);
        }

        if (admin) {
            await User.findByIdAndDelete(admin._id);
        }

        if (attendee) {
            await User.findByIdAndDelete(attendee._id);
        }

        if (otherAttendee) {
            await User.findByIdAndDelete(otherAttendee._id);
        }

        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
        }
    }, 30000);

    test('POST /api/registrations should register an attendee', async () => {
        const response = await request(app)
            .post('/api/registrations')
            .set('Authorization', `Bearer ${token}`)
            .send({
                eventId: event._id
            });

        expect(response.statusCode).toBe(201);

        expect(response.body).toHaveProperty('_id');
        expect(response.body.event.toString()).toBe(
            event._id.toString()
        );
        expect(response.body.attendee.toString()).toBe(
            attendee._id.toString()
        );
    });

    test('POST /api/registrations should reject duplicate registration', async () => {
        const response = await request(app)
            .post('/api/registrations')
            .set('Authorization', `Bearer ${token}`)
            .send({
                eventId: event._id
            });

        expect(response.statusCode).toBe(400);

        expect(response.body.message).toBe(
            'You are already registered for this event'
        );
    });

    test('POST /api/registrations should reject a full event', async () => {
        const fullEvent = await Event.create({
            title: `Full Event ${Date.now()}`,
            description: 'Full event for registration tests',
            date: new Date(Date.now() + 86400000),
            city: 'Cairo',
            venue: 'Full Event Venue',
            capacity: 1,
            category: category._id,
            organizer: admin._id
        });

        const firstRegistration = await request(app)
            .post('/api/registrations')
            .set('Authorization', `Bearer ${token}`)
            .send({
                eventId: fullEvent._id
            });

        expect(firstRegistration.statusCode).toBe(201);

        const secondRegistration = await request(app)
            .post('/api/registrations')
            .set('Authorization', `Bearer ${otherToken}`)
            .send({
                eventId: fullEvent._id
            });

        expect(secondRegistration.statusCode).toBe(400);

        expect(secondRegistration.body.message).toBe(
            'This event is full'
        );

        await Registration.deleteMany({
            event: fullEvent._id
        });

        await Event.findByIdAndDelete(fullEvent._id);
    });

    test('POST /api/registrations should reject unauthenticated users', async () => {
        const response = await request(app)
            .post('/api/registrations')
            .send({
                eventId: event._id
            });

        expect(response.statusCode).toBe(401);
    });

    test('POST /api/registrations should reject admin users', async () => {
        const adminLogin = await request(app)
            .post('/api/auth/login')
            .send({
                email: admin.email,
                password: 'testpassword123'
            });

        expect(adminLogin.statusCode).toBe(200);
        expect(adminLogin.body.token).toBeDefined();

        const response = await request(app)
            .post('/api/registrations')
            .set(
                'Authorization',
                `Bearer ${adminLogin.body.token}`
            )
            .send({
                eventId: event._id
            });

        expect(response.statusCode).toBe(403);

        expect(response.body.message).toBe(
            'Only attendees can register for events'
        );
    });

    test('GET /api/registrations/my should return only my registrations with populated event', async () => {
        await Registration.deleteMany({
            attendee: attendee._id
        });

        const createdRegistration = await Registration.create({
            attendee: attendee._id,
            event: event._id
        });

        const response = await request(app)
            .get('/api/registrations/my')
            .set('Authorization', `Bearer ${token}`);

        expect(response.statusCode).toBe(200);

        expect(Array.isArray(response.body)).toBe(true);

        const registration = response.body.find(
            item =>
                item._id.toString() ===
                createdRegistration._id.toString()
        );

        expect(registration).toBeDefined();

        expect(registration.attendee).toBeDefined();
        expect(registration.event).toBeDefined();

        expect(registration.event._id.toString()).toBe(
            event._id.toString()
        );

        expect(registration.event.title).toBe(
            'Registration Test Event'
        );
    });

    test('GET /api/registrations/my should reject unauthenticated users', async () => {
        const response = await request(app)
            .get('/api/registrations/my');

        expect(response.statusCode).toBe(401);
    });

    test('DELETE /api/registrations/:registrationId should cancel own registration', async () => {
        await Registration.deleteMany({
            attendee: attendee._id,
            event: event._id
        });

        const registration = await Registration.create({
            attendee: attendee._id,
            event: event._id
        });

        const response = await request(app)
            .delete(
                `/api/registrations/${registration._id}`
            )
            .set('Authorization', `Bearer ${token}`);

        expect(response.statusCode).toBe(200);

        expect(response.body.message).toBe(
            'Registration cancelled successfully'
        );

        const deletedRegistration =
            await Registration.findById(registration._id);

        expect(deletedRegistration).toBeNull();
    });

    test('DELETE /api/registrations/:registrationId should reject cancelling another user registration', async () => {
        const registration = await Registration.create({
            attendee: otherAttendee._id,
            event: event._id
        });

        const response = await request(app)
            .delete(
                `/api/registrations/${registration._id}`
            )
            .set('Authorization', `Bearer ${token}`);

        expect(response.statusCode).toBe(403);

        expect(response.body.message).toBe(
            'You can only cancel your own registration'
        );

        const existingRegistration =
            await Registration.findById(registration._id);

        expect(existingRegistration).not.toBeNull();

        await Registration.findByIdAndDelete(
            registration._id
        );
    });

    test('DELETE /api/registrations/:registrationId should reject unauthenticated users', async () => {
        const registration = await Registration.create({
            attendee: attendee._id,
            event: event._id
        });

        const response = await request(app)
            .delete(
                `/api/registrations/${registration._id}`
            );

        expect(response.statusCode).toBe(401);

        await Registration.findByIdAndDelete(
            registration._id
        );
    });

    test('DELETE /api/registrations/:registrationId should return 404 for a missing registration', async () => {
        const missingId = new mongoose.Types.ObjectId();

        const response = await request(app)
            .delete(
                `/api/registrations/${missingId}`
            )
            .set('Authorization', `Bearer ${token}`);

        expect(response.statusCode).toBe(404);

        expect(response.body.message).toBe(
            'Registration not found'
        );
    });

    test('Registration schema should have a unique compound index on event and attendee', () => {
        const indexes = Registration.schema.indexes();

        const compoundIndex = indexes.find(
            ([fields, options]) =>
                fields.event === 1 &&
                fields.attendee === 1 &&
                options.unique === true
        );

        expect(compoundIndex).toBeDefined();
    });
});