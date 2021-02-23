const jwt = require('jsonwebtoken');
const db = require('../models');

module.exports = async (req, res, next) => {
  if (req.headers['authorization']) {
    const token = req.headers['authorization'].split(' ')[1];
    await jwt.verify(token, process.env.JWT_TOKEN, (err, payload) => {
      if(err) {
        next(err);
      } else {
        db.User.findById(payload._id, (err, foundUser) => {
          if(err) {
            next(err);
          } else if (foundUser.isAuthorized) {
            req.currentUser = payload._id;
            next();
          } else {
            next('Not authorized');
          }
        });
      }
    });
  } else {
    res.sendStatus(403);
  }
};