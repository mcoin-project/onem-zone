ONEmSimModule.constant('Services', 
    [
        { name: ['onem'], icon: 'home', template: 'cards' },
        { name: ['account'], icon: 'settings', template: 'cards' },
        { name: ['subscribe'], icon: 'note_add', template: 'cards' },
        { name: ['market'], icon: 'shopping_cart', template: 'cards', default: true },
        { name: ['msg'], icon: 'message', template: 'cards' },
        { name: ['xgroup'], icon: 'group_work', template: 'cards' },
        { name: ['post'], icon: 'comment', template: 'cards' },
        { name: ['wiki'], icon: 'import_contacts', template: 'cards' },
        { name: ['france24'], icon: 'list', template: 'cards' },
        { name: ['aljazeera'], icon: 'format_align_left', template: 'cards' },
        { name: ['contacts'], icon: 'supervisor_account', template: 'cards' },
        { name: ['reuters'], icon: 'description', template: 'cards' },
        { name: ['unsubscribe'], icon: 'delete', template: 'cards' }
    ]
);


ONEmSimModule.factory('Cache', [
    'Socket',
    '$timeout',
    '$interval',
    'Services',
    function (Socket, $timeout, $interval, Services) {
        
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

            //      debugger;
            if (!mtText) return -1;

            var matches = mtText.match(/(^([A-Z])[ ].*\n+)/gm);
            var results = [];
            console.log("matches");
            console.log(matches);
            if (matches && matches.length > 0) {
                matches.filter(function (s) {
                    var r = s.split(' #');
                    results.push(r[1].trim().toLowerCase());
                });
                console.log("results");
                console.log(results);

                for (var i = 0; i < Services.length; i++) {
                    for (var j = 0; j < results.length; j++) {
                        console.log("services[i].name");
                        console.log(Services[i].name);
                        if (Services[i].name.includes(results[j])) {
                            var s = Services[i];
                            var ind = Services[i].name.indexOf(results[j]);
                            console.log("ind:"+ind);
                            s.name = Services[i].name[ind];
                            console.log("s.name:"+s.name);

                            activeServices.push(s);
                        }
                    }
                }
            }
            console.log("activeServices");
            console.log(activeServices);
            return activeServices;
        }

        var processService = function (mtText) {

            if (!mtText) return -1;
            var options = [];

            var lines = mtText.split('\n');
            var header = lines[0];
            var footer = lines[lines.length - 1];
            var optionsDescLetters = mtText.match(/(?<=^[A-Z][ ])(.*\n+)/gm);
            var optionsDescNumbers = [];
            var optionNumbersRegex = /^(\s+?\d+)(\s.+)/gm;
            var optionLetters = mtText.match(/^([A-Z] )/gm);
            var optionNumbers = mtText.match(/^((\s+)?[0-9]+ )/gm);
            var buttons = lines[lines.length - 1].match(/\b[A-Z]+[A-Z]+\b/gm) || null;
            var type;
            var currentPage, numPages = 0;
            var pages = [];
            var breadcrumbs = [];
            var no;
            var pagesText = mtText.match(/^(\.\.).+/gm);

            if (!optionsDescLetters) optionsDesc = [];
            if (!optionLetters) optionLetters = [];
            if (!optionNumbers) optionNumbers = [];

            for (var i=0; i< optionNumbers.length; i++) {
                optionNumbers[i] = optionNumbers[i].trim();
            }

            while ((no = optionNumbersRegex.exec(mtText)) !== null) {
                optionsDescNumbers.push(no[2].trim());
            }

            if (optionLetters.length > 0) {
                for (var i = 0; i < optionLetters.length && i < optionsDescLetters.length; i++) {
                    var o = {
                        desc: optionsDescLetters[i],
                        option: optionLetters[i]
                    };
                    options.push(o);
                }
            } else if (optionNumbers.length > 0) {
                for (var i = 0; i < optionNumbers.length && i < optionsDescNumbers.length; i++) {
                    var o = {
                        desc: optionsDescNumbers[i],
                        option: optionNumbers[i]
                    };
                    options.push(o);
                }             
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

            console.log("optionLetters");
            console.log(optionLetters);
            console.log("optionNumbers");
            console.log(optionNumbers);
            console.log("optionDescLetters");
            console.log(optionsDescLetters);
            console.log("optionDescNumbers");
            console.log(optionsDescNumbers);

            if ((optionLetters.length == 0 || optionsDescLetters.length == 0) && 
                (optionNumbers.length == 0 || optionsDescNumbers.length == 0)) {
                options = lines;
                type = "input"
                if (header) options.shift(); // remove header only if it's present
                options.pop(); // remove footer
                if (options.length > 1 && options[options.length-1].startsWith('..')) options.pop(); // remove pagination footer if present
            } else {
                type = "menu"
            }

            if (!buttons) buttons = [];

            if (pagesText && pagesText[0] && pagesText[0].length > 0) {
                var p = pagesText[0].split('/');
                if (p.length > 1) {
                    currentPage = parseInt(p[0].slice(2));
                    numPages = parseInt(p[1]);
                    for (var i = 1; i <= numPages; i++) {
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

                checkMt = $interval(function () {
                    console.log("checking:" + mtResponse);
                    if (mtResponse) {
                        var result = mtResponse;
                        mtResponse = undefined;
                        $timeout.cancel(timer);
                        stopInterval();
                        console.log("got sms");
                        console.log(result);
         //               debugger;

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
                var result;
                for (var i = 0; i < Services.length; i++) {
                    if (Services[i].default) {
                        result = Services[i];
                        break;
                    }
                }
                return result;
            },
            getServices: async function () {

                Socket.emit('API MO SMS', '#');
                try {
                    var mt = await waitforMtSMS();
                    return processServicesList(mt);
                } catch (error) {
                    return new Error (error);
                }
            },
            getService: async function (service) {

                Socket.emit('API MO SMS', '#' + service);
                console.log("emitting:" + '#' + service);

                try {
                    var mt = await waitforMtSMS();
                    return processService(mt);
                } catch (error) {
                    return new Error (error);
                }
            },
            selectOption: async function (inputText) {

                Socket.emit('API MO SMS', inputText);
                console.log("emitting:" + inputText);
                try {
                    var mt = await waitforMtSMS();
                    return processService(mt);
                } catch (error) {
                    return new Error (error);
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
