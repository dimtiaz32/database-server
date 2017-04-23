var promise = require('bluebird');

var options = {
  promiseLib: promise
};

var pgp = require('pg-promise')(options);
var connectionString = 'postgres://localhost:5432/hospital';
var db = pgp(connectionString);

//add query functions
function getAllDoctors(req, res, next) {
  db.any('SELECT * FROM doctors ORDER BY lname ASC')
    .then(function(data) {
      res.status(200)
        .json({
          status: 'success',
          data: data,
          message: 'Retrieved all doctors'
        });
    })
    .catch(function(err) {
      return next(err);
    });
}

function getDoctor(req, res, next) {
  var doctorId = parseInt(req.params.id);
  db.one('SELECT * FROM doctors d WHERE d.did = $1', doctorId)
    .then(function(data) {
      res.status(200)
        .json({
          status: 'success',
          data: data,
          message: 'Retrieved ONE doctor'
        });
    })
    .catch(function(err) {
      return next(err);
    });
}

function createDoctor(req, res, next) {
  var did;
  console.log(req.body);

  db.one("INSERT INTO doctors (fname, lname) VALUES ($1, $2) RETURNING did;", [req.body.fname, req.body.lname])
    .then(function(data) {
      //console.log("CREATED THE DOCTOR SERVER SIDE");
      did = data.did;

      //now enter the specialty
      db.none("INSERT INTO specialties (did, specialty) VALUES ($1, $2);", [did, req.body.specialty])
        .then(function() {
          res.status(200)
            .json({
              statusText: 'success for the post',
              message: 'Inserted doctor'
            });
        })
        .catch(function(error) {
          console.log(error);
          return next(error);
        });

    })
    .catch(function(err) {
      console.log(err);
      return next(err);
    });

}


function updateDoctor(req, res, next) {
  db.none('UPDATE doctors SET fName=$1, lName=$2 WHERE did=$3', [req.body.fName, req.body.lName, parseInt(req.params.id)])
    .then(function() {
      res.status(200)
        .json({
          status: 'success',
          message: 'Updated doctor'
        });
    })
    .catch(function(err) {
      return next(err);
    });
}

function removeDoctor(req, res, next) {
  var deleteId = parseInt(req.params.id);
  db.result('DELETE FROM doctors WHERE did=$1', deleteId)
    .then(function(result) {
      res.status(200)
        .json({
          status: 'succes',
          message: 'Removed ${result.rowCount} doctor(s)'
        });
    })
    .catch(function(err){
      return next(err);
    });
}

function getDoctorSpecialties(req, res, next) {
  var did = req.params.id;
  db.any('SELECT s.specialty FROM specialties s WHERE s.did=$1 ORDER BY s.specialty ASC', did)
    .then(function(data) {
      res.status(200)
        .json({
          status: 'success',
          data: data,
          message: 'Got the specialties'
        });
    })
    .catch(function(error) {
      console.log(error);
      return next(error);
    });
}

function getDoctorsFiltered(req, res, next) {
  var specialty = req.body.specialty;
  var queryString;

  if (specialty === 'None') {
    queryString = "SELECT * FROM doctors d ORDER BY lname ASC";
  } else {
    queryString = "SELECT * FROM doctors d, specialties s WHERE d.did=s.did AND s.specialty='"+ specialty +"' ORDER BY d.lname ASC";
  }

  console.log(queryString);

  db.any(queryString)
    .then(function(data) {
      res.status(200)
        .json({
          status: 'success',
          data: data,
          message: 'Got the filtered doctors'
        })
    })
    .catch(function(err) {
      console.log(err);
      return next(err);
    });
}

