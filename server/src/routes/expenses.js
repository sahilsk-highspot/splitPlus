const express = require('express');
const router = express.Router({ mergeParams: true });
const { body, validationResult } = require('express-validator');
const Expense = require('../models/Expense');
const Group = require('../models/Group');
const auth = require('../middleware/auth');

// POST /api/groups/:id/expenses — add expense
router.post(
    '/',
    auth,
    [
        body('description').notEmpty().withMessage('Description required'),
        body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be positive'),
        body('paidBy').notEmpty().withMessage('Payer required'),
        body('splitAmong').isArray({ min: 1 }).withMessage('splitAmong must be array of user IDs'),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        try {
            const group = await Group.findById(req.params.id);
            if (!group) return res.status(404).json({ message: 'Group not found' });
            if (!group.members.some((m) => m.equals(req.user._id))) {
                return res.status(403).json({ message: 'Not a member of this group' });
            }

            const { description, amount, paidBy, splitAmong, splitType = 'equal', customSplits } = req.body;

            let splits = [];
            if (splitType === 'equal') {
                const share = Math.round((amount / splitAmong.length) * 100) / 100;
                const remainder = Math.round((amount - share * splitAmong.length) * 100) / 100;
                splits = splitAmong.map((userId, idx) => ({
                    user: userId,
                    share: idx === 0 ? share + remainder : share, // distribute rounding to first person
                }));
            } else if (splitType === 'custom' && customSplits) {
                splits = customSplits; // [{ user, share }]
            }

            const expense = await Expense.create({
                group: req.params.id,
                description,
                amount,
                paidBy,
                splits,
                splitType,
                createdBy: req.user._id,
            });

            const populated = await expense
                .populate('paidBy', 'name email avatar')
                .then((e) => e.populate('splits.user', 'name email avatar'))
                .then((e) => e.populate('createdBy', 'name email'));

            res.status(201).json(populated);
        } catch (err) {
            res.status(500).json({ message: 'Server error', error: err.message });
        }
    }
);

// GET /api/groups/:id/expenses — list expenses
router.get('/', auth, async (req, res) => {
    try {
        const group = await Group.findById(req.params.id);
        if (!group) return res.status(404).json({ message: 'Group not found' });
        if (!group.members.some((m) => m.equals(req.user._id))) {
            return res.status(403).json({ message: 'Not a member of this group' });
        }

        const expenses = await Expense.find({ group: req.params.id })
            .populate('paidBy', 'name email avatar')
            .populate('splits.user', 'name email avatar')
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 });

        res.json(expenses);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// DELETE /api/groups/:id/expenses/:expenseId
router.delete('/:expenseId', auth, async (req, res) => {
    try {
        const expense = await Expense.findById(req.params.expenseId);
        if (!expense) return res.status(404).json({ message: 'Expense not found' });
        if (!expense.createdBy.equals(req.user._id)) {
            return res.status(403).json({ message: 'Only expense creator can delete it' });
        }
        await expense.deleteOne();
        res.json({ message: 'Expense deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

module.exports = router;
