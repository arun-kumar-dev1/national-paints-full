const asyncHandler = require('express-async-handler');
const ReceptionModel = require('../models/ReceptionModel');
const { generateToken } = require('../config/jwtToken');

const Register = asyncHandler(async (req, res) => {
  try {
    const newReception = await ReceptionModel.create(req.body);
    const token = generateToken(newReception._id);

    res.status(201).json({ newReception, token });
  } catch (error) {
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
});

const getAllReception = asyncHandler( async(req,res)=>{
  try{
   const allReception = await ReceptionModel.find()
   res.status(201).json(allReception );
  }catch(error){
   res.status(500).json({ message: 'error in fetching reception', error: error.message });
  }
  
})

const editReception = asyncHandler(async (req, res) => {
  const { id } = req.params; // Get Reception ID from URL parameters
  const updateData = req.body; // Get updated data from request body

  try {
    const updatedReception = await ReceptionModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedReception) {
      return res.status(404).json({ message: 'Reception not found' });
    }

    res.status(200).json({ message: 'Reception updated successfully', updatedReception });
  } catch (error) {
    res.status(500).json({ message: 'Error updating Reception', error: error.message });
  }
});

const deleteReception = asyncHandler(async (req, res) => {
  const { id } = req.params; // Get Reception ID from URL parameters

  try {
    const deletedReception = await ReceptionModel.findByIdAndDelete(id);

    if (!deletedReception) {
      return res.status(404).json({ message: 'Reception not found' });
    }

    res.status(200).json({ message: 'Reception deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting Reception', error: error.message });
  }
});



module.exports = {
  Register,
  getAllReception,
  editReception,
  deleteReception
};
