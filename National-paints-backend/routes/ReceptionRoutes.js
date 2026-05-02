const express = require('express');
const { Register, getAllReception, editReception, deleteReception} = require('../controllers/ReceptionController');
const router = express.Router();


router.post('/register', Register);

router.get('/all', getAllReception);

router.put('/edit/:id', editReception);

router.delete('/delete/:id', deleteReception);


module.exports = router;