ONEmSimModule.factory('User', [
    '$resource',
    function ($resource) {
        return $resource('/api', {}, {
            getMsisdn: {
                method: 'GET',
                url: 'api/user/msisdn',
                isArray: false
            },
            updateMsisdn: {
                method: 'PUT',
                url: 'api/user/msisdn',
                isArray: false
            },
            setProfile: {
                method: 'PUT',
                url: 'api/user/profile',
                isArray: false
            },
            getProfile: {
                method: 'GET',
                url: 'api/user/profile',
                isArray: false
            },
            checkMsisdn: {
                method: 'GET',
                url: 'api/user/checkMsisdn',
                isArray: false
            },
            sendToken: {
                method: 'GET',
                url: 'api/user/sendToken',
                isArray: false
            },
            verifyToken: {
                method: 'GET',
                url: 'api/user/verifyToken',
                isArray: false
            },
            deleteUser: {
                method: 'DELETE',
                url: 'api/user',
                isArray: false
            }
        });
    }
]);
