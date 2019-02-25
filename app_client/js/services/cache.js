
ONEmSimModule.factory('Cache', [
    'Socket',
    '$timeout',
    '$interval',
    'Services',
    'MtText',
    'DataModel',
    function (Socket, $timeout, $interval, Services, MtText, DataModel) {

        var services;
        var mtResponse;
        var initialized = false;
        const SMS_TIMEOUT = 10000;

        var timer;
        var checkMt;

        var stopInterval = function () {
            $interval.cancel(checkMt);
            checkMt = undefined;
        };

        var getOption = function(text) {
            var optionsDescLetterRegEx = /^([A-Z]) ([A-Z#a-z].+)/gm;
            var optionNumbersRegex = /^(\d+) ([A-Z#a-z].+)/gm;
            var sectionNumbersRegex = /^\d+[\.\d]+ ([A-Z#a-z].+)/gm;
            var result;
            if (!text) return undefined;
    
            text = text.trim();

            var no = optionNumbersRegex.exec(text);
            var no1 = optionsDescLetterRegEx.exec(text);
            var no2 = sectionNumbersRegex.exec(text);
    
            if (no && no[2] && no[2].split(' ').length <= 5) {
                //var option = no[1].trim();
                var desc = no[2].trim();
                result = desc;
            } else if (no1 && no1[2] && no1[2].split(' ').length <= 5) {
                //var option = no1[1].trim();
                var desc = no1[2].trim();
                result = desc;
            } else if (no2 && no2[1] && no2[1].split(' ').length <= 5) {
                //var option = no2[0].trim();
                var desc = no2[1].trim();
                result = desc;
            }
            return result;
            
        }

        var processServicesList = function (mtText) {

            var activeServices = [];

            if (!mtText) return -1;

            var results = [];

            var lines = mtText.split('\n');
            console.log("lines");
            console.log(lines);

            if (lines && lines.length > 0) {
                lines.filter(function (s) {
                    var r = getOption(s);
                    if (r) {
                        results.push(r.slice(1).toLowerCase());
                    }
                });
                console.log("results");
                console.log(results);

                services = new Services(results);
                activeServices = services.generateMenuItems();

            }
            console.log("activeServices");
            console.log(activeServices);
            if (activeServices.length > 0) {
                initialized = true;
            }
            return activeServices;
        }

        var processService = function (mtText) {

            if (!mtText)  throw "missing mtText";

            var result = new MtText(mtText);
            var type = !result.hideInput() ? "input" : "menu";

            console.log({
                header: result.header,
                footer: result.footer,
                preBody : result.preBody,
                body: result.body,
                buttons: result.buttons,
                type: type,
                pages: result.pages.numPages,
                currentPage: result.pages.currentPage,
                breadcrumbs: result.breadcrumbs
            });

            return {
                header: result.header,
                footer: result.footer,
                preBody : result.preBody,
                body: result.body,
                buttons: result.buttons,
                type: type,
                pages: result.pages.numPages,
                currentPage: result.pages.currentPage,
                breadcrumbs: result.breadcrumbs
            };
        }

        var waitforMtSMS = function () {
            return new Promise(function (resolve, reject) {

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
                        reject("no response to MO SMS");
                    }, SMS_TIMEOUT // run 10s timer to wait for response from server
                );
            });
        }

        return {

            mtResponse: mtResponse,

            reset: function() {
                if (checkMt) stopInterval();
                if (timer) $timeout.cancel(timer);
                initialized = false;
                activeServices = [];
                mtResponse = undefined;
                return true;
            },
            isInitialized: function() {
                return initialized;
            },
            getGoCommand: function() {
                if (services) {
                    return services.getGoCommand();
                } else {
                    return 'go';
                }
            },
            getLandingService: function () {
                if (services) {
                    return services.getLandingService();
                } else {
                    return false;
                }
            },
            getServices: async function () {

                Socket.emit('API MO SMS', '#');
                try {
                    var mt = await waitforMtSMS();
                    return processServicesList(mt);
                } catch (error) {
                    throw error;
                }
            },
            getService: async function (service) {

                var inputObj = {
                    type: "mo",
                    value: '#' + service
                };
                DataModel.addResult(inputObj);

                Socket.emit('MO SMS', '#' + service);
                console.log("emitting:" + '#' + service);

                try {
                    var mt = await waitforMtSMS();
                    return processService(mt);
                } catch (error) {
                    throw error;
                }
            },
            selectOption: async function (inputText) {

                var inputObj = {
                    type: "mo",
                    value: inputText
                };
                DataModel.addResult(inputObj);
                Socket.emit('MO SMS', inputText);
                console.log("emitting:" + inputText);
                try {
                    var mt = await waitforMtSMS();
                    return processService(mt);
                } catch (error) {
                    throw error;
                }
            },
            receivedMt: function (text) {
                console.log("cancelling timer : " + text);
                $timeout.cancel(timer);
                //   stopInterval();
                mtResponse = text;
            }
        }
    }
]);
