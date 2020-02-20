ONEmSimModule.directive('myClock', [
    '$interval',
    'dateFilter',
    function ($interval, dateFilter) {
        return {
            restrict: "A",
            transclude: true,
            scope: {
                format: "@"
            },
            link: function (scope, element, attrs) {
                var format = scope.clock || 'HH:mm:ss';

                var updateTime = function () {
                    element.text(dateFilter(new Date(), format));
                };

                //Schedule update every second:
                var timer = $interval(updateTime, 1000);

                //Listen on DOM destroy (removal) event and cancel the next UI update
                //to prevent updating time after the DOM element was removed:
                element.on('$destroy', function () {
                    $interval.cancel(timer);
                });
            }
        };
    }
]);