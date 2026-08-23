require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Category = require('../models/Category');
const Event = require('../models/Event');

const connectDB = require('../config/db');

const seedData = async () => {
    try {
        await connectDB();

        const hashedPassword = await bcrypt.hash('admin123456', 10);

        let admin = await User.findOne({
            email: 'admineventpulse@gmail.com'
        });

        if (!admin){
            const hashedPassword = await bcrypt.hash('admin123456', 10);
        
            admin = await User.create({
                name: 'Admin User',
                email: 'admineventpulse@gmail.com',
                password: hashedPassword,
                role: 'admin'
        });

        console.log('Admin created');
    } else {
        console.log('Admin already exists');
    }

        let categories = await Category.find();

        if (categories.length === 0){
            categories = await Category.insertMany([
            {
                name: "Technology",
                description: "Tech and programming events"
            },
            {
                name: "Sports",
                description: "Sports events and competitions"
            },
            {
                name: "Music",
                description: "Music concerts and entertainment events"
            }
        ]);

        console.log('Categories created');
    } else {
        console.log('Categories already exist');
    }

const existingEvents = await Event.countDocuments();

if (existingEvents === 0) {

        await Event.insertMany([
            {
                title: "Node.js Workshop",
                description: "Learn backend development with Node.js",
                date: new Date('2026-08-1'),
                city: "Cairo",
                venue: "Tech Hub Cairo",
                capacity: 50,
                category: categories[0]._id,
                organizer: admin._id
            },
            {
                title: "Football Tournament",
                description: "A friendly football competition",
                date: new Date('2026-09-15'),
                city : "Giza",
                venue: "Giza Sports Club",
                capacity: 100,
                category: categories[1]._id,
                organizer: admin._id
            },
            {
                title: "Music Concert",
                description: "A live music and entertainment event",
                date: new Date('2026-10-10'),
                city: "Cairo",
                venue: "Cairo Opera House",
                capacity: 200,
                category: categories[2]._id,
                organizer: admin._id
            },
            {
                title: "Tech Conference",
                description: "A conference about modern technology",
                date: new Date('2026-11-20'),
                city: "Cairo",
                venue: "Cairo Convention Center",
                capacity: 150,
                category: categories[0]._id,
                organizer: admin._id
            }
        ]);

        console.log('Events created');
    } else {
        console.log('Events already exist')
    }

        console.log('Seed completed successfully');
        
        process.exit();
    
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

seedData();