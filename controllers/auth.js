const User = require("../models/User");

const sendTokenResponse = (user, statusCode, res) => {
//create token
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === "production") {
    options.secure = true;
  }

  res
    .status(statusCode)
    // .cookie("token", token, options)
    .json({ success: true, _id:user._id, name: user.name, email:user.email, token });
};

// @desc    Register a user
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, tel, email, password, role } = req.body;

    //create user
    let user;
    try {
      user = await User.create({
      name,
      email,
      password,
      role,
      tel,
      });
    } catch (err) {
      return res.status(400).json({ success: false, msg: err.message || "Error creating user" });
    }

    sendTokenResponse(user, 200, res);
  } catch (err) {
    if(err.code === 11000) {
      return res.status(400).json({ success: false, msg: "Email already exists" });
    }
    res.status(400).json({ success: false });
    console.log(err.stack);
  }
};

// @desc    Login a user
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
  const { email, password } = req.body;

//validate
  if (!email || !password) {
    return res
      .status(400)
      .json({ success: false, msg: "Please provide an email and password" });
  }
//check for user
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return res
      .status(401)
      .json({ success: false, msg: "Invalid credentials" });
  }

//check if password match
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return res
      .status(401)
      .json({ success: false, msg: "Invalid credentials" });
  }

    sendTokenResponse(user, 200, res);
  } catch (err) {
    res.status(401).json({ success: false, msg: "Cannot convert email or password to string" });
  }
};

// @desc    Get current logged in user
// @route   POST /api/v1/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  const user = await User.findById(req.user.id);
    res.status(200).json({
        success: true,
        data: user
    });
}

exports.logout  = async (req, res, next) => {
  res.cookie("token", "none", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({
    success: true,
    data: {},
  });
}

exports.updateProfile = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.user.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({ success: false, msg: "User not found" });
    }

    sendTokenResponse(user, 200, res);
  } catch (err) {
    res.status(400).json({ success: false, msg: err.message || "Error updating profile" });
  }
}