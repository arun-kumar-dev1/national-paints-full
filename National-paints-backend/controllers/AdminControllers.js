const asyncHandler = require('express-async-handler');
const AdminModel = require('../models/AdminModel');
const { generateToken } = require('../config/jwtToken');
const AccountantModel = require('../models/AccountantModel');
const HRModel = require('../models/HrModel');
const ReceptionModel = require('../models/ReceptionModel');

const Register = asyncHandler(async (req, res) => {
  try {
    console.log(req?.body, "SDFGHJK");

    const newAdmin = await AdminModel.create(req.body);
    const token = generateToken(newAdmin._id);

    res.status(201).json({ newAdmin, token });
  } catch (error) {
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
});


const Login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Please provide both email and password');
  }

  // Function to compare password and return token if valid
  const validateUser = (user) => {
    if (user && password === user.password) {
      const token = generateToken(user._id);
      const { _id, name, email, mobileNumber, role } = user;
      res.status(200).json({
        _id,
        name,
        email,
        mobileNumber,
        role,
        token,
      });
      return true;
    }
    return false;
  };

  // Try to find user in AdminModel
  const admin = await AdminModel.findOne({ email });
  if (validateUser(admin)) return;

  // Try to find user in AccountantModel
  const accountant = await AccountantModel.findOne({ email });
  if (validateUser(accountant)) return;

  // Try to find user in HRModel
  const hr = await HRModel.findOne({ email });
  if (validateUser(hr, 'HR')) return;

  // Try to find user in ReceptionModel
  const receptionist = await ReceptionModel.findOne({ email });
  if (validateUser(receptionist)) return;

  // If no match is found in any model
  res.status(401);
  throw new Error('Invalid email or password');
});


module.exports = {
  Register,
  Login
};
