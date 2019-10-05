ONEmSimModule.controller('navbarController', [
    '$scope',
    '$rootScope',
    '$auth',
    '$state',
    'Request',
    'DataModel',
    function ($scope, $rootScope, $auth, $state, Request, DataModel) {
        $scope.isAuthenticated = function () {
            return $auth.isAuthenticated();
        }

        $scope.$state = $state;
        $scope.dropdown="My Profile";
        $scope.user = {};
        $scope.spinner = DataModel.getSpinner();
        $scope.ready = false;

        $scope.inboxCount = DataModel.getInbox().length || 0;

        $rootScope.$on('_onemUpdateInbox', function(event, result) {
            $scope.inboxCounts = DataModel.getInboxCounts();
            console.log("inboxCounts");
            console.log($scope.inboxCounts);
        });


        $rootScope.$watch('user', function(newVal, oldVal, scope) {
            console.log("rootscope watch");
            console.log(newVal);
            if (newVal) {
                if (newVal.email) $scope.user.email = newVal.email;
                if (newVal.firstName) $scope.user.firstName = newVal.firstName;
                if (newVal.lastName) $scope.user.lastName = newVal.lastName;
            }

            if ($rootScope.user) {
                console.log($scope.dropdown);
                if ($rootScope.user.firstName) {
                    $scope.dropdown = $rootScope.user.firstName;
                    console.log($scope.dropdown);
    
                    if ($rootScope.user.lastName) $scope.dropdown += ' ';
                }
                if ($rootScope.user.lastName) {
                    console.log($scope.dropdown);
    
                    $scope.dropdown += $rootScope.user.lastName;
                }
                if (!$scope.dropdown) {
                    console.log($scope.dropdown);
    
                    $scope.dropdown = $rootScope.user.email;
                }
            }
        });

        $scope.$on('error', function (ev, data) {
            console.log("[MN]: socket error:" + ev);
            console.log(ev);
            console.log(data);
        });

        $scope.$on('socket:LOGOUT', function (ev, data) {
            $state.go('logout');
        });

        $scope.$on('socket:MT SMS', function (ev, data) {
            console.log("[MN]: MT received:");
            console.log(data);
            var outputObj = {
                type: "mt",
                value: data.mtText
            };
            $scope.results = DataModel.addResult(outputObj);
            console.log("touchMode:");
            console.log($scope.touchCheckboxModel);
            Request.receivedMt(data.mtText, false);
        });

        $scope.$on('socket:API MT SMS', function (ev, data) {
            console.log("touchMode:");
            console.log($scope.touchCheckboxModel);
            Request.apiReceivedMt(data.mtText, false);
        });

        $scope.$on('socket:INBOX MT SMS', function (ev, data) {
            console.log("nav: received INBOX API MT");
            console.log(data.mtText);
            DataModel.addMessage(data.mtText);
            DataModel.addResult(data.mtText);
        });

    }
]);
