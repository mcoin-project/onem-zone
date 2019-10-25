ONEmSimModule.factory('Wallet', [
    '$resource',
    function ($resource) {
        return $resource('/api/wallet', {}, {
            getAccounts: {
                method: 'GET',
                url: 'api/wallet/getAccounts',
                isArray: false
            },
            topUp: {
                method: 'POST',
                url: 'api/wallet/topUp',
                isArray: false
            }
        });
    }
]);
