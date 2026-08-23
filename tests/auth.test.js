const request = require('supertest');
const app = require('../app');

describe('Authentication API', () => {

test('POST /api/auth/register should reject invalid data', async () => {
    const response = await request(app)
    .post('/api/auth/register')
    .send({
        name: '',
        email: 'not-an-email',
        password: '123'
    });

    expect(response.statusCode).toBe(422);
    expect(response.body.errors).toBeDefined();
    expect(response.body.errors.length).toBeGreaterThan(0);
});

test('GET /api/auth/profile should reject unauthenticated user', async () => {
    const response = await request(app)
    .get('/api/auth/profile');

    expect(response.statusCode).toBe(401);
});

});