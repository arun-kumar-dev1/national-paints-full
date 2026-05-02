const mongoose = require('mongoose')

const TourSchema = new mongoose.Schema({
    employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee'
    },
    employeeName: {
        type: String,
        default: ''
    },
    startDate: {
        type: Date,
    },
    endDate: {
        type: Date,
    },
    remark: {
        type: String,
        default: ''
    }
})

const Tour = mongoose.model('Tour',TourSchema)

module.exports = Tour   