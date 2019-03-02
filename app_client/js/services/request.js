
ONEmSimModule.factory('Request', [
    '$rootScope',
    'Socket',
    '$timeout',
    '$interval',
    'DataModel',
    'MtText',
    'ServicesData',
    function ($rootScope, Socket, $timeout, $interval, DataModel, MtText, ServicesData) {

        const SMS_TIMEOUT = 10000;
        var mtResponse;
        var timer;
        var checkMt;
        var apiMtResponse;
        var apiTimer;
        var apiCheckMt;
        var allResults = [];
        var messagePending = false;

        var stopInterval = function () {
            $interval.cancel(checkMt);
            checkMt = undefined;
        };

        var apiStopInterval = function () {
            $interval.cancel(apiCheckMt);
            apiCheckMt = undefined;
        };

        var waitforMtSMS = function () {
            return new Promise(function (resolve, reject) {

                messagePending = true;
                
                checkMt = $interval(function () {
                    console.log("checking:" + mtResponse);
                    if (mtResponse) {

                        var result = mtResponse;
                        mtResponse = undefined;
                        $timeout.cancel(timer);
                        stopInterval();
                        console.log("got sms");
                        console.log(result);

                        resolve(result);
                    }
                }, 100);

                timer = $timeout(
                    function () {
                        $interval.cancel(checkMt);
                        stopInterval();
                        messagePending = false;

                        reject("no response to MO SMS");
                    }, SMS_TIMEOUT // run 10s timer to wait for response from server
                );
            });
        }

        var apiWaitforMtSMS = function () {
            return new Promise(function (resolve, reject) {

                apiCheckMt = $interval(function () {
                    console.log("checking:" + apiMtResponse);
                    if (apiMtResponse) {
                        var result = apiMtResponse;
                        apiMtResponse = undefined;
                        $timeout.cancel(apiTimer);
                        apiStopInterval();
                        console.log("got api sms");
                        console.log(result);

                        resolve(result);
                    }
                }, 100);

                apiTimer = $timeout(
                    function () {
                        $interval.cancel(apiCheckMt);
                        apiStopInterval();
                        reject("no response to API MO SMS");
                    }, SMS_TIMEOUT // run 10s timer to wait for response from server
                );
            });
        }

        return {

            mtResponse: mtResponse,
            apiMtResponse: apiMtResponse,

            reset: function () {

                if (checkMt) stopInterval();
                if (timer) $timeout.cancel(timer);
                if (apiCheckMt) apiStopInterval();
                if (apiTimer) $timeout.cancel(apiTimer);
                mtResponse = undefined;
                apiMtResponse = undefined;
                return true;
            },
            get: async function (data, options) {
                var self = this;
                var channel = 'MO SMS';
                if (!data) throw "missing data parameter";

                if (options && options.method && options.method.toLowerCase() == 'api') {
                    channel = 'API ' + channel;
                } else {
                    var inputObj = {
                        type: "mo",
                        value: data
                    };
                    DataModel.addResult(inputObj);
                }

                // if this is not a next page operation, we're being called for the first time, so can clear results
                if (!options || (options && !options.recursive)) allResults = [];

                Socket.emit(channel, data);
                try {
                    var mt;
                    if (channel.startsWith('API')) {
                        mt = await apiWaitforMtSMS();
                    } else {
                        mt = await waitforMtSMS();
                    }
                    var response = new MtText(mt);
                    allResults.push(mt);

                    if (options && options.all &&
                        response.isChunkedPage() && 
                        response.pages.currentPage < response.pages.numPages) {

                        var moreCommand = response.getMoreButton() || 'more';
                        mt = await self.get(moreCommand, { method: options.method, all: true, recursive: true });
                    }

                    console.log("returning allResults:");
                    console.log(allResults);
                    if (allResults.length == 1) {
                        return allResults[0];
                    } else if (allResults.length == 0) {
                        return undefined;
                    } else {
                        return allResults;
                    }
                } catch (error) {
                    allResults = [];
                    throw error;
                }
            },
            receivedMt: function (text) {
                // if we weren't expecting a message, then add to inbox
                if (messagePending) {
                    console.log("*** received unexpected message **");
                    messagePending = false;

                    DataModel.addMessage(text);
                }
                console.log("receivedMt cancelling timer : " + text);
                $timeout.cancel(timer);
                //   stopInterval();
                mtResponse = text;
            },
            apiReceivedMt: function (text) {
                console.log("apiReceivedMt cancelling timer : " + text);
                $timeout.cancel(apiTimer);
                //   stopInterval();
                apiMtResponse = text;
            }
        }
    }
]);
