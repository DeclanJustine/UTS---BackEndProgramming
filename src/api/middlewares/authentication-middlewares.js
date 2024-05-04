const passport = require('passport');
const passportJWT = require('passport-jwt');

const config = require('../../core/config');
const { Bank } = require('../../models');

// Authenticate user based on the JWT token
passport.use(
  'bank',
  new passportJWT.Strategy(
    {
      jwtFromRequest: passportJWT.ExtractJwt.fromAuthHeaderWithScheme('jwt'),
      secretOrKey: config.secret.jwt,
    },
    async (payload, done) => {
      const bank = await Bank.findOne({ id: payload.user_id });
      return bank ? done(null, bank) : done(null, false);
    }
  )
);

module.exports = passport.authenticate('bank', { session: false });
