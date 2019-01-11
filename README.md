ONEm Zone
=========

ONEm Zone provides an emulation of the SMS interface to ONEm's Interactive Services.  See www.onem.com for more details.

## Installation

'$ git clone https://github.com/mcoin-project/onem-zone.git'  
'$ cd onem-zone'  
'$ git checkout master'  
'$ npm install'  

## Setup the environment

Create a .env file in the root directory with your favourite editor

'SMPP_SYSTEMID=<system id>'  
'SMPP_PASSWORD=<password>'  
'SMPP_PORT=<smpp port>'  
'PORT=<http port>'  
'SHORT_NUMBER=<operator's platform number>'  
'GOOGLE_CLIENT_ID=785326362402-co8gkpjf1rcfmiur67pggp4mkersm4mi.apps.googleusercontent.com'  
'GOOGLE_CLIENT_SECRET=<google secret>'  
'TOKEN_SECRET=<something secure>'  
'TOKEN_VALIDITY=1209600'  
'NEXMO_API_KEY=<key from nexmo credentials>'  
'NEXMO_API_SECRET=<nexmo account secret>'  
'NEXMO_ENABLED=true'  
'FACEBOOK_APP_ID=280049366235647'  
'HTTPS=off'  

