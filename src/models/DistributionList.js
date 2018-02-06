module.exports = function (app) {
    app.factory('DistributionList', function (CMSModelInterceptor,
                                              langService,
                                              _,
                                              ouDistributionListService,
                                              organizationService,
                                              OUDistributionList) {
        'ngInject';
        return function DistributionList(model) {
            var self = this, distributionListService;
            self.id = null;

            self.global = true;
            self.arName = null;
            self.enName = null;
            self.status = true;
            self.distributionListMembers = [];
            self.relatedOus = null;

            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            /**
             * @description Get all required fields
             * @return {Array|requiredFields}
             */
            DistributionList.prototype.getRequiredFields = function () {
                return requiredFields;
            };

            /**
             * @description Get the concatenated arabic name and english name with separator passed for distribution list. If no separator is passed, it will take hyphen(-)
             * @param separator
             * @returns {string}
             */
            DistributionList.prototype.getNames = function (separator) {
                return this.arName + ' ' + (separator ? separator : '-') + ' ' + this.enName;
            };

            /**
             * @description Get the translated arabic or english name according to current language for distribution list. If reverse is passed, it will return the name in language other than current language
             * @param reverse
             * @returns {string}
             */
            DistributionList.prototype.getTranslatedName = function (reverse) {
                return langService.current === 'ar' ? (reverse ? this.enName : this.arName ) : (reverse ? this.arName : this.enName);
            };

            /**
             * @description Get the status of distribution list as Active or Inactive instead of true or false.
             * @returns {string}
             */
            DistributionList.prototype.getTranslatedStatus = function () {
                return this.status ? langService.get('active') : langService.get('inactive');
            };

            /**
             * @description Get the globalization of distribution list as Yes or No instead of true or false.
             * @returns {string}
             */
            DistributionList.prototype.getTranslatedGlobal = function () {
                return this.global ? langService.get('yes') : langService.get('no');
            };

            DistributionList.prototype.setIsGlobal = function (status) {
                this.global = status;
                return this;
            };

            DistributionList.prototype.hasOrganizations = function () {
                return this.relatedOus.length;
            };

            DistributionList.prototype.getRelatedOus = function () {
                return this.relatedOus;
            };

            DistributionList.prototype.setRelatedOus = function (relatedOus) {
                this.relatedOus = relatedOus;
                return this;
            };

            DistributionList.prototype.deleteAllOUDistributionLists = function () {
                var self = this;
                return ouDistributionListService
                    .deleteBulkOUDistributionLists(this.getRelatedOus())
                    .then(function () {
                        self.setRelatedOus([]);
                        self.global = true;
                        return self;
                    });
            };

            DistributionList.prototype.addToOUDistributionLists = function (organization) {
                var self = this;
                /*return ouDistributionListService
                 .updateOUDistributionList((new OUDistributionList()).setOuId(organization).setDistributionList(this))
                 .then(function (ouDistributionList) {
                 return ouDistributionListService.loadOUDistributionLists().then(function (value) {
                 var selectedOUs = _.filter(value, function (ouDis) {
                 return ouDis.distributionList.id === self.id;
                 });
                 self.relatedOus = [];
                 self.relatedOus = selectedOUs;
                 return self.relatedOus;
                 });
                 });*/

                return ouDistributionListService
                    .addOUDistributionList((new OUDistributionList()).setOuId(organization).setDistributionList(this))
                    .then(function (ouDistributionList) {
                        self.relatedOus.push(ouDistributionList);
                        return self.relatedOus;
                    });
            };

            DistributionList.prototype.addBulkToOUDistributionLists = function (organizations) {
                var self = this;
                return ouDistributionListService
                    .createListOUDistributionLists(organizations, self, true)
                    .then(function (ouDistributionLists) {
                        self.relatedOus = self.relatedOus.concat(ouDistributionLists);
                    })
            };

            DistributionList.prototype.deleteBulkFromOUDistributionLists = function (ouDistributionLists) {
                var self = this;
                return ouDistributionListService
                    .deleteBulkOUDistributionLists(ouDistributionLists)
                    .then(function () {
                        var ids = _.map(ouDistributionLists, 'id');
                        self.relatedOus = _.filter(self.relatedOus, function (ouDistributionList) {
                            return ids.indexOf(ouDistributionList.id) === -1;
                        });
                    });
            };

            DistributionList.prototype.openDialogToSelectOrganizations = function () {
                var self = this;
                return organizationService
                    .controllerMethod
                    .selectOrganizations('select_organization')
                    .then(function (organizations) {
                        return self.addBulkToOUDistributionLists(organizations);
                    });
            };

            DistributionList.prototype.repairGlobalStatus = function () {
                var self = this;
                if (self.hasOrganizations() && self.global)
                    self.setIsGlobal(false);
                else if (!self.hasOrganizations() && !self.isGlobal)
                    self.setIsGlobal(true);

                return distributionListService.updateDistributionList(self);
            };

            DistributionList.prototype.setDistributionListService = function (service) {
                distributionListService = service;
                return this;
            };

            DistributionList.prototype.opendDialogToSelectOrganizations = function () {
                var self = this;
                return organizationService
                    .controllerMethod
                    .selectOrganizations('select_organization')
                    .then(function (organizations) {
                        return self.addBulkToOUDistributionLists(organizations);
                    });
            };

            /*DistributionList.prototype.updateStatus = function () {
             var methods = ['activateCorrespondenceSite', 'deactivateCorrespondenceSite'];
             if (arguments.length)
             this.status = arguments[0];

             var method = this.status ? methods[0] : methods[1];
             return distributionListService[method](this);
             };*/

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('DistributionList', 'init', this);
        }
    })
};