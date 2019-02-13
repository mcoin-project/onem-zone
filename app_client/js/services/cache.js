
ONEmSimModule.factory('Cache', [
    'Socket',
    '$timeout',
    '$interval',
    function (Socket, $timeout, $interval) {

        const SMS_TIMEOUT = 10000;

        const services = [
            { name: ['account'], icon: '3d_rotation', template: 'cards' },
            { name: ['aljazeera'], icon: 'accessibility', template: 'cards' },
            { name: ['contacts'], icon: 'account_circle', template: 'cards' },
            { name: ['france24'], icon: 'alarm', template: 'cards' },
            { name: ['market'], icon: 'all_out', template: 'cards' },
            { name: ['msg'], icon: 'build', template: 'cards' },
            { name: ['onem'], icon: 'done', template: 'cards' },
            { name: ['reuters'], icon: 'favorite', template: 'cards' },
            { name: ['subscribe'], icon: 'find_replace', template: 'cards' },
            { name: ['xgroup'], icon: 'feedback', template: 'cards' },
            { name: ['unsubscribe'], icon: 'help_outline', template: 'cards' }
        ];

        var activeServices = [];
        var mtResponse;
        var timer;

        var processServicesList = function (mtText) {

            if (!mtText) return -1;

            var matches = mtText.match(/(^([A-Z])[ ].*\n+)/gm);
            var results = [];
            if (matches.length > 0) {
                matches.filter(function (s) {
                    var r = s.split(' #');
                    results.push(r[1].trim().toLowerCase());
                });
                for (var i = 0; i < results.length; i++) {
                    if (services[i].name.includes(results[i])) {
                        var s = services[i];
                        var ind = services[i].name.indexOf(results[i]);
                        s.name = services[i].name[ind];
                        activeServices.push(s);
                    }
                }
            } else {
                return -1;
            }
            console.log(activeServices);
            return activeServices;
        }

        var processService = function (mtText) {

            if (!mtText) return -1;
            var options = [];

            var lines = mtText.split('\n');
            var header = lines[0];
            var footer = lines[lines.length-1];
            var optionsDesc = mtText.match(/(?<=^[A-Z][ ])(.*\n+)/gm);
            var optionLetters = mtText.match(/^([A-Z] )/gm);
            var buttons = lines[lines.length-1].match(/\b[A-Z]+[A-Z]+\b/gm) || null;
            var type;
            var currentPage, numPages = 0;
            var pages = [];
            if (!optionsDesc) optionsDesc = [];
            if (!optionLetters) optionLetters = [];

            for (var i=0; i < optionLetters.length && i < optionsDesc.length; i++) {
                var o = {
                    desc: optionsDesc[i],
                    option: optionLetters[i]
                };
                options.push(o);
            }

            if (optionLetters.length == 0 || optionsDesc.length == 0) {
                options = lines;
                type = "input"
                options.shift(); // remove header
                options.pop(); // remove footer
            } else {
                type = "menu"
            }

            if (!buttons) buttons = [];

            if (lines.length > 1 && lines[lines.length-2].startsWith("..") {
                var p = lines[lines.length-2].split('/');
                if (p.length > 1) {
                    currentPage = p[0];
                    numPages = p[1];
                    for (var i=1; i <= numPages; i++) {
                        pages.push[i];
                    }
                }
            }

            return {
                header: header,
                footer: footer,
                options: options,
                buttons: buttons,
                type: type,
                pages: pages,
                numPages: numPages,
                currentPage: currentPage
            };
        }

        var waitforMtSMS = function () {
            return new Promise(function (resolve, reject) {

                var checkMt;

                function stopInterval() {
                    $interval.cancel(checkMt);
                    checkMt = undefined;
                };

                checkMt = $interval(function () {
                    if (mtResponse) {
                        var result = mtResponse;
                        mtResponse = undefined;
                        $timeout.cancel(timer);
                        stopInterval();
                        resolve(result);
                    }
                }, 100);

                timer = $timeout(
                    function () {
                        $interval.cancel(checkMt);
                        reject("no response to MO SMS");
                    }, SMS_TIMEOUT // run 10s timer to wait for response from server
                );
            });
        }

        return {

            getServices: async function () {

                Socket.emit('API MO SMS', '#');
                var mt = await waitforMtSMS();
                return processServicesList(mt);
            },
            getService: async function (service) {

                Socket.emit('API MO SMS', '#' + service);
                console.log("emitting:" + '#' + service);
                var mt = await waitforMtSMS();
                return processService(mt);
            },
            selectOption: async function (inputText) {

                Socket.emit('API MO SMS', inputText);
                console.log("emitting:" + inputText);
                var mt = await waitforMtSMS();
                return processService(mt);
            },
            receivedMt: function (text) {
                $timeout.cancel(timer);
                mtResponse = text;
            }
        }
    }
]);
