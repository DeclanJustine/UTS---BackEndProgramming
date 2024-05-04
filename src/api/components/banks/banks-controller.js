const banksService = require('./banks-service');
const { errorResponder, errorTypes } = require('../../../core/errors');
let loginLimiter = {};

/**
 * Handle get list of users request
 * @param {object} request - Express request object
 * @param {object} response - Express response object
 * @param {object} next - Express route middlewares
 * @returns {object} Response object or pass an error to the next route
 */
async function getUsers(request, response, next) {
  try {
    const usersBank = await banksService.getUsers();

    return response.status(200).json(usersBank);
  } catch (error) {
    return next(error);
  }
}

/**
 * Function for get all the info of user request
 * @param {object} request - Express request object
 * @param {object} response - Express response object
 * @param {object} next - Express route middlewares
 * @returns {object} Return all the info of the object
 */
async function getInfo(request, response, next) {
  try {
    const userBank = await banksService.getInfo(request.params.id);

    if (!userBank) {
      throw errorResponder(errorTypes.UNPROCESSABLE_ENTITY, 'Unknown user');
    }

    return response.status(200).json(userBank);
  } catch (error) {
    return next(error);
  }
}

/**
 * Handle get user detail request
 * @param {object} request - Express request object
 * @param {object} response - Express response object
 * @param {object} next - Express route middlewares
 * @returns {object} Response object or pass an error to the next route
 */
async function getUser(request, response, next) {
  try {
    const userBank = await banksService.getUser(request.params.id);

    if (!userBank) {
      throw errorResponder(errorTypes.UNPROCESSABLE_ENTITY, 'Unknown user');
    }

    return response.status(200).json(userBank);
  } catch (error) {
    return next(error);
  }
}

/**
 * Handle create user request
 * @param {object} request - Express request object
 * @param {object} response - Express response object
 * @param {object} next - Express route middlewares
 * @returns {object} Response object or pass an error to the next route
 */
async function createUser(request, response, next) {
  try {
    const name = request.body.name;
    const email = request.body.email;
    const password = request.body.password;
    const password_confirm = request.body.password_confirm;
    const nominal = parseInt(request.body.nominal);

    // Check confirmation password
    if (password !== password_confirm) {
      throw errorResponder(
        errorTypes.INVALID_PASSWORD,
        'Password confirmation mismatched'
      );
    }

    // Email must be unique
    const emailIsRegistered = await banksService.emailIsRegistered(email);
    if (emailIsRegistered) {
      throw errorResponder(
        errorTypes.EMAIL_ALREADY_TAKEN,
        'Email is already registered'
      );
    }

    if (nominal >= 50000) {
      const success = await banksService.createUser(
        name,
        email,
        password,
        nominal
      );
      if (!success) {
        throw errorResponder(
          errorTypes.UNPROCESSABLE_ENTITY,
          'Failed to create user'
        );
      }

      return response.status(200).json({ name, email });
    } else {
      throw errorResponder(
        errorTypes.NOMINAL_TIDAK_MEMENUHI,
        'Nominal harus lebih dari atau sama dengan 50000'
      );
    }
  } catch (error) {
    return next(error);
  }
}

/**
 * Handle login request
 * @param {object} request - Express request object
 * @param {object} response - Express response object
 * @param {object} next - Express route middlewares
 * @returns {object} Response object or pass an error to the next route
 */
async function login(request, response, next) {
  const { email, password } = request.body;

  try {
    // Cek Login jika lebih dari 5
    if (loginLimiter[email] && loginLimiter[email].attempts >= 3) {
      throw errorResponder(
        errorTypes.FORBIDDEN,
        `[${new Date().toISOString().replace('T', ' ').split('.')[0]}] User ${email} has been blocked`
      );
    }

    // Check login credentials
    const loginSuccess = await banksService.checkLoginBankCredentials(
      email,
      password
    );

    if (!loginSuccess) {
      // Untuk menambahkan attempts
      if (!loginLimiter[email]) {
        loginLimiter[email] = { attempts: 1, loginTerakhirnya: Date.now() };
      } else {
        loginLimiter[email].attempts++;
        loginLimiter[email].loginTerakhirnya = Date.now();
      }

      // Untuk menampilkan message dan error type di bruno
      if (loginLimiter[email].attempts >= 3) {
        throw errorResponder(
          errorTypes.BANK_LIMITER,
          `[${new Date().toISOString().replace('T', ' ').split('.')[0]}] User ${email} failed to login. Attempt = ${loginLimiter[email].attempts}. Your account has been blocked`
        );
      } else {
        throw errorResponder(
          errorTypes.BANK_LIMITER,
          `[${new Date().toISOString().replace('T', ' ').split('.')[0]}] User ${email} failed to login. Attempt = ${loginLimiter[email].attempts}.`
        );
      }
    } else {
      // Untuk reset limitnya jika telah berhasil login
      loginLimiter[email] = { attempts: 0, loginTerakhirnya: null };
    }

    return response.status(200).json(loginSuccess);
  } catch (error) {
    return next(error);
  }
}

/**
 * Handle update user request
 * @param {object} request - Express request object
 * @param {object} response - Express response object
 * @param {object} next - Express route middlewares
 * @returns {object} Response object or pass an error to the next route
 */
