require('dotenv').config();

const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const app = require('../app');
const connectDB = require('../config/db');

const User = require('../models/User');
const Category = require('../models/Category');
const Event = require('../models/Event');

describe('Events API', () => {
    let admin;
    let attendee;
    let category;
    let secondCategory;
    let token;
    let attendeeToken;

    beforeAll(async () => {
        await connectDB();

        admin = await User.create({
            name: 'Test Admin',
            email: `testadmin${Date.now()}@example.com`,
            password: 'testpassword123',
            role: 'admin'
        });

        attendee = await User.create({
            name: 'Test Attendee',
            email: `testattendee${Date.now()}@example.com`,
            password: 'testpassword123',
            role: 'attendee'
        });

        category = await Category.create({
            name: `Test Category ${Date.now()}`,
            description: 'Category used for testing'
        });

        secondCategory = await Category.create({
            name: `Second Category ${Date.now()}`,
            description: 'Second category used for testing'
        });

        token = jwt.sign(
            {
                id: admin._id,
                role: admin.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '1h'
            }
        );

        attendeeToken = jwt.sign(
            {
                id: attendee._id,
                role: attendee.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '1h'
            }
        );
    });

    afterAll(async () => {
        await Event.deleteMany({
            organizer: {
                $in: [admin._id, attendee._id]
            }
        });

        await Category.findByIdAndDelete(category._id);
        await Category.findByIdAndDelete(secondCategory._id);

        await User.findByIdAndDelete(admin._id);
        await User.findByIdAndDelete(attendee._id);

        await mongoose.connection.close();
    });

    test('GET /api/events should return events', async () => {
        const response = await request(app)
            .get('/api/events');

        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('data');
        expect(response.body).toHaveProperty('total');
        expect(response.body).toHaveProperty('page');
        expect(response.body).toHaveProperty('limit');
        expect(response.body).toHaveProperty('totalPages');
    });

    test('GET /api/events/:id should return one event', async () => {
        const event = await Event.create({
            title: 'Single Event Test',
            description: 'Event used for single event testing',
            date: new Date('2027-01-15T18:00:00.000Z'),
            city: 'Cairo',
            venue: 'Test Venue',
            capacity: 100,
            category: category._id,
            organizer: admin._id
        });

        const response = await request(app)
            .get(`/api/events/${event._id}`);

        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('title');
        expect(response.body.data.title).toBe('Single Event Test');
        expect(response.body.data).toHaveProperty('category');
        expect(response.body.data).toHaveProperty('organizer');
    });

    test('GET /api/events/:id should return 404 for a missing event', async () => {
        const fakeId = new mongoose.Types.ObjectId();

        const response = await request(app)
            .get(`/api/events/${fakeId}`);

        expect(response.statusCode).toBe(404);
    });

    test('POST /api/events should allow admin to create an event', async () => {
        const response = await request(app)
            .post('/api/events')
            .set('Authorization', `Bearer ${token}`)
            .send({
                title: 'Created Test Event',
                description: 'This event was created by an admin',
                date: '2027-01-15T18:00:00.000Z',
                city: 'Cairo',
                venue: 'Test Venue',
                capacity: 100,
                category: category._id.toString()
            });

        expect(response.statusCode).toBe(201);
        expect(response.body).toHaveProperty('data');
        expect(response.body.data.title).toBe('Created Test Event');
        expect(response.body.data.organizer.toString()).toBe(
            admin._id.toString()
        );
    });

    test('POST /api/events should reject invalid data with 422', async () => {
        const response = await request(app)
            .post('/api/events')
            .set('Authorization', `Bearer ${token}`)
            .send({
                title: '',
                description: '',
                date: 'not-a-date',
                city: '',
                venue: '',
                capacity: 0,
                category: 'invalid-category-id'
            });

        expect(response.statusCode).toBe(422);
        expect(response.body.errors).toBeDefined();
        expect(response.body.errors.length).toBeGreaterThan(0);
    });

    test('POST /api/events should reject attendee users', async () => {
        const response = await request(app)
            .post('/api/events')
            .set('Authorization', `Bearer ${attendeeToken}`)
            .send({
                title: 'Unauthorized Event',
                description: 'This event should not be created',
                date: '2027-01-15T18:00:00.000Z',
                city: 'Cairo',
                venue: 'Test Venue',
                capacity: 100,
                category: category._id.toString()
            });

        expect(response.statusCode).toBe(403);
    });

    test('POST /api/events should reject unauthenticated users', async () => {
        const response = await request(app)
            .post('/api/events')
            .send({
                title: 'Unauthorized Event',
                description: 'This event should not be created',
                date: '2027-01-15T18:00:00.000Z',
                city: 'Cairo',
                venue: 'Test Venue',
                capacity: 100,
                category: category._id.toString()
            });

        expect(response.statusCode).toBe(401);
    });

    test('PATCH /api/events/:id should allow admin to update an event', async () => {
        const event = await Event.create({
            title: 'Original Event Title',
            description: 'Original event description',
            date: new Date('2027-02-15T18:00:00.000Z'),
            city: 'Cairo',
            venue: 'Original Venue',
            capacity: 100,
            category: category._id,
            organizer: admin._id
        });

        const response = await request(app)
            .patch(`/api/events/${event._id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                title: 'Updated Event Title',
                city: 'Giza'
            });

        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('data');
        expect(response.body.data.title).toBe('Updated Event Title');
        expect(response.body.data.city).toBe('Giza');
    });

    test('PATCH /api/events/:id should reject attendee users', async () => {
        const event = await Event.create({
            title: 'Update Test Event',
            description: 'Event used to test attendee update restriction',
            date: new Date('2027-02-15T18:00:00.000Z'),
            city: 'Cairo',
            venue: 'Test Venue',
            capacity: 100,
            category: category._id,
            organizer: admin._id
        });

        const response = await request(app)
            .patch(`/api/events/${event._id}`)
            .set('Authorization', `Bearer ${attendeeToken}`)
            .send({
                title: 'Unauthorized Update'
            });

        expect(response.statusCode).toBe(403);
    });

    test('PATCH /api/events/:id should reject unauthenticated users', async () => {
        const event = await Event.create({
            title: 'Unauthenticated Update Event',
            description: 'Event used to test authentication',
            date: new Date('2027-02-20T18:00:00.000Z'),
            city: 'Cairo',
            venue: 'Test Venue',
            capacity: 100,
            category: category._id,
            organizer: admin._id
        });

        const response = await request(app)
            .patch(`/api/events/${event._id}`)
            .send({
                title: 'Unauthorized Update'
            });

        expect(response.statusCode).toBe(401);
    });

    test('PATCH /api/events/:id should return 404 for a missing event', async () => {
        const fakeId = new mongoose.Types.ObjectId();

        const response = await request(app)
            .patch(`/api/events/${fakeId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                title: 'Updated Event'
            });

        expect(response.statusCode).toBe(404);
    });

    test('DELETE /api/events/:id should allow admin to delete an event', async () => {
        const event = await Event.create({
            title: 'Delete Test Event',
            description: 'Event used to test deletion',
            date: new Date('2027-03-15T18:00:00.000Z'),
            city: 'Cairo',
            venue: 'Test Venue',
            capacity: 100,
            category: category._id,
            organizer: admin._id
        });

        const response = await request(app)
            .delete(`/api/events/${event._id}`)
            .set('Authorization', `Bearer ${token}`);

        expect(response.statusCode).toBe(200);

        const deletedEvent = await Event.findById(event._id);
        expect(deletedEvent).toBeNull();
    });

    test('DELETE /api/events/:id should reject attendee users', async () => {
        const event = await Event.create({
            title: 'Attendee Delete Test Event',
            description: 'Event used to test attendee delete restriction',
            date: new Date('2027-03-20T18:00:00.000Z'),
            city: 'Cairo',
            venue: 'Test Venue',
            capacity: 100,
            category: category._id,
            organizer: admin._id
        });

        const response = await request(app)
            .delete(`/api/events/${event._id}`)
            .set('Authorization', `Bearer ${attendeeToken}`);

        expect(response.statusCode).toBe(403);

        const existingEvent = await Event.findById(event._id);
        expect(existingEvent).not.toBeNull();
    });

    test('DELETE /api/events/:id should reject unauthenticated users', async () => {
        const event = await Event.create({
            title: 'Unauthenticated Delete Test Event',
            description: 'Event used to test authentication',
            date: new Date('2027-03-25T18:00:00.000Z'),
            city: 'Cairo',
            venue: 'Test Venue',
            capacity: 100,
            category: category._id,
            organizer: admin._id
        });

        const response = await request(app)
            .delete(`/api/events/${event._id}`);

        expect(response.statusCode).toBe(401);
    });

    test('DELETE /api/events/:id should return 404 for a missing event', async () => {
        const fakeId = new mongoose.Types.ObjectId();

        const response = await request(app)
            .delete(`/api/events/${fakeId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(response.statusCode).toBe(404);
    });

    test('GET /api/events should filter by category', async () => {
        await Event.create([
            {
                title: 'Category Filter Event One',
                description: 'Category filter test',
                date: new Date('2027-04-01T18:00:00.000Z'),
                city: 'Cairo',
                venue: 'Venue One',
                capacity: 100,
                category: category._id,
                organizer: admin._id
            },
            {
                title: 'Category Filter Event Two',
                description: 'Category filter test',
                date: new Date('2027-04-02T18:00:00.000Z'),
                city: 'Cairo',
                venue: 'Venue Two',
                capacity: 100,
                category: secondCategory._id,
                organizer: admin._id
            }
        ]);

        const response = await request(app)
            .get(`/api/events?category=${category._id}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.data.length).toBeGreaterThan(0);

        response.body.data.forEach((event) => {
            expect(event.category._id.toString()).toBe(
                category._id.toString()
            );
        });
    });

    test('GET /api/events should filter by city', async () => {
        await Event.create([
            {
                title: 'Cairo Filter Event',
                description: 'Cairo filtering test',
                date: new Date('2027-05-01T18:00:00.000Z'),
                city: 'Cairo',
                venue: 'Cairo Venue',
                capacity: 100,
                category: category._id,
                organizer: admin._id
            },
            {
                title: 'Giza Filter Event',
                description: 'Giza filtering test',
                date: new Date('2027-05-02T18:00:00.000Z'),
                city: 'Giza',
                venue: 'Giza Venue',
                capacity: 100,
                category: category._id,
                organizer: admin._id
            }
        ]);

        const response = await request(app)
            .get('/api/events?city=Cairo');

        expect(response.statusCode).toBe(200);
        expect(response.body.data.length).toBeGreaterThan(0);

        response.body.data.forEach((event) => {
            expect(event.city).toBe('Cairo');
        });
    });

    test('GET /api/events should filter by startDate', async () => {
        await Event.create([
            {
                title: 'Start Date Before',
                description: 'Date range test',
                date: new Date('2027-06-01T18:00:00.000Z'),
                city: 'Cairo',
                venue: 'Venue',
                capacity: 100,
                category: category._id,
                organizer: admin._id
            },
            {
                title: 'Start Date After',
                description: 'Date range test',
                date: new Date('2027-06-20T18:00:00.000Z'),
                city: 'Cairo',
                venue: 'Venue',
                capacity: 100,
                category: category._id,
                organizer: admin._id
            }
        ]);

        const response = await request(app)
            .get('/api/events?startDate=2027-06-15');

        expect(response.statusCode).toBe(200);

        response.body.data.forEach((event) => {
            expect(new Date(event.date).getTime()).toBeGreaterThanOrEqual(
                new Date('2027-06-15').getTime()
            );
        });
    });

    test('GET /api/events should filter by endDate', async () => {
        await Event.create([
            {
                title: 'End Date Before',
                description: 'Date range test',
                date: new Date('2027-07-01T18:00:00.000Z'),
                city: 'Cairo',
                venue: 'Venue',
                capacity: 100,
                category: category._id,
                organizer: admin._id
            },
            {
                title: 'End Date After',
                description: 'Date range test',
                date: new Date('2027-07-25T18:00:00.000Z'),
                city: 'Cairo',
                venue: 'Venue',
                capacity: 100,
                category: category._id,
                organizer: admin._id
            }
        ]);

        const response = await request(app)
            .get('/api/events?endDate=2027-07-15');

        expect(response.statusCode).toBe(200);

        response.body.data.forEach((event) => {
            expect(new Date(event.date).getTime()).toBeLessThanOrEqual(
                new Date('2027-07-15').getTime()
            );
        });
    });

    test('GET /api/events should combine category, city, and date filters', async () => {
        await Event.create([
            {
                title: 'Combined Match Event',
                description: 'Combined filter matching event',
                date: new Date('2027-08-10T18:00:00.000Z'),
                city: 'Cairo',
                venue: 'Combined Venue',
                capacity: 100,
                category: category._id,
                organizer: admin._id
            },
            {
                title: 'Wrong Category Event',
                description: 'Should not match',
                date: new Date('2027-08-10T18:00:00.000Z'),
                city: 'Cairo',
                venue: 'Venue',
                capacity: 100,
                category: secondCategory._id,
                organizer: admin._id
            },
            {
                title: 'Wrong City Event',
                description: 'Should not match',
                date: new Date('2027-08-10T18:00:00.000Z'),
                city: 'Giza',
                venue: 'Venue',
                capacity: 100,
                category: category._id,
                organizer: admin._id
            },
            {
                title: 'Wrong Date Event',
                description: 'Should not match',
                date: new Date('2027-09-10T18:00:00.000Z'),
                city: 'Cairo',
                venue: 'Venue',
                capacity: 100,
                category: category._id,
                organizer: admin._id
            }
        ]);

        const response = await request(app)
            .get(
                `/api/events?category=${category._id}&city=Cairo&startDate=2027-08-01&endDate=2027-08-31`
            );

        expect(response.statusCode).toBe(200);

        const matchingEvent = response.body.data.find(
            (event) => event.title === 'Combined Match Event'
        );

        expect(matchingEvent).toBeDefined();

        response.body.data.forEach((event) => {
            expect(event.city).toBe('Cairo');
            expect(event.category._id.toString()).toBe(
                category._id.toString()
            );

            const eventDate = new Date(event.date).getTime();

            expect(eventDate).toBeGreaterThanOrEqual(
                new Date('2027-08-01').getTime()
            );

            expect(eventDate).toBeLessThanOrEqual(
                new Date('2027-08-31').getTime()
            );
        });
    });

    test('GET /api/events should paginate results', async () => {
        await Event.create(
            Array.from({ length: 12 }, (_, index) => ({
                title: `Pagination Event ${index + 1}`,
                description: 'Pagination test event',
                date: new Date(
                    `2027-09-${String(index + 1).padStart(2, '0')}T18:00:00.000Z`
                ),
                city: 'Pagination City',
                venue: 'Pagination Venue',
                capacity: 100,
                category: category._id,
                organizer: admin._id
            }))
        );

        const response = await request(app)
            .get('/api/events?city=Pagination%20City&page=2&limit=5');

        expect(response.statusCode).toBe(200);
        expect(response.body.page).toBe(2);
        expect(response.body.limit).toBe(5);
        expect(response.body.total).toBe(12);
        expect(response.body.totalPages).toBe(3);
        expect(response.body.data).toHaveLength(5);
    });

    test('GET /api/events should use default pagination values', async () => {
        const response = await request(app)
            .get('/api/events');

        expect(response.statusCode).toBe(200);
        expect(response.body.page).toBe(1);
        expect(response.body.limit).toBe(10);
        expect(response.body).toHaveProperty('totalPages');
    });

    test('GET /api/events should sort by date ascending', async () => {
        await Event.create([
            {
                title: 'Date Sort Late',
                description: 'Date sorting test',
                date: new Date('2027-11-20T18:00:00.000Z'),
                city: 'Date Sort City',
                venue: 'Venue',
                capacity: 100,
                category: category._id,
                organizer: admin._id
            },
            {
                title: 'Date Sort Early',
                description: 'Date sorting test',
                date: new Date('2027-11-05T18:00:00.000Z'),
                city: 'Date Sort City',
                venue: 'Venue',
                capacity: 100,
                category: category._id,
                organizer: admin._id
            },
            {
                title: 'Date Sort Middle',
                description: 'Date sorting test',
                date: new Date('2027-11-12T18:00:00.000Z'),
                city: 'Date Sort City',
                venue: 'Venue',
                capacity: 100,
                category: category._id,
                organizer: admin._id
            }
        ]);

        const response = await request(app)
            .get('/api/events?city=Date%20Sort%20City&sortBy=date&order=asc');

        expect(response.statusCode).toBe(200);

        const dates = response.body.data.map((event) =>
            new Date(event.date).getTime()
        );

        for (let i = 1; i < dates.length; i++) {
            expect(dates[i]).toBeGreaterThanOrEqual(dates[i - 1]);
        }
    });

    test('GET /api/events should sort by date descending', async () => {
        await Event.create([
            {
                title: 'Descending Date One',
                description: 'Descending sorting test',
                date: new Date('2027-12-05T18:00:00.000Z'),
                city: 'Descending Date City',
                venue: 'Venue',
                capacity: 100,
                category: category._id,
                organizer: admin._id
            },
            {
                title: 'Descending Date Two',
                description: 'Descending sorting test',
                date: new Date('2027-12-12T18:00:00.000Z'),
                city: 'Descending Date City',
                venue: 'Venue',
                capacity: 100,
                category: category._id,
                organizer: admin._id
            },
            {
                title: 'Descending Date Three',
                description: 'Descending sorting test',
                date: new Date('2027-12-10T18:00:00.000Z'),
                city: 'Descending Date City',
                venue: 'Venue',
                capacity: 100,
                category: category._id,
                organizer: admin._id
            }
        ]);

        const response = await request(app)
            .get('/api/events?city=Descending%20Date%20City&sortBy=date&order=desc');

        expect(response.statusCode).toBe(200);

        const dates = response.body.data.map((event) =>
            new Date(event.date).getTime()
        );

        for (let i = 1; i < dates.length; i++) {
            expect(dates[i]).toBeLessThanOrEqual(dates[i - 1]);
        }
    });

    test('GET /api/events should sort by registrations', async () => {
        const response = await request(app)
            .get('/api/events?sortBy=registrations');

        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('data');
    });

    test('GET /api/events should search by title case-insensitively', async () => {
        await Event.create({
            title: 'Frontend Workshop',
            description: 'Learn modern frontend development',
            date: new Date('2028-01-10T18:00:00.000Z'),
            city: 'Search City',
            venue: 'Search Venue',
            capacity: 100,
            category: category._id,
            organizer: admin._id
        });

        const response = await request(app)
            .get('/api/events?search=WORKSHOP');

        expect(response.statusCode).toBe(200);

        const matchingEvent = response.body.data.find(
            (event) => event.title === 'Frontend Workshop'
        );

        expect(matchingEvent).toBeDefined();
    });

    test('GET /api/events should search by description case-insensitively', async () => {
        await Event.create({
            title: 'Design Event',
            description: 'Join our amazing Backend Workshop this year',
            date: new Date('2028-01-15T18:00:00.000Z'),
            city: 'Search City',
            venue: 'Search Venue',
            capacity: 100,
            category: category._id,
            organizer: admin._id
        });

        const response = await request(app)
            .get('/api/events?search=WORKSHOP');

        expect(response.statusCode).toBe(200);

        const matchingEvent = response.body.data.find(
            (event) => event.title === 'Design Event'
        );

        expect(matchingEvent).toBeDefined();
    });

    test('GET /api/events should not return unrelated search results', async () => {
        await Event.create({
            title: 'Career Fair',
            description: 'A professional networking event',
            date: new Date('2028-02-10T18:00:00.000Z'),
            city: 'Search Exclusion City',
            venue: 'Search Venue',
            capacity: 100,
            category: category._id,
            organizer: admin._id
        });

        const response = await request(app)
            .get('/api/events?city=Search%20Exclusion%20City&search=WORKSHOP');

        expect(response.statusCode).toBe(200);

        const matchingEvent = response.body.data.find(
            (event) => event.title === 'Career Fair'
        );

        expect(matchingEvent).toBeUndefined();
    });

    test('GET /api/events should combine search filtering and pagination', async () => {
        await Event.create(
            Array.from({ length: 6 }, (_, index) => ({
                title: `Combined Workshop ${index + 1}`,
                description: 'Combined search and pagination test',
                date: new Date(
                    `2028-03-${String(index + 1).padStart(2, '0')}T18:00:00.000Z`
                ),
                city: 'Combined Search City',
                venue: 'Venue',
                capacity: 100,
                category: category._id,
                organizer: admin._id
            }))
        );

        const response = await request(app)
            .get(
                '/api/events?city=Combined%20Search%20City&search=workshop&page=2&limit=2'
            );

        expect(response.statusCode).toBe(200);
        expect(response.body.page).toBe(2);
        expect(response.body.limit).toBe(2);
        expect(response.body.total).toBe(6);
        expect(response.body.totalPages).toBe(3);
        expect(response.body.data).toHaveLength(2);
    });

    test('GET /api/events should return populated category data', async () => {
        await Event.create({
            title: 'Populate Category Event',
            description: 'Populate category test',
            date: new Date('2028-04-10T18:00:00.000Z'),
            city: 'Populate City',
            venue: 'Populate Venue',
            capacity: 100,
            category: category._id,
            organizer: admin._id
        });

        const response = await request(app)
            .get('/api/events?city=Populate%20City');

        expect(response.statusCode).toBe(200);

        const event = response.body.data.find(
            (item) => item.title === 'Populate Category Event'
        );

        expect(event).toBeDefined();
        expect(event.category).toHaveProperty('name');
    });

    test('GET /api/events should return populated organizer data', async () => {
        await Event.create({
            title: 'Populate Organizer Event',
            description: 'Populate organizer test',
            date: new Date('2028-04-15T18:00:00.000Z'),
            city: 'Populate Organizer City',
            venue: 'Populate Venue',
            capacity: 100,
            category: category._id,
            organizer: admin._id
        });

        const response = await request(app)
            .get('/api/events?city=Populate%20Organizer%20City');

        expect(response.statusCode).toBe(200);

        const event = response.body.data.find(
            (item) => item.title === 'Populate Organizer Event'
        );

        expect(event).toBeDefined();
        expect(event.organizer).toHaveProperty('name');
        expect(event.organizer).toHaveProperty('email');
    });

    test('GET /api/events/:id should populate category and organizer', async () => {
        const event = await Event.create({
            title: 'Populate Single Event',
            description: 'Populate single event test',
            date: new Date('2028-05-10T18:00:00.000Z'),
            city: 'Populate Single City',
            venue: 'Populate Venue',
            capacity: 100,
            category: category._id,
            organizer: admin._id
        });

        const response = await request(app)
            .get(`/api/events/${event._id}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.data.category).toHaveProperty('name');
        expect(response.body.data.organizer).toHaveProperty('name');
        expect(response.body.data.organizer).toHaveProperty('email');
    });
});