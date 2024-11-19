const admin = require("../config/firebaseConfig");

class Middleware {
  async decodeToken(req, res, next) {
    let userToken;

    if (req.body.headers && req.body.headers.Authorization) {
      userToken = req.body.headers.Authorization.split(" ")[1];
    } else if (req.headers && req.headers.authorization) {
      userToken = req.headers.authorization.split(" ")[1];
    }

    try {
      const decodeValue = await admin.auth().verifyIdToken(userToken);
      if (decodeValue) {
        req.user = decodeValue;
        return next();
      }
      return res.json({ message: "가입되지 않는 사용자" });
    } catch (error) {
      return res.json({ message: "Internal 에러, " + error });
    }
  }
}

module.exports = new Middleware();
