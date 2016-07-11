# Magister 6

Homey app to interface with the Magister 6 school information system.

After adding a student as a device (sorry students :) ), the following
functionality is available:

Insights:
* Log new incoming grades for all classes

Speech:
* Let Homey speak on new incoming grades
* Let Homey speak on a change in day-roster (for today or tomorrow)

Flow:
* Trigger a flow on new incoming grades
* Trigger a flow on a change in day-roster (for today)
* Action: Let Homey say all new grades for the last 24hrs or 7 days
* Action: Let Homey say the day-roster of today or tomorrow
* Action: Let Homey say the homework of today or tomorrow

Flow tokens:
* Incoming grade: grade, weight, class, description, studentname
* Roster change : 1st hour, begin time, last hour, end time, studentname

Setup a student via "Devices" and enter the schoolname, student username and
student password. Please note: the parent credentials cannot be used at this stage.

Known limitations:
Since Magister is used in the Dutch school system, the app is optimized for Dutch
language. Magister information provided by the school is usually in Dutch.
Only student credentials can be used at this stage, not the parents' credentials.
When adding multiple students the app might run into available resource limits.
All insights from different students are presently logged in the same log.
Insights-logging of all previous grades of the present schoolyear is theoretically
possible, but due to Homey limitations not implemented. I hope that in a next
Homey firmware update this feature can be added. The app has only been tested
with one student, so it is very likely there will be unknown bugs :)

===============================================================================

Version changelog
v0.0.7 2016.07.11 Added fetch all grades for insights in setup
v0.0.6 2016.07.11 Improved handling of unexpected datareturn from Magister
v0.0.4 2016.07.10 Added caching of Magister object for improved performance
v0.0.3 2016.07.09 Initial release
