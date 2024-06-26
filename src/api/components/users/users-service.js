const usersRepository = require('./users-repository');
const { hashPassword, passwordMatched } = require('../../../utils/password');

/**
 * Get list of users
 * @returns {Array}
 */
async function getUsers(hlm, isi, search, sort) {
  const awal = (hlm - 1) * isi;
  const akhir = hlm * isi;
  let users = await usersRepository.getUsers();

  // Sistem search yang saya buat adalah case sensitive (Huruf besar dan kecil mempengaruhi)
  if (search) {
    const [searchAwal, searchAkhir] = search.split(':');
    if (searchAwal === 'email' && searchAkhir) {
      users = users.filter((user) => user.email.includes(searchAkhir));
    } else if (searchAwal === 'name' && searchAkhir) {
      users = users.filter((user) => user.name.includes(searchAkhir));
    } else if (searchAwal === 'id' && searchAkhir) {
      users = users.filter((user) => user.id.includes(searchAkhir));
    }
  }

  // Untuk mengurutkan secara descending atau ascending
  if (sort) {
    const [sortAwal, sortAkhir] = sort.split(':');
    if (sortAwal === 'email' && sortAkhir === 'desc') {
      users.sort((a, b) => {
        if (a < b) {
          return 1;
        } else if (a > b) {
          return -1;
        } else {
          return 0;
        }
      });
    }
  }

  // if condition jika halaman dan batas halaman terdapat di query maka ini yang akan dijalananin
  if (hlm && isi) {
    const pagination = [];
    for (let i = awal; i < akhir && i < users.length; i++) {
      const user = users[i];
      pagination.push({
        id: user.id,
        name: user.name,
        email: user.email,
      });
    }

    const count = users.length;
    const totalhlm = Math.ceil(count / isi);
    const hlmsblm = hlm > 1;
    const hlmslnjt = hlm < totalhlm;

    return {
      page_number: hlm,
      page_size: isi,
      count: count,
      total_pages: totalhlm,
      has_previous_page: hlmsblm,
      has_next_page: hlmslnjt,
      data: pagination,
    };
  }

  const results = [];
  for (let i = 0; i < users.length; i += 1) {
    const user = users[i];
    results.push({
      id: user.id,
      name: user.name,
      email: user.email,
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
  const user = await usersRepository.getUser(id);

  // User not found
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
}

/**
 * Create new user
 * @param {string} name - Name
 * @param {string} email - Email
 * @param {string} password - Password
 * @returns {boolean}
 */
async function createUser(name, email, password) {
  // Hash password
  const hashedPassword = await hashPassword(password);

  try {
    await usersRepository.createUser(name, email, hashedPassword);
  } catch (err) {
    return null;
  }

  return true;
}

/**
 * Update existing user
 * @param {string} id - User ID
 * @param {string} name - Name
 * @param {string} email - Email
 * @returns {boolean}
 */
async function updateUser(id, name, email) {
  const user = await usersRepository.getUser(id);

  // User not found
  if (!user) {
    return null;
  }

  try {
    await usersRepository.updateUser(id, name, email);
  } catch (err) {
    return null;
  }

  return true;
}

/**
 * Delete user
 * @param {string} id - User ID
 * @returns {boolean}
 */
async function deleteUser(id) {
  const user = await usersRepository.getUser(id);

  // User not found
  if (!user) {
    return null;
  }

  try {
    await usersRepository.deleteUser(id);
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
  const user = await usersRepository.getUserByEmail(email);

  if (user) {
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
  const user = await usersRepository.getUser(userId);
  return passwordMatched(password, user.password);
}

/**
 * Change user password
 * @param {string} userId - User ID
 * @param {string} password - Password
 * @returns {boolean}
 */
async function changePassword(userId, password) {
  const user = await usersRepository.getUser(userId);

  // Check if user not found
  if (!user) {
    return null;
  }

  const hashedPassword = await hashPassword(password);

  const changeSuccess = await usersRepository.changePassword(
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
};
