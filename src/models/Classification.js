module.exports = function (app) {
    app.factory('Classification', function (CMSModelInterceptor,
                                            OUClassification,
                                            $q,
                                            langService,
                                            _) {
        'ngInject';
        return function Classification(model) {
            var self = this, ouClassificationService, organizationService, classificationService;
            self.arName = null;
            self.enName = null;
            self.isGlobal = true;
            self.groupPrefix = null;
            self.id = null;
            self.parent = null;
            self.childCount = 0;
            self.relatedOus = []; // null
            self.securityLevels = null;
            self.status = true;
            self.children = [];


            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [
                'arName',
                'enName',
                'isGlobal',
                'securityLevels',
                'status'
            ];

            if (model)
                angular.extend(self, model);

            /**
             * get all required fields
             * @return {Array|requiredFields}
             */
            Classification.prototype.getRequiredFields = function () {
                return requiredFields;
            };
            /**
             * @description Get the isGlobalization of classification as Yes or No instead of true or false.
             * @returns {string}
             */
            Classification.prototype.getTranslatedGlobal = function () {
                return this.isGlobal ? langService.get('global') : langService.get('not_global');
            };
            /**
             * @description Get the status of classification as active  or inactive instead of true or false.
             * @returns {string}
             */
            Classification.prototype.getTranslatedStatus = function () {
                return this.status ? langService.get('active') : langService.get('inactive');
            };

            Classification.prototype.getNames = function (separator) {
                return this.arName + ' ' + (separator ? separator : '-') + ' ' + this.enName;
            };

            Classification.prototype.getSecurityLevels = function (separator) {
                var lang = langService.current.charAt(0).toUpperCase() + langService.current.substr(1);
                return _.map(this.securityLevels, ('default' + lang + 'Name')).join(separator || ',  ');
            };

            Classification.prototype.getTranslatedName = function (reverse) {
                return langService.current === 'ar' ? (reverse ? this.enName : this.arName) : (reverse ? this.arName : this.enName);
            };
            /**
             * @description Get the name of record with passed language name
             * @param language
             * @returns {string}
             */
            Classification.prototype.getNameByLanguage = function (language) {
                return this[language + 'Name'];
            };
            Classification.prototype.appendChild = function (classification) {
                this.children.push(classification);
                return this;
            };
            Classification.prototype.setChildren = function (classifications) {
                this.children = classifications;
                return this;
            };
            Classification.prototype.hasChildren = function () {
                // return this.children.length;
                return this.childCount > 0;
            };

            Classification.prototype.cannotSave = function () {
                return !this.isGlobal && !this.relatedOus.length;
            };

            Classification.prototype.hasOrganizations = function () {
                return this.relatedOus.length;
            };
            Classification.prototype.setIsGlobal = function (status) {
                this.isGlobal = status;
                return this;
            };
            Classification.prototype.getRelatedOus = function () {
                return this.relatedOus;
            };

            Classification.prototype.setRelatedOus = function (relatedOus) {
                this.relatedOus = relatedOus;
                return this;
            };

            Classification.prototype.setOUClassificationService = function (service) {
                ouClassificationService = service;
                return this;
            };

            Classification.prototype.setOrganizationService = function (service) {
                organizationService = service;
                return this;
            };
            Classification.prototype.setClassificationService = function (service) {
                classificationService = service;
                return this;
            };

            Classification.prototype.deleteAllOUClassifications = function () {
                var self = this;
                return ouClassificationService
                    .deleteBulkOUClassifications(this.getRelatedOus())
                    .then(function () {
                        self.setRelatedOus([]);
                        self.isGlobal = true;
                        return self;
                    });
            };

            Classification.prototype.addToOUClassifications = function (organization) {
                var self = this;
                return ouClassificationService
                    .addOUClassification((new OUClassification()).setOuId(organization).setClassification(this))
                    .then(function (ouClassification) {
                        self.relatedOus.push(ouClassification);
                        return ouClassification;
                    });
            };
            Classification.prototype.addBulkToOUClassifications = function (organizations) {
                var self = this;
                return ouClassificationService
                    .createListOUClassifications(organizations, self, true)
                    .then(function (ouClassifications) {
                        return self.relatedOus = self.relatedOus.concat(ouClassifications);
                    })
            };

            Classification.prototype.deleteBulkFromOUClassifications = function (ouClassifications) {
                var self = this;
                return ouClassificationService
                    .deleteBulkOUClassifications(ouClassifications)
                    .then(function () {
                        var ids = _.map(ouClassifications, 'id');
                        return self.relatedOus = _.filter(self.relatedOus, function (ouClassification) {
                            return ids.indexOf(ouClassification.id) === -1;
                        });
                    });
            };

            Classification.prototype.openDialogToSelectOrganizations = function () {
                var self = this;
                return organizationService
                    .controllerMethod
                    .selectOrganizations('select_organization')
                    .then(function (organizations) {
                        return self.addBulkToOUClassifications(organizations);
                    });
            };

            Classification.prototype.repairGlobalStatus = function () {
                var self = this;
                if (self.hasOrganizations() && self.isGlobal)
                    self.setIsGlobal(false);
                else if (!self.hasOrganizations() && !self.isGlobal)
                    self.setIsGlobal(true);

                return classificationService.updateClassification(self);
            };

            Classification.prototype.updateStatus = function () {
                var methods = ['activateClassification', 'deactivateClassification'];
                if (arguments.length)
                    this.status = arguments[0];

                var method = this.status ? methods[0] : methods[1];
                return classificationService[method](this);
            };

            Classification.prototype.save = function () {
                if (this.id) {
                    return classificationService.updateClassification(this);
                    //return this.update();
                }
                return classificationService.addClassification(this);
            };

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('Classification', 'init', this);
        }
    })
};
