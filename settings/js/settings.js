/* global $ */
let allStudents = {};
var Homey;

function clearBusy() { $('#busy').hide(); }
function showBusy(message, showTime) {
	$('#busy span').html(message);
	$('#busy').show();
	if (showTime) $('#busy').delay(showTime).fadeOut();
}

function clearSettings() {
	$('#studentList').val(null);
	$('#school').val('');
	$('#username').val('');
	$('#password').val('');
	$('#childNumber').val('');
	$('#type_group').val('');
	$('#totalAverageGrade').val('');
	// $('#lastGradeLogDate').val('');
	$('#period').val('');
	$('#photo').prop('src', 'student.jpg');
}

function showSettings(student) {
	if (student === undefined) { return clearSettings(); }
	$('#studentList').val(student.studentId);
	$('#school').val(student.credentials.school);
	$('#username').val(student.credentials.username);
	$('#password').val(student.credentials.password);
	$('#childNumber').val(student.credentials.childNumber);
	$('#type_group').val(student.type_group);
	$('#totalAverageGrade').val(student.totalAverageGrade);
	// $('#lastGradeLogDate').val(student.lastGradeLogDate);
	$('#period').val(student.period);
	$('#photo').prop('src', `../userdata/${student.studentId}.jpg`);
	return clearBusy();
}

function studentSelected() {
	const selectedStudent = $('#studentList').val();
	if (selectedStudent === ('null' || 'undefined')) clearSettings();
	else showSettings(allStudents[selectedStudent]);
}

// function to populate the dropdown list
function fillDropdown(students) {
	//first empty the dropdownlist
	const dropDown = document.getElementById("studentList");
	while (dropDown.length > 0) {
		dropDown.remove(dropDown.length - 1);
	}
	//now fill the dropdown list and add an empty item in the dropdown list
	const newOption = document.createElement('option');
	newOption.text = __('settings.newStudent');
	newOption.value = null;
	dropDown.add(newOption);
	clearSettings();
	for (const student in students) {
		var studentOption = document.createElement("option");
		studentOption.text = allStudents[student].fullName;
		studentOption.value = allStudents[student].studentId;
		dropDown.add(studentOption);
		showSettings(allStudents[student]);
  }
}

// get all students stored in Homey app settings
function getAllStudents() {
	Homey.get('', (err, settings) => {
		if (err) return console.error('Could not get all settings', err);
		allStudents = settings || {};
		return fillDropdown(allStudents);
	});
}

// function storeStudent(studentSettings) {
// 	Homey.set(studentSettings.studentId, studentSettings, (error) => {
// 		if (error) {
// 			Homey.alert(error, 'error');
// 		} else {
// 			Homey.alert(Homey.__('settings.settingsSaved'), 'info');
// 		}
// 		getAllStudents();
// 	});
// }

function save() {
	showBusy(Homey.__('settings.busyValidation'), 30000);
	const credentials = {
		school: $('#school').val(),
		username: $('#username').val(),
		password: $('#password').val(),
		childNumber: $('#childNumber').val(),
	};
	Homey.api('POST', '/account/save', credentials, (error, result) => {
		if (error) {
			clearBusy();
			return Homey.alert(error, 'error');
		}	// result is student settings
		clearBusy();
		Homey.alert(Homey.__('settings.settingsSaved', { profileInfo: JSON.stringify(result.profileInfo) }), 'info');
		return setTimeout(() => getAllStudents(), 1000);
	});
}

function clearAccount() {
	Homey.confirm(__('settings.confirmClearAccount'), 'warning', (error, result) => {
		if (error) return console.error(error);
		if (result) {
			const toDelete = $('#studentList').val();
			console.log(toDelete);
			Homey.api('DELETE', '/account/delete', { id: toDelete }, (err, res) => {
				if (err) {
					return Homey.alert(error, 'error');
				}
				getAllStudents();
			});
		}
	});
}

function showLogs() {
	Homey.api('GET', 'getlogs/', (err, result) => {
		if (!err) {
			document.getElementById('loglines').innerHTML = '';
			for (let i = (result.length - 1); i >= 0; i -= 1) {
				document.getElementById('loglines').innerHTML += result[i];
				document.getElementById('loglines').innerHTML += '<br />';
			}
		}
	});
}
function deleteLogs() {
	Homey.api('GET', 'deletelogs/', (err, result) => {
		if (err) {
			Homey.alert(err.message, 'error'); // [, String icon], Function callback )
		} else { Homey.alert('Logs deleted!', 'info'); }
	});
}
function showPanel(panel) {
	$('.panel').hide();
	$('.panel-button').removeClass('panel-button-active').addClass('panel-button-inactive');
	$('#panel-button-' + panel).removeClass('panel-button-inactive').addClass('panel-button-active');
	$('#panel-' + panel).show();
	if (panel === 2) {
		showLogs();
	}
}

// Executed when the settings page is loaded
function onHomeyReady(HomeyAPI) {
	Homey = HomeyAPI;
	getAllStudents();
	showPanel(1);
	clearBusy();
	Homey.ready();
}
