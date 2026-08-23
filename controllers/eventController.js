const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const Event = require('../models/Event');
require('../models/Category');
require('../models/User');

const createEvent = asyncHandler(async (req, res) => {
    const event = await Event.create({
        ...req.body,
        organizer: req.user.id
    });

    res.status(201).json({
        status: 'success',
        data: event
    });
});

const getEvents = asyncHandler(async (req, res) => {
    const {
        category,
        city,
        startDate,
        endDate,
        search,
        sortBy,
        order
    } = req.query;

    const filter = {};

    if (category) {
        filter.category = category;
    }

    if (city) {
        filter.city = city;
    }

    if (startDate || endDate) {
        filter.date = {};

        if (startDate) {
            filter.date.$gte = new Date(startDate);
        }

        if (endDate) {
            filter.date.$lte = new Date(endDate);
        }
    }

    if (search) {
        filter.$or = [
            {
                title: {
                    $regex: search,
                    $options: 'i'
                }
            },
            {
                description: {
                    $regex: search,
                    $options: 'i'
                }
            }
        ];
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const skip = (page - 1) * limit;

    const allowedSortFields = ['date', 'registrations'];

    const sortField = allowedSortFields.includes(sortBy)
        ? sortBy
        : 'date';

    const sortDirection = order === 'desc' ? -1 : 1;

    const total = await Event.countDocuments(filter);

    let events;

    if (sortField === 'registrations') {
        events = await Event.aggregate([
            {
                $match: filter
            },
            {
                $lookup: {
                    from: 'registrations',
                    localField: '_id',
                    foreignField: 'event',
                    as: 'registrations'
                }
            },
            {
                $addFields: {
                    registrations: {
                        $size: '$registrations'
                    }
                }
            },
            {
                $sort: {
                    registrations: sortDirection
                }
            },
            {
                $skip: skip
            },
            {
                $limit: limit
            }
        ]);

        events = await Event.populate(events, [
            {
                path: 'category',
                select: 'name description'
            },
            {
                path: 'organizer',
                select: 'name email role'
            }
        ]);
    } else {
        const sort = {
            [sortField]: sortDirection
        };

        events = await Event.find(filter)
            .populate('category', 'name description')
            .populate('organizer', 'name email role')
            .sort(sort)
            .skip(skip)
            .limit(limit);
    }

    const totalPages = Math.ceil(total / limit);

    res.json({
        status: 'success',
        total,
        page,
        limit,
        totalPages,
        data: events
    });
});

const getEventById = asyncHandler(async (req, res) => {
    const event = await Event.findById(req.params.id)
        .populate('category', 'name description')
        .populate('organizer', 'name email role');

    if (!event) {
        throw new AppError('Event not found', 404);
    }

    res.json({
        status: 'success',
        data: event
    });
});

const updateEvent = asyncHandler(async (req, res) => {
    const event = await Event.findById(req.params.id);

    if (!event) {
        throw new AppError('Event not found', 404);
    }

    Object.assign(event, req.body);

    await event.save();

    res.json({
        status: 'success',
        data: event
    });
});

const deleteEvent = asyncHandler(async (req, res) => {
    const event = await Event.findById(req.params.id);

    if (!event) {
        throw new AppError('Event not found', 404);
    }

    await event.deleteOne();

    res.json({
        status: 'success',
        data: null
    });
});

module.exports = {
    createEvent,
    getEvents,
    getEventById,
    updateEvent,
    deleteEvent
};