ONEmSimModule.controller('navbarController', [
    '$scope',
    '$rootScope',
    '$templateCache',
    '$auth',
    '$state',
    '$timeout',
    function ($scope, $rootScope, $templateCache, $auth, $state, $timeout) {
        $scope.isAuthenticated = function () {
            return $auth.isAuthenticated();
        }

        $scope.agree = function() {
            $state.go('logoutDelete');
        }

        // $rootScope.$watch('user', function (newVal, oldVal, scope) {

        //     console.log("newVal");
        //     console.log(newVal);

        //     console.log("oldVal");
        //     console.log(oldVal);

        //     if (JSON.stringify(newVal) == JSON.stringify(oldVal)) return;

        //     console.log("user changed:");

        //     var currentPageTemplate;
        //     if ($state.current) {
        //         //if ($state.current.templateUrl == 'partials/index.html') {
        //         //    $window.location.reload();

        //        // } else {
        //        //     currentPageTemplate = $state.current.templateUrl;
        //        //     console.log("reloading:" + currentPageTemplate);
        //        //     $templateCache.remove(currentPageTemplate);
        //          //   $state.reload();
        //        // }

        //     }
        // });
    }
]);
