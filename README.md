ONEm Zone
=========

ONEm Zone provides an emulation of the SMS interface to ONEm's Interactive Services.  See www.onem.com for more details.

## Pre-requisites

* NPM 6.4.1 or higher
* Node 9.0.0 or higher
* MongoDB v3.4.13 or higher

For IP communication, ensure that the backend server where the NodeJS app is running has access to the internet to make HTTP and HTTPS requests.  Ensure also that the same server is able to communicate via SMPP on internal network using the configured SMPP port (see below).

## Installation
```
$ git clone https://github.com/mcoin-project/onem-zone.git
$ cd onem-zone
$ git checkout master
$ npm install
```
## Setup the environment

Create a .env file in the root directory with your favourite editor with the following syntax:
```
<parameter 1>=<value>
<parameter 2>=<value>
```
| Parameter  | Default  | Description |
| ------------- | -------  | ------------- |
| `SMPP_SYSTEMID` | `autotest` | SMPP system Id, get this from your system admin  |
| `SMPP_PASSWORD` | `password` | SMPP password, get this from your system admin  |
| `SMPP_PORT`  |`2775` | SMPP port, get this from your system admin |
| `PORT`  |`5000` | The HTTP port on which the the app should listen |
| `SHORT_NUMBER`  |`444100` | The platform number that will be used as the 'SMPP destination' address |
| `FACEBOOK_APP_ID` | `280049366235647` | The Facebook app Id used for oauth2 api calls  |  
| `GOOGLE_CLIENT_ID`  |`785326362402-co8gkpjf1rcfmiur67pggp4mkersm4mi.apps.googleusercontent.com` | The Google client Id used for oauth2 api calls |
| `GOOGLE_CLIENT_SECRET` | | Get this from your system admin |  
| `TOKEN_SECRET` | | A secret string that is used for JWT tokens to preserve login sessions |  
| `TOKEN_VALIDITY` | `1209600` | The validity period in seconds of the JWT token.  Users are forced to login again when token has expired |
| `NEXMO_API_KEY` | | The Nexmo api key  Nexmo is used for sending SMS one time passwords to authenticate first-time users.  Get this from your system admin |
| `NEXMO_API_SECRET` | | Nexmo is used for sending SMS one time passwords to authenticate first-time users.  Get this from your system admin |
| `NEXMO_ENABLED` | `false` | Boolean that controls whether to send SMS OTP password or not.  Default is false, set to true for production use |  
| `HTTPS` | `OFF` | Set to `ON` to force Node JS to redirect the client to HTTPS session |  
| `DEBUG` | none | Set to `onem-zone` to enable debug on node console.  |

## Running in production mode

The following command will execute in production mode and serve the files from the `public` folder.
```
$ npm start
```
## Server Side Debug

Either:
Use `DEBUG` parameter in `.env` (see above).

Or:
to enable debug in production mode:
```
$ DEBUG=onem-zone node app prod
```

## Developing and contributing

```
$ git checkout develop
```
Folder structure:

* `/app_api...`  Node backend server files
* `/app_client...`  Client front end files.  ONEm Zone is written in AngularJS
* `/bower_components...`    It's recommended to install third party javascript dependencies with `bower`.  Execure `bower install` commands from inside `app_client` folder.  And modify `index.html` to include the installed dependencies.

Gulp and BrowserSync are used to facilitate development and testing.  To start a development session on your local machine open two terminal sessions.

Ensure mongo is running in background.  Then from first terminal window:
```
$ npm run start-dev
```
From second terminal window:
```
$ gulp
```
The above command executes in dev mode and the server serves the files from the `app_client` folder.  Your browser should launch automatically.  Any changes you make to the scss files in `app_client/scss` are automatically compiled to css and the browser refreshes automatically.  Similarly, any changes to the html files in `index.html` or in `/partials` will also cause browser to refresh.

When you want to make a production build:
```
$ gulp build
```
To execute the app in production mode:
```
$ npm start
```
Please make pull requests towards `develop` branch.
