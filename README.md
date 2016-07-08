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

Setup a student via "Devices" and enter the schoolname, student username and
student password. Please note: the parent credentials cannot be used at this stage.

Known limitations:
Since Magister is used in the Dutch school system, the app is optimized for Dutch
language. Translation to English is only partially ready (to be finished in next
release).
When adding multiple students the app might run into available resource limits.
Only student credentials can be used at this stage, not the parents' credentials.
Insights-logging all previous grades of the present schoolyear is theoretically
possible, but due to Homey limitations not implemented. I hope that in a next
Homey firmware update this feature can be added.
The app has only been tested with one student, so it is very likely there will
be unknown bugs :)

===============================================================================

Version changelog

v0.0.3 2016.07.08
Initial release
