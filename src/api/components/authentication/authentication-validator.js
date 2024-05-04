const joi = require('joi');

module.exports = {
  loginUsers: {
    body: {
      email: joi.string().email().required().label('Email'),
      password: joi.string().required().label('Password'),
    },
  },
};
