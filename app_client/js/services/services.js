
ONEmSimModule.factory('Services', [
    'ServicesConfig',
    function (ServicesConfig) {

        function Service(service) {
            this.service = service;
            this.languageIndex = 0;
        };
        
        Service.prototype.getName = function() {
            var i = this.languageIndex;
            return this.service.name[i];
        }

        Service.prototype.getIcon = function() {
            return this.service.icon;
        }

        Service.prototype.isDefault = function() {
            return this.service.default;
        }
        function Services(hashResults) {
        
            this.hashResults = hashResults;
            this.services = [];
            for (var i = 0; i < ServicesConfig.length; i++) {
                var s = new Service(ServicesConfig[i]);
                this.services.push(s);
            }
            this.languageIndex = this.detectLanguage();
            this.setLanguageIndex(this.languageIndex);
        };
        
        Services.prototype.getLandingService = function() {
            var result;
            for (var i = 0; i < this.services.length; i++) {
                if (this.services[i].isDefault()) {
                    result = this.services[i];
                    break;
                }
            }
            console.log("getLandingService:");
            console.log(result);
            return result;
        }

        Services.prototype.detectLanguage = function() {
            // grab the first service in the hashresults and see if we can find a matching index in the services config, else return default of 0
            // maybe this can be improved later
            var result = 0; // default language is 0 (usually English)
        
            if (!this.hashresults || this.hashresults.length == 0) return result;
        
            for (var i = 0; i < this.services.length; i++) {
                if (this.services[i].name.includes(this.hashresults[0])) {
                    result = i;
                    break;
                }
            }
            return result;
        }
        
        Services.prototype.getDefault = function () {
            for (var i = 0; i < this.services.length; i++) {
                if (this.services[i].default) {
                    return this.services[i];
                }
            }
            return undefined;
        };
        
        // bit ugly but looks like I need to apply this to all services.  Tried to pass parent object but caused angular circular reference errors
        Services.prototype.setLanguageIndex = function(index) {
            for (var i = 0; i < this.services.length; i++) {
                this.services[i].languageIndex = index;
            }
        };
        
        Services.prototype.getLanguageIndex = function() {
            return this.languageIndex;
        };
        
        
        Services.prototype.generateMenuItems = function() {
            var results = [];
        
            for (var i = 0; i < this.services.length; i++) {
                for (var j = 0; j < this.hashResults.length; j++) {
                    var n = this.services[i].getName();
                    if (n && n.length > 1 && n.includes(this.hashResults[j])) {
                        results.push(this.services[i]);
                        break;
                    }
                }
            }
            return results;
        };
        
        return Services;
    }
]);