async function updateUser(request, response, next) {
  try {
    const id = request.params.id;
    const name = request.body.name;
    const email = request.body.email;

    // Email must be unique
    const emailIsRegistered = await banksService.emailIsRegistered(email);
    if (emailIsRegistered) {
      throw errorResponder(
        errorTypes.EMAIL_ALREADY_TAKEN,
        'Email is already registered'
      );
    }

    const success = await banksService.updateUser(id, name, email);
    if (!success) {
      throw errorResponder(
        errorTypes.UNPROCESSABLE_ENTITY,
        'Failed to update user'
      );
    }

    return response.status(200).json({ id });
  } catch (error) {
    return next(error);
  }
}

/**
 * Function for update the balance of user by withdraw money
 * @param {object} request - Express request object
 * @param {object} response - Express response object
 * @param {object} next - Express route middlewares
 * @returns {object} Response object or pass an error to the next route
 */
async function updateBalance(request, response, next) {
  try {
    const id = request.params.id;
    const name = request.body.name;
    const email = request.body.email;
    const nominalTarik = parseInt(request.body.nominalTarik);

    const bank = await banksService.getInfo(id);
    const nominal = bank.nominal;

    if (nominal < nominalTarik) {
      throw errorResponder(errorTypes.MIN_TRANSACTION, 'Failed to update user');
    } else {
      const success = await banksService.updateBalance(
        id,
        name,
        email,
        nominalTarik
      );
      return response.status(200).json({ success });
    }
  } catch (error) {
    return next(error);
  }
}

/**
 * Function for update the balance of user by deposit money
 * @param {object} request - Express request object
 * @param {object} response - Express response object
 * @param {object} next - Express route middlewares
 * @returns {object} Response object or pass an error to the next route
 */
async function updateBalances(request, response, next) {
  try {
    const id = request.params.id;
    const name = request.body.name;
    const email = request.body.email;
    const nominalSetor = parseInt(request.body.nominalSetor);

    const success = await banksService.updateBalances(
      id,
      name,
      email,
      nominalSetor
    );
    return response.status(200).json({ success });
  } catch (error) {
    return next(error);
  }
}

/**
 * Function for update the balance of two users by transfer money
 * @param {object} request - Express request object
 * @param {object} response - Express response object
 * @param {object} next - Express route middlewares
 * @returns {object} Response object or pass an error to the next route
 */
async function transfer(request, response, next) {
  try {
    const id = request.body.id;
    const accID = request.body.accID;
    const toId = request.body.toId;
    const toAccID = request.body.toAccID;
    const nominalTransfer = parseInt(request.body.nominalTransfer);
    const deskripsi = request.body.description;

    const bank = await banksService.getInfo(id);
    const nominal = bank.nominal;

    if (nominal < nominalTransfer) {
      throw errorResponder(errorTypes.MIN_TRANSACTION, 'Transfer Failed');
    } else {
      const account = await banksService.transferNominal(
        id,
        toId,
        nominalTransfer
      );

      if (!account) {
        throw errorResponder(
          errorTypes.UNPROCESSABLE_ENTITY,
          'Unidentified accID'
        );
      }

      const transferNote = await banksService.transferNote(
        id,
        toId,
        nominalTransfer,
        deskripsi
      );

      return response
        .status(200)
        .json({ transferNote, message: 'Transfer Success' });
    }
  } catch (error) {
    return next(error);
  }
}

/**
 * Handle delete user request
 * @param {object} request - Express request object
 * @param {object} response - Express response object
 * @param {object} next - Express route middlewares
 * @returns {object} Response object or pass an error to the next route
 */
async function deleteUser(request, response, next) {
  try {
    const id = request.params.id;

    const success = await banksService.deleteUser(id);
    if (!success) {
      throw errorResponder(
        errorTypes.UNPROCESSABLE_ENTITY,
        'Failed to delete user'
      );
    }

    return response.status(200).json({ id });
  } catch (error) {
    return next(error);
  }
}

/**
 * Handle change user password request
 * @param {object} request - Express request object
 * @param {object} response - Express response object
 * @param {object} next - Express route middlewares
 * @returns {object} Response object or pass an error to the next route
 */
async function changePassword(request, response, next) {
  try {
    // Check password confirmation
    if (request.body.newPassword !== request.body.confirmPassword) {
      throw errorResponder(
        errorTypes.INVALID_PASSWORD,
        'Password confirmation mismatched'
      );
    }

    // Check old password
    if (
      !(await banksService.checkPassword(
        request.params.id,
        request.body.oldPassword
      ))
    ) {
      throw errorResponder(errorTypes.INVALID_CREDENTIALS, 'Wrong password');
    }

    const changeSuccess = await banksService.changePassword(
      request.params.id,
      request.body.newPassword
    );

    if (!changeSuccess) {
      throw errorResponder(
        errorTypes.UNPROCESSABLE_ENTITY,
        'Failed to change password'
      );
    }

    return response.status(200).json({ id: request.params.id });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  changePassword,
  updateBalance,
  updateBalances,
  getInfo,
  transfer,
  login,
};
