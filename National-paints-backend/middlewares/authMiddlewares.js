const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const AdminModel = require('../models/AdminModel');
const ReceptionModel = require('../models/ReceptionModel');
const AccountantModel = require('../models/AccountantModel');
const HRModel = require('../models/HrModel');

const isAdmin = async (req, res, next) => {
    try {
      const token = req.headers.authorization?.split(' ')[1]; 
      console.log(token)
      if (!token) {
        return res.status(401).json({ message: 'No token provided' });
      }
  
      const decoded = jwt.verify(token, process.env.JWT_SECRET); 
  
      const admin = await AdminModel.findById(decoded.id);
      if (!admin) {
        return res.status(403).json({ message: 'Access denied' });
      }
  
      // Attach user to the request object
      req.admin = admin;
      next();
    } catch (error) {
      return res.status(401).json({ message: 'Invalid token', error: error.message });
    }
  };

  const isReceptionist = asyncHandler(async (req, res, next) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({ message: 'No token provided' });
      }
  
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
  
      const admin = await AdminModel.findById(decoded.id);
      if (admin) {
        req.admin = admin;
        return next();
      }
  
      const receptionist = await ReceptionModel.findById(decoded.id);
      if (receptionist && receptionist.role === 'Reception') {
        // Allow access if the user is an receptionist
        req.receptionist = receptionist;
        return next();
      }
  
      return res.status(403).json({ message: 'Access denied. Only Receptionist and admins can access this route.' });
    } catch (error) {
      return res.status(401).json({ message: 'Invalid token', error: error.message });
    }
  });

  const isAccountant = asyncHandler(async (req, res, next) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({ message: 'No token provided' });
      }
  
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
  
      const admin = await AdminModel.findById(decoded.id);
      if (admin) {
        req.admin = admin;
        return next();
      }
  
      const accountant = await AccountantModel.findById(decoded.id);
      if (accountant && accountant.role === 'Accountant') {
        // Allow access if the user is an accountant
        req.accountant = accountant;
        return next();
      }
  
      return res.status(403).json({ message: 'Access denied. Only Accountant and admins can access this route.' });
    } catch (error) {
      return res.status(401).json({ message: 'Invalid token', error: error.message });
    }
  });

  const isHR = asyncHandler(async (req, res, next) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({ message: 'No token provided' });
      }
  
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
  
      const admin = await AdminModel.findById(decoded.id);
      if (admin) {
        req.admin = admin;
        return next();
      }
  
      const hr = await HRModel.findById(decoded.id);
      if (hr && hr.role === 'HR') {
        // Allow access if the user is an hr
        req.hr = hr;
        return next();
      }
  
      return res.status(403).json({ message: 'Access denied. Only Hr and admins can access this route.' });
    } catch (error) {
      return res.status(401).json({ message: 'Invalid token', error: error.message });
    }
  });


module.exports = { isAdmin,isAccountant,isReceptionist,isHR};
