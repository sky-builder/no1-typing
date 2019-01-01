const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const jwtSecret = require('config').get('jwtSecret');

const db = require('../models');

async function getUser(req, res, next) {
  let { id } = req.params;

  let result = await db.User.findOne({ _id: id });
  req.result = result;
  next();
}

async function getUsers(req, res, next) {
  let { username } = req.query;

  const where = {};

  if (username) {
    where.username = username;
  }

  let result = await db.User.find(where);
  req.result = result;
  next();
}

async function createUser(req, res, next) {
  const { body } = req;
  body.password = await encryptPassword(body.password);
  let result = await db.User.create(body);
  req.result = result;
  next();
}

async function authUser(req, res, next) {
  const { email, password } = req.body;
  if (!email || !password) {
    req.error = {
      code: 400,
      message: 'miss necessary paramters.',
    };
    next(new Error('miss necessary parameters.'));
  }
  let result = await db.User.findOne({ email });

  if (!result) {
    req.error = {
      code: 404,
      message: 'user not found.',
    };
    next(new Error('user not found.'));
  }
  // compare password
  let match = await comparePassword(password, result.password);
  if (!match) {
    next(new Error('password not match.'));
  }

  // login
  req.user = {
    email: result.email,
    username: result.username,
    isAdmin: result.isAdmin,
  };

  next();
}
async function createJwt(req, res, next) {
  let user = req.user;
  req.token = jwt.sign(
    {
      email: user.email,
      username: user.username,
      isAdmin: user.isAdmin,
    },
    jwtSecret,
  );
  next();
}
async function loginUser(req, res, next) {
  let { token } = req;

  // record where and when user login
  // may be behind proxy
  const where = {
    username: req.user.username,
  };
  let lastLoginIp =
    req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  let lastLoginTime = Date.now();
  const update = {
    lastLoginIp,
    lastLoginTime,
  };
  db.User.updateOne(where, update).exec();

  req.result = token;
  next();
}

async function encryptPassword(plainPassword) {
  let satlRounds = 10;
  let hash = await bcrypt.hash(plainPassword, satlRounds);
  return hash;
}
async function comparePassword(plainPassword, hash) {
  let match = bcrypt.compare(plainPassword, hash);
  return match;
}

module.exports = {
  getUser,
  getUsers,
  createUser,
  authUser,
  createJwt,
  loginUser,
};
