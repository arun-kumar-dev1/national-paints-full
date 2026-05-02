const Tour = require('../models/TourModel')

const addTour = async (req,res) => {
    const {employeeId,employeeName,startDate,endDate,remark} = req.body
    try{
        const tour = new Tour({employeeId,employeeName,startDate,endDate,remark})
        await tour.save()
        res.status(200).json({message:'Tour added successfully',tour})
    }catch(err){
        res.status(500).json({message:'Error adding tour',err})
    }
}

const getTour = async (req,res) => {
    try{
        const tours = await Tour.find()
        res.status(200).json({message:'Tour fetched successfully',tours})
    }catch(err){
        res.status(500).json({message:'Error fetching tour',err})
    }
}

const deleteTour = async (req,res) => {
    const {id} = req.params
    try{
        await Tour.findByIdAndDelete(id)
        res.status(200).json({message:'Tour deleted successfully'})
    }catch(err){
        res.status(500).json({message:'Error deleting tour',err})
    }
}

module.exports = {addTour,getTour,deleteTour}