const express = require('express');
const router = express.Router({ mergeParams: true });
const Expense = require('../models/Expense');
const Group = require('../models/Group');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { computeNetBalances, simplifyDebts } = require('../engine/balanceEngine');

// GET /api/groups/:id/balances — per-user net balances + simplified settlements
router.get('/', auth, async (req, res) => {
    try {
        const group = await Group.findById(req.params.id).populate('members', 'name email avatar');
        if (!group) return res.status(404).json({ message: 'Group not found' });
        if (!group.members.some((m) => m._id.equals(req.user._id))) {
            return res.status(403).json({ message: 'Not a member of this group' });
        }

        const expenses = await Expense.find({ group: req.params.id })
            .populate('paidBy', 'name email avatar')
            .populate('splits.user', 'name email avatar');

        const netBalances = computeNetBalances(expenses);
        const settlements = simplifyDebts({ ...netBalances });

        // Enrich balances with user info
        const memberMap = {};
        group.members.forEach((m) => { memberMap[m._id.toString()] = m; });

        const enrichedBalances = Object.entries(netBalances).map(([userId, amount]) => ({
            user: memberMap[userId] || { _id: userId },
            amount,
        }));

        // Enrich settlements with user info
        const enrichedSettlements = settlements.map((s) => ({
            from: memberMap[s.from] || { _id: s.from },
            to: memberMap[s.to] || { _id: s.to },
            amount: s.amount,
        }));

        res.json({ balances: enrichedBalances, settlements: enrichedSettlements });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

module.exports = router;
