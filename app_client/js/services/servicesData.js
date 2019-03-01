
ONEmSimModule.factory('ServicesData', ['Services',
    function (Services) {

        var services;

        return {
            services: function (data) {
                if (typeof data == "undefined") {
                    return services;
                } else {
                    services = new Services(data);
                    return services;
                }
            },
        }
    }
]);
