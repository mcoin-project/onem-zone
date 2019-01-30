
ONEmSimModule.directive('closeKeyboard', ['screenSize',
function(screenSize) {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {

            element.bind('keyup', function(event) {

                if (!screenSize.is('xs')) return;

                if (event.keyCode === 13) {
                    console.log("13 event");
                    /* To dismiss onscreen keyboard */
                    // In some cases, focus was needed before blur to dismiss onscreen keyboard
                    //textFields[0].focus();
                    //textFields[0].blur();
                    element[0].blur();
    
                    /* To ensure status messages are visible on small screens */
                    //$window.scrollTo(0, 0);
                    //return false;
                }
            });
        }
    }
}
]);
