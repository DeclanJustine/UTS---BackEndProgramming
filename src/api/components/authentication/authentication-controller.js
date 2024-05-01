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
async function login(request, response, next) {
  const { email, password } = request.body;

  try {
    // Check if the user's login attempts count has exceeded the limit
    if (loginLimiter[email] && loginLimiter[email].attempts >= 5) {
      // Check if the last login attempt was within the time window
      if (Date.now() - loginLimiter[email].loginTerakhirnya < 30 * 60 * 1000) {
        const errorMessage = `${new Date().toISOString().replace('T', ' ').split('.')[0]}] User ${email} login limit reached. Please try again 30 minute later`;
        throw errorResponder(errorTypes.FORBIDDEN, errorMessage);
      } else {
        // Reset login attempts if more than 30 minutes have passed since last attempt
        loginLimiter[email] = { attempts: 0, loginTerakhirnya: null };
      }
    }

    // Check login credentials
    const loginSuccess = await authenticationServices.checkLoginCredentials(
      email,
      password
    );

    if (!loginSuccess) {
      // Increment login attempts count and update last attempt time
      if (!loginLimiter[email]) {
        loginLimiter[email] = { attempts: 1, loginTerakhirnya: Date.now() };
      } else {
        loginLimiter[email].attempts++;
        loginLimiter[email].loginTerakhirnya = Date.now();
      }

      if (loginLimiter[email].attempts >= 5) {
        const errorMessage = `[${new Date().toISOString().replace('T', ' ').split('.')[0]}] User ${email} gagal login. Attempt = ${loginLimiter[email].attempts}.Limit Reached`;
        throw errorResponder(errorTypes.AVOID_SPAM, errorMessage);
      } else {
        const errorMessage = `[${new Date().toISOString().replace('T', ' ').split('.')[0]}] User ${email} gagal login. Attempt = ${loginLimiter[email].attempts}.`;
        throw errorResponder(errorTypes.AVOID_SPAM, errorMessage);
      }
    }

    // Untuk reset limitnya jika telah berhasil login
    if (loginLimiter[email]) {
      loginLimiter[email] = { attempts: 0, loginTerakhirnya: null };
    }

    return response.status(200).json(loginSuccess);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  login,
};