function searchDoctors(req, res, next) {
  var fname = req.body.fnamesearch;
  var lname = req.body.lnamesearch;

  if (lname === undefined) {
    lname = "";
  }
  if (fname === undefined) {
    fname = "";
  }

  var fname = "'%"+fname+"%'";
  var lname = "'%"+lname+"%'";

  var queryString = "SELECT * FROM doctors d WHERE LOWER(d.fname) LIKE LOWER("+fname+") AND LOWER(d.lname) LIKE LOWER("+lname+") ORDER BY d.lname ASC";
  console.log(queryString);
  db.any(queryString)
    .then(function(data) {
      res.status(200)
        .json({
          status: 'success',
          data: data,
          message: 'Got the searched doctors'
        });
    })
    .catch(function(err) {
      console.log(err);
      return next(err);
    });
}




//Queries for patients
function getAllPatients(req, res, next) {
  db.any('SELECT * FROM patients ORDER BY lname ASC')
    .then(function(data) {
      res.status(200)
        .json({
          status: 'success',
          data: data,
          message: 'Got all patients'
        });
    })
    .catch(function(err) {
      return next(err);
    });
}

function getPatient(req, res, next) {
  var id = req.params.id;
  db.one('SELECT * FROM patients p, doctors d, treats t, stays_in s, wards w WHERE p.pid=$1 AND p.pid=t.pid AND t.did=d.did AND p.pid=s.pid AND s.wid=w.wid', id)
    .then(function(data) {
      res.status(200)
        .json({
          status: 'success',
          data: data,
          message: 'Got one patient'
        });
    })
    .catch(function(err) {
      return next(err);
    });
}

function createPatient(req, res, next) {
  console.log(req.body);

  db.none('INSERT INTO patients (fname, lname, phonenumber, pdetails, admissiondate) VALUES (${fname}, ${lname}, ${phonenumber}, ${pdetails}, current_timestamp)', req.body)
    .then(function() {
      res.status(200)
        .json({
          status: 'success',
          message: 'created a new patient'
        });
    })
    .catch(function(err) {
      console.log(err);
      return next(err);
    });
}

function getPatientsFiltered(req, res, next) {
  var did = req.body.did;
  var wid = req.body.wid;
  var queryString;

  if (did === 0 && wid === 0) {
    queryString = "SELECT * FROM patients ORDER BY lname ASC";
  } else if (wid === 0) {
    queryString = "SELECT * FROM patients p, treats t WHERE p.pid=t.pid AND t.did=" + did + " ORDER BY p.lname ASC";
  } else if (did === 0) {
    queryString = "SELECT * FROM patients p, stays_in s WHERE p.pid=s.pid AND s.wid=" + wid + " ORDER BY p.lname ASC";
  } else {
    queryString = "SELECT * FROM patients p, stays_in s, treats t WHERE p.pid=t.pid AND t.pid=s.pid AND t.did="+did+" AND s.wid="+wid+" ORDER BY p.lname ASC";
  }

  db.any(queryString)
    .then(function(data) {
      res.status(200)
        .json({
          status: 'success',
          data: data,
          message: 'Got the filtered doctors'
        })
    })
    .catch(function(err) {
      console.log(err);
      return next(err);
    });
}

function searchPatients(req, res, next) {
  var fname = req.body.fnamesearch;
  var lname = req.body.lnamesearch;

  if (lname === undefined) {
    lname = "";
  }
  if (fname === undefined) {
    fname = "";
  }

  var fname = "'%"+fname+"%'";
  var lname = "'%"+lname+"%'";

  var queryString = "SELECT * FROM patients p WHERE LOWER(p.fname) LIKE LOWER("+fname+") AND LOWER(p.lname) LIKE LOWER("+lname+") ORDER BY p.lname ASC";
  console.log(queryString);
  db.any(queryString)
    .then(function(data) {
      res.status(200)
        .json({
          status: 'success',
          data: data,
          message: 'Got the searched patients'
        });
    })
    .catch(function(err) {
      console.log(err);
      return next(err);
    });
}

function getPatientDoctors(req, res, next) {
  var pid = req.params.id;

  db.any('SELECT d.fname, d.lname, t.dname, t.treatment, t.pid, t.did FROM treats t, doctors d WHERE t.pid=$1 AND t.did=d.did', pid)
    .then(function(data) {
      res.status(200)
        .json({
          status: 'success',
          data: data,
          message: 'Got the patients doctors'
        });
    })
    .catch(function(err) {
      console.log(err);
      return next(err);
    });
}

