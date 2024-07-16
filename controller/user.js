const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../service/schemas/user");
const gravatar = require("gravatar");
const multer = require("multer");
const path = require("path");
const fs = require("fs/promises");
const Jimp = require("jimp");

const avatarUploadPath = path.join(__dirname, "../tmp");
const avatarStorage = multer.diskStorage({
  destination: avatarUploadPath,
  filename: (req, file, cb) => {
    cb(null, `${req.user._id}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only images are allowed!"));
    }
  },
});

const register = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const avatarURL = gravatar.url(email, { s: "250", d: "identicon" }, true);
    const user = await User.create({
      email,
      password: hashedPassword,
      avatarURL,
    });

    res.status(201).json({
      user: {
        email: user.email,
        subscription: user.subscription,
        avatarURL: user.avatarURL,
      },
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Email or password is wrong" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    await User.findByIdAndUpdate(user._id, { token });

    res.json({ token });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { token: null });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

const getCurrent = async (req, res, next) => {
  res.json({
    email: req.user.email,
    subscription: req.user.subscription,
  });
};

const updateAvatar = async (req, res, next) => {
  const { path: tempUpload, filename } = req.file;
  const fileExt = path.extname(filename);
  const newFilename = `${req.user._id}${fileExt}`;
  const resultUpload = path.join(__dirname, "../public/avatars", newFilename);

  try {
    const avatar = await Jimp.read(tempUpload);
    await avatar.resize(250, 250).writeAsync(resultUpload);
    await fs.unlink(tempUpload);

    const avatarURL = `/avatars/${newFilename}`;
    await User.findByIdAndUpdate(req.user._id, { avatarURL });

    res.json({ avatarURL });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  getCurrent,
  updateAvatar,
  upload,
};
