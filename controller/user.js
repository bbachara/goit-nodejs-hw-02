const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const User = require("../service/schemas/user");

const register = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hashedPassword });

    res.status(201).json({
      user: {
        email: user.email,
        subscription: user.subscription,
      },
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  passport.authenticate("jwt", { session: false }, (err, user, info) => {
    if (err || !user) {
      return res.status(401).json({ message: "Email or password is wrong" });
    }
    req.login(user, { session: false }, async (err) => {
      if (err) {
        return next(err);
      }
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });
      await User.findByIdAndUpdate(user._id, { token });
      return res.json({ token });
    });
  })(req, res);
};

const logout = async (req, res, next) => {
  req.logout();
  res.status(204).send();
};

const getCurrent = async (req, res, next) => {
  res.json({
    email: req.user.email,
    subscription: req.user.subscription,
  });
};

module.exports = {
  register,
  login,
  logout,
  getCurrent,
};
