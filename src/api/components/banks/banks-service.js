const bankRepository = require('./banks-repository');
const { hashPassword, passwordMatched } = require('../../../utils/password');
const { errorTypes, errorResponder } = require('../../../core/errors');

/**
 * Get list of users
 * @returns {Array}
 */
async function getUsers() {
  const usersBank = await bankRepository.getUsers();

  const results = [];
  for (let i = 0; i < usersBank.length; i += 1) {
    const userBank = usersBank[i];
    results.push({
      id: userBank.id,
      accNum: userBank.accID,
      name: userBank.name,
      email: userBank.email,
    });
  }
  return results;
}

/**
 * Get user detail
 * @param {string} id - User ID
 * @returns {Object}
 */
async function getUser(id) {
  const userBank = await bankRepository.getUser(id);

  // User not found
  if (!userBank) {
    return null;
  }

  return {
    id: userBank.id,
    accNum: userBank.accID,
    name: userBank.name,
    email: userBank.email,
    menu: '/info , /changePassword, /withdraw, /deposit, /transfer ',
  };
}

/**
 * Get user info detail
 * @param {string} id - User ID
 * @returns {Object}
 */
async function getInfo(id) {
  const userBank = await bankRepository.getInfo(id);

  // User not found
  if (!userBank) {
    return null;
  }

  return {
    id: userBank.id,
    accNum: userBank.accID,
    name: userBank.name,
    email: userBank.email,
    nominal: userBank.nominal,
    time: `[${new Date().toISOString().replace('T', ' ').split('.')[0]}]`,
  };
}

/**
 * Create new user
 * @param {string} name - Name
 * @param {string} email - Email
 * @param {string} password - Password
 * @returns {boolean}
 */
async function createUser(name, email, password, nominal) {
  // Hash password
  const hashedPassword = await hashPassword(password);
  const randNum1 = Math.floor(1 + Math.random() * 900000);
  const randNum2 = Math.floor(1000 + Math.random() * 9000);
  const accID = randNum1.toString() + randNum2.toString();

  try {
    await bankRepository.createUser(
      accID,
      name,
      email,
      hashedPassword,
      nominal
    );
  } catch (err) {
    return null;
  }

  return true;
}

/**
 * Check username and password for login.
 * @param {string} email - Email
 * @param {string} password - Password
 * @returns {object} An object containing, among others, the JWT token if the email and password are matched. Otherwise returns null.
 */
async function checkLoginBankCredentials(email, password) {
  const userBank = await bankRepository.getUserBankByEmail(email);

  // We define default user password here as '<RANDOM_PASSWORD_FILTER>'
  // to handle the case when the user login is invalid. We still want to
  // check the password anyway, so that it prevents the attacker in
  // guessing login credentials by looking at the processing time.
  const userPassword = userBank
    ? userBank.password
    : '<RANDOM_PASSWORD_FILLER>';
  const passwordChecked = await passwordMatched(password, userPassword);

  // Because we always check the password (see above comment), we define the
  // login attempt as successful when the `user` is found (by email) and
  // the password matches.
  if (userBank && passwordChecked) {
    return {
      email: userBank.email,
      name: userBank.name,
      user_id: userBank.id,
      accNum: userBank.accID,
    };
  }

  return null;
}

/**
 * Update existing user
 * @param {string} id - User ID
 * @param {string} name - Name
 * @param {string} email - Email
 * @returns {boolean}
 */
async function updateUser(id, name, email) {
  const userBank = await bankRepository.getUser(id);

  // User not found
  if (!userBank) {
    return null;
  }

  try {
    await bankRepository.updateUser(id, name, email);
  } catch (err) {
    return null;
  }

  return true;
}

/**
 * Update existing user balances by withdraw
 * @param {string} id
 * @param {string} name
 * @param {string} email
 * @param {string} nominalTarik
 * @returns
 */
async function updateBalance(id, name, email, nominalTarik) {
  const userBank = await bankRepository.getUser(id);

  // User not found
  if (!userBank) {
    return null;
  }

  try {
    const nominalAkhir = userBank.nominal - nominalTarik;
    await bankRepository.updateBalance(id, name, email, nominalAkhir);
    return {
      id: userBank.id,
      accNum: userBank.accID,
      name: userBank.name,
      email: userBank.email,
      nominalAkhir: nominalAkhir.toString(),
    };
  } catch (err) {
    return null;
  }
}

