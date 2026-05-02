const asyncHandler = require('express-async-handler');
const HrModel = require('../models/HrModel');
const { generateToken } = require('../config/jwtToken');
const ReceptionModel = require('../models/ReceptionModel');


const Register = asyncHandler( async(req,res)=>{
    try{
     const newHR = await HrModel.create(req.body)
     const token = generateToken(newHR._id);
 
     res.status(201).json({ newHR, token });
    }catch(error){
     res.status(500).json({ message: 'Registration failed', error: error.message });
    }
    
 })

 
 const getAllHr = asyncHandler( async(req,res)=>{
   try{
    const allHr = await HrModel.find()
    res.status(201).json(allHr);
   }catch(error){
    res.status(500).json({ message: 'error in fetching Hr', error: error.message });
   }
   
})

const editHr = asyncHandler(async (req, res) => {
   const { id } = req.params; // Get Hr ID from URL parameters
   const updateData = req.body; // Get updated data from request body
 
   try {
     const updatedHr = await HrModel.findByIdAndUpdate(
       id,
       updateData,
       { new: true, runValidators: true }
     );
 
     if (!updatedHr) {
       return res.status(404).json({ message: 'Hr not found' });
     }
 
     res.status(200).json({ message: 'Hr updated successfully', updatedHr });
   } catch (error) {
     res.status(500).json({ message: 'Error updating Hr', error: error.message });
   }
 });

 const deleteHr = asyncHandler(async (req, res) => {
   const { id } = req.params; // Get Hr ID from URL parameters
 
   try {
     const deletedHr = await HrModel.findByIdAndDelete(id);
 
     if (!deletedHr) {
       return res.status(404).json({ message: 'Hr not found' });
     }
 
     res.status(200).json({ message: 'Hr deleted successfully' });
   } catch (error) {
     res.status(500).json({ message: 'Error deleting Hr', error: error.message });
   }
 });

module.exports = {
   Register,
   getAllHr,
   editHr,
   deleteHr
};
