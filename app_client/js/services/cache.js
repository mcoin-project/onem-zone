
ONEmSimModule.factory('Cache', [
    'Socket',
    '$timeout',
    '$interval',
    'Services',
    'MtText',
    function (Socket, $timeout, $interval, Services, MtText) {

        var services;
        var mtResponse;

        const SMS_TIMEOUT = 10000;

        var timer;

        var checkMt;

        var stopInterval = function () {
            $interval.cancel(checkMt);
            checkMt = undefined;
        };

        var processServicesList = function (mtText) {

            var activeServices = [];

            if (!mtText) return -1;

            var matches = mtText.match(/(^([A-Z])[ ].*\n+)/gm);
            var results = [];
            console.log("matches");
            console.log(matches);
            if (matches && matches.length > 0) {
                matches.filter(function (s) {
                    var r = s.split(' #');
                    if (r[1]) {
                        results.push(r[1].trim().toLowerCase());
                    }
                });
                console.log("results");
                console.log(results);

                services = new Services(results);
                activeServices = services.generateMenuItems();

            }
            console.log("activeServices");
            console.log(activeServices);
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

            getLandingService: function () {
                return services.getLandingService();
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

                Socket.emit('API MO SMS', '#' + service);
                console.log("emitting:" + '#' + service);

                try {
                    var mt = await waitforMtSMS();
                    return processService(mt);
                } catch (error) {
                    throw error;
                }
            },
            selectOption: async function (inputText) {

                Socket.emit('API MO SMS', inputText);
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
