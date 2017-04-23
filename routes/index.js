var express = require('express');
var router = express.Router();

var db = require('../queries');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/api/doctors', db.getAllDoctors);
router.get('/api/doctors/:id', db.getDoctor);
router.post('/api/doctors', db.createDoctor);
router.put('/api/doctors/:id', db.updateDoctor);
router.delete('/api/doctors/:id', db.removeDoctor);
router.get('/api/specialties/:id', db.getDoctorSpecialties);
router.post('/api/specialties', db.addSpecialty);
router.post('/api/filteredDoctors', db.getDoctorsFiltered);
router.post('/api/searchDoctors', db.searchDoctors);

router.get('/api/patients', db.getAllPatients);
router.get('/api/patients/:id', db.getPatient);
router.post('/api/patients', db.createPatient);
router.post('/api/filteredPatients', db.getPatientsFiltered);
router.post('/api/searchPatients', db.searchPatients);
router.get('/api/patientDoctors/:id', db.getPatientDoctors);
router.get('/api/patientWards/:id', db.getPatientWards);
router.post('/api/treatments', db.addTreatment);
router.post('/api/staysin', db.addStaysIn);

router.get('/api/wards', db.getAllWards);

router.get('/api/nurses', db.getAllNurses);

router.get('/api/specialties', db.getSpecialties);

module.exports = router;
