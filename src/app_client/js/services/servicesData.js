
ONEmSimModule.factory('ServicesData', ['Services',
    function (Services) {

        var servicesData;

        return {
            loadServices: async function (data) {
                try {
                    servicesData = new Services(data);
                    servicesData.initialize();
                    console.log("initialised services");
                    console.log(servicesData);
                    return servicesData;
                } catch (error) {
                    console.log("/servicesData");
                    console.log(error);
                    throw error;
                }
            },

            services: function () {
                return servicesData;
            },
        }
    }
]);
