const User = require('../models/User');

const deactivateInactiveUsers = async () => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 90);

await User.updateMany(
  {
    role: 'user',
    archived: false,
    status: 'active',
    loginDays: { $gt: 0 }, // ✅ MUST have logged in at least once
    lastLoginDate: { $lt: cutoffDate }
  },
  { $set: { status: 'deactivated' } }
);

};

module.exports = deactivateInactiveUsers;
