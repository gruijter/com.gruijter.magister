/* global $ */
let allStudents = {};
var Homey;


function clearAccount() {
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



function clearSettings() {
	$('#studentList').val(null);
	$('#school').val('');
	$('#username').val('');
	$('#password').val('');
	$('#type_group').val('');
	$('#totalAverageGrade').val('');
	$('#period').val('');
	$('#photo').prop('src', 'student.jpg');
}

function showSettings(student) {
	if (student === undefined) { return clearSettings(); }
	$('#studentList').val(student.studentId);
	$('#school').val(student.credentials.school);
	$('#username').val(student.credentials.username);
	$('#password').val(student.credentials.password);
	$('#type_group').val(student.type_group);
	$('#totalAverageGrade').val(student.totalAverageGrade);
	$('#period').val(student.period);
	$('#photo').prop('src', `../userdata/${student.studentId}.jpg`);
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

function storeStudent(studentSettings) {
	Homey.set(studentSettings.studentId, studentSettings, (error) => {
		if (error) {
			Homey.alert(error, 'error');
		} else {
			Homey.alert(Homey.__('settings.settingsSaved'), 'info');
		}
		getAllStudents();
	});
}

function validate() {
	const credentials = {
		school: $('#school').val(),
		username: $('#username').val(),
		password: $('#password').val(),
	};
	Homey.api('POST', '/account/validate', credentials, (error, result) => {
		if (error) {
			return Homey.alert(error, 'error');
		}
		Homey.confirm(Homey.__('settings.testOk', { profileInfo: JSON.stringify(result.profileInfo) }), 'info', (err, res) => {
			if (err) return console.error(err)
			if (res) {
				const studentSettings = {
					studentId: result.profileInfo.id.toString(), // This is used as unique student ID, e.g. "18341"
					credentials: {
						school: result.school.name,
						username: credentials.username,
						password: credentials.password,
					},
					fullName: `${result.profileInfo.firstName} ${result.profileInfo.namePrefix} ${result.profileInfo.lastName}`,
					type_group: 'currentCourse.type.description - currentCourse.group.description',
					period: 'currentCourse.period',
					totalAverageGrade: null,
				};
				if ((allStudents[result.profileInfo.id]) !== undefined) {
					studentSettings.totalAverageGrade = allStudents[result.profileInfo.id].totalAverageGrade;
				}
				storeStudent(studentSettings);
			}
		});
	});
}

// Executed when the settings page is loaded
function onHomeyReady(HomeyAPI) {
	Homey = HomeyAPI;
	getAllStudents();
	showPanel(1);
	Homey.ready();
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
