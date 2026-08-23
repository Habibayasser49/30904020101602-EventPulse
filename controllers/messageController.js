const Message = require('../models/Message');
const Event = require('../models/Event');

const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

const sendAnnouncement = asyncHandler(async (req, res) => {
    const { eventId, text } = req.body;

    const event = await Event.findById(eventId);

    if (!event) {
        throw new AppError('Event not found', 404);
    }

    const message = await Message.create({
        event: eventId,
        sender: req.user.id,
        text
    });

    const io = req.app.get('io');

    if (io) {
        io.to(eventId).emit('announcement', message);
    }

    res.status(201).json({
        message: 'Announcement sent successfully',
        announcement: message
    });
});

const getMessageByEvent = asyncHandler(async (req, res) => {
    const { eventId } = req.params;

    const messages = await Message.find({
        event: eventId
    })
        .populate('sender', 'name email')
        .sort({ createdAt: 1 });

    res.status(200).json(messages);
});

module.exports = {
    sendAnnouncement,
    getMessageByEvent
};