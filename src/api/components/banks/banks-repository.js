const { Bank } = require('../../../models');
const { nominal } = require('../../../models/banking-schema');

/**
 * Get a list of users
 * @returns {Promise}
 */
async function getUsers() {
  return Bank.find({});
}

/**
 * Get all info of users
 * @param {object} id
 * @returns {Promise}
 */
async function getInfo(id) {
  return Bank.findById(id);
}

/**
 * Get a list info of user by id
 * @param {object} id
 * @returns {Promise}
 */
async function getUser(id) {
  return Bank.findById(id);
}

/**
 * Create new user
 * @param {string} name - Name
 * @param {string} email - Email
 * @param {string} password - Hashed password
 * @returns {Promise}
 */
async function createUser(accID, name, email, password, nominal) {
  return Bank.create({
    accID,
    name,
    email,
    password,
    nominal,
  });
}

/**
 * Get a list of user by email
 * @param {string} email
 * @returns
 */
async function getUserBankByEmail(email) {
  return Bank.findOne({ email });
}

/**
 * Update existing user
 * @param {string} id - User ID
 * @param {string} name - Name
 * @param {string} email - Email
 * @returns {Promise}
 */
async function updateUser(id, name, email) {
  return Bank.updateOne(
    {
      _id: id,
    },
    {
      $set: {
        name,
        email,
      },
    }
  );
}

/**
 * Update existing user balance
 * @param {string} id - User ID
 * @param {string} name - Name
 * @param {string} email - Email
 * @param {string} nominalAkhir - Balance
 * @returns {Promise}
 */
async function updateBalance(id, name, email, nominalAkhir) {
  return Bank.updateOne(
    {
      _id: id,
      name: name,
      email: email,
    },
    {
      $set: {
        nominal: nominalAkhir,
      },
    }
  );
}

/**
 * Update existing user balance
 * @param {string} id - User ID
 * @param {string} nominalAkhir - Balance
 * @returns {Promise}
 */
async function updateBalances(accID, nominalAkhir) {
  return Bank.updateOne(
    {
      accID: accID,
    },
    {
      $set: {
        nominal: nominalAkhir,
      },
    }
  );
}

/**
 * Delete a user
 * @param {string} id - User ID
 * @returns {Promise}
 */
async function deleteUser(id) {
  return Bank.deleteOne({ _id: id });
}

/**
 * Get user by email to prevent duplicate email
 * @param {string} email - Email
 * @returns {Promise}
 */
async function getUserByEmail(email) {
  return Bank.findOne({ email });
}

/**
 * Update user password
 * @param {string} id - User ID
 * @param {string} password - New hashed password
 * @returns {Promise}
 */
async function changePassword(id, password) {
  return Bank.updateOne({ _id: id }, { $set: { password } });
}

module.exports = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getUserByEmail,
  changePassword,
  getInfo,
  updateBalance,
  getUserBankByEmail,
  updateBalances,
};
