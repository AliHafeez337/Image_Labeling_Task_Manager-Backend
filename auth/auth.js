module.exports = {
  ensureAuthenticated: async (req, res, next) => {
    if (req.isAuthenticated()) {
      // console.log(req.user)
      req.token = req.headers.authorization.slice(7)
      return next();
    }
    req.flash('error_msg', 'Please log in to view that resource');
    res.status(401).send({
      'errmsg': "Unauthorized, You can not access this resource."
    });
  }
};
