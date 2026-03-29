const mongoose = require('mongoose');

const splitSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        share: { type: Number, required: true, min: 0 },
    },
    { _id: false }
);

const expenseSchema = new mongoose.Schema(
    {
        group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
        description: { type: String, required: true, trim: true },
        amount: { type: Number, required: true, min: 0.01 },
        paidBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        splits: { type: [splitSchema], required: true },
        splitType: { type: String, enum: ['equal', 'custom'], default: 'equal' },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Expense', expenseSchema);
