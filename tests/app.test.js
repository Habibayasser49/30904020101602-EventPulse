const request = require('supertest');
const app =require('../app');

describe('EventPulse API', () => {
    
    test('Get / should return API running message', async () => {
        const response = await request(app).get('/');

        expect(response.statusCode).toBe(200);
        expect(response.body.message).toBe('EventPulse API is running');
    });
});