ONEm Zone
=========

ONEm Zone provides an emulation of the SMS interface to ONEm's Interactive Services.  See www.onem.com for more details.

## Pre-requisites

* NPM 6.4.1 or higher
* Node 9.0.0 or higher
* MongoDB v3.4.13 or higher

## Installation

`$ git clone https://github.com/mcoin-project/onem-zone.git`  
`$ cd onem-zone`  
`$ git checkout master`  
`$ npm install`  

## Setup the environment

Create a .env file in the root directory with your favourite editor with the following syntax:

`<parameter 1>=<value>`  
`<parameter 2>=<value>`  

| Parameter  | Default  | Description |
| ------------- | -------  | ------------- |
| `SMPP_SYSTEMID` | `autotest` | SMPP system Id, get this from your system admin  |
| `SMPP_PASSWORD` | `password` | SMPP password, get this from your system admin  |
| `SMPP_PORT`  |`2775` | SMPP port, get this from your system admin |

`PORT=<http port>`  
`SHORT_NUMBER=<operator's platform number>`  
`GOOGLE_CLIENT_ID=785326362402-co8gkpjf1rcfmiur67pggp4mkersm4mi.apps.googleusercontent.com`  
`GOOGLE_CLIENT_SECRET=<google secret>`  
`TOKEN_SECRET=<something secure>`  
`TOKEN_VALIDITY=1209600`  
`NEXMO_API_KEY=<key from nexmo credentials>`  
`NEXMO_API_SECRET=<nexmo account secret`  
`NEXMO_ENABLED=true`  
`FACEBOOK_APP_ID=280049366235647`  
`HTTPS=off`  

## Running in production mode

The following command will execute in production mode and serve the files from the `public` folder.

`$ npm start`

## Developing and contribiting

