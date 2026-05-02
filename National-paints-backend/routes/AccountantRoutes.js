const express = require('express');
const { Register, getAllAcccountant, editAccountant, deleteAccountant} = require('../controllers/AccountantController');
const { isAdmin } = require('../middlewares/authMiddlewares');
const router = express.Router();


router.post('/register', Register);

router.get('/all', getAllAcccountant);

router.put('/edit/:id', editAccountant);

router.delete('/delete/:id', deleteAccountant);

module.exports = router;