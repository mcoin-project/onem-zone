
ONEmSimModule.factory('Cache', [
    'Socket',
    '$timeout',
    '$interval',
    function (Socket, $timeout, $interval) {

    const SMS_TIMEOUT = 10000;

	const services = [
            { name: ['account'], icon:'3d_rotation', template: 'cards' },
            { name: ['aljazeera'], icon:'accessibility', template: 'cards' },
            { name: ['contacts'], icon:'account_circle', template: 'cards' },
            { name: ['france24'], icon:'alarm', template: 'cards' },
            { name: ['market'], icon:'all_out', template: 'cards' },
            { name: ['msg'], icon:'build', template: 'cards' },
            { name: ['onem'], icon:'done', template: 'cards' },
            { name: ['reuters'], icon:'favorite', template: 'cards' },
            { name: ['subscribe'], icon:'find_replace', template: 'cards' },
            { name: ['xgroup'], icon:'feedback', template: 'cards' },
            { name: ['unsubscribe'], icon:'help_outline', template: 'cards' }
	];
	/*
        var services = [
            { name: 'account', template: 'cards' },
            { name: 'aljazeera', template: 'cards' },
            { name: 'contacts', template: 'cards' },
            { name: 'france24', template: 'cards' },
            { name: 'market', template: 'cards' },
            { name: 'msg', template: 'cards' },
            { name: 'onem', template: 'cards' },
            { name: 'reuters', template: 'cards' },
            { name: 'subscribe', template: 'cards' },
            { name: 'xgroup', template: 'cards' },
            { name: 'unsubscribe', template: 'cards' }
        ]; */

        var activeServices = [];
        var savedScope;
        var mtResponse;

        processServices = function (mtText) {

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

        waitforMtSMS = function() {
            return new Promise(function (resolve, reject) {

                var checkMt, timer;;

                function stopInterval(){
                    $interval.cancel(checkMt);
                    checkMt = undefined;
                };

                checkMt = $interval(function() {
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


            // taking scope as a param is a hack
            getServices: async function (scope) {

                //return new Promise(function (resolve, reject) {

                    savedScope = scope;

                    savedScope.$on('socket:API MT SMS', function (ev, data) {
                        $timeout.cancel(timer);
                        console.log("getService: received MT");
                        console.log(data);
                        mtResponse = data.mtText;
                        //resolve(data.mtText);
                    });

                    // scope.$on('socket:API MT SMS', function (ev, data) {
                    //     $timeout.cancel(timer);
                    //     console.log("getServices: received MT");
                    //     console.log(data);
                    //     var results = processServices(data.mtText);
                    //     console.log(results);
                    //     resolve(results);
                    // });
                    Socket.emit('API MO SMS', '#');
                    var mt = await waitforMtSMS();
                    return processServices(mt);
                //});
            },
            getService: async function (service) {

                    Socket.emit('API MO SMS', '#'+service);
                    console.log("emitting:"+ '#'+service);
                    return await waitforMtSMS();
                    // var timer = $timeout(
                    //     function () {
                    //         reject("no response to MO SMS");
                    //     }, SMS_TIMEOUT // run 10s timer to wait for response from server
                    // );
                //});
            }
        }
    }
]);
