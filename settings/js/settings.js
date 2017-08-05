/* global $ */
var allStudents;

// Executed when the settings page is loaded
function onHomeyReady() {
  getAllStudents();
  initAccount();
  Homey.ready();
}
// get all students stored in Homey app settings
function getAllStudents (){
  Homey.get('', function(err, settings) {
    if(err) return console.error('Could not get all settings', err);
    allStudents=settings;
    fillDropdown(allStudents);
  });
}

function initAccount () {
  clearBusy();
  clearError();
  clearSuccess();
}

function studentSelected () {
  var selectedStudent= $('#studentList').val();
  if (selectedStudent == ('null' || 'undefined')) clearSettings();
  else showSettings(allStudents[selectedStudent]);
}

function clearAccount () {
  Homey.confirm(__('settings.confirmClearAccount'), 'warning', function (error, result) {
    if (error) return console.error(error)
    if (result) {
      showBusy(__('settings.account.messages.busyClearing'));
      var toDelete= $('#studentList').val();
      Homey.unset(toDelete);
      Homey.api('GET', '/account/delete?' + $.param({id: toDelete}), function (err, result) { });
      getAllStudents();
      showSuccess(__('settings.account.messages.successClearing'), 3000);
    }
  })
}

function validate () {
  var credentials = {
    school : $('#school').val(),
    username : $('#username').val(),
    password : $('#password').val()
  };
  $('#validate').prop('disabled', true);
  $('#clearAccount').prop('disabled', true);
  showBusy(__('settings.busyValidation'));
  Homey.api('GET', '/account/validate?' + $.param(credentials), function (err, result) {
    if(!result.error) {												// connection validation successful, now add the student
      showBusy(__('settings.busySaving'));
      var student_settings = {
        studentId   : result.result.id.toString(), // This is used as unique student ID, e.g. "18341"
        credentials : {
          school: result.result.magisterSchool.name,
          username: credentials.username,
          password: credentials.password
        },
        fullName    : result.result.fullName,
        type_group  : result.result.currentCourse.type.description + " - " + result.result.currentCourse.group.description,
        period      : result.result.currentCourse.period,
        totalAverageGrade: null
      };
      if ( (allStudents[result.result.id]) != undefined ){
        student_settings.totalAverageGrade=allStudents[result.result.id].totalAverageGrade
      };
      storeStudent(student_settings);
    } else {			//connection validation unsuccessfull
      $('#validate').prop('disabled', false);
      $('#clearAccount').prop('disabled', false);
      Homey.alert(result.error);
      return showError((__('settings.error') ), 5000)
    }
  })
}

//store the student in Homey app settings
function storeStudent(student) {
  setTimeout(function () {
    Homey.set(student.studentId, student, function (error, settings) {
      $('#validate').prop('disabled', false);
      $('#clearAccount').prop('disabled', false);
      if (error) { return showError(__('settings.error')+error) }
      showSuccess(__('settings.successSaving'), 3000)
    })
    getAllStudents();
  }, 2000)
}

//function to populate the dropdown list
function fillDropdown(students) {
  //first empty the dropdownlist
  var dropDown = document.getElementById("studentList");
  while (dropDown.length > 0) {
    dropDown.remove(dropDown.length-1);
  }
  //now fill the dropdown list and add an empty item in the dropdown list
  var option = document.createElement("option");
  option.text = __('settings.newStudent');
  option.value = null;
  dropDown.add(option);
  clearSettings();
  for (var student in students) {
    var option = document.createElement("option");
    option.text = allStudents[student].fullName;
    option.value = allStudents[student].studentId;
    dropDown.add(option);
    showSettings(allStudents[student])
  }
}

function clearSettings () {
  $('#studentList').val(null);
  $('#school').val('');
  $('#username').val('');
  $('#password').val('')
  $('#type_group').val('');
  $('#totalAverageGrade').val('');
  $('#period').val('');
  $('#photo').prop('src', 'student.jpg')
}
function showSettings (student) {
  if (student== undefined) {return clearSettings()};
  $('#studentList').val(student.studentId);
  $('#school').val(student.credentials.school);
  $('#username').val(student.credentials.username);
  $('#password').val(student.credentials.password);
  $('#type_group').val(student.type_group);
  $('#totalAverageGrade').val(student.totalAverageGrade);
  $('#period').val(student.period);
  $('#photo').prop('src', '../userdata/'+student.studentId+'.jpg')
}

function clearBusy () { $('#busy').hide() }
function showBusy (message, showTime) {
  clearError()
  clearSuccess()
  $('#busy span').html(message)
  $('#busy').show()
  if (showTime) $('#busy').delay(showTime).fadeOut()
}

function clearError () { $('#error').hide() }
function showError (message, showTime) {
  clearBusy()
  clearSuccess()
  $('#error span').html(message)
  $('#error').show()
  if (showTime) $('#error').delay(showTime).fadeOut()
}

function clearSuccess () { $('#success').hide() }
function showSuccess (message, showTime) {
  clearBusy()
  clearError()
  $('#success span').html(message)
  $('#success').show()
  if (showTime) $('#success').delay(showTime).fadeOut()
}
