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
                                                 OUPrivateRegistry,
                                                 employeeService) {
        'ngInject';
        var self = this;
        self.serviceName = 'organizationService';

        self.organizations = [];
        self.allOrganizationsStructure = [];

        self.rootOrganization = {};
        self.childrenOrganizations = {};
        /**
         * @description load organizations from server.
         * @returns {Promise|organizations}
         */
        self.loadOrganizations = function (skipUserRole, skipSetValue) {
            var url = urlService.organizations;
            if (skipUserRole) {
                url = url + '/lookup';
            }
            return $http.get(url).then(function (result) {
                if (skipSetValue) {
                    var ous = generator.generateCollection(result.data.rs, Organization, self._sharedMethods);
                    return generator.interceptReceivedCollection('Organization', ous);
                }
                self.organizations = generator.generateCollection(result.data.rs, Organization, self._sharedMethods);
                self.organizations = generator.interceptReceivedCollection('Organization', self.organizations);
                return self.organizations;
            });
        };

        /**
         * @description get organizations from self.organizations if found and if not load it from server again.
         * @returns {Promise|organizations}
         */
        self.getOrganizations = function (skipUserRoleWhenLoad, skipSetValue) {
            return self.organizations.length ? $q.when(self.organizations) : self.loadOrganizations(skipUserRoleWhenLoad, skipSetValue);
        };

        /**
         * @description return back the loaded organizations.
         * @return {Array|*}
         */
        self.returnOrganizations = function () {
            return self.organizations;
        };

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
         * @description get organization by organizationId
         * @param organizationId
         * @param useNormalOrgList
         * @returns {Organization|undefined} return Organization Model or undefined if not found.
         */
        self.getOrganizationById = function (organizationId, useNormalOrgList) {
            if (!organizationId)
                return;

            var id = organizationId.hasOwnProperty('id') ? organizationId.id : organizationId,
                ous = useNormalOrgList ? self.organizations : self.allOrganizationsStructure;

            return _.find(ous, function (organization) {
                return Number(organization.id) === Number(id);
            });
        };

        /**
         * @description Load all organizations structure
         * @returns {*}
         */
        self.loadAllOrganizationsStructure = function () {
            var url = urlService.organizations + '/structure';
            return $http.get(url).then(function (result) {
                self.allOrganizationsStructure = generator.generateCollection(result.data.rs, Organization, self._sharedMethods);
                self.allOrganizationsStructure = generator.interceptReceivedCollection('Organization', self.allOrganizationsStructure);
                return self.allOrganizationsStructure;
            });
        };
        /**
         * load selcted organization with hierarchy
         * @param selectedOrganization
         * @returns {*}
         */
        self.loadHierarchy = function (selectedOrganization) {
            var id = selectedOrganization.hasOwnProperty('id') ? selectedOrganization.id : selectedOrganization;
            return $http.get(urlService.organizations + '/criteria/' + id).then(function (result) {
                return generator.interceptReceivedCollection('Organization', generator.generateCollection(result.data.rs, Organization, self._sharedMethods));
            });
        };

        /**
         * @description Get/Load all organizations structure
         * @returns {Promise}
         */
        self.getAllOrganizationsStructure = function () {
            return self.allOrganizationsStructure.length ? $q.when(self.allOrganizationsStructure) : self.loadAllOrganizationsStructure();
        };

        /**
         * @description get all registry organizations
         * @param returnPromise
         * If true, returns array of regOus in promise
         * @returns {Array}
         */
        self.getAllRegistryOrganizations = function (returnPromise) {
            var regOus = _.filter(self.organizations, function (organization) {
                return organization.hasRegistry;
            });
            if (returnPromise) {
                return $q.resolve(regOus);
            }
            return regOus;
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
         * @description add manager to all users
         * @param ouId
         * @param isViceManager
         * @returns {*}
         */
        self.addManagerToAllUsers = function (ouId, isViceManager) {
            ouId = ouId.hasOwnProperty('id') ? ouId.id : ouId;
            return $http
                .put(urlService.addManagerToAllUsers.change({
                    ouId: ouId,
                    manager: isViceManager ? 'vice-manager' : 'manager'
                }))
                .then(function (result) {
                    return result.data.rs;
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
            return _.filter(self.allOrganizationsStructure, function (item) {
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

        self.findOrganizationChildrenByText = function (searchText, searchKey, ou) {
            // service-request: need service to return collection of users from backend-team based on search text.
            searchText = searchText.toLowerCase().trim();
            return self.loadOrganizationChildren(ou, false).then(function (result) {
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
         * If available, it will exclude regOus from response
         * @param skipCurrentRegOu
         */
        self.loadOrganizationChildren = function (organization, type, skipCurrentRegOu) {
            var parentOuId = organization.hasOwnProperty('id') ? organization.id : organization;

            // type query parameter is used to exclude reg Ous.
            return $http
                .get((urlService.organizations + '/' + parentOuId + '/childs' + (type ? '?type=1' : '')))
                .then(function (result) {
                    var children = generator.generateCollection(result.data.rs, Organization, self._sharedMethods);
                    children = generator.interceptReceivedCollection('Organization', children);
                    if (skipCurrentRegOu) {
                        children = _.filter(children, function (ou) {
                            return ou.id !== parentOuId;
                        })
                    }
                    return children;
                }).catch(function (reason) {
                    console.log(reason);
                });
        };
        /**
         * @description load children  for Central archive
         * @param organization
         * @param skipCurrentRegOu
         */
        self.loadChildrenOrganizations = function (organization, skipCurrentRegOu) {
            var parentOuId = organization.hasOwnProperty('id') ? organization.id : organization;
            return $http
                .get(urlService.organizations + '/' + parentOuId + '/childs-reg-parent')
                .then(function (result) {
                    var children = generator.generateCollection(result.data.rs, Organization, self._sharedMethods);
                    children = generator.interceptReceivedCollection('Organization', children);
                    if (skipCurrentRegOu) {
                        children = _.filter(children, function (ou) {
                            return ou.id !== parentOuId;
                        })
                    }
                    return children;
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
                        organizations: self.allOrganizationsStructure,
                        defaultTab: 'basic'
                    },
                    resolve: {
                        classifications: function (classificationService) {
                            'ngInject';
                            return classificationService.getClassifications();
                        },
                        correspondenceSites: function (correspondenceSiteService) {
                            'ngInject';
                            return correspondenceSiteService.loadCorrespondenceSitesWithLimit(100);
                        },
                        documentTemplates: function (documentTemplateService) {
                            'ngInject';
                            // return documentTemplateService.loadDocumentTemplates(organization.id);
                            return [];
                        },
                        entityLDAPProviders: function (entityService, rootEntity) {
                            'ngInject';
                            return entityService.loadEntityById(rootEntity.returnRootEntity().rootEntity)
                                .then(function (result) {
                                    return result.ldapProviders;
                                });
                        },
                        departmentUsers: function (ouApplicationUserService) {
                            'ngInject';
                            if (!organization.hasRegistry) {
                                return [];
                            }
                            return ouApplicationUserService.loadOuApplicationUserByRegOu(organization.id);
                        },
                        distributionLists: function (distributionListService) {
                            'ngInject';
                            return distributionListService.getDistributionLists();
                        }
                    }
                });
            },
            /**
             *
             * @param organization
             * @param $event
             * @param defaultTab
             * @return {promise}
             */
            organizationEdit: function (organization, $event, defaultTab) {
                console.log('ROOT');
                return dialog.showDialog({
                    templateUrl: cmsTemplate.getPopup('organization'),
                    targetEvent: $event,
                    controller: 'organizationPopCtrl',
                    controllerAs: 'ctrl',
                    escapeToClose: false, // TODO: check if need as business
                    locals: {
                        rootMode: (!organization.parent || organization.parent === -1),
                        editMode: true,
                        // organization: organization,
                        organizations: self.allOrganizationsStructure,
                        defaultTab: defaultTab || 'basic'
                    },
                    resolve: {
                        organization: function (organizationService) {
                            'ngInject';
                            return organizationService.loadOrganizationById(organization.id)
                                .then(function (item) {
                                    item.referencePlanItemStartSerialList = _.filter(item.referencePlanItemStartSerialList, 'referencePlanItemId');
                                    item.referenceNumberPlanId.referencePlanItemStartSerialList = angular.copy(item.referencePlanItemStartSerialList);
                                    return item;
                                });
                        },
                        children: function () {
                            'ngInject';
                            return self.loadOrganizationChildren(organization, false);
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
                            return correspondenceSiteService.loadCorrespondenceSitesWithLimit(100);
                        },
                        documentTemplates: function (documentTemplateService) {
                            'ngInject';
                            return documentTemplateService
                                .loadDocumentTemplates(organization.id);
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
                        },
                        entityLDAPProviders: function (entityService, rootEntity) {
                            'ngInject';
                            return entityService.loadEntityById(rootEntity.returnRootEntity().rootEntity)
                                .then(function (result) {
                                    return result.ldapProviders;
                                });
                        },
                        departmentUsers: function (ouApplicationUserService) {
                            'ngInject';
                            if (!organization.hasRegistry) {
                                return [];
                            }
                            return ouApplicationUserService.loadOuApplicationUserByRegOu(organization.id);
                        },
                        distributionLists: function (distributionListService) {
                            'ngInject';
                            return distributionListService.getDistributionLists();
                        }
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

        /**
         * @description load Ou Private registry Ous Mapping
         * @param organization
         */
        self.loadPrivateRegOUsMapping = function (organization) {
            var ouId = organization.hasOwnProperty('id') ? organization.id : organization;

            return $http
                .get(urlService.privateRegistryOU + "/to-regou-id/" + ouId)
                .then(function (result) {
                    return generator.interceptReceivedCollection('OUPrivateRegistry', generator.generateCollection(result.data.rs, OUPrivateRegistry, self._sharedMethods));
                });
        };


        /**
         * @description
         * @param organization
         * @param excludedPrivateRegOU
         * @param $event
         * @returns {promise}
         */
        self.openPrivateRegistryOUDialog = function (organization, excludedPrivateRegOU, $event) {
            return dialog
                .showDialog({
                    targetEvent: $event,
                    templateUrl: cmsTemplate.getPopup('private-registry-ou'),
                    controller: 'privateRegistryOUPopCtrl',
                    controllerAs: 'ctrl',
                    bindToController: true,
                    locals: {
                        organization: organization,
                        excludedPrivateRegOU: excludedPrivateRegOU
                    },
                    resolve: {
                        registryOrganizations: function () {
                            'ngInject';
                            return self.getAllOrganizationsStructure()
                                .then(function (organizations) {
                                    return _.filter(organizations, function (organization) {
                                        return organization.hasRegistry;
                                    });
                                });
                        }
                    }
                });
        };

        /**
         * @description add Private Registry Ous
         */
        self.addPrivateRegistryOUs = function (organization, privateOus) {
            organization = organization.hasOwnProperty('id') ? organization.id : organization;
            privateOus = _.map(privateOus, 'id');
            return $http.post(urlService.privateRegistryOU + '/from-regou-id/bulk',
                {
                    first: organization,
                    second: privateOus
                }).then(function (result) {
                return result.data.rs;
            })
        };

        self.deletePrivateRegistryOUs = function (privateOu) {
            var id = privateOu.hasOwnProperty('id') ? privateOu.id : privateOu;
            return $http.delete(urlService.privateRegistryOU + "/" + id);
        };

        /**
         * @description delete bulk private registry ous
         * @param privateOus
         * @returns {*}
         */
        self.deleteBulkPrivateRegistryOUs = function (privateOus) {
            var bulkIds = privateOus[0].hasOwnProperty('id') ? _.map(privateOus, 'id') : privateOus;
            return $http({
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                url: urlService.privateRegistryOU + '/bulk',
                data: bulkIds
            }).then(function (result) {
                return generator.getBulkActionResponse(result, privateOus, false, 'failed_delete_selected', 'delete_success', 'delete_success_except_following');
            });
        };

        self.exportOrganizations = function () {
            return $http
                .get(urlService.organizations + "/export/excel", null)
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
         * @description Returns the organizations the user can follow up on
         * @returns {*}
         */
        self.getFollowUpOrganizations = function () {
            return $http.get(urlService.followupOu)
                .then(function (result) {
                    result = generator.generateCollection(result.data.rs, Organization, self._sharedMethods);
                    result = generator.interceptReceivedCollection('Organization', result);
                    return result;
                })
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
         * @description get ou view permission organizations by user id
         * @param userId
         * @returns {*}
         */
        self.getUserViewPermissionOusByUserId = function (userId) {
            userId = userId && userId.hasOwnProperty('id') ? userId.id : userId;
            return $http.get(urlService.ouViewPermission + '/lookup/user-id/' + userId).then(function (result) {
                var ous = generator.generateCollection(result.data.rs, WFOrganization, self._sharedMethods);
                ous = generator.interceptReceivedCollection('WFOrganization', ous);
                return ous;
            });
        };

        /**
         * @description load OU Distribution Lists
         * @param organization
         */
        self.loadOUDistributionList = function (organization) {
            organization = organization.hasOwnProperty('id') ? organization.id : organization;
            return $http.get(urlService.distributionLists + '/regou-id/' + organization)
                .then(function (result) {
                    return result.data.rs;
                });
        };

        self.addOUDistributionList = function (regOu, distributionList) {
            regOu = regOu.hasOwnProperty('id') ? regOu.id : regOu;
            distributionList = distributionList.hasOwnProperty('id') ? distributionList.id : distributionList;

            return $http.put(urlService.distributionLists + '/regou-id/' + regOu + '/dist-id/' + distributionList)
                .then(function (result) {
                    return result.data.rs;
                })
        };

        self.updateDistributionListsForRegOU = function (regOU, distLists) {
            regOU = regOU.hasOwnProperty('id') ? regOU.id : regOU;
            return $http.put(urlService.distributionLists + '/regou-id/' + regOU, _.map(distLists, 'id'))
                .then(function (result) {
                    return result.data.rs;
                });
        };

        self.openOUDistributionListsDialog = function (regOu, excludedDL, $event) {
            return dialog
                .showDialog({
                    targetEvent: $event,
                    templateUrl: cmsTemplate.getPopup('ou-distribution-lists'),
                    controller: 'ouDistributionListsPopCtrl',
                    controllerAs: 'ctrl',
                    bindToController: true,
                    locals: {
                        regOu: regOu,
                        excludedDL: excludedDL
                    },
                    resolve: {
                        distributionLists: function (distributionListService) {
                            'ngInject';
                            return distributionListService.getDistributionLists()
                                .then(function (dl) {
                                    return dl;
                                });
                        }
                    }
                });
        };


        /**
         * @description delete OU distribution list
         * @param regOu
         * @param distributionList
         * @returns {HttpPromise}
         */
        self.deleteOUDistributionList = function (regOu, distributionList) {
            regOu = regOu.hasOwnProperty('id') ? regOu.id : regOu;
            distributionList = distributionList.hasOwnProperty('id') ? distributionList.id : distributionList;

            return $http
                .delete(urlService.distributionLists + '/regou-id/' + regOu + '/dist-id/' + distributionList);
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
        };

        /**
         * @description activate organization
         * @param organizationId
         */
        self.activateOrganization = function (organizationId) {
            organizationId = organizationId.hasOwnProperty('id') ? organizationId.id : organizationId;
            return $http
                .put((urlService.organizations + '/activate/' + organizationId))
                .then(function () {
                    return true;
                });
        };

        /**
         * @description Deactivate organization
         * @param organizationId
         */
        self.deactivateOrganization = function (organizationId) {
            organizationId = organizationId.hasOwnProperty('id') ? organizationId.id : organizationId;
            return $http
                .put((urlService.organizations + '/deactivate/' + organizationId))
                .then(function () {
                    return true;
                });
        };

    });
};
