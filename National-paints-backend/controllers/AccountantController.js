const asyncHandler = require('express-async-handler');
const AccountantModel = require('../models/AccountantModel');
const { generateToken } = require('../config/jwtToken');


const Register = asyncHandler( async(req,res)=>{
    try{
     const newAccountant = await AccountantModel.create(req.body)
     const token = generateToken(newAccountant._id);
 
     res.status(201).json({ newAccountant, token });
    }catch(error){
     res.status(500).json({ message: 'Registration failed', error: error.message });
    }
    
 })

 const getAllAcccountant = asyncHandler( async(req,res)=>{
   try{
    const allAccountant = await AccountantModel.find()
    res.status(201).json(allAccountant);
   }catch(error){
    res.status(500).json({ message: 'error in fetching accountant', error: error.message });
   }
   
})

const editAccountant = asyncHandler(async (req, res) => {
   const { id } = req.params; // Get accountant ID from URL parameters
   const updateData = req.body; // Get updated data from request body
 
   try {
     const updatedAccountant = await AccountantModel.findByIdAndUpdate(
       id,
       updateData,
       { new: true, runValidators: true }
     );
 
     if (!updatedAccountant) {
       return res.status(404).json({ message: 'Accountant not found' });
     }
 
     res.status(200).json({ message: 'Accountant updated successfully', updatedAccountant });
   } catch (error) {
     res.status(500).json({ message: 'Error updating accountant', error: error.message });
   }
 });

 const deleteAccountant = asyncHandler(async (req, res) => {
   const { id } = req.params; // Get accountant ID from URL parameters
 
   try {
     const deletedAccountant = await AccountantModel.findByIdAndDelete(id);
 
     if (!deletedAccountant) {
       return res.status(404).json({ message: 'Accountant not found' });
     }
 
     res.status(200).json({ message: 'Accountant deleted successfully' });
   } catch (error) {
     res.status(500).json({ message: 'Error deleting accountant', error: error.message });
   }
 });

module.exports = {
   Register,
   getAllAcccountant,
   editAccountant,
   deleteAccountant
};