function getPatientWards(req, res, next) {
  var pid = req.params.id;

  db.any('SELECT w.wname, s.wid, s.pid, s.room, s.indate, s.outdate FROM wards w, stays_in s WHERE s.pid=$1 AND s.wid=w.wid', pid)
    .then(function(data) {
      res.status(200)
        .json({
          status: 'success',
          data: data,
          message: 'Got the wards for the patient'
        });
    })
    .catch(function(err) {
      console.log(err);
      return next(err);
    });
}


function addTreatment(req, res, next) {

  db.none('INSERT INTO treats (pid, did, dname, treatment) VALUES (${pid}, ${did}, ${dname}, ${treatment})', req.body)
    .then(function() {
      res.status(200)
        .json({
          status: 'success',
          message: 'inserted the treatment'
        });
    })
    .catch(function(err) {
      console.log(err);
      return next(err);
    });
}

function addStaysIn(req, res, next) {
  db.none('INSERT INTO stays_in (pid, wid, room, indate) VALUES (${pid}, ${wid}, ${room}, current_timestamp)', req.body)
    .then(function() {
      res.status(200)
        .json({
          status: 'success',
          message: 'inserted the stays_in'
        });
    })
    .catch(function(error) {
      console.log(error);
      return next(error);
    });
}


function getAllWards(req, res, next) {
  db.any('SELECT * FROM wards ORDER BY wname ASC')
    .then(function(data) {
      res.status(200)
        .json({
          status: 'success',
          data: data,
          message: 'Got all the wards'
        });
    })
    .catch(function(error) {
      console.log(error);
      return next(error);
    });
}



function getAllNurses(req, res, next) {
  db.any('SELECT * FROM nurses')
    .then(function(data) {
      res.status(200)
        .json({
          status: 'success',
          data: data,
          message: 'Got all the nures'
        });
    })
    .catch(function(error) {
      console.log(error);
      return next(error);
    });
}


function getSpecialties(req, res, next) {
  db.any("SELECT DISTINCT specialty FROM specialties ORDER BY specialty ASC")
    .then(function(data) {
      res.status(200)
        .json({
          status: 'success',
          data: data,
          message: 'got all the specialties'
        });
    })
    .catch(function(err) {
      console.log(err);
      return next(err);
    });
}

function addSpecialty(req, res, next) {

  if (req.body.specialty !== 'Add Specialty') {
    db.none("INSERT INTO specialties (did, specialty) VALUES (${did}, ${specialty})", req.body)
      .then(function() {
        res.status(200)
          .json({
            status: 'success',
            message: 'Added a specialty'
          });
      })
      .catch(function(err) {
        console.log(err);
        return next(err);
      });
  } else {
    res.status(200)
      .json({
        status: 'bad success',
        message: 'Add Specialty is not a specialty'
      });
  }

}

module.exports = {
  //doctors
  getAllDoctors: getAllDoctors,
  getDoctor: getDoctor,
  createDoctor: createDoctor,
  removeDoctor: removeDoctor,
  updateDoctor: updateDoctor,
  getDoctorSpecialties: getDoctorSpecialties,
  getDoctorsFiltered: getDoctorsFiltered,
  searchDoctors: searchDoctors,
  //patients
  getAllPatients: getAllPatients,
  getPatient: getPatient,
  createPatient: createPatient,
  getPatientsFiltered: getPatientsFiltered,
  searchPatients: searchPatients,
  getPatientDoctors: getPatientDoctors,
  getPatientWards: getPatientWards,
  addTreatment: addTreatment,
  addStaysIn: addStaysIn,
  //wards
  getAllWards: getAllWards,
  //nurses
  getAllNurses: getAllNurses,
  //specialties
  getSpecialties: getSpecialties,
  addSpecialty: addSpecialty
};
