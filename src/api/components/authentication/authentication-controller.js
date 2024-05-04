const { errorResponder, errorTypes } = require('../../../core/errors');
const authenticationServices = require('./authentication-service');

let loginLimiter = {};

/**
 * Handle login request
 * @param {object} request - Express request object
 * @param {object} response - Express response object
 * @param {object} next - Express route middlewares
 * @returns {object} Response object or pass an error to the next route
 */
async function loginUsers(request, response, next) {
  const { email, password } = request.body;

  try {
    // Cek Login jika lebih dari 5
    limitReached(email);

    // Check login credentials
    const loginSuccess = await authenticationServices.checkLoginCredentials(
      email,
      password
    );

    if (!loginSuccess) {
      // Untuk menambahkan attempts
      increaseAttempts(email);
      // Untuk menampilkan message dan error type di bruno
      throw errorResponder(
        errorTypes.AVOID_SPAM,
        errorMessage(email, loginLimiter[email].attempts)
      );
    } else {
      // Untuk reset limitnya jika telah berhasil login
      resetAttempts(email);
    }

    return response.status(200).json(loginSuccess);
  } catch (error) {
    return next(error);
  }
}

/**
 * Function for handle limited reach
 * @param {string} email - User's email
 */
function limitReached(email) {
  if (loginLimiter[email] && loginLimiter[email].attempts >= 5) {
    if (
      Date.now() - loginLimiter[email].loginTerakhirnya <
      30 * 60 * 1000 //  Menandakan 30 menit
    ) {
      throw errorResponder(
        errorTypes.FORBIDDEN,
        `[${new Date().toISOString().replace('T', ' ').split('.')[0]}] User ${email} login limit reached. Please try again 30 minute later`
      );
    } else {
      // Reset kesempatan login jika sudah lebih dari 30 menit
      loginLimiter[email] = { attempts: 0, loginTerakhirnya: null };
    }
  }
}

/**
 * Function to increase login Attempt
 * @param {string} email - User's email
 */
function increaseAttempts(email) {
  if (!loginLimiter[email]) {
    loginLimiter[email] = { attempts: 1, loginTerakhirnya: Date.now() };
  } else {
    loginLimiter[email].attempts++;
    loginLimiter[email].loginTerakhirnya = Date.now();
  }
}

/**
 * Function to reset login attempts
 * @param {string} email - User's email
 */
function resetAttempts(email) {
  loginLimiter[email] = { attempts: 0, loginTerakhirnya: null };
}

/**
 * Funtion for outputing the errorMessage
 * @param {string} email - User's email
 * @param {string} attempts - Login attempts
 * @returns
 */
function errorMessage(email, attempts) {
  const time = currentTime();
  const messagePlus = attempts >= 5 ? '. Limit Reached' : '.';
  return `[${time}] User ${email} gagal login. Attempt = ${attempts}${messagePlus}`;
}

/**
 * Funtion to get a current time
 * @returns current time
 */
function currentTime() {
  return new Date().toISOString().replace('T', ' ').split('.')[0];
}

module.exports = {
  loginUsers,
};
