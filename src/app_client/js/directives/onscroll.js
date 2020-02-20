
ONEmSimModule.directive('onScroll', ['$timeout', function($timeout) {
    return {
        restrict: 'A',
        link: function (scope, element, attr, controller) {
    
            element.on('scroll', function() {
                if (element[0].scrollHeight - element[0].scrollTop === element[0].clientHeight) {
                    scope[attr.atBottom] = true
                } else {
                    scope[attr.atBottom] = false 
                }
                scope.$apply();
            });
        }
      }
}]);
