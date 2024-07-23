const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../service/schemas/user");
const gravatar = require("gravatar");
const multer = require("multer");
const path = require("path");
const fs = require("fs/promises");
const Jimp = require("jimp");
const crypto = require("crypto");
const { sendVerificationEmail } = require("../modules/email");

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
  const verificationToken = crypto.randomBytes(32).toString("hex");

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const avatarURL = gravatar.url(email, { s: "250", d: "identicon" });

    const user = await User.create({
      email,
      password: hashedPassword,
      avatarURL,
      verificationToken,
    });

    await sendVerificationEmail(email, verificationToken);

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

    if (!user.verify) {
      return res.status(401).json({ message: "Email not verified" });
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
    await fs.unlink(tempUpload);
    next(error);
  }
};

const verifyUser = async (req, res, next) => {
  const { verificationToken } = req.params;
  try {
    const user = await User.findOne({ verificationToken });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.verificationToken = null;
    user.verify = true;
    await user.save();

    res.json({ message: "Email verified successfully" });
  } catch (error) {
    next(error);
  }
};

const resendVerificationEmail = async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      status: "error",
      code: 400,
      message: "Missing required field 'email'",
    });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        status: "error",
        code: 404,
        message: "User not found",
      });
    }

    if (user.verify) {
      return res.status(400).json({
        status: "error",
        code: 400,
        message: "Verification has already been passed",
      });
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");
    user.verificationToken = verificationToken;
    await user.save();

    await sendVerificationEmail(email, verificationToken);

    res.json({
      status: "success",
      code: 200,
      message: "Verification email sent",
    });
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    await User.findByIdAndDelete(req.user._id);
    res.status(200).json({
      status: "success",
      message: "User deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  getCurrent,
  upload,
  updateAvatar,
  verifyUser,
  resendVerificationEmail,
  deleteUser,
};
