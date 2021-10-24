const jwt = require("jsonwebtoken");
const accessTokenSecret = "youraccesstokensecret";

function isLoggedIn(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: "invalid token" });
    }
    const reqToken = authHeader.split(" ")[1];
    jwt.verify(reqToken, accessTokenSecret, (err, user) => {
      if (err || !user) {
        throw err;
        // todo: dibuat token baru
      }
      req.body.sendername = user.username
      next()
    });
  } catch (err) {
    return res.status(500).json(err);
  }
}

module.exports = {
  isLoggedIn,
}