const router = require('express').Router();
const multer = require('multer');
const recordService = require('../services/record');
const expressJwt = require('express-jwt');
const config = require('config');

/**
 * 返回速度排名前十的记录。
 * @param snippetId String
 */
router.get('/api/records', (req, res) => {
  req.log.info();

  let { snippetId } = req.query;
  snippetId = snippetId || '';

  const where = {};
  if (snippetId) {
    where.snippetId = snippetId;
  }

  recordService
    .getTop(where)
    .then(result => {
      res.send(result);
    })
    .catch(error => {
      res.status(500);
      res.send(error);
    });
});

router.post(
  '/api/records',
  expressJwt({ secret: config.get('jwtSecret') }),
  multer().none(),
  (req, res) => {
    req.log.info();
    const { body } = req;
    body.username = req.user.username;
    console.log(body);
    recordService
      .create(body)
      .then(result => {
        res.send(result);
      })
      .catch(error => {
        res.status(500);
        res.send(error);
      });
  },
);

module.exports = router;
