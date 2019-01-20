ONEmSimModule.directive('closeKeyboard', [
    '$window',
    function ($window) {
        return function (scope, element, attr) {

            var textFields = element.find('input');
            element.bind('submit', function () {

                /* To dismiss onscreen keyboard */
                // In some cases, focus was needed before blur to dismiss onscreen keyboard
                textFields[0].focus();
                textFields[0].blur();

                /* To ensure status messages are visible on small screens */
                $window.scrollTo(0, 0);
            });
        }
    }
]);


