
ONEmSimModule.factory('Cache', [
    'Socket',
    '$timeout',
    '$interval',
    function (Socket, $timeout, $interval) {

        const SMS_TIMEOUT = 10000;

        const services = [
            { name: ['account'], icon: 'settings', template: 'cards' },
            { name: ['aljazeera'], icon: 'format_align_left', template: 'cards' },
            { name: ['contacts'], icon: 'supervisor_account', template: 'cards' },
            { name: ['france24'], icon: 'list', template: 'cards' },
            { name: ['market'], icon: 'shopping_cart', template: 'cards', default: true },
            { name: ['msg'], icon: 'message', template: 'cards' },
            { name: ['onem'], icon: 'home', template: 'cards' },
            { name: ['reuters'], icon: 'description', template: 'cards' },
            { name: ['subscribe'], icon: 'note_add', template: 'cards' },
            { name: ['xgroup'], icon: 'group_work', template: 'cards' },
            { name: ['unsubscribe'], icon: 'delete', template: 'cards' }
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
            var breadcrumbs = [];

            if (!optionsDesc) optionsDesc = [];
            if (!optionLetters) optionLetters = [];

            for (var i=0; i < optionLetters.length && i < optionsDesc.length; i++) {
                var o = {
                    desc: optionsDesc[i],
                    option: optionLetters[i]
                };
                options.push(o);
            }

            if (footer && footer.startsWith('--')) footer = footer.slice(2) // remove -- from footer

            // make breadcrumb contain words after the first word
            if (header.startsWith('#')) {
                var words = header.match(/\S+\s*/gm);
                if (words && words.length > 0) {
                    breadcrumbs.push(words[0].toUpperCase().trim());
                    var rest = "";
                    for (var i = 1; i < words.length; i++) {
                        rest += words[i];
                    }
                    breadcrumbs.push(rest.toUpperCase().trim());
                }
            } else {
                header = undefined;
            } 


            if (optionLetters.length == 0 || optionsDesc.length == 0) {
                options = lines;
                type = "input"
                if (header) options.shift(); // remove header only if it's present
                options.pop(); // remove footer
            } else {
                type = "menu"
            }

            if (!buttons) buttons = [];

            if (lines.length > 1 && lines[lines.length-2].startsWith("..")) {
                var p = lines[lines.length-2].split('/');
                if (p.length > 1) {
                    currentPage = parseInt(p[0].slice(2));
                    numPages = parseInt(p[1]);
                    for (var i=1; i <= numPages; i++) {
                        pages.push(i);
                    }
                }
            }

            console.log("breadcrumbs");
            console.log(breadcrumbs);

            return {
                header: header,
                footer: footer,
                options: options,
                buttons: buttons,
                type: type,
                pages: pages,
                numPages: numPages,
                currentPage: currentPage,
                breadcrumbs: breadcrumbs
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

            getLandingService: function() {
                var result;
                for (var i=0; i< services.length; i++) {
                    if (services[i].default) {
                        result = services[i];
                        break;
                    }
                }
                return result;
            },
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