/**
 * Update existing user balances by deposit
 * @param {string} id
 * @param {string} name
 * @param {string} email
 * @param {string} nominalSetor
 * @returns
 */
async function updateBalances(id, name, email, nominalSetor) {
  const userBank = await bankRepository.getUser(id);

  // User not found
  if (!userBank) {
    return null;
  }

  try {
    const nominalAkhir = parseInt(userBank.nominal) + parseInt(nominalSetor);
    await bankRepository.updateBalance(id, name, email, nominalAkhir);
    return {
      id: userBank.id,
      name: userBank.name,
      email: userBank.email,
      nominalAkhir: nominalAkhir.toString(),
    };
  } catch (err) {
    return null;
  }
}

/**
 * Update existing user balances by transfer the balance from account to account
 * @param {string} id
 * @param {string} toId
 * @param {string} nominalTransfer
 * @returns
 */
async function transferNominal(id, toId, nominalTransfer) {
  try {
    const fromAcc = await bankRepository.getInfo(id);
    const toAcc = await bankRepository.getInfo(toId);
    const nominal = fromAcc.nominal;
    const fromAccs = fromAcc.accID;
    const nominalTo = toAcc.nominal;
    const toAccs = toAcc.accID;
    const nominalFromAcc = parseInt(nominal) - parseInt(nominalTransfer);
    const nominalToAcc = parseInt(nominalTo) + parseInt(nominalTransfer);
    await bankRepository.updateBalance(fromAccs, nominalFromAcc);
    await bankRepository.updateBalance(toAccs, nominalToAcc);
  } catch (error) {
    return null;
  }
  return true;
}

/**
 * Give a message note after transfering the balance
 * @param {string} id
 * @param {string} toId
 * @param {string} nominalTransfer
 * @param {string} description
 * @returns
 */
async function transferNote(id, toId, nominalTransfer, description) {
  try {
    const fromAcc = await bankRepository.getInfo(id);
    const toAcc = await bankRepository.getInfo(toId);
    const randNum1 = Math.floor(1 + Math.random() * 9000);
    const randNum2 = Math.floor(100 + Math.random() * 900);
    const ids = randNum1.toString() + randNum2.toString();

    return {
      transaction_id: ids,
      from: `ID : [${fromAcc.accID}], Name : ${fromAcc.name}`,
      to: `ID : [${toAcc.accID}], Name : ${toAcc.name}`,
      nominal: nominalTransfer.toString(),
      date: `[${new Date().toISOString().replace('T', ' ').split('.')[0]}]`,
      description: description,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Delete user
 * @param {string} id - User ID
 * @returns {boolean}
 */
async function deleteUser(id) {
  const userBank = await bankRepository.getUser(id);

  // User not found
  if (!userBank) {
    return null;
  }

  try {
    await bankRepository.deleteUser(id);
  } catch (err) {
    return null;
  }

  return true;
}

/**
 * Check whether the email is registered
 * @param {string} email - Email
 * @returns {boolean}
 */
async function emailIsRegistered(email) {
  const userBank = await bankRepository.getUserByEmail(email);

  if (userBank) {
    return true;
  }

  return false;
}

/**
 * Check whether the password is correct
 * @param {string} userId - User ID
 * @param {string} password - Password
 * @returns {boolean}
 */
async function checkPassword(userId, password) {
  const userBank = await bankRepository.getUser(userId);
  return passwordMatched(password, userBank.password);
}

/**
 * Change user password
 * @param {string} userId - User ID
 * @param {string} password - Password
 * @returns {boolean}
 */
async function changePassword(userId, password) {
  const userBank = await bankRepository.getUser(userId);

  // Check if user not found
  if (!userBank) {
    return null;
  }

  const hashedPassword = await hashPassword(password);

  const changeSuccess = await bankRepository.changePassword(
    userId,
    hashedPassword
  );

  if (!changeSuccess) {
    return null;
  }

  return true;
}

module.exports = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  emailIsRegistered,
  checkPassword,
  changePassword,
  getInfo,
  updateBalance,
  updateBalances,
  transferNominal,
  transferNote,
  checkLoginBankCredentials,
};
