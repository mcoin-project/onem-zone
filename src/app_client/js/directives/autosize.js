ONEmSimModule.directive('autoSize', ['$timeout', function($timeout) {
    return {
        restrict: 'A',
        link: function (scope, element, attr, controller) {

            function initialize() {
                element.css({ 'height': 'auto', 'overflow-y': 'hidden' });
                $timeout(function () {
                    element.css('height', element[0].scrollHeight + 3 + 'px');
                }, 0);
            }

            // element.on('input', function () {
            //     initialize();
            // });

            scope.$watch(attr.ngModel, function() {
                    console.log("submit")
                    element.css({ 'height': 'auto', 'overflow-y': 'hidden' });
                    element.css('height', element[0].scrollHeight + 3 + 'px');
            });


        }
      }
}]);