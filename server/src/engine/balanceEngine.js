/**
 * Balance Engine — Core Debt Simplification Algorithm
 *
 * computeNetBalances: For each expense, paidBy gets +amount,
 * each split member gets -share. Returns { userId: netAmount }.
 *
 * simplifyDebts: Uses greedy min-max heap approach to minimize
 * the number of transactions to settle all debts.
 */

/**
 * @param {Array} expenses - populated Expense documents
 * @returns {Object} { userId: netBalance } (+ve = should receive, -ve = owes)
 */
function computeNetBalances(expenses) {
    const balances = {};

    for (const expense of expenses) {
        const payerId = expense.paidBy._id
            ? expense.paidBy._id.toString()
            : expense.paidBy.toString();

        // Person who paid gets credit for full amount
        balances[payerId] = (balances[payerId] || 0) + expense.amount;

        // Each split person is debited their share
        for (const split of expense.splits) {
            const userId = split.user._id
                ? split.user._id.toString()
                : split.user.toString();
            balances[userId] = (balances[userId] || 0) - split.share;
        }
    }

    // Round to 2 decimal places to avoid floating point artifacts
    for (const key in balances) {
        balances[key] = Math.round(balances[key] * 100) / 100;
    }

    return balances;
}

/**
 * Simplify debts using greedy algorithm.
 * Finds the person with max credit and max debt, settles them,
 * and repeats until all settled.
 *
 * @param {Object} netBalances - { userId: netAmount }
 * @returns {Array} [{ from, to, amount }] — min transactions to settle
 */
function simplifyDebts(netBalances) {
    // Filter out zero balances
    const balanceList = Object.entries(netBalances)
        .filter(([, v]) => Math.abs(v) > 0.005)
        .map(([id, amount]) => ({ id, amount }));

    const settlements = [];

    while (balanceList.length > 1) {
        // Sort: highest creditor (most positive) first, highest debtor (most negative) last
        balanceList.sort((a, b) => b.amount - a.amount);

        const creditor = balanceList[0]; // has +ve balance (should receive)
        const debtor = balanceList[balanceList.length - 1]; // has -ve balance (owes)

        if (Math.abs(creditor.amount) < 0.005 || Math.abs(debtor.amount) < 0.005) break;

        const settleAmount = Math.min(creditor.amount, -debtor.amount);
        settleAmount > 0.005 &&
            settlements.push({
                from: debtor.id,
                to: creditor.id,
                amount: Math.round(settleAmount * 100) / 100,
            });

        creditor.amount -= settleAmount;
        debtor.amount += settleAmount;

        // Remove settled entries
        if (Math.abs(creditor.amount) < 0.005) balanceList.shift();
        if (Math.abs(debtor.amount) < 0.005) balanceList.pop();
    }

    return settlements;
}

module.exports = { computeNetBalances, simplifyDebts };
