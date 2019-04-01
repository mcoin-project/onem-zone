ONEmSimModule.controller('walletController', [
    '$scope',
    'Wallet',
    'toastr',
    'ngDialog',
    function ($scope, Wallet, toastr, ngDialog) {

        $scope.accounts = [];

        Wallet.getAccounts().$promise.then(function(response) {
            console.log("got result:");
            console.log(response);
            $scope.accounts = response.accounts;
        }).catch(function(error) {
            toastr.error("Could not retrieve wallets"); 
        });

        $scope.topUp = function (index) {
            $scope.selectedAccount = index;
            ngDialog.open({
                template: 'partials/modals/modal-top-up.html',
                className: 'ngdialog-theme-default',
                controller: 'modalTopUpController',
                scope: $scope,
                showClose: true
            });
        };
    }
]);
