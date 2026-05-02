const express = require('express');
const { Register, getAllHr, editHr, deleteHr} = require('../controllers/HrControllers');
const router = express.Router();


router.post('/register', Register);

router.get('/all', getAllHr);

router.put('/edit/:id', editHr);

router.delete('/delete/:id', deleteHr);



module.exports = router;