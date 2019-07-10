module.exports = function (app) {
    app.factory('CorrespondenceSite', function (CMSModelInterceptor,
                                                OUCorrespondenceSite,
                                                $q,
                                                langService,
                                                _) {
        'ngInject';
        return function CorrespondenceSite(model) {
            var self = this, ouCorrespondenceSiteService, organizationService, correspondenceSiteService;
            self.correspondenceTypeId = null;
            self.parent = null;
            self.isGlobal = true;
            self.arName = null;
            self.enName = null;
            self.status = true;
            self.childCount = 0;
            self.arDisplayName = null;
            self.enDisplayName = null;
            self.relatedOus = [];
            self.children = [];
            self.faxNumber = null;

            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [
                'arName',
                'enName',
                'isGlobal',
                'status',
                'correspondenceTypeId'
            ];

            if (model)
                angular.extend(self, model);

            /**
             * get all required fields
             * @return {Array|requiredFields}
             */
            CorrespondenceSite.prototype.getRequiredFields = function () {
                return requiredFields;
            };
            /**
             * @description Get the isGlobalization of correspondenceSite as Yes or No instead of true or false.
             * @returns {string}
             */
            CorrespondenceSite.prototype.getTranslatedGlobal = function () {
                return this.isGlobal ? langService.get('global') : langService.get('not_global');
            };
            /**
             * @description Get the status of correspondenceSite as active  or inactive instead of true or false.
             * @returns {string}
             */
            CorrespondenceSite.prototype.getTranslatedStatus = function () {
                return this.status ? langService.get('active') : langService.get('inactive');
            };

            CorrespondenceSite.prototype.getNames = function (separator) {
                return this.arName + ' ' + (separator ? separator : '-') + ' ' + this.enName;
            };

            CorrespondenceSite.prototype.getSecurityLevels = function (separator) {
                var lang = langService.current.charAt(0).toUpperCase() + langService.current.substr(1);
                return _.map(this.securityLevels, ('default' + lang + 'Name')).join(separator || ',  ');
            };

            CorrespondenceSite.prototype.getTranslatedName = function (reverse) {
                return langService.current === 'ar' ? (reverse ? this.enName : this.arName) : (reverse ? this.arName : this.enName);
            };
            CorrespondenceSite.prototype.appendChild = function (correspondenceSite) {
                this.children.push(correspondenceSite);
                return this;
            };
            CorrespondenceSite.prototype.setChildren = function (correspondenceSites) {
                this.children = correspondenceSites;
                return this;
            };
            CorrespondenceSite.prototype.hasChildren = function () {
                // return this.children.length;
                return this.childCount > 0;
            };

            CorrespondenceSite.prototype.cannotSave = function () {
                return !this.isGlobal && !this.hasOrganizations();
            };

            CorrespondenceSite.prototype.hasOrganizations = function () {
                return this.relatedOus.length;
            };
            CorrespondenceSite.prototype.setIsGlobal = function (status) {
                this.isGlobal = status;
                return this;
            };
            CorrespondenceSite.prototype.getRelatedOus = function () {
                return this.relatedOus;
            };

            CorrespondenceSite.prototype.setRelatedOus = function (relatedOus) {
                this.relatedOus = relatedOus;
                return this;
            };

            CorrespondenceSite.prototype.setOUCorrespondenceSiteService = function (service) {
                ouCorrespondenceSiteService = service;
                return this;
            };

            CorrespondenceSite.prototype.setOrganizationService = function (service) {
                organizationService = service;
                return this;
            };
            CorrespondenceSite.prototype.setCorrespondenceSiteService = function (service) {
                correspondenceSiteService = service;
                return this;
            };

            CorrespondenceSite.prototype.deleteAllOUCorrespondenceSites = function () {
                var self = this;
                //console.log(self);
                return ouCorrespondenceSiteService
                    .deleteBulkOUCorrespondenceSites(this.getRelatedOus())
                    .then(function () {
                        self.setRelatedOus([]);
                        self.isGlobal = true;
                        return self;
                    });
            };

            CorrespondenceSite.prototype.addToOUCorrespondenceSites = function (organization) {
                var self = this;
                return ouCorrespondenceSiteService
                    .addOUCorrespondenceSite((new OUCorrespondenceSite()).setOuId(organization).setCorrespondenceSite(this))
                    .then(function (ouCorrespondenceSite) {
                        self.relatedOus.push(ouCorrespondenceSite);
                        return ouCorrespondenceSite;
                    });
            };
            CorrespondenceSite.prototype.addBulkToOUCorrespondenceSites = function (organizations) {
                var self = this;
                return ouCorrespondenceSiteService
                    .createListOUCorrespondenceSites(organizations, self, true)
                    .then(function (ouCorrespondenceSites) {
                        return self.relatedOus = self.relatedOus.concat(ouCorrespondenceSites);
                    })
            };

            CorrespondenceSite.prototype.deleteBulkFromOUCorrespondenceSites = function (ouCorrespondenceSites) {
                var self = this;
                return ouCorrespondenceSiteService
                    .deleteBulkOUCorrespondenceSites(ouCorrespondenceSites)
                    .then(function () {
                        var ids = _.map(ouCorrespondenceSites, 'id');
                        self.relatedOus = _.filter(self.relatedOus, function (ouCorrespondenceSite) {
                            return ids.indexOf(ouCorrespondenceSite.id) === -1;
                        });
                    });
            };

            CorrespondenceSite.prototype.openDialogToSelectOrganizations = function () {
                var self = this;
                return organizationService
                    .controllerMethod
                    .selectOrganizations('select_organization')
                    .then(function (organizations) {
                        return self.addBulkToOUCorrespondenceSites(organizations);
                    });
            };

            CorrespondenceSite.prototype.repairGlobalStatus = function () {
                var self = this;
                if (self.hasOrganizations() && self.isGlobal)
                    self.setIsGlobal(false);
                else if (!self.hasOrganizations() && !self.isGlobal)
                    self.setIsGlobal(true);

                return correspondenceSiteService.updateCorrespondenceSite(self);
            };

            CorrespondenceSite.prototype.updateStatus = function () {
                var methods = ['activateCorrespondenceSite', 'deactivateCorrespondenceSite'];
                if (arguments.length)
                    this.status = arguments[0];

                var method = this.status ? methods[0] : methods[1];
                return correspondenceSiteService[method](this);
            };

            CorrespondenceSite.prototype.save = function () {
                if (this.id) {
                    return correspondenceSiteService.updateCorrespondenceSite(this)
                    //return this.update();
                }
                return correspondenceSiteService.addCorrespondenceSite(this);
            };

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('CorrespondenceSite', 'init', this);
        }
    })
};