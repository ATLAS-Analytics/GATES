# Welcome to GATES


## What is it? 

GATES is a service that simplifies running [AB tests](https://en.wikipedia.org/wiki/A/B_testing). 

## Links
*   [Docker](https://hub.docker.com/r/atlasanalyticsservice/gates)
*   [GitHub](https://github.com/ATLAS-Analytics/GATES)
*   [Documentation](https://atlas-analytics.github.io/GATES/)

## TODO

* check logout works
* define API
* improve docs
* get server
* tests / stress tests
* analytics
* receiving (separate smaller server pod/service, only 2-3 endpoints). Autoscaling with trigger on latency.
* receiver-service is not nodeport 
* reduce rights of the fronter account
* add to configuration option to not need authentication so non edu people can use it.

team has:
* name, description, time of creation, members, url
experiment has: 
* name, description, time of creation, url, state (active, paused, done ) 
* options, generate code, analysis input rate, results if recieved, export selector data.
* Info (name, creation time, description, status )
* Setup (name of id variable, variables, buckets per variable, collects results (checkbox), collected variable name )
* Generate code (curl, python, c++,... )
* Data (requests served total & per bucket, stat. sign, if collected: collected fraction, plot of results per bucket, data export)
