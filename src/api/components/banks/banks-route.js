const express = require('express');

const authenticationMiddleware = require('../../middlewares/authentication-middlewares');
const celebrate = require('../../../core/celebrate-wrappers');
const banksController = require('./banks-controller');
const banksValidator = require('./banks-validator');

const route = express.Router();

module.exports = (app) => {
  app.use('/banks', route);

  // Get list of users
  route.get('/check', authenticationMiddleware, banksController.getUsers);

  // Create user
  route.post(
    '/createAcc',
    authenticationMiddleware,
    celebrate(banksValidator.createUser),
    banksController.createUser
  );

  route.post(
    '/login',
    authenticationMiddleware,
    celebrate(banksValidator.login),
    banksController.login
  );

  route.post(
    '/login/:id/transfer',
    authenticationMiddleware,
    banksController.transfer
  );

  // Get user detail
  route.get('/login/:id', authenticationMiddleware, banksController.getUser);

  // Get user info
  route.get(
    '/login/:id/info',
    authenticationMiddleware,
    banksController.getInfo
  );

  // Update user
  route.put(
    '/:id',
    authenticationMiddleware,
    celebrate(banksValidator.updateUser),
    banksController.updateUser
  );

  // Tarik Uang mengurangi nominal
  route.put(
    '/login/:id/tarikUang',
    authenticationMiddleware,
    banksController.updateBalance
  );

  // Setor Uang menambah nominal
  route.put(
    '/login/:id/depoUang',
    authenticationMiddleware,
    banksController.updateBalances
  );

  // Delete user
  route.delete('/:id', authenticationMiddleware, banksController.deleteUser);

  // Change password
  route.post(
    '/login/:id/changePassword',
    authenticationMiddleware,
    celebrate(banksValidator.changePassword),
    banksController.changePassword
  );
};
