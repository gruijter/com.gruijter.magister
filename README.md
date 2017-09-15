# Magister #

Homey app to interface with the Magister school information system.

After adding a student in the settings page, the following functionality is
available:

### Flow: ###
- Trigger   : New incoming grade
- Trigger   : Change in day-roster today or tomorrow
- Condition : A lesson was scrapped today or tomorrow
- Condition : A test is planned today or tomorrow
- Action    : Let Homey say all new grades for the last 24hrs or 7 days
- Action    : Let Homey say the day-roster of today or tomorrow
- Action    : Let Homey say the homework of today or tomorrow
- Action    : Let Homey say the tests of today or tomorrow

### Trigger Flow tokens: ###
- Incoming grade: grade, weight, class, description, studentname
- Roster change : scrapped hour, 1st hour, last hour, begin time, end time,
                  studentname

### Insights: ###
- Log new incoming grades for all classes

### Known limitations: ###
Using parent credentials is not fully functional (no student picture, and only one
student per school). Using student credentials is preferred.

### Migrating from Version 1 app: ###
Students and flows must be re-added when migrating from V1 to V2. The V1 student
device should be deleted manually.

##### Donate: #####
If you like the app you can show your appreciation by posting it in the [forum].
If you really like the app you can buy me a beer.

[![Paypal donate][pp-donate-image]][pp-donate-link]

<sup>btc: 14VR1QCpqWUWiSLa1sn3Dpzq3Wrp83zFfC</sup>

<sup>eth: 0xEcF4747203Eba214c071fDAa4825cD867B410d70</sup>

<sup>ltc: LfGJu1AdnPFMoBXwHvf2qG9sCV1onyXDvd</sup>

===============================================================================

Version changelog
```
v2.0.6	2017.08.05 Condition cards bugfix. Removed driver
v2.0.5	2017.08.05 Complete rewrite from device to app settings. Extra flowcards
				Parent login partially implemented. Student login is preferred
```


[forum]: https://forum.athom.com/discussion/1716
[pp-donate-link]: https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=YGTW25KRKEADE
[pp-donate-image]: https://www.paypalobjects.com/en_US/i/btn/btn_donate_SM.gif
