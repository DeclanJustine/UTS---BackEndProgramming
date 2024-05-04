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

    // Check login credentials
    const loginSuccess = await authenticationServices.checkLoginCredentials(
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
      if (loginLimiter[email].attempts >= 5) {
        throw errorResponder(
          errorTypes.AVOID_SPAM,
          `[${new Date().toISOString().replace('T', ' ').split('.')[0]}] User ${email} gagal login. Attempt = ${loginLimiter[email].attempts}.Limit Reached`
        );
      } else {
        throw errorResponder(
          errorTypes.AVOID_SPAM,
          `[${new Date().toISOString().replace('T', ' ').split('.')[0]}] User ${email} gagal login. Attempt = ${loginLimiter[email].attempts}.`
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

module.exports = {
  loginUsers,
};
