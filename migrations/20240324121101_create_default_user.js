const logger = require('../src/core/logger')('api');
const { Bank } = require('../src/models');
const { hashPassword } = require('../src/utils/password');

const name = 'Admin';
const email = 'admins@example.com';
const password = '123456';

logger.info('Creating default users');

(async () => {
  try {
    const numUsers = await Bank.countDocuments({
      name,
      email,
    });

    if (numUsers > 0) {
      throw new Error(`User ${email} already exists`);
    }

    const hashedPassword = await hashPassword(password);
    await Bank.create({
      name,
      email,
      password: hashedPassword,
    });
  } catch (e) {
    logger.error(e);
  } finally {
    process.exit(0);
  }
})();
