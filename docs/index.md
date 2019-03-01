# Welcome to GATES


## What is it? 

GATES is a service that simplifies running [AB tests](https://en.wikipedia.org/wiki/A/B_testing). 



## Links
*   [Docker](https://hub.docker.com/r/atlasanalyticsservice/gates)
*   [GitHub](https://github.com/ATLAS-Analytics/GATES)
*   [Documentation](https://atlas-analytics.github.io/GATES/)

## TODO

* get auth link not to show.
* profile link - with form and editing
* get dropdowns not to open automatically.
* make teams, experiments & teams hidden for non-logged users.
* remove approval things. who creates a team, asks coleagues to sign up, then add them to team by username
* add back kubernetes-client
* define API
* improve docs
* get server
* es templates
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