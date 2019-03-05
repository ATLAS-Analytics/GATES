# Welcome to GATES


## What is it? 

GATES is a service that simplifies running [AB tests](https://en.wikipedia.org/wiki/A/B_testing). 



## Links
*   [Docker](https://hub.docker.com/r/atlasanalyticsservice/gates)
*   [GitHub](https://github.com/ATLAS-Analytics/GATES)
*   [Documentation](https://atlas-analytics.github.io/GATES/)

## TODO

* set pug basedir. refer to pug includes with apsolute paths.
* download/update easing, waypoints. Is magnificent pop up needed? 
* Don't call /user on every index render. should simply check session? 
* load user's teams upon login.
* add a checkmark when a team selected, load experiments.
* check logout works
* define API
* improve docs
* get server
* tests / stress tests
* analytics
* receiving (separate smaller server pod/service, only 2-3 endpoints). Autoscaling with trigger on latency.
* receiver-service is not nodeport 
* reduce rights of the fronter account

teams (drop down. last option is "new team". one of existing teams is selected)
team has name, task, time of creation, members (add - only from existing (by username), remove), retire team
experiments (drop down. last option "new experiment". one of existing is selected)
exeriment has: name, description, timeofcreation, options, state (active, paused, done ), generate code
analysis input rate, results if recieved, export selector.