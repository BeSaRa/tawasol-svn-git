module.exports = function (app) {
    app.service('organizationService', function (urlService,
                                                 $http,
                                                 cmsTemplate,
                                                 langService,
                                                 WFOrganization,
                                                 $rootScope,
                                                 _,
                                                 organizationTypeService,
                                                 $q,
                                                 Organization,
                                                 dialog,
                                                 generator,
                                                 lookupService,
                                                 PropertyConfiguration,
                                                 employeeService) {
        'ngInject';
        var self = this;
        self.serviceName = 'organizationService';

        self.organizations = [];

        self.rootOrganization = {};
        self.childrenOrganizations = {};

        /**
         * @description load organization by id.
         * @param organizationId
         */
        self.loadOrganizationById = function (organizationId) {
            organizationId = organizationId.hasOwnProperty('id') ? organizationId.id : organizationId;
            return $http
                .get((urlService.organizations + '/' + organizationId))
                .then(function (result) {
                    var organization = generator.generateInstance(result.data.rs, Organization, self._sharedMethods);
                    return generator.interceptReceivedInstance('Organization', organization);
                });
        };
        /**
         * @description load organizations from server.
         * @returns {Promise|organizations}
         */
        self.loadOrganizations = function () {
            return $http.get(urlService.organizations).then(function (result) {
                self.organizations = generator.generateCollection(result.data.rs, Organization, self._sharedMethods);
                self.organizations = generator.interceptReceivedCollection('Organization', self.organizations);
                return self.organizations;
            });
        };
        /**
         * @description get all registry organizations
         * @return {Array}
         */
        self.getAllRegistryOrganizations = function () {
            return _.filter(self.organizations, function (organization) {
                return organization.hasRegistry;
            });
        };
        /**
         * @description get organizations from self.organizations if found and if not load it from server again.
         * @returns {Promise|organizations}
         */
        self.getOrganizations = function () {
            return self.organizations.length ? $q.when(self.organizations) : self.loadOrganizations();
        };
        /**
         * @description return back the loaded organizations.
         * @return {Array|*}
         */
        self.returnOrganizations = function () {
            return self.organizations;
        };
        /**
         * @description add new organization to service
         * @param organization
         * @return {Promise|organization}
         */
        self.addOrganization = function (organization) {
            return $http
                .post((urlService.organizations + '/add-ou'), generator.interceptSendInstance('Organization', organization))
                .then(function (result) {
                    organization = generator.interceptReceivedInstance('Organization', generator.generateInstance(result.data.rs, Organization, self._sahredMethods));
                    self.organizations.push(organization);
                    return organization;
                });
        };
        /**
         * @description make an update for given organization.
         * @param organization
         * @return {Promise|organization}
         */
        self.updateOrganization = function (organization) {
            return $http
                .put((urlService.organizations + '/update-ou'), generator.interceptSendInstance('Organization', organization))
                .then(function (result) {
                    organization = generator.interceptReceivedInstance('Organization', generator.generateInstance(result.data.rs, Organization, self._sahredMethods));
                    self.replaceOrganization(organization);
                    return organization;
                });
        };
        /**
         * to replace organization from organizations .
         * @param organization
         */
        self.replaceOrganization = function (organization) {
            self.organizations = _.map(self.organizations, function (item) {
                if (organization.id === item.id) {
                    item = organization;
                }
                return item;
            });
        };
        /**
         * @description delete given organization.
         * @param organization
         * @return {Promise}
         */
        self.deleteOrganization = function (organization) {
            var id = organization.hasOwnProperty('id') ? organization.id : organization;
            return $http
                .delete((urlService.organizations + '/' + id));
        };
        /**
         * @description create the shred method to the model.
         * @type {{delete: generator.delete, update: generator.update}}
         * @private
         */
        self._sharedMethods = generator.generateSharedMethods(self.deleteOrganization, self.updateOrganization);

        /**
         * @description get organization by organizationId
         * @param organizationId
         * @returns {Organization|undefined} return Organization Model or undefined if not found.
         */
        self.getOrganizationById = function (organizationId) {
            if (!organizationId)
                return;

            var id = organizationId.hasOwnProperty('id') ? organizationId.id : organizationId;

            return _.find(self.organizations, function (organization) {
                return Number(organization.id) === Number(id);
            });
        };

        /**
         * @description Activate organization
         * @param organization
         */
        self.activateOrganization = function (organization) {
            return $http
                .put((urlService.organizations + '/activate/' + organization.id))
                .then(function () {
                    return organization;
                });
        };

        /**
         * @description Deactivate organization
         * @param organization
         */
        self.deactivateOrganization = function (organization) {
            return $http
                .put((urlService.organizations + '/deactivate/' + organization.id))
                .then(function () {
                    return organization;
                });
        };

        /**
         * @description Activate bulk organizations
         * @param organizations
         */
        self.activateBulkOrganizations = function (organizations) {
            var bulkIds = organizations[0].hasOwnProperty('id') ? _.map(organizations, 'id') : organizations;
            return $http
                .put((urlService.organizations + '/activate/bulk'), bulkIds)
                .then(function () {
                    return organizations;
                });
        };

        /**
         * @description Deactivate bulk organizations
         * @param organizations
         */
        self.deactivateBulkOrganizations = function (organizations) {
            var bulkIds = organizations[0].hasOwnProperty('id') ? _.map(organizations, 'id') : organizations;
            return $http
                .put((urlService.organizations + '/deactivate/bulk'), bulkIds)
                .then(function () {
                    return organizations;
                });
        };
        /**
         * get parents for organization with related to same leaf.
         * @param organization
         * @param array
         * @return {*}
         */
        self.getParents = function (organization, array) {
            var parent = self.getOrganizationById(organization.parent);
            if (parent) {
                array.push(parent);
                self.getParents(parent, array);
            }
            return array;
        };
        /**
         * @description get all parents which has registry
         * @param organization
         * @param excludeMe
         * @return {Array}
         */
        self.getAllParentsHasRegistry = function (organization, excludeMe) {
            var array = [];
            self.getParents(organization, array);
            if (organization.hasRegistry && !excludeMe)
                array.unshift(organization);
            return _.filter(array, function (item) {
                return item.hasRegistry === true;
            });
        };
        /**
         * @description get all parents which has central archive
         * @param organization
         * @param excludeMe
         * @return {Array}
         */
        self.getAllParentsHasCentralArchive = function (organization, excludeMe) {
            var array = [];
            self.getParents(organization, array);
            if (organization.centralArchive && !excludeMe)
                array.unshift(organization);
            return _.filter(array, function (item) {
                return item.centralArchive === true;
            });
        };

        self.getAllCentralArchive = function (exclude) {
            return _.filter(self.organizations, function (item) {
                return exclude ? (item.centralArchive && exclude.id !== item.id) : item.centralArchive;
            });
        };
        /**
         * get any child belong the given organization.
         * @param organization
         * @param array
         * @return {*}
         */
        self.getChildren = function (organization, array) {
            if (!array)
                array = [];

            _.map(self.organizations, function (org) {
                if (organization.id === org.parent && !_.find(array, function (x) {
                    return x.id === org.id
                })) {
                    array.push(org);
                    self.getChildren(org, array);
                }
            });
            return array;
        };
        /**
         * get all available parents for the current organization.
         * @param organization
         * @param excluded
         * @return {Array}
         */
        self.getAllAvailableParents = function (organization, excluded) {
            var availableParents = [];
            var excludedArray = [excluded];
            self.getChildren(excluded, excludedArray);
            var excludedIds = _.map(excludedArray, 'id');

            _.map(self.organizations, function (org) {
                if (excludedIds.indexOf(org.id) === -1)
                    availableParents.push(org);
            });
            return availableParents;
        };

        self.findOrganizationsByText = function (searchText, searchKey) {
            // service-request: need service to return collection of users from backend-team based on search text.
            searchText = searchText.toLowerCase().trim();
            return self.loadOrganizations().then(function (result) {
                return _.filter(result, function (organization) {
                        var properties = [
                            'arName',
                            'description',
                            'email',
                            'enName',
                            'mobile',
                            'code'];

                        if (!searchKey) {
                            var found = false;
                            var value = "";
                            for (var i = 0; i < properties.length; i++) {
                                value = ('' + organization[properties[i]]).toString().toLowerCase().trim();
                                if (value.indexOf(searchText) !== -1) {
                                    found = true;
                                    break;
                                }
                            }
                            return found;
                        }

                        return (Number(organization[searchKey.key]) === Number(searchText));
                    }
                );
            });
        };
        /**
         * load children organization for given organization.
         * @param organization
         * @param type
         */
        self.loadOrganizationChildren = function (organization, type) {
            var id = organization.hasOwnProperty('id') ? organization.id : organization;

            // type query parameter is used to exclude reg Ous.
            return $http
                .get((urlService.organizations + '/' + id + '/childs' + (type ? '?type=1' : '')))
                .then(function (result) {
                    var children = generator.generateCollection(result.data.rs, Organization, self._sharedMethods);
                    return generator.interceptReceivedCollection('Organization', children);
                }).catch(function (reason) {
                    console.log(reason);
                });
        };
        /**
         * @description load children  for Central archive
         * @param organization
         */
        self.loadChildrenOrganizations = function (organization) {
            var id = organization.hasOwnProperty('id') ? organization.id : organization;
            return $http
                .get(urlService.organizations + '/' + id + '/childs-reg-parent')
                .then(function (result) {
                    var children = generator.generateCollection(result.data.rs, Organization, self._sharedMethods);
                    return generator.interceptReceivedCollection('Organization', children);
                }).catch(function (reason) {
                    console.log(reason);
                });
        };


        self.controllerMethod = {
            /**
             *
             * @param label
             * @param $event
             * @param exclude
             * @return {promise}
             */
            selectOrganizations: function (label, $event, exclude) {
                return dialog
                    .showDialog({
                        templateUrl: cmsTemplate.getPopup('select-organization'),
                        targetEvent: $event,
                        controller: 'selectOrganizationPopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            singleMode: false,
                            label: label,
                            exclude: exclude
                        }
                    });
            },
            /**
             *
             * @param organization
             */
            organizationAddRoot: function (organization/*, $event*/) {
                dialog.alertMessage(organization);
            },
            /**
             *
             * @param organization
             * @param $event
             * @return {promise}
             */
            organizationAdd: function (organization, $event) {
                return dialog.showDialog({
                    templateUrl: cmsTemplate.getPopup('organization'),
                    targetEvent: $event,
                    controller: 'organizationPopCtrl',
                    controllerAs: 'ctrl',
                    escapeToClose: false, // TODO: check if need as business
                    locals: {
                        rootMode: organization.hasOwnProperty('identifier'),
                        editMode: false,
                        organization: organization,
                        children: [],
                        ouClassifications: [],
                        ouCorrespondenceSites: [],
                        allPropertyConfigurations: [],
                        unAssignedUsers: [],
                        ouAssignedUsers: [],
                        organizations: self.organizations
                    },
                    resolve: {
                        classifications: function (classificationService) {
                            'ngInject';
                            return classificationService.getClassifications();
                        },
                        correspondenceSites: function (correspondenceSiteService) {
                            'ngInject';
                            return correspondenceSiteService.loadActiveCorrespondenceSites();
                        },
                        documentTemplates: function (documentTemplateService) {
                            'ngInject';
                            // return documentTemplateService.loadDocumentTemplates(organization.id);
                            return [];
                        }/*,
                         organizations: function(organizationService){
                         return organizationService.getOrganizations()
                         }*/
                    }
                });
            },
            /**
             *
             * @param organization
             * @param $event
             * @return {promise}
             */
            organizationEdit: function (organization, $event) {
                return dialog.showDialog({
                    templateUrl: cmsTemplate.getPopup('organization'),
                    targetEvent: $event,
                    controller: 'organizationPopCtrl',
                    controllerAs: 'ctrl',
                    escapeToClose: false, // TODO: check if need as business
                    locals: {
                        rootMode: !organization.parent,
                        editMode: true,
                        organization: organization,
                        organizations: self.organizations
                    },
                    resolve: {
                        children: function () {
                            'ngInject';
                            return self.loadOrganizationChildren(organization);
                        },
                        ouClassifications: function (ouClassificationService) {
                            'ngInject';
                            return organization.hasRegistry ? ouClassificationService.loadOUClassificationsByOuId(organization) : [];
                        },
                        classifications: function (classificationService) {
                            'ngInject';
                            return classificationService.getClassifications();
                        },
                        ouCorrespondenceSites: function (ouCorrespondenceSiteService) {
                            'ngInject';
                            return organization.hasRegistry ? ouCorrespondenceSiteService.loadOUCorrespondenceSitesByOuId(organization) : [];
                        },
                        correspondenceSites: function (correspondenceSiteService) {
                            'ngInject';
                            return correspondenceSiteService.loadActiveCorrespondenceSites();
                        },
                        documentTemplates: function (documentTemplateService) {
                            'ngInject';
                            return documentTemplateService.loadDocumentTemplates(organization.id);
                        },
                        allPropertyConfigurations: function (propertyConfigurationService, $q) {
                            'ngInject';
                            var currentUserOrg = employeeService.getEmployee().userOrganization;
                            var loggedInOuId = currentUserOrg && currentUserOrg.hasOwnProperty('id') ? currentUserOrg.id : currentUserOrg;
                            if (organization.id === loggedInOuId) {
                                //return lookupService.getPropertyConfigurations();
                                var propConfigs = lookupService.getPropertyConfigurations();
                                _.map(propConfigs, function (index, key) {
                                    propConfigs[key] = _.map(propConfigs[key], function (propConfig) {
                                        return new PropertyConfiguration(propConfig);
                                    });
                                    return propConfigs;
                                });
                                return propConfigs;
                            }

                            //return propertyConfigurationService.loadPropertyConfigurations();
                            return $q.all([
                                propertyConfigurationService.loadPropertyConfigurationsByDocumentClassAndOU('outgoing', organization.id),
                                propertyConfigurationService.loadPropertyConfigurationsByDocumentClassAndOU('incoming', organization.id),
                                propertyConfigurationService.loadPropertyConfigurationsByDocumentClassAndOU('internal', organization.id)
                            ]).then(function (result) {
                                //return result[0].concat(result[1]).concat(result[2]);
                                return {
                                    'outgoing': result[0],
                                    'incoming': result[1],
                                    'internal': result[2]
                                };
                            });

                        },
                        unAssignedUsers: function (ouApplicationUserService) {
                            'ngInject';
                            return ouApplicationUserService.loadUnassignedOUApplicationUsers(organization.id);
                        },
                        ouAssignedUsers: function (ouApplicationUserService) {
                            'ngInject';
                            return ouApplicationUserService.loadRelatedOUApplicationUsers(organization.id);
                        }/*,
                         organizations: function(organizationService){
                         return organizationService.getOrganizations()
                         }*/
                    }
                });
            },
            organizationDelete: function (organization, $event) {
                return dialog
                    .confirmMessage(langService.get('confirm_delete').change({name: organization.getNames()}), null, null, $event)
                    .then(function () {
                        return self.deleteOrganization(organization);
                    });
            },
            /**
             * Show Dialog for Import Excel File
             */
            organizationImport: function ($event) {
                return dialog
                    .showDialog({
                        templateUrl: cmsTemplate.getPopup('import-organization'),
                        targetEvent: $event,
                        controller: 'importOrganizationPopCtrl',
                        controllerAs: 'ctrl',
                        locals: {}
                    });
            }
        };

        self.exportOrganizations = function () {
            return $http
                .post(urlService.organizations + "/exportExcel", null)
                .then(function (result) {
                    return result;
                });
        };

        self.uploadExcelFile = function (excelFile) {
            var form = new FormData();
            form.append('name', excelFile.name.split('.')[0]);
            form.append('file', excelFile);
            return $http.post(urlService.organizations + "/uploadFile", form, {
                headers: {
                    'Content-Type': undefined
                }
            }).then(function (result) {
                return result.data.rs;
            })
        };

        self.validateExcelFile = function (url) {
            var urlToSend = JSON.stringify({"path": url});
            return $http.post(urlService.organizations + "/validateExcel", urlToSend).then(function (result) {
                return result.data.rs;
            });
        };

        self.getRegistryOrganizationId = function (organization) {
            var ouId = organization.hasOwnProperty('registryParentId') ? organization.id : organization;
            return self.getOrganizationById(ouId);
        };

        self.getOrganizationsByRegOU = function (regOUId) {
            regOUId = regOUId.hasOwnProperty('id') ? regOUId.id : regOUId;
            return $http
                .get(urlService.organizations + '/' + regOUId + '/childs')
                .then(function (result) {
                    var organizations = generator.generateCollection(result.data.rs, Organization, self._sharedMethods);
                    organizations = generator.interceptReceivedCollection('Organization', organizations);
                    return organizations;
                });
        };
        /**
         * @description load central archive organizations.
         * @return {*}
         */
        self.centralArchiveOrganizations = function () {
            return $http.get(urlService.availableCentralArchive)
                .then(function (result) {
                    var organizations = generator.generateCollection(result.data.rs, WFOrganization);
                    return organizations.length ? organizations : false;
                });
        };
        /**
         * @description sync organizations
         * @return {*}
         */
        self.syncFNOrganizations = function () {
            return $http.put(urlService.organizations + '/sync-fn-groups')
                .then(function (result) {
                    return result.data.rs;
                });
        }

    });
};
