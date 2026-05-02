const express = require('express');
const { addEmployee, getAllEmployee, getEmployeeAttendance, unpaidEmployees, unapprovedEmployees, approveEmployee, editEmployee, transferToPaidEmployee, getSingleEmployee, editSalary, deleteEmployee, rejectEmployee, getAgainEmployee, deletePermanently, deleteSalary } = require('../controllers/EmployeeControllers');
const { putSalary, paySalary, generateSalarySlip, payAdvance, disapproveSalary,unpayAdvance,unpaySalary } = require('../controllers/SalaryController');
const { GiveLoan } = require('../controllers/LoanController');
const { isHR } = require('../middlewares/authMiddlewares');
const router = express.Router();


router.post('/add', addEmployee);

router.get('/all', getAllEmployee);

router.get('/all', getAllEmployee);


router.get('/unpaid',unpaidEmployees)

router.get('/unapproved',unapprovedEmployees)

router.get('/:id', getSingleEmployee);

router.put('/approve/:id',approveEmployee)

router.delete('/reject/:id',rejectEmployee)

router.put('/edit/:id', editEmployee)

router.put('/edit-salary',isHR,editSalary)

router.post('/transfer-to-paid/:id',transferToPaidEmployee)

router.get('/:employeeId/:month', getEmployeeAttendance);

router.post('/putSalary', putSalary);

router.post('/pullSalary', disapproveSalary)

router.delete('/delete-salary/:salaryId/:employeeId',deleteSalary)

router.post('/paySalary', paySalary);

router.post('/unpaySalary',unpaySalary)

router.put('/payAdvance', payAdvance);

router.put('/unpayAdvance', unpayAdvance);

router.post('/generate-salary-slip', generateSalarySlip);

router.post('/give-loan',GiveLoan)

router.put('/deactivate/:id',deleteEmployee)

router.delete('/delete/:id',deletePermanently)

router.put('/get-again/:id',getAgainEmployee)


module.exports = router;