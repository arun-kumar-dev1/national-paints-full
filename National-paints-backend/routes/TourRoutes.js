const express = require('express')
const router = express.Router()
const { addTour, getTour, deleteTour } = require('../controllers/TourController')

router.post('/add-tour', addTour)

router.get('/all-tour', getTour)

router.delete('/delete-tour/:id', deleteTour)

module.exports = router