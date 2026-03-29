const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Group = require('../models/Group');
const User = require('../models/User');
const auth = require('../middleware/auth');

// POST /api/groups — create group
router.post(
    '/',
    auth,
    [body('name').notEmpty().withMessage('Group name is required')],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        try {
            const { name, description, category } = req.body;
            const group = await Group.create({
                name,
                description,
                category,
                members: [req.user._id],
                createdBy: req.user._id,
            });
            const populated = await group.populate('members', 'name email avatar');
            res.status(201).json(populated);
        } catch (err) {
            res.status(500).json({ message: 'Server error', error: err.message });
        }
    }
);

// GET /api/groups — list groups where current user is member
router.get('/', auth, async (req, res) => {
    try {
        const groups = await Group.find({ members: req.user._id })
            .populate('members', 'name email avatar')
            .populate('createdBy', 'name email')
            .sort({ updatedAt: -1 });
        res.json(groups);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// GET /api/groups/:id — group detail
router.get('/:id', auth, async (req, res) => {
    try {
        const group = await Group.findById(req.params.id)
            .populate('members', 'name email avatar')
            .populate('createdBy', 'name email');
        if (!group) return res.status(404).json({ message: 'Group not found' });
        if (!group.members.some((m) => m._id.equals(req.user._id))) {
            return res.status(403).json({ message: 'Not a member of this group' });
        }
        res.json(group);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// POST /api/groups/:id/members — add member by email
router.post('/:id/members', auth, async (req, res) => {
    try {
        const { email } = req.body;
        const group = await Group.findById(req.params.id);
        if (!group) return res.status(404).json({ message: 'Group not found' });
        if (!group.createdBy.equals(req.user._id)) {
            return res.status(403).json({ message: 'Only group creator can add members' });
        }

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (group.members.some((m) => m.equals(user._id))) {
            return res.status(409).json({ message: 'User already in group' });
        }

        group.members.push(user._id);
        await group.save();
        const populated = await group.populate('members', 'name email avatar');
        res.json(populated);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// DELETE /api/groups/:id/members/:userId — remove member
router.delete('/:id/members/:userId', auth, async (req, res) => {
    try {
        const group = await Group.findById(req.params.id);
        if (!group) return res.status(404).json({ message: 'Group not found' });
        if (!group.createdBy.equals(req.user._id)) {
            return res.status(403).json({ message: 'Only group creator can remove members' });
        }
        group.members = group.members.filter((m) => !m.equals(req.params.userId));
        await group.save();
        res.json({ message: 'Member removed' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

module.exports = router;
