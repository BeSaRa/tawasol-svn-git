module.exports = function (app) {
    app.factory('DynamicMenuItem', function (CMSModelInterceptor,
                                             tokenService,
                                             _,
                                             rootEntity,
                                             employeeService,
                                             helper,
                                             $timeout,
                                             lookupService,
                                             langService,
                                             $q) {
        'ngInject';
        return function DynamicMenuItem(model) {
            var self = this, dynamicMenuItemService;
            self.id = null;
            self.arName = null;
            self.enName = null;
            self.parent = null;
            self.url = '#';
            self.urlParams = '';
            self.status = true;
            self.isGlobal = true;
            self.itemOrder = null;
            self.menuType = 1;

            self.parentInfo = null;
            self.childCount = null;

            self.children = [];
            self.parsedURLParams = {};
            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [
                'arName',
                'enName',
                'menuType'
            ];

            if (model)
                angular.extend(this, model);

            /**
             * get all required fields
             * @return {Array|requiredFields}
             */
            DynamicMenuItem.prototype.getRequiredFields = function () {
                return requiredFields;
            };
            /**
             * @description Get the concatenated arabic name and english name with separator passed for Distribution Workflow Application User. If no separator is passed, it will take hyphen(-)
             * @param separator
             * @returns {string}
             */
            DynamicMenuItem.prototype.getNames = function (separator) {
                return this.arName + ' ' + (separator ? separator : '-') + ' ' + this.enName;
            };

            DynamicMenuItem.prototype.setId = function (id) {
                this.id = id;
                return this;
            };
            DynamicMenuItem.prototype.setArName = function (arName) {
                this.arName = arName;
                return this;
            };
            DynamicMenuItem.prototype.setEnName = function (enName) {
                this.enName = enName;
                return this;
            };
            DynamicMenuItem.prototype.setParent = function (parent) {
                this.parent = parent;
                return this;
            };
            DynamicMenuItem.prototype.setUrlParams = function (urlParams) {
                this.urlParams = urlParams;
                return this;
            };
            DynamicMenuItem.prototype.setStatus = function (status) {
                this.status = status;
                return this;
            };
            DynamicMenuItem.prototype.setIsGlobal = function (isGlobal) {
                this.isGlobal = isGlobal;
                return this;
            };
            DynamicMenuItem.prototype.setItemOrder = function (itemOrder) {
                this.itemOrder = itemOrder;
                return this;
            };
            DynamicMenuItem.prototype.setMenuType = function (menuType) {
                this.menuType = menuType;
                return this;
            };
            DynamicMenuItem.prototype.setParentInfo = function (parentInfo) {
                this.parentInfo = parentInfo;
                return this;
            };
            DynamicMenuItem.prototype.setChildCount = function (childCount) {
                this.childCount = childCount;
                return this;
            };
            /**
             * @description Get the status of Ready To Export Outgoing as Active or Inactive instead of true or false.
             * @returns {string}
             */
            DynamicMenuItem.prototype.getTranslatedStatus = function () {
                return this.status ? langService.get('active') : langService.get('inactive');
            };
            /**
             * @description Get the globalization of sms template as Yes or No instead of true or false.
             * @returns {string}
             */
            DynamicMenuItem.prototype.getTranslatedGlobal = function () {
                return this.isGlobal ? langService.get('yes') : langService.get('no');
            };
            DynamicMenuItem.prototype.loadSubDynamicMenuItems = function () {
                var self = this;
                return dynamicMenuItemService
                    .loadSubDynamicMenuItems(this)
                    .then(function (result) {
                        self.children = result;
                        self.childCount = result.length;
                        return self.children;
                    });
            };

            DynamicMenuItem.prototype.setDynamicMenuItemService = function (service) {
                dynamicMenuItemService = service;
                return this;
            };

            DynamicMenuItem.prototype.parseURLParams = function () {
                var self = this;
                if (typeof self.urlParams !== 'string')
                    self.urlParams = '';

                var urlParamsArray = self.urlParams.split('|');

                _.map(urlParamsArray, function (param) {
                    if (param.length) {
                        param = param.split(':');
                        self.parsedURLParams[param[0]] = lookupService.getLookupByLookupKey(lookupService.menuItemParam, Number(param[1]));
                    }
                })
            };

            DynamicMenuItem.prototype.scanURLVariables = function () {
                if (typeof this.url !== 'string')
                    this.url = '';
                return this.url.match(/{(\w+)}/g);
            };

            DynamicMenuItem.prototype.mapSend = function () {
                var self = this, variables = self.scanURLVariables();

                if (angular.isArray(variables)) {
                    _.map(variables, function (value, index) {
                        variables[index] = value + ':' + self.parsedURLParams[value].lookupKey;
                    });
                    self.urlParams = variables.join('|');
                }

                delete self.children;
                delete self.parsedURLParams;
            };

            DynamicMenuItem.prototype.mapReceived = function () {
                var self = this;
                !self.hasOwnProperty('children') ? self.children = [] : null;
                !self.hasOwnProperty('parsedURLParams') ? self.children = {} : null;
                self.parseURLParams();
            };

            DynamicMenuItem.prototype.allHasValue = function () {
                return !_.some(this.parsedURLParams, function (item) {
                    return item == null;
                });
            };

            DynamicMenuItem.prototype.verifyVariablesStatus = function () {
                var self = this, variables = self.scanURLVariables(), lookups = Object.keys(self.parsedURLParams),
                    returnedValue = false;
                if (variables && variables.length === lookups.length && self.allHasValue()) {
                    returnedValue = true
                } else if (!variables) {
                    self.parsedURLParams = {};
                    returnedValue = true
                }
                return returnedValue;
            };

            DynamicMenuItem.prototype.removeUnusedParsedURLParams = function () {
                var self = this, variables = self.scanURLVariables(),
                    parsedVariables = Object.keys(self.parsedURLParams);
                if (variables && variables.length < parsedVariables.length) {
                    _.map(parsedVariables, function (variable) {
                        variables.indexOf(variable) === -1 ? self.removeParsedVariable(variable) : null;
                    })
                }
            };

            DynamicMenuItem.prototype.removeParsedVariable = function (variableName) {
                delete this.parsedURLParams[variableName];
            };

            DynamicMenuItem.prototype.scanURLVariablesCatchDuplicate = function () {
                var self = this, defer = $q.defer(), variables = self.scanURLVariables(),
                    duplicate = helper.findDuplicateInArray(variables || []);
                $timeout(function () {
                    duplicate.length ? defer.reject(duplicate) : defer.resolve(variables);
                });
                return defer.promise;
            };

            DynamicMenuItem.prototype.generateLangKey = function () {
                var key = 'menu_item_dynamic_' + this.id;
                langService.insertRunTimeLangKey(key, this.arName, this.enName);
                return key;
            };
            DynamicMenuItem.prototype.getDynamicMenuIcon = function () {
                var icon = null;
                switch (this.menuType) {
                    case 0 :
                        icon = 'archive';
                        break;
                    case 1 :
                        icon = 'file-chart';
                        break;
                    default:
                        icon = 'menu';
                        break;
                }
                return icon;
            };

            DynamicMenuItem.prototype.getMenuType = function () {
                var type = null;
                switch (this.menuType) {
                    case 0 :
                        type = 'icn';
                        break;
                    case 1 :
                        type = 'reports';
                        break;
                    default:
                        type = 'others';
                        break;
                }
                return type;
            };

            DynamicMenuItem.prototype.isTypeEqual = function (typeName) {
                return this.getMenuType() === typeName.toLowerCase();
            };

            DynamicMenuItem.prototype.generateState = function () {
                var state = 'app';
                switch (this.getMenuType()) {
                    case 'reports' :
                        state += '.reports';
                        break;
                    case 'icn':
                        state += '.icn';
                        break;
                    case 'others':
                        state += '.others';
                        break;
                }
                return state;
            };

            DynamicMenuItem.prototype.getReplacement = function (lookup) {
                switch (lookup.lookupStrKey) {
                    case 'TOKEN':
                        return tokenService.getToken();
                    case 'OUID':
                        return employeeService.getEmployee().getOUID();
                    case 'USER_ID':
                        return employeeService.getEmployee().id;
                    case 'RANDOM':
                        return Math.random();
                    case 'USER_DOMAIN_NAME':
                        return employeeService.getEmployee().domainName;
                    case 'ROOT_ENTITY_IDENTIFIER':
                        return rootEntity.returnRootEntity().id;
                    case 'LANGUAGE_CODE':
                        return langService.current;
                    case 'ROOT_ENTITY_NAME':
                        return rootEntity.returnRootEntity().identifier;
                }
            };

            DynamicMenuItem.prototype.getMenuUrlAfterReplacement = function () {
                var self = this, url = self.url, variables = self.scanURLVariables();
                if (variables && variables.length) {
                    _.map(variables, function (item) {
                        url = url.replace(item, self.getReplacement(self.parsedURLParams[item]));
                    });
                    console.log("URL AFTER REPLACE", url);
                    return url;
                } else {
                    return self.url;
                }
            };

            DynamicMenuItem.prototype.getTranslatedName = function (reverse) {
                return langService.current === 'ar' ? (reverse ? this.enName : this.arName) : (reverse ? this.arName : this.enName);
            };

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('DynamicMenuItem', 'init', this);
        }
    })
};
