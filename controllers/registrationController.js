const Registration = require('../models/Registration');
const Event = require('../models/Event');

const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

const registerForEvent = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const eventId = req.body.eventId;

    if (req.user.role !== 'attendee') {
        throw new AppError(
            'Only attendees can register for events',
            403
        );
    }

    const event = await Event.findById(eventId);

    if (!event) {
        throw new AppError('Event not found', 404);
    }

    const existing = await Registration.findOne({
        event: eventId,
        attendee: userId
    });

    if (existing) {
        throw new AppError(
            'You are already registered for this event',
            400
        );
    }

    const currentCount = await Registration.countDocuments({
        event: eventId
    });

    if (currentCount >= event.capacity) {
        throw new AppError('This event is full', 400);
    }

    let registration;

    try {
        registration = await Registration.create({
            event: eventId,
            attendee: userId
        });
    } catch (error) {
        if (error.code === 11000) {
            throw new AppError(
                'You are already registered for this event',
                400
            );
        }

        throw error;
    }

    const io = req.app.get('io');

    if (io) {
        io.to(event._id.toString()).emit('registrationUpdate', {
            message: 'A new user registered for this event',
            eventId: event._id
        });
    }

    res.status(201).json(registration);
});

const getMyRegistrations = asyncHandler(async (req, res) => {
    const registrations = await Registration.find({
        attendee: req.user.id
    })
        .populate('event')
        .populate('attendee', 'name email');

    res.status(200).json(registrations);
});

const cancelRegistration = asyncHandler(async (req, res) => {
    const registration = await Registration.findById(
        req.params.registrationId
    );

    if (!registration) {
        throw new AppError(
            'Registration not found',
            404
        );
    }

    if (registration.attendee.toString() !== req.user.id) {
        throw new AppError(
            'You can only cancel your own registration',
            403
        );
    }

    await registration.deleteOne();

    const io = req.app.get('io');

    if (io) {
        io.to(registration.event.toString()).emit(
            'registrationUpdate',
            {
                message: 'A registration was cancelled',
                eventId: registration.event
            }
        );
    }

    res.status(200).json({
        message: 'Registration cancelled successfully'
    });
});

module.exports = {
    registerForEvent,
    getMyRegistrations,
    cancelRegistration
};