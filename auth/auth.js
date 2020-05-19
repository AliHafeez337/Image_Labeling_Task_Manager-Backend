module.exports = {
  ensureAuthenticated: async (req, res, next) => {
    if (req.isAuthenticated()) {
      req.token = req.headers.authorization.slice(7)

      for (let i in req.user.tokens){
        if ( req.token === req.user.tokens[i].token ){
          return next();
        }
      }
    }
    req.flash('error_msg', 'Please log in to view that resource');
    res.status(401).send({
      'errmsg': "Unauthorized, You can not access this resource."
    });
  }
};
