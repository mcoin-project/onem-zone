
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

        Service.prototype.getTemplate = function() {
            return this.service.template;
        }

        Service.prototype.isDefault = function() {
            return this.service.default;
        }

        Service.prototype.isCall = function() {
            return this.service.call;
        }

        function Services(hashResults) {
            this.goCommand = ServicesConfig.goCommand;
            this.hashResults = hashResults;
            this.services = [];
            for (var i = 0; i < ServicesConfig.services.length; i++) {
                var s = new Service(ServicesConfig.services[i]);
                this.services.push(s);
            }
            this.languageIndex = this.detectLanguage();
            this.language(this.languageIndex);
            console.log(this);
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

        Services.prototype.getCallService = function() {
            var result;
            for (var i = 0; i < this.services.length; i++) {
                if (this.services[i].isCall()) {
                    result = this.services[i];
                    break;
                }
            }
            console.log("getCallService:");
            console.log(result);
            return result;
        }

        Services.prototype.getGoCommand = function() {
            var i = this.languageIndex;
            return this.goCommand[i];
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

        // setter and getter depending if index param is present
        Services.prototype.language = function(index) {
            if (!index) return this.languageIndex;
            if (index < 0 || index >= this.goCommand.length) return false;
            for (var i = 0; i < this.services.length; i++) {
                this.services[i].languageIndex = index;
            }
            this.languageIndex = index;
            return true;
        };
        
        Services.prototype.generateMenuItems = function() {
            var results = [];
            for (var i = 0; i < this.services.length; i++) {
                if (this.services[i].service.always) {
                    results.push(this.services[i]);
                } else {
                    for (var j = 0; j < this.hashResults.length; j++) {
                        var n = this.services[i].getName();
                        if (n && n.length > 1 && n.includes(this.hashResults[j])) {
                            results.push(this.services[i]);
                            break;
                        }
                    }
                }
            }
            return results;
        };
        
        return Services;
    }
]);
