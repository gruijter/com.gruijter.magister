/* global $ */
let allStudents = {};
// const Homey;
const img = new Image();

function clearSettings() {
	$('#studentList').val(null);
	$('#typeAndgroup').val('');
	$('#totalAverageGrade').val('');
	$('#period').val('');
	$('#photo').prop('src', 'student.jpg');
}

function showSettings(student) {
	if (student === undefined) { return clearSettings(); }
	$('#studentList').val(student.studentId);
	$('#typeAndgroup').val(student.typeAndGroup);
	$('#totalAverageGrade').val(student.totalAverageGrade);
	$('#period').val(student.period);
	$('#photo').prop('src', `../userdata/${student.studentId}.jpg`);
	img.onerror = function onError() {
		$('#photo').prop('src', 'student.jpg');
	};
	img.src = `../userdata/${student.studentId}.jpg`;
}

function studentSelected() {
	const selectedStudent = $('#studentList').val();
	if (selectedStudent === ('null' || 'undefined')) clearSettings();
	else showSettings(allStudents[selectedStudent]);
}

// function to populate the dropdown list
function fillDropdown() {
	// first empty the dropdownlist
	const dropDown = document.getElementById('studentList');
	while (dropDown.length > 0) {
		dropDown.remove(dropDown.length - 1);
	}
	Object.keys(allStudents).forEach((key) => {
		const studentOption = document.createElement('option');
		studentOption.text = allStudents[key].fullName;
		studentOption.value = allStudents[key].studentId;
		dropDown.add(studentOption);
		showSettings(allStudents[key]);
	});
}

// get all students stored in Homey devices
function getAllStudents() {
	Homey.api('GET', 'getStudents/', (err, result) => {
		if (!err) {
			allStudents = result;
			fillDropdown();
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
	Homey.api('GET', 'deletelogs/', (err) => {
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
	Homey.ready();
}
