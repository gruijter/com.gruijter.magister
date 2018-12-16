# Magister #

Homey [app] to interface with the Magister school information system.

After adding a student via the device tab, the following functionality is
available:

### Flow: ###
- Trigger   : New incoming grade
- Trigger   : Change in day-roster today or tomorrow
- trigger   : A lesson was skipped today (spijbelen)
- Condition : A lesson was cancelled today or tomorrow
- Condition : A test is planned today or tomorrow
- Condition : Homework is planned today or tomorrow
- Action    : Let Homey say all new grades for the last 24hrs or 7 days
- Action    : Let Homey say the day-roster of today or tomorrow
- Action    : Let Homey say the homework of today or tomorrow
- Action    : Let Homey say the tests of today or tomorrow

### Trigger Flow tokens: ###
- Incoming grade: grade, weight, class, description, student name
- Roster change : student name, 1st hour, last hour, start time, end time,
                  number of cancelled classes, number of tests
- Skipped lesson: class, hour, student name

### Insights: ###
- Log new incoming grades for all classes

##### Donate: #####
If you like the app you can show your appreciation by posting it in the [forum].
If you really like the app you can buy me a beer.

[![Paypal donate][pp-donate-image]][pp-donate-link]

===============================================================================

Version changelog (summary)
```
v3.1.1  2018.12.16 stable release.
v3.1.0  2018.12.02 BETA. New auth method. School search during pair. Improve change roster detection. Fix grade log.
v3.0.5  2018.11.04 Fix grades for non-numbers
v3.0.4  2018.09.08 Fix login for schools with numbers in their url
v3.0.3  2018.09.02 Fix flows for multiple students. Fix missing profile picture.
v3.0.2  2018.08.12 Reduced memory usage.
v3.0.1  2018.06.03 Fix repeated new grade reports. Improved cancelled class reports.
v3.0.0  2018.05.26 Beta. Complete rewrite to SDK2 as device. 1hr polling.
        Parent login fixed. Added skipped class triggers. Added mobile card info.
v2.0.7  2017.10.01 Minor bugfixes
v2.0.6  2017.08.05 Condition cards bugfix. Removed driver
v2.0.5  2017.08.05 Complete rewrite from device to app settings. Extra flowcards
        Parent login partially implemented. Student login is preferred
v1.0.0  2016.12.27 Stable release
v0.0.3  2016.07.09 Initial release
```

[app]: https://apps.athom.com/app/com.gruijter.magister
[forum]: https://community.athom.com/t/595
[pp-donate-link]: https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=YGTW25KRKEADE
[pp-donate-image]: https://www.paypalobjects.com/en_US/i/btn/btn_donate_SM.gif
