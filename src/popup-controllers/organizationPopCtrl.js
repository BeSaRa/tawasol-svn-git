module.exports = function (app) {
    app.controller('organizationPopCtrl', function ($scope,
                                                    configurationService,
                                                    printService,
                                                    dialog,
                                                    generator,
                                                    langService,
                                                    lookupService,
                                                    downloadService,
                                                    toast,
                                                    editMode,
                                                    rootMode,
                                                    correspondenceSiteService,
                                                    OUClassification,
                                                    OUCorrespondenceSite,
                                                    Organization,
                                                    defaultTab,
                                                    organizationService,
                                                    organizationTypeService,
                                                    referencePlanNumberService,
                                                    validationService,
                                                    applicationUserService,
                                                    classificationService,
                                                    organization,
                                                    ReferencePlanItemStartSerial,
                                                    documentTemplateService,
                                                    documentStampService,
                                                    PropertyConfiguration,
                                                    allPropertyConfigurations,
                                                    propertyConfigurationService,
                                                    $q,
                                                    _,
                                                    $filter,
                                                    jobTitleService,
                                                    rankService,
                                                    themeService,
                                                    roleService,
                                                    rootEntity,
                                                    correspondenceSiteTypeService,
                                                    OUApplicationUser,
                                                    ouApplicationUserService,
                                                    userClassificationViewPermissionService,
                                                    ApplicationUser,
                                                    cmsTemplate,
                                                    employeeService,
                                                    correspondenceViewService,
                                                    ouClassificationService,
                                                    ouCorrespondenceSiteService,
                                                    gridService,
                                                    entityLDAPProviders,
                                                    distributionLists) {
        'ngInject';

        var self = this;
        self.controllerName = 'organizationPopCtrl';
        // current organization.
        self.parentOrganization = organization;

        self.distributionLists = distributionLists;

        self.employeeService = employeeService;
        // to check edit mode.
        self.editMode = editMode;
        // to check add root mode.
        self.rootMode = rootMode;
        // correspondence sites types
        self.correspondenceSiteTypes = correspondenceSiteTypeService.correspondenceSiteTypes;
        // ldap providers for entity
        self.entityLDAPProviders = entityLDAPProviders;
        self.globalSettings = rootEntity.getGlobalSettings();
        //get escalation process of global settings
        self.entityEscalationProcess = self.globalSettings.escalationProcess;
        // get permissions
        self.permissions = roleService.permissionsByGroup;
        // set copy of current organization if editMode true.
        self.organization = !self.editMode ? new Organization({
            wfsecurity: lookupService.getLookupByLookupKey(lookupService.workflowSecurity, self.globalSettings.wfsecurity),
            securitySchema: lookupService.getLookupByLookupKey(lookupService.securitySchema, self.globalSettings.securitySchema),
            ldapCode: self.entityLDAPProviders.length === 1 ? self.entityLDAPProviders[0].ldapCode : null,
            escalationProcess: (self.entityEscalationProcess !== null) ? lookupService.getLookupByLookupKey(lookupService.escalationProcess, self.entityEscalationProcess) : null
        }) : angular.copy(organization);
        self.organizationCopy = angular.copy(self.organization);
        /////////////////////////// capture the current workflow security level before update //////////////////////////
        self.initialWFSecurity = self.organization.wfsecurity;

        self.model = new Organization(organization);
        self.selectedDocumentClass = null;
        // get global correspondence sites for g2gId
        self.globalCorrespondenceSitesForG2GId = correspondenceViewService.globalCorrespondenceSitesForG2GId;
        // get global correspondence sites for internal g2gId
        self.globalCorrespondenceSitesForInternalG2GId = correspondenceViewService.globalCorrespondenceSitesForInternalG2GId;
        // get job titles
        self.jobTitles = jobTitleService.jobTitles;
        //get ranks
        self.ranks = rankService.ranks;
        // get themes
        self.themes = themeService.themes;
        // get roles
        self.roles = roleService.roles;
        //self.propertyConfiguration = new PropertyConfiguration();
        self.documentClasses = lookupService.returnLookups(lookupService.documentClass);
        self.allPropertyConfigurations = allPropertyConfigurations;
        self.propertyConfigurations = [];
        self.propertyConfigurationsCopy = angular.copy(self.propertyConfigurations);
        self.priorityLevels = lookupService.returnLookups(lookupService.priorityLevel);

        if (self.editMode && !self.rootMode) {
            self.parentOrganization = organizationService.getOrganizationById(self.organization.parent);
        }
        // list parents hasRegistry
        self.listParentsHasRegistry = organizationService.getAllParentsHasRegistry(organization, self.editMode);
        // list parents hasCentralArchive
        self.listParentsHasCentralArchive = organizationService.getAllCentralArchive(self.editMode ? organization : false);
        // all available parents
        // self.availableParents = organizationService.getAllAvailableParents(organization, organization);
        // all organizations
        self.organizations = organizationService.allOrganizationsStructure;
        // all organization Types
        self.organizationTypes = organizationTypeService.organizationTypes;
        // all security schema
        self.securitySchema = lookupService.returnLookups(lookupService.securitySchema);
        // all reference plan numbers
        self.listReferencePlanNumbers = referencePlanNumberService.referencePlanNumbers;
        // all workflow security settings
        self.workflowSecurity = lookupService.returnLookups(lookupService.workflowSecurity);
        // all escalation process
        self.escalationProcess = lookupService.returnLookups(lookupService.escalationProcess);
        // all children for current organization.
        self.organizationChildren = [];
        self.organizationChildrenCopy = angular.copy(self.organizationChildren);

        self.ouClassifications = [];
        self.ouClassificationsCopy = angular.copy(self.ouClassifications);

        self.ouCorrespondenceSites = [];
        self.ouCorrespondenceSitesCopy = angular.copy(self.ouCorrespondenceSites);

        self.documentTemplates = [];
        self.documentTemplatesCopy = angular.copy(self.documentTemplates);

        self.documentStamps = [];
        self.documentStampsCopy = angular.copy(self.documentStamps);

        self.unAssignedUserSearchText = '';

        self.privateRegOUs = [];
        self.privateRegOUsCopy = angular.copy(self.privateRegOUs);
        self.selectedPrivateRegOUs = [];

        self.ouDistributionLists = [];
        self.ouDistributionListsCopy = angular.copy(self.ouDistributionLists);
        self.selectedOUDistributionLists = [];

        self.serials = [];
        self.selectedSerialYear = (new Date()).getFullYear();
        self.serialYears = _.range(configurationService.SEARCH_YEARS, ((new Date()).getFullYear() + 1));
        self.selectedSerialOrganizations = [];

        /**
         * @description Contains options for grid configuration
         * @type {{limit: (*|number), page: number, order: string, limitOptions: *[], pagingCallback: pagingCallback}}
         */
        self.serialGrid = {
            progress: null,
            limit: gridService.getGridPagingLimitByGridName(gridService.grids.administration.serialNumbers) || 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: gridService.getGridLimitOptions(gridService.grids.administration.serialNumbers, self.serials),
            pagingCallback: function (page, limit) {
                gridService.setGridPagingLimitByGridName(gridService.grids.administration.serialNumbers, limit);
            },
            searchColumns: {
                arabicName: 'arName',
                englishName: 'enName'
            },
            searchText: ''
        };

        self.listParentsHasCentralArchive.push(new Organization({
            id: null,
            arName: langService.getKey('not_found', 'ar'),
            enName: langService.getKey('not_found', 'en')
        }));

        // labels for translate when open select user
        self.selectUserLabels = {
            adminUserId: 'select_admin',
            viceManagerId: 'select_vice_manager',
            managerId: 'select_manager'
        };

        self.removeUserLabels = {
            adminUserId: 'remove_selected_admin',
            viceManagerId: 'remove_selected_vice_manager',
            managerId: 'remove_selected_manager'
        };

        self.tabsValidate = {
            sla: {
                lang: 'sla',
                tab: 'workflow_settings'
            },
            securitySchema: {
                lang: 'security_schema',
                tab: 'security_settings'
            },
            arName: {
                lang: 'arabic_name'
            },
            enName: {
                lang: 'english_name'
            },
            correspondenceTypeId: {
                lang: 'correspondence_site_type'
            },
            registryParentId: {
                lang: 'registry_parent'
            },
            referenceNumberPlanId: {
                lang: 'reference_number_plan'
            },
            outype: {
                lang: 'organization_type'
            },
            code: {
                lang: 'code'
            },
            ldapPrefix: {
                lang: 'prefix'
            },
            ldapCode: {
                lang: 'ldap_code'
            },
            deadlineReminder: {
                lang: 'send_a_reminder_before_deadline_date_with',
                tab: 'workflow_settings'
            }
        };

        self.selectedOUClassifications = [];

        self.classifications = [];

        self.selectedOUClassification = new OUClassification({ouid: organization.id});

        self.classificationEditMode = false;


        self.selectedOUCorrespondenceSites = [];

        self.correspondenceSites = [];

        self.selectedOUCorrespondenceSite = new OUCorrespondenceSite({ouid: organization.id});

        self.correspondenceSiteEditMode = false;


        function _loadOuDistributionLists() {
            if (!self.organization.hasRegistry && self.organization.isPrivateRegistry)
                return;

            // ouDistributionLists
            organizationService
                .loadOUDistributionList(self.organization)
                .then(function (result) {
                    self.ouDistributionLists = result;
                });

        }

        if (self.editMode) {
            _loadOuDistributionLists();
        }

        /**
         * @description Get the sorting key for information or lookup model
         * @param property
         * @param modelType
         * @returns {*}
         */
        self.getSortingKey = function (property, modelType) {
            return generator.getColumnSortingKey(property, modelType);
        };

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedDataClassifications = function () {
            self.ouClassifications = $filter('orderBy')(self.ouClassifications, self.grid.classifications.order);
        };

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedDataCorrespondenceSites = function () {
            self.ouCorrespondenceSites = $filter('orderBy')(self.ouCorrespondenceSites, self.grid.correspondenceSites.order);
        };

        self.grid = {
            classifications: {
                name: 'ouClassificationsGrid',
                progress: null,
                limit: 5, // default limit
                page: 1, // first page
                //order: 'arName', // default sorting order
                order: '', // default sorting order
                limitOptions: [5, 10, 20, {
                    label: langService.get('all'),
                    value: function () {
                        return (self.ouClassifications.length + 21);
                    }
                }],
                searchColumns: {
                    id: 'classification.id',
                    arabicName: 'classification.arName',
                    englishName: 'classification.enName',
                    code: 'code',
                    itemOrder: 'itemOrder',
                    status: ''
                },
                searchText: '',
                searchCallback: function (grid) {
                    self.ouClassifications = gridService.searchGridData(self.grid.classifications, self.ouClassificationsCopy);
                }
            },
            correspondenceSites: {
                name: 'ouCorrespondenceSitesGrid',
                progress: null,
                limit: 5, // default limit
                page: 1, // first page
                //order: 'arName', // default sorting order
                order: '', // default sorting order
                limitOptions: [5, 10, 20, {
                    label: langService.get('all'),
                    value: function () {
                        return (self.ouCorrespondenceSites.length + 21);
                    }
                }],
                searchColumns: {
                    arabicName: 'correspondenceSite.arName',
                    englishName: 'correspondenceSite.enName',
                    code: 'code',
                    itemOrder: 'itemOrder',
                    status: ''
                },
                searchText: '',
                searchCallback: function (grid) {
                    self.ouCorrespondenceSites = gridService.searchGridData(self.grid.correspondenceSites, self.ouCorrespondenceSitesCopy);
                }
            }
        };

        self.services = {
            'activate': 'activateBulk',
            'deactivate': 'deactivateBulk'
        };

        self.currentOUClassifiaction = new OUClassification();
        self.currentOUCorrespondenceSite = new OUCorrespondenceSite();

        self.userAdded = false;


        self.showSaveButton = function () {
            return !(self.selectedTab === 'propertyConfiguration'
                || self.selectedTab === 'documentTemplates'
                || self.selectedTab === 'documentStamps'
                || self.selectedTab === 'correspondenceSites'
                || self.selectedTab === 'classifications'
                || self.selectedTab === 'users'
                || self.selectedTab === 'departmentUsers'
                || self.selectedTab === 'children');
        };

        /**
         * to get all right list for current organization.
         * @param organization
         */
        self.recreateAllNeeds = function (organization) {
            // list parents hasRegistry

            self.listParentsHasRegistry = organizationService.getAllParentsHasRegistry(organization);
            // list parents hasCentralArchive
            self.listParentsHasCentralArchive = organizationService.getAllParentsHasCentralArchive(organization);
            // // all available parents
            // self.availableParents = organizationService.getAllAvailableParents(organization, organization);
            // console.log(self.availableParents, 'Parents');
        };

        // TODO: need to add organization Type from here.
        self.addNewOrganizationType = function ($event) {
            organizationTypeService
                .controllerMethod
                .organizationTypeAdd($event)
                .then(function (result) {
                    organizationTypeService.loadOrganizationTypes()
                        .then(function(){
                            self.organization.outype = result;
                            self.organizationTypes.unshift(result);
                        });
                })
        };
        // TODO: need to add reference plan number from here.
        self.addNewReferencePlanNumber = function () {
            // referencePlanNumberService
        };

        /**
         * @description Handles the change status of OU
         */
        self.onChangeOUStatus = function () {
            dialog.confirmMessage(langService.get('confirm_change_affect_whole_system'))
                .then(function () {

                })
                .catch(function () {
                    self.organization.status = !self.organization.status;
                })
        };

        /**
         * centreArchive Change
         * @param centralArchive
         */
        self.centralArchiveChange = function (centralArchive) {
            dialog.confirmMessage(langService.get('confirm_change_affect_whole_system'))
                .then(function () {
                    if (centralArchive) {
                        self.organization.setCentralArchiveUnitId(null);
                    } else {
                        self.organization.setCentralArchiveUnitId(self.listParentsHasCentralArchive[0])
                    }
                    if (!(self.organization.hasRegistry || self.organization.centralArchive)) {
                        self.organization.faxId = '';
                    }

                    if (!self.organization.hasRegistry && !self.organization.centralArchive) {
                        self.organization.internalG2gId = null;
                        self.organization.g2gId = null;
                    }
                })
                .catch(function () {
                    self.organization.centralArchive = !self.organization.centralArchive;
                })
        };
        /**
         * has registry change
         * @param hasRegistry
         */
        self.hasRegistryChange = function (hasRegistry) {
            dialog.confirmMessage(langService.get('confirm_change_affect_whole_system'))
                .then(function () {
                    self.organization.ldapCode = null;
                    self.organization.isPrivateRegistry = false;
                    if (hasRegistry) {
                        self.organization.setRegistryParentId(null);
                        if (self.entityLDAPProviders.length === 1) {
                            self.organization.ldapCode = self.entityLDAPProviders[0].ldapCode;
                        }
                    } else {
                        self.organization.referencePlanItemStartSerialList = [];
                        self.organization.referenceNumberPlanId = null;
                        self.organization.centralArchiveUnitId = null;
                    }

                    if (!(self.organization.hasRegistry || self.organization.centralArchive)) {
                        self.organization.faxId = '';
                    }

                    if (self.organization.hasRegistry || self.organization.centralArchive) {
                        self.organization.internalG2gId = null;
                        self.organization.g2gId = null;
                    }
                })
                .catch(function () {
                    self.organization.hasRegistry = !self.organization.hasRegistry;
                })
        };

        /**
         * @description Checks if public registry changed to private
         * @returns {boolean}
         * @private
         */
        var _isPublicRegistryChangedToPrivate = function () {
            return (!self.model.isPrivateRegistry && self.organization.isPrivateRegistry) && self.editMode;
        };

        /**
         * @description Handles on change of isPrivateRegistry
         * @param $event
         * @returns {boolean}
         */
        self.onChangePrivateRegistry = function ($event) {
            if (_isPublicRegistryChangedToPrivate()) {
                self.organization.isPrivateRegistry = false;
                toast.info(langService.get('can_not_change_global_to_private').change({type: langService.get('reg_ou')}))
            } else if (!self.organization.isPrivateRegistry && self.editMode) {
                dialog.confirmMessage(langService.get('confirm_permanent_change')).then(function () {
                    self.organization.isPrivateRegistry = false;
                }).catch(function () {
                    self.organization.isPrivateRegistry = true;
                })
            }
        };

        /**
         * @description get reference planNumber Id from registry unit.
         * @param parent
         */
        self.registryParentChanged = function (parent) {
            self.organization.referenceNumberPlanId = parent.referenceNumberPlanId;
            self.organization.ldapCode = parent.ldapCode;
        };

        /**
         * @description to select user for admin, manager and vice manager
         * @param property
         * @param isViceManager
         * @param $event
         */
        self.selectUser = function (property, isViceManager, $event) {
            ouApplicationUserService
                .controllerMethod
                .selectOUApplicationUserSingle(self.organization, property, self.selectUserLabels[property], isViceManager, $event)
                .then(function (ouApplicationUser) {
                    self.organization[property] = ouApplicationUser.applicationUser;
                    self.isAddManagerToAllUsersEnabled = ouApplicationUser.isAddManagerToAllUsersEnabled;
                    self.isAddViceManagerToAllUsersEnabled = ouApplicationUser.isAddViceManagerToAllUsersEnabled;
                })
        };
        /**
         * to delete user from admin , manager and vice manager.
         * @param property
         */
        self.deleteUserFrom = function (property) {
            var message = langService.get(self.removeUserLabels[property]);
            dialog
                .confirmMessage(message.change({name: self.organization[property].getNames()}))
                .then(function () {
                    self.organization[property] = null;
                });
        };

        /**
         * check validation of required fields
         * @param model
         * @return {Array}
         */
        self.checkRequiredFields = function (model) {
            var required = angular.copy(model.getRequiredFields()), result = [], isAllSlaRequiredValid = false;
            if (!model.hasRegistry) {
                required.splice(required.indexOf('correspondenceTypeId'), 1);
            }
            // if no registry and no central archive, sla is not required
            if (!model.hasRegistry && !model.centralArchive) {
                required.splice(required.indexOf('sla'), 1);
            } else {
                isAllSlaRequiredValid = _.every(self.priorityLevels, function (priority) {
                    var sla = self.organization.sla ? self.organization.sla[priority.lookupKey] : null;
                    return generator.validRequired(sla);
                });
            }

            _.map(required, function (property) {
                if (!generator.validRequired(model[property]) || (!isAllSlaRequiredValid && property === 'sla'))
                    result.push(property);
            });

            return result;
        };

        /**
         * to add new organization
         */
        self.addOrganizationFromCtrl = function () {
            validationService
                .createValidation('ADD_ORGANIZATION')
                .addStep('check_required', true, self.checkRequiredFields, self.organization, function (result) {
                    return !result.length || (result.length === 1 && result[0] === 'registryParentId' && self.organization.hasRegistry);
                })
                .notifyFailure(function (step, result) {
                    generator.generateTabsError(
                        langService.get('can_not_add_for_these_reasons'),
                        result,
                        self.tabsValidate,
                        langService.get('basic_info')
                    )
                })
                // .addStep('check_valid', true, self.organization, function (result) {
                //     return !(!result.hasRegistry && result.centralArchive)
                // })
                // .notifyFailure(function () {
                //     dialog.errorMessage(langService.get('archive_and_has_registry'));
                // })
                // .addStep('check_reference_plan', true, self.organization, function (result) {
                //     return (result.hasRegistry && result.referenceNumberPlanId) || (!result.hasRegistry && !result.referenceNumberPlanId);
                // })
                // .notifyFailure(function () {
                //     generator.generateTabsError(
                //         langService.get('can_not_add_for_these_reasons'),
                //         ['referenceNumberPlanId'],
                //         self.tabsValidate,
                //         langService.get('basic_info')
                //     )
                // })
                .validate()
                .then(function () {
                    // set parent for to the organization unit.
                    if (!self.rootMode) {
                        self.organization.setParent(self.parentOrganization);
                    }

                    organizationService
                        .addOrganization(self.organization)
                        .then(function (result) {
                            self.organization = angular.copy(result);
                            self.model = angular.copy(self.organization);
                            self.recreateAllNeeds(self.organization);
                            referencePlanNumberService.loadReferencePlanNumbers().then(function (result) {
                                self.listReferencePlanNumbers = result;
                                organizationService
                                    .loadOrganizations()
                                    .then(function () {
                                        if (self.organization.hasRegistry && !self.organization.isPrivateRegistry && self.ouDistributionLists.length) {
                                            organizationService
                                                .updateDistributionListsForRegOU(self.organization, self.ouDistributionLists)
                                                .then(function () {
                                                    _loadOuDistributionLists();
                                                    toast.success(langService.get('add_success').change({name: self.organization.getNames()}));
                                                    if (self.editMode) {
                                                        dialog.hide(self.model);
                                                    }
                                                });
                                        } else {
                                            toast.success(langService.get('add_success').change({name: self.organization.getNames()}));
                                            if (self.editMode) {
                                                dialog.hide(self.model);
                                            }
                                        }
                                        self.editMode = true;
                                    });
                            })
                        })
                });


        };
        /**
         * to save the edit
         */
        self.editOrganizationFromCtrl = function () {
            if (_isPublicRegistryChangedToPrivate()) {
                self.organization.isPrivateRegistry = false;
            }
            validationService
                .createValidation('EDIT_ORGANIZATION')
                .addStep('check_required', true, self.checkRequiredFields, self.organization, function (result) {
                    return !result.length || (result.length === 1 && result[0] === 'registryParentId' && self.organization.hasRegistry);
                })
                .notifyFailure(function (step, result) {
                    generator.generateTabsError(
                        langService.get('check_this_fields'),
                        result,
                        self.tabsValidate,
                        langService.get('basic_info')
                    )
                })
                // .addStep('check_valid', true, self.organization, function (result) {
                //     return !(!result.hasRegistry && result.centralArchive)
                // })
                // .notifyFailure(function () {
                //     dialog.errorMessage(langService.get('archive_and_has_registry'));
                // })
                .validate()
                .then(function () {
                    self.organization.parent = self.parentOrganization;

                    if (self.rootMode) {
                        self.organization.parent = null;
                    }

                    /////////////////////////// validate workflow security level before update /////////////////////////

                    var initialWFSecurityKey = parseInt(self.initialWFSecurity.lookupKey);

                    var selectedWFSecurityKey = parseInt(self.organization.wfsecurity.lookupKey);

                    var isValidWFSecurityLevel = true;

                    /*if (selectedWFSecurityKey > initialWFSecurityKey) {
                        isValidWFSecurityLevel = false;
                        dialog.errorMessage(langService.get('error_setting_workflow_security_to_lower_level'));
                    }*/

                    //////////////////////// if workflow security level is valid , then update /////////////////////////
                    if (isValidWFSecurityLevel) {
                        organizationService
                            .updateOrganization(self.organization)
                            .then(function () {
                                if (self.isAddManagerToAllUsersEnabled) {
                                    organizationService.addManagerToAllUsers(self.organization.id);
                                }
                                if (self.isAddViceManagerToAllUsersEnabled) {
                                    organizationService.addManagerToAllUsers(self.organization.id, true);
                                }

                                self.model = angular.copy(self.organization);

                                if (self.organization.hasRegistry && !self.organization.isPrivateRegistry && self.ouDistributionLists.length) {
                                    organizationService
                                        .updateDistributionListsForRegOU(self.organization, self.ouDistributionLists)
                                        .then(function () {
                                            _loadOuDistributionLists();
                                            toast.success(langService.get('edit_success').change({name: self.organization.getNames()}));
                                            dialog.hide(self.model);
                                        });
                                } else {
                                    toast.success(langService.get('edit_success').change({name: self.organization.getNames()}));
                                    if (self.organization.id === employeeService.getEmployee().getOUID()) {
                                        employeeService.getEmployee().loadOrganization();
                                    }
                                    dialog.hide(self.model);
                                }
                            })
                    }
                })
        };
        /**
         * to open edit for the child organizations
         * @param organization
         * @param $event
         */
        self.openEditOrganization = function (organization, $event) {
            return organizationService
                .controllerMethod
                .organizationEdit(organization, $event)
                .then(function (organization) {
                    self.recreateAllNeeds(self.organization);
                    self.replaceChildOrganization(organization);
                })
                .catch(function (organization) {
                    self.replaceChildOrganization(organization);
                });
        };

        self.childrenGrid = {
            name: 'childrenGrid',
            progress: null,
            searchColumns: {
                depNameAr: 'arName',
                depNameEn: 'enName',
                parentOrReportingToAr: function (record) {
                    if (record.hasOwnProperty('parentOrReportingToInfo') && record.parentOrReportingToInfo)
                        return 'parentOrReportingToInfo.arName';
                    return '';
                },
                parentOrReportingToEn: function (record) {
                    if (record.hasOwnProperty('parentOrReportingToInfo') && record.parentOrReportingToInfo)
                        return 'parentOrReportingToInfo.enName';
                    return '';
                },
                organizationTypeAr: 'organizationTypeInfo.arName',
                organizationTypeEn: 'organizationTypeInfo.enName'
            },
            searchText: '',
            searchCallback: function (grid) {
                self.organizationChildren = gridService.searchGridData(self.childrenGrid, self.organizationChildrenCopy);
            }
        };

        /**
         * to replace children organization after edit or update
         * @param replace
         */
        self.replaceChildOrganization = function (replace) {
            self.organizationChildren = _.map(self.organizationChildren, function (organization) {
                if (organization.id === replace.id)
                    organization = replace;

                return organization;
            });
            self.organizationChildrenCopy = angular.copy(self.organizationChildren);
        };

        /**
         * @description Reload Children grid
         * @param pageNumber
         * @returns {*}
         */
        self.reloadChildren = function (pageNumber) {
            var defer = $q.defer();
            self.childrenGrid.progress = defer.promise;
            return organizationService.loadOrganizationChildren(self.organization, false)
                .then(function (result) {
                    self.organizationChildren = result;
                    self.organizationChildrenCopy = angular.copy(self.organizationChildren);
                    defer.resolve(true);
                    if (pageNumber)
                        self.childrenGrid.page = pageNumber;
                    self.childrenGrid.searchCallback();
                    return result;
                });
        };

        /**
         * @description Clears the searchText for the given field
         * @param fieldType
         */
        self.clearSearchText = function (fieldType) {
            self[fieldType + 'SearchText'] = '';
        };

        /**
         * @description Prevent the default dropdown behavior of keys inside the search box of dropdown
         * @param $event
         */
        self.preventSearchKeyDown = function ($event) {
            if ($event) {
                var code = $event.which || $event.keyCode;
                if (code !== 38 && code !== 40)
                    $event.stopPropagation();
            }
        };

        self.changeOrganizationStatus = function (organization) {
            return organization
                .updateStatus()
                .then(function () {
                    toast.success(langService.get('specific_status_success').change({name: organization.getTranslatedName()}));
                })
                .catch(function () {
                    toast.error("Failed !!");
                })
        };

        self.createDefaultOURelations = function () {
            self.selectedOUClassification = new OUClassification({ouid: self.organization.id});
            self.selectedOUCorrespondenceSite = new OUCorrespondenceSite({ouid: self.organization.id});
        };


        self.confirmChangeSecuritySchema = function ($event) {
            var defer = $q.defer();
            if (self.organization.securitySchema.lookupKey === 1) {
                dialog.confirmMessage(langService.get('confirm_document_security_schema_change'))
                    .then(function (result) {
                        defer.resolve(true);
                    }).catch(function (result) {
                    defer.reject(false);
                })
            } else {
                defer.resolve(true);
            }
            defer.promise.then(function (response) {

            })
                .catch(function (error) {
                    self.organization.securitySchema = lookupService.getLookupByLookupKey(lookupService.securitySchema, 0);
                })
        };

        self.classificationExists = function (classification) {
            return _.find(self.ouClassifications, function (ouClassification) {
                var id = ouClassification.classification.id;
                if (self.classificationEditMode) {
                    return ouClassification.id === classification.id && ouClassification.id !== self.currentOUClassifiaction.id;
                } else {
                    return id === classification.id
                }
            });
        };

        self.addSelectedOUClassification = function () {
            return validationService
                .createValidation('OUClassification')
                .addStep('check_required', true, generator.checkRequiredFields, self.selectedOUClassification, function (result) {
                    return !result.length
                })
                .notifyFailure(function (result) {
                    dialog.alertMessage(generator.generateErrorFields('check_this_fields', result));
                })
                .validate()
                .then(function () {

                    if (self.classificationEditMode) {
                        self.updateOUClassification(self.selectedOUClassification);
                        return;
                    }

                    self.organization
                        .addOUClassification(self.selectedOUClassification)
                        .then(function (ouClassification) {
                            self.selectedOUClassification = new OUClassification({ouid: self.organization.id});
                            toast.success(langService.get('add_success').change({name: ouClassification.classification.getTranslatedName()}));
                            self.ouClassifications.push(ouClassification);
                        })
                })
        };

        self.removeOUClassification = function (ouClassification) {
            dialog
                .confirmMessage(langService.get('confirm_delete').change({name: ouClassification.classification.getTranslatedName()}))
                .then(function () {
                    return self
                        .organization
                        .deleteOUClassification(ouClassification)
                        .then(function () {
                            toast.success(langService.get('delete_success'));
                            var id = ouClassification.id;
                            self.ouClassifications = _.filter(self.ouClassifications, function (ouClassification) {
                                return ouClassification.id !== id;
                            });
                            self.ouClassificationsCopy = angular.copy(self.ouClassifications);
                        });
                })

        };

        self.changeBulkStatusOUClassifications = function (status) {
            var result = status === 'activate';
            self.organization[self.services[status] + 'OUClassifications'](self.selectedOUClassifications).then(function () {
                toast.success(langService.get('status_success'));
                var ids = _.map(self.selectedOUClassifications, 'id');
                self.selectedOUClassifications = [];
                self.ouClassifications = _.map(self.ouClassifications, function (ouClassification) {
                    if (ids.indexOf(ouClassification.id) !== -1) {
                        ouClassification.status = result;
                    }
                    return ouClassification;
                });
                self.ouClassificationsCopy = angular.copy(self.ouClassifications);
            })
        };

        self.editOUClassification = function (ouClassification, $event) {
            self.selectedOUClassification = angular.copy(ouClassification);
            self.classificationEditMode = true;
            self.currentOUClassifiaction = angular.copy(ouClassification);
        };

        self.editOUClassificationOnly = function (ouClassification, $event) {
            self.resetEditClassificationMode();
            return classificationService
                .controllerMethod
                .classificationEdit(ouClassification, self.organization, $event)
                .then(function (classification) {
                    toast.success(langService.get('update_success'));
                    ouClassification.classification = classification;
                    self.ouClassificationsCopy = angular.copy(self.ouClassifications);
                })

        };

        self.updateOUClassification = function () {
            return self.organization.updateOUClassification(self.selectedOUClassification)
                .then(function (result) {
                    toast.success(langService.get('update_success'));
                    self.classificationEditMode = false;
                    self.selectedOUClassification = null;
                    self.ouClassifications = _.map(self.ouClassifications, function (ouClassification) {
                        if (ouClassification.id === result.id) {
                            ouClassification = result;
                        }
                        return ouClassification;
                    });
                    self.ouClassificationsCopy = angular.copy(self.ouClassifications);
                });
        };

        self.resetEditClassificationMode = function () {
            self.selectedOUClassification = null;
            self.classificationEditMode = false;
            self.currentOUClassifiaction = null;
        };

        self.changeOUClassificationStatus = function (ouClassification) {
            ouClassification.updateStatus().then(function () {
                toast.success(langService.get('status_success'));
            });
        };

        self.removeBulkOUClassifications = function ($event) {
            dialog.confirmMessage(langService.get('confirm_delete_selected_multiple'), null, null, $event)
                .then(function () {
                    self.organization.deleteAllOUClassifications(self.selectedOUClassifications).then(function () {
                        toast.success(langService.get('delete_success'));
                        var ids = _.map(self.selectedOUClassifications, 'id');
                        self.selectedOUClassifications = [];
                        self.ouClassifications = _.filter(self.ouClassifications, function (ouClassification) {
                            return ids.indexOf(ouClassification.id) === -1;
                        });
                        self.ouClassificationsCopy = angular.copy(self.ouClassifications);
                    })
                })
        };


        self.noMoreClassifications = function () {
            return self.ouClassifications.length === self.classifications.length;
        };

        self.addExistsOUClassification = function () {
            var excluded = _.map(self.ouClassifications, 'classification');
            return classificationService
                .controllerMethod
                .showClassificationSelector(excluded)
                .then(function (selectedClassifications) {
                    self.organization
                        .assignClassifications(selectedClassifications)
                        .then(function (ouClassifications) {
                            self.ouClassifications = self.ouClassifications.concat(ouClassifications);
                            self.ouClassificationsCopy = angular.copy(self.ouClassifications);
                            toast.success(langService.get('add_success').change({name: langService.get('classifications')}));
                        })
                });
        };

        self.addAllExistsOUClassifications = function () {
            var excluded = _.map(_.map(self.ouClassifications, function (ouClassification) {
                return ouClassification.classification;
            }), 'id');

            var availableClassifications = _.filter(self.classifications, function (classification) {
                return excluded.indexOf(classification.id) === -1 && classification.status && !classification.isGlobal;
            });

            if (!availableClassifications.length) {
                dialog.infoMessage(langService.get('no_records_to_add').change({name: langService.get('classification')}));
                return;
            }

            self.organization
                .assignClassifications(availableClassifications)
                .then(function (ouClassifications) {
                    self.ouClassifications = self.ouClassifications.concat(ouClassifications);
                    self.ouClassificationsCopy = angular.copy(self.ouClassifications);
                    toast.success(langService.get('add_success').change({name: langService.get('classifications')}));
                });
        };

        /**
         * @description Opens popup for adding new classification and link to current OU
         * @param $event
         * @returns {*}
         */
        self.addNewOUClassification = function ($event) {
            return classificationService
                .controllerMethod
                .classificationAdd(null, self.organization, $event)
                .then(function (ouClassification) {
                    self.ouClassifications = self.ouClassifications.concat(ouClassification);
                    self.ouClassificationsCopy = angular.copy(self.ouClassifications);
                })
        };

        function _getClassifications() {
            return classificationService.getClassifications()
                .then(function (classificationsResult) {
                    return self.classifications = classificationsResult;
                });
        }

        self.reloadOUClassifications = function (pageNumber) {
            if (!self.model.hasRegistry) {
                return null;
            }

            var classificationsDefer = $q.defer();
            if (self.tabsData.classifications.loaded) {
                classificationsDefer.resolve(true);
            } else {
                _getClassifications().then(function () {
                    classificationsDefer.resolve(true);
                })
            }

            return classificationsDefer.promise.then(function () {
                var defer = $q.defer();
                self.grid.classifications.progress = defer.promise;
                return ouClassificationService
                    .loadOUClassificationsByOuId(self.organization)
                    .then(function (result) {
                        self.ouClassifications = result;
                        self.ouClassificationsCopy = angular.copy(self.ouClassifications);
                        self.selectedOUClassifications = [];
                        self.selectedOUClassification = null;
                        defer.resolve(true);
                        if (pageNumber)
                            self.grid.classifications.page = pageNumber;
                        self.getSortedDataClassifications();
                        self.grid.classifications.searchCallback();
                        return result;
                    });
            });
        };


        /****** correspondence Site section ********/

        self.correspondenceSiteExists = function (correspondenceSite) {
            return _.find(self.ouCorrespondenceSites, function (ouCorrespondenceSite) {
                var id = ouCorrespondenceSite.correspondenceSite.id;
                if (self.correspondenceSiteEditMode) {
                    return ouCorrespondenceSite.id === correspondenceSite.id && ouCorrespondenceSite.id !== self.currentOUCorrespondenceSite.id;
                } else {
                    return id === correspondenceSite.id
                }
            });
        };

        self.disableAddOUCorrespondenceSite = function () {
            return generator.checkRequiredFields(self.selectedOUCorrespondenceSite).length;
        };

        self.updateOUCorrespondenceSite = function (selectedOUCorrespondenceSite) {
            return self.organization.updateOUCorrespondenceSite(selectedOUCorrespondenceSite)
                .then(function (selectedOUCorrespondenceSite) {
                    toast.success(langService.get('update_success'));
                    self.correspondenceSiteEditMode = false;
                    self.selectedOUCorrespondenceSite = null;
                    self.ouCorrespondenceSites = _.map(self.ouCorrespondenceSites, function (ouCorrespondenceSite) {
                        if (ouCorrespondenceSite.id === selectedOUCorrespondenceSite.id) {
                            ouCorrespondenceSite = selectedOUCorrespondenceSite;
                        }
                        return ouCorrespondenceSite;
                    });
                    self.ouCorrespondenceSitesCopy = angular.copy(self.ouCorrespondenceSites);
                });
        };

        self.addSelectedOUCorrespondenceSite = function () {
            return validationService
                .createValidation('OUCorrespondenceSite')
                .addStep('check_required', true, generator.checkRequiredFields, self.selectedOUCorrespondenceSite, function (result) {
                    return !result.length
                })
                .notifyFailure(function (result) {
                    dialog.alertMessage(generator.generateErrorFields('check_this_fields', result));
                })
                .validate()
                .then(function () {

                    if (self.correspondenceSiteEditMode) {
                        self.updateOUCorrespondenceSite(self.selectedOUCorrespondenceSite);
                        return;
                    }

                    self.organization
                        .addOUCorrespondenceSite(self.selectedOUCorrespondenceSite)
                        .then(function (ouCorrespondenceSite) {
                            self.selectedOUCorrespondenceSite = new OUCorrespondenceSite({ouid: self.organization.id});
                            toast.success(langService.get('add_success').change({name: ouCorrespondenceSite.correspondenceSite.getNames()}));
                            self.ouCorrespondenceSites.push(ouCorrespondenceSite);
                        })
                })
        };

        self.removeOUCorrespondenceSite = function (ouCorrespondenceSite) {
            dialog
                .confirmMessage(langService.get('confirm_delete').change({name: ouCorrespondenceSite.correspondenceSite.getNames()}))
                .then(function () {
                    return self
                        .organization
                        .deleteOUCorrespondenceSite(ouCorrespondenceSite)
                        .then(function () {
                            toast.success(langService.get('delete_success'));
                            var id = ouCorrespondenceSite.id;
                            self.ouCorrespondenceSites = _.filter(self.ouCorrespondenceSites, function (ouCorrespondenceSite) {
                                return ouCorrespondenceSite.id !== id;
                            });
                            self.ouCorrespondenceSitesCopy = angular.copy(self.ouCorrespondenceSites);
                        });
                })

        };

        self.changeBulkStatusOUCorrespondenceSites = function (status) {
            var result = status === 'activate';
            self.organization[self.services[status] + 'OUCorrespondenceSites'](self.selectedOUCorrespondenceSites).then(function () {
                toast.success(langService.get('status_success'));
                var ids = _.map(self.selectedOUCorrespondenceSites, 'id');
                self.selectedOUCorrespondenceSites = [];
                self.ouCorrespondenceSites = _.map(self.ouCorrespondenceSites, function (ouCorrespondenceSite) {
                    if (ids.indexOf(ouCorrespondenceSite.id) !== -1) {
                        ouCorrespondenceSite.status = result;
                    }
                    return ouCorrespondenceSite;
                });
                self.ouCorrespondenceSitesCopy = angular.copy(self.ouCorrespondenceSites);
            })
        };

        self.changeOUCorrespondenceSiteStatus = function (ouCorrespondenceSite) {
            ouCorrespondenceSite.updateStatus().then(function () {
                toast.success(langService.get('status_success'));
            });
        };

        self.removeBulkOUCorrespondenceSites = function ($event) {
            dialog.confirmMessage(langService.get('confirm_delete_selected_multiple'), null, null, $event)
                .then(function () {
                    self.organization.deleteAllOUCorrespondenceSites(self.selectedOUCorrespondenceSites).then(function () {
                        toast.success(langService.get('delete_success'));
                        var ids = _.map(self.selectedOUCorrespondenceSites, 'id');
                        self.selectedOUCorrespondenceSites = [];
                        self.ouCorrespondenceSites = _.filter(self.ouCorrespondenceSites, function (ouCorrespondenceSite) {
                            return ids.indexOf(ouCorrespondenceSite.id) === -1;
                        });
                        self.ouCorrespondenceSitesCopy = angular.copy(self.ouCorrespondenceSites);
                    })
                })
        };


        self.noMoreCorrespondenceSites = function () {
            return self.ouCorrespondenceSites.length === self.correspondenceSites.length;
        };

        self.addExistsOUCorrespondenceSite = function () {
            var excluded = _.map(self.ouCorrespondenceSites, 'correspondenceSite');
            return correspondenceSiteService
                .controllerMethod
                .showCorrespondenceSiteSelector(excluded)
                .then(function (selectedCorrespondenceSites) {
                    self.organization
                        .assignCorrespondenceSites(selectedCorrespondenceSites)
                        .then(function (ouCorrespondenceSites) {
                            self.ouCorrespondenceSites = self.ouCorrespondenceSites.concat(ouCorrespondenceSites);
                            self.ouCorrespondenceSitesCopy = angular.copy(self.ouCorrespondenceSites);
                            toast.success(langService.get('add_success').change({name: langService.get('correspondence_sites')}));
                        })
                });
        };

        self.addAllExistsOUCorrespondenceSites = function () {
            var excluded = _.map(_.map(self.ouCorrespondenceSites, function (ouCorrespondenceSites) {
                return ouCorrespondenceSites.correspondenceSite;
            }), 'id');

            var availableCorrespondenceSites = _.filter(self.correspondenceSites, function (correspondenceSite) {
                return excluded.indexOf(correspondenceSite.id) === -1 && correspondenceSite.status && !correspondenceSite.isGlobal;
            });

            if (!availableCorrespondenceSites.length) {
                dialog.infoMessage(langService.get('no_records_to_add').change({name: langService.get('correspondence_site')}));
                return;
            }

            self.organization
                .assignCorrespondenceSites(availableCorrespondenceSites)
                .then(function (ouCorrespondenceSites) {
                    self.ouCorrespondenceSites = self.ouCorrespondenceSites.concat(ouCorrespondenceSites);
                    self.ouCorrespondenceSitesCopy = angular.copy(self.ouCorrespondenceSites);
                    toast.success(langService.get('add_success').change({name: langService.get('correspondence_sites')}));
                });
        };

        /**
         * @description Opens popup for adding new correspondence site and link to current OU
         * @param $event
         * @returns {*}
         */
        self.addNewOUCorrespondenceSite = function ($event) {
            return correspondenceSiteService
                .controllerMethod
                .correspondenceSiteAdd(null, self.organization, $event)
                .then(function (ouCorrespondenceSite) {
                    self.ouCorrespondenceSites = self.ouCorrespondenceSites.concat(ouCorrespondenceSite);
                    self.ouCorrespondenceSitesCopy = angular.copy(self.ouCorrespondenceSites);
                })
        };


        self.editOUCorrespondenceSite = function (ouCorrespondenceSite) {
            self.selectedOUCorrespondenceSite = angular.copy(ouCorrespondenceSite);
            self.correspondenceSiteEditMode = true;
            self.currentOUCorrespondenceSite = angular.copy(ouCorrespondenceSite);
        };

        self.resetEditCorrespondenceSiteMode = function () {
            self.selectedOUCorrespondenceSite = null;
            self.correspondenceSiteEditMode = false;
            self.currentOUCorrespondenceSite = null;
        };

        self.editOUCorrespondenceSiteOnly = function (ouCorrespondenceSite, $event) {
            self.resetEditCorrespondenceSiteMode();

            return correspondenceSiteService
                .controllerMethod
                .correspondenceSiteEdit(ouCorrespondenceSite, self.organization, $event)
                .then(function (correspondenceSite) {
                    toast.success(langService.get('update_success'));
                    ouCorrespondenceSite.correspondenceSite = correspondenceSite;
                    self.ouCorrespondenceSitesCopy = angular.copy(self.ouCorrespondenceSites);
                })

        };

        function _getCorrespondenceSites() {
            return correspondenceSiteService.loadCorrespondenceSitesWithLimit(100)
                .then(function (corrSitesResult) {
                    return self.correspondenceSites = corrSitesResult;
                });
        }

        self.reloadOUCorrespondenceSites = function (pageNumber) {
            if (!self.model.hasRegistry) {
                return null;
            }

            var corrSitesDefer = $q.defer();
            if (self.tabsData.correspondenceSites.loaded) {
                corrSitesDefer.resolve(true);
            } else {
                _getCorrespondenceSites().then(function () {
                    corrSitesDefer.resolve(true);
                })
            }

            return corrSitesDefer.promise.then(function () {
                var defer = $q.defer();
                self.grid.correspondenceSites.progress = defer.promise;
                return ouCorrespondenceSiteService
                    .loadOUCorrespondenceSitesByOuId(self.organization)
                    .then(function (result) {
                        self.ouCorrespondenceSites = result;
                        self.ouCorrespondenceSitesCopy = angular.copy(self.ouCorrespondenceSites);
                        self.selectedOUCorrespondenceSites = [];
                        self.selectedOUCorrespondenceSite = null;
                        defer.resolve(true);
                        if (pageNumber)
                            self.grid.correspondenceSites.page = pageNumber;
                        self.getSortedDataCorrespondenceSites();
                        self.grid.correspondenceSites.searchCallback();
                        return result;
                    });
            });
        };

        /**
         * @description Contains the selected document templates
         * @type {Array}
         */
        self.selectedDocumentTemplates = [];

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedDataTemplate = function () {
            self.documentTemplates = $filter('orderBy')(self.documentTemplates, self.documentTemplateGrid.order);
        };

        /**
         * @description Contains options for grid configuration
         * @type {{limit: number, page: number, order: string, limitOptions: [*]}}
         */
        self.documentTemplateGrid = {
            name: 'documentTemplateGrid',
            progress: null,
            limit: 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: [5, 10, 20, // limit options
                {
                    label: langService.get('all'),
                    value: function () {
                        return (self.documentTemplates.length + 21)
                    }
                }
            ],
            searchColumns: {
                docSubject: 'docSubject',
                documentTitle: 'documentTitle',
                docType: function () {
                    return self.getSortingKey('docTypeInfo', 'Information');
                }
            },
            searchText: '',
            searchCallback: function (grid) {
                self.documentTemplates = gridService.searchGridData(self.documentTemplateGrid, self.documentTemplatesCopy);
            }
        };

        /**
         * @description Opens dialog for add new document template
         * @param $event
         */
        self.openAddDocumentTemplateDialog = function ($event) {
            documentTemplateService
                .controllerMethod
                .documentTemplateAdd(organization.id, (organization.hasRegistry ? null : organization.id), $event)
                .then(function (result) {
                    self.reloadDocumentTemplates(self.documentTemplateGrid.page)
                        .then(function () {
                            toast.success(langService.get('add_success').change({name: result.getSubjectTitle()}));
                        });
                });
        };

        /**
         * @description Opens dialog for edit document template
         * @param $event
         * @param documentTemplate
         */
        self.openEditDocumentTemplateDialog = function (documentTemplate, $event) {
            documentTemplateService
                .controllerMethod
                .documentTemplateEdit(documentTemplate, $event)
                .then(function (result) {
                    self.reloadDocumentTemplates(self.documentTemplateGrid.page)
                        .then(function () {
                            toast.success(langService.get('edit_success').change({name: result.getSubjectTitle()}));
                        });
                });
        };

        /**
         * @description Reload the grid of document template
         * @param pageNumber
         * @return {*|Promise<U>}
         */
        self.reloadDocumentTemplates = function (pageNumber) {
            var defer = $q.defer();
            self.documentTemplateGrid.progress = defer.promise;
            return documentTemplateService
                .loadDocumentTemplates(organization, null, (!organization.hasRegistry ? organization.id : null))
                .then(function (result) {
                    self.documentTemplates = result;
                    self.documentTemplatesCopy = angular.copy(self.documentTemplates);
                    self.selectedDocumentTemplates = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.documentTemplateGrid.page = pageNumber;
                    self.getSortedDataTemplate();
                    self.documentTemplateGrid.searchCallback();
                    return result;
                });
        };

        /**
         * @description Delete single document template
         * @param documentTemplate
         * @param $event
         */
        self.removeDocumentTemplate = function (documentTemplate, $event) {
            documentTemplateService
                .controllerMethod
                .documentTemplateDelete(documentTemplate, $event)
                .then(function () {
                    self.reloadDocumentTemplates(self.documentTemplateGrid.page);
                });
        };

        /**
         * @description Downloads the original document template
         * @param documentTemplate
         * @param $event
         */
        self.downloadDocumentTemplate = function (documentTemplate, $event) {
            downloadService.controllerMethod
                .documentTemplateDownload(documentTemplate);
        };


        /**
         * @description Contains the selected document stamps
         * @type {Array}
         */
        self.selectedDocumentStamps = [];

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedDataStamp = function () {
            self.documentStamps = $filter('orderBy')(self.documentStamps, self.documentStampGrid.order);
        };

        /**
         * @description Contains options for grid configuration
         * @type {{limit: number, page: number, order: string, limitOptions: [*]}}
         */
        self.documentStampGrid = {
            name: 'documentStampGrid',
            progress: null,
            limit: 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: [5, 10, 20, // limit options
                {
                    label: langService.get('all'),
                    value: function () {
                        return (self.documentStamps.length + 21)
                    }
                }
            ],
            searchColumns: {
                docSubject: 'docSubject',
                documentTitle: 'documentTitle'
            },
            searchText: '',
            searchCallback: function (grid) {
                self.documentStamps = gridService.searchGridData(self.documentStampGrid, self.documentStampsCopy);
            }
        };

        /**
         * @description Opens dialog for add new document stamp
         * @param $event
         */
        self.openAddDocumentStampDialog = function ($event) {
            documentStampService
                .controllerMethod
                .documentStampAdd($event, organization.id, $event)
                .then(function (result) {
                    self.reloadDocumentStamps(self.documentStampGrid.page)
                        .then(function () {
                            toast.success(langService.get('add_success').change({name: result.getSubjectTitle()}));
                        });
                });
        };

        /**
         * @description Opens dialog for edit document stamp
         * @param $event
         * @param documentStamp
         */
        self.openEditDocumentStampDialog = function (documentStamp, $event) {
            documentStampService
                .controllerMethod
                .documentStampEdit(documentStamp, $event)
                .then(function (result) {
                    self.reloadDocumentStamps(self.documentStampGrid.page)
                        .then(function () {
                            toast.success(langService.get('edit_success').change({name: result.getSubjectTitle()}));
                        });
                });
        };

        /**
         * @description Reload the grid of document stamp
         * @param pageNumber
         * @return {*|Promise<U>}
         */
        self.reloadDocumentStamps = function (pageNumber) {
            var defer = $q.defer();
            self.documentStampGrid.progress = defer.promise;
            return documentStampService
                .loadDocumentStamps(organization)
                .then(function (result) {
                    self.documentStamps = result;
                    self.documentStampsCopy = angular.copy(self.documentStamps);
                    self.selectedDocumentStamps = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.documentStampGrid.page = pageNumber;
                    self.getSortedDataStamp();
                    self.documentStampGrid.searchCallback();
                    return result;
                });
        };

        /**
         * @description Delete single document stamp
         * @param documentStamp
         * @param $event
         */
        self.removeDocumentStamp = function (documentStamp, $event) {
            documentStampService
                .controllerMethod
                .documentStampDelete(documentStamp, $event)
                .then(function () {
                    self.reloadDocumentStamps(self.documentStampGrid.page);
                });
        };


        self.selectedPropertyConfigurations = [];

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedDataPropertyConfiguration = function () {
            self.propertyConfigurations = $filter('orderBy')(self.propertyConfigurations, self.propertyConfigurationGrid.order);
        };

        /**
         * @description Contains options for grid configuration
         * @type {{limit: number, page: number, order: string, limitOptions: [*]}}
         */
        self.propertyConfigurationGrid = {
            name: 'propertyConfigurationGrid',
            progress: null,
            limit: 5, // default limit
            page: 1, // first page
            //order: 'arName', // default sorting order
            order: '', // default sorting order
            limitOptions: [5, 10, 20, // limit options
                {
                    label: langService.get('all'),
                    value: function () {
                        return (self.propertyConfigurations.length + 21)
                    }
                }
            ],
            searchColumns: {
                dataType: 'dataType',
                defaultOperator: 'defaultOperator',
                defaultValue: 'defaultValue',
                spName: 'spName',
                symbolicName: 'symbolicName'
            },
            searchText: '',
            searchCallback: function (grid) {
                self.propertyConfigurations = gridService.searchGridData(self.propertyConfigurationGrid, self.propertyConfigurationsCopy);
            }
        };

        self.searchModelPropertyConfigurations = {
            symbolicName: ''
        };

        /**
         * to enable/disable add/reload button if document class select box is selected
         * @returns {boolean}
         */
        self.checkDocumentClassSelected = function () {
            if (self.selectedDocumentClass) {
                return false;
            }
            return true;
        };


        self.reloadPropertyConfigurations = function (pageNumber) {
            var defer = $q.defer();
            self.propertyConfigurationGrid.progress = defer.promise;

            var docClass = (self.selectedDocumentClass.hasOwnProperty('lookupKey') ? self.selectedDocumentClass.lookupStrKey : self.selectedDocumentClass);
            return propertyConfigurationService
                .loadPropertyConfigurationsByDocumentClassAndOU(docClass.toLowerCase(), self.organization.id)
                .then(function (result) {
                    self.allPropertyConfigurations[docClass.toLowerCase()] = result;
                    self.propertyConfigurations = result;
                    self.propertyConfigurationsCopy = angular.copy(self.propertyConfigurations);
                    defer.resolve(true);

                    self.selectedPropertyConfigurations = [];
                    if (pageNumber)
                        self.propertyConfigurationGrid.page = pageNumber;

                    var currentUserOrg = employeeService.getEmployee().userOrganization;
                    var loggedInOuId = currentUserOrg.hasOwnProperty('id') ? currentUserOrg.id : currentUserOrg;
                    if (self.organization.id === loggedInOuId) {
                        lookupService.replacePropertyConfigurationsByDocumentClass(result, docClass.toLowerCase());
                    }
                    self.getSortedDataPropertyConfiguration();
                    self.propertyConfigurationGrid.searchCallback();
                    return result;
                })
        };

        self.filterPropertyConfigurationsForOUByDocumentClass = function () {
            var docClass = (self.selectedDocumentClass.hasOwnProperty('lookupKey') ? self.selectedDocumentClass.lookupStrKey : self.selectedDocumentClass);
            self.propertyConfigurations = self.allPropertyConfigurations[docClass.toLowerCase()];
            self.propertyConfigurationsCopy = angular.copy(self.propertyConfigurations);
            self.getSortedDataPropertyConfiguration();
            self.propertyConfigurationGrid.searchCallback();
        };

        self.openAddPropertyConfigurationsDialog = function ($event) {
            propertyConfigurationService
                .controllerMethod
                .propertyConfigurationAdd(self.organization.id, self.selectedDocumentClass.lookupKey, $event)
                .then(function (result) {
                    if (result) {
                        self.reloadPropertyConfigurations(self.propertyConfigurationGrid.page)
                            .then(function () {
                                self.filterPropertyConfigurationsForOUByDocumentClass();
                                toast.success(langService.get('save_success'));
                            });
                    }
                });
        };

        self.openEditPropertyConfigurationsDialog = function (propertyConfiguration, $event) {
            propertyConfigurationService
                .controllerMethod
                .propertyConfigurationEdit(propertyConfiguration, $event)
                .then(function (result) {
                    if (result) {
                        self.reloadPropertyConfigurations(self.propertyConfigurationGrid.page)
                            .then(function () {
                                self.filterPropertyConfigurationsForOUByDocumentClass();
                                toast.success(langService.get('edited_successfully'));
                            });
                    }
                });
        };


        /**
         * @description Contains the selected application users
         * @type {Array}
         */
        self.selectedOUApplicationUsers = [];

        self.ouAssignedUsers = [];
        self.ouAssignedUsersCopy = angular.copy(self.ouAssignedUsers);
        self.unAssignedUsers = [];
        self.selectedUnassignedUser = null;

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedDataAppUser = function () {
            self.ouAssignedUsers = $filter('orderBy')(self.ouAssignedUsers, self.appUserGrid.order);
        };

        /**
         * @description Contains options for grid configuration
         * @type {{limit: number, page: number, order: string, limitOptions: [*]}}
         */
        self.appUserGrid = {
            name: 'appUserGrid',
            progress: null,
            limit: 5, // default limit
            page: 1, // first page
            //order: 'arName', // default sorting order
            order: '', // default sorting order
            limitOptions: [5, 10, 20, // limit options
                {
                    label: langService.get('all'),
                    value: function () {
                        return (self.ouAssignedUsers.length + 21)
                    }
                }
            ],
            searchColumns: {
                arabicName: 'applicationUser.arFullName',
                englishName: 'applicationUser.enFullName',
                loginName: 'applicationUser.loginName',
                domainName: 'applicationUser.domainName'
            },
            searchText: '',
            searchCallback: function (grid) {
                self.ouAssignedUsers = gridService.searchGridData(self.appUserGrid, self.ouAssignedUsersCopy);
            }
        };

        /**
         * @description Reload the grid of application user
         * @param pageNumber
         * @return {*|Promise<U>}
         */
        self.reloadOuApplicationUsers = function (pageNumber) {
            var defer = $q.defer();
            self.appUserGrid.progress = defer.promise;


            return ouApplicationUserService
                .loadUnassignedOUApplicationUsers(organization.id)
                .then(function (result) {
                    self.unAssignedUsers = result;

                    return ouApplicationUserService
                        .loadRelatedOUApplicationUsers(organization.id)
                        .then(function (result) {
                            self.ouAssignedUsers = result;
                            self.ouAssignedUsersCopy = angular.copy(self.ouAssignedUsers);
                            self.selectedOUApplicationUsers = [];
                            defer.resolve(true);
                            if (pageNumber)
                                self.appUserGrid.page = pageNumber;
                            self.getSortedDataAppUser();
                            self.appUserGrid.searchCallback();
                            return result;
                        });
                });
        };


        /**
         * @description Opens dialog for add new application user
         * @param $event
         */
        self.openAddApplicationUserDialog = function ($event) {
            applicationUserService
                .controllerMethod
                .applicationUserFromOuAdd(self.organization, $event)
                .then(function () {
                    self.reloadOuApplicationUsers(self.appUserGrid.page);
                    self.reloadDepartmentUsers(self.departmentUsersGrid.page);
                })
                .catch(function () {
                    self.reloadOuApplicationUsers(self.appUserGrid.page);
                    self.reloadDepartmentUsers(self.departmentUsersGrid.page);
                });
        };

        /**
         * @description Opens dialog for edit application user
         * @param $event
         * @param {ApplicationUser} ouApplicationUser
         */
        self.openEditApplicationUserDialog = function (ouApplicationUser, $event) {
            if (!(ouApplicationUser instanceof OUApplicationUser)) {
                return;
            }

            // validationService
            //     .createValidation('LOAD_USER_CLASSIFICATION_VIEW_PERMISSIONS')
            //     .addStep('load_user_classification', true, userClassificationViewPermissionService.loadUserClassificationViewPermissions, organization.id, function (result) {
            //         self.userClassificationViewPermissions = result;
            //         return result;
            //     })
            //     .notifyFailure(function (step, result) {
            //
            //     })
            //     .validate()
            //     .then(function () {
            applicationUserService
                .controllerMethod
                .applicationUserFromOuEdit(ouApplicationUser, $event)
                .then(function () {
                    self.reloadOuApplicationUsers(self.appUserGrid.page);
                    self.reloadDepartmentUsers(self.departmentUsersGrid.page);
                });
            // })
            // .catch(function () {
            //
            // });
        };

        /**
         * @description Open the popup to assign/add the selected unassigned user to organization
         * @param $event
         */
        self.assignUserToOU = function ($event) {
            var ouApplicationUser = new OUApplicationUser({
                id: null,
                ouid: self.organization,
                applicationUser: self.selectedUnassignedUser,
                wfsecurity: self.organization.wfsecurity.lookupKey
            });
            return dialog
                .showDialog({
                    targetEvent: $event,
                    templateUrl: cmsTemplate.getPopup('ou-unassigned-user'),
                    controller: 'ouUnassignedUserPopCtrl',
                    controllerAs: 'ctrl',
                    locals: {
                        ouApplicationUser: ouApplicationUser
                    }
                }).then(function (ouApplicationUser) {
                    self.ouAssignedUsers.unshift(ouApplicationUser);
                    self.departmentUsers.unshift(ouApplicationUser);
                    self.userAdded = !self.userAdded;
                    self.selectedUnassignedUser = null;
                })
                .catch(function(error){
                    self.selectedUnassignedUser = null;
                });
        };

        self.userExistsInOrganization = function (applicationUser) {
            return _.find(self.ouAssignedUsers, function (ouApplicationUser) {
                return ouApplicationUser.applicationUser.id === applicationUser.id;
            });
        };

        /**
         * @description Delete single application user from OU
         * @param ouApplicationUser
         * @param $event
         */
        self.removeOUApplicationUser = function (ouApplicationUser, $event) {
            ouApplicationUserService
                .deleteOUApplicationUser(ouApplicationUser, $event)
                .then(function () {
                    self.reloadOuApplicationUsers(self.appUserGrid.page);
                    self.reloadDepartmentUsers(self.departmentUsersGrid.page);
                    toast.success(langService.get('delete_success'));
                });
        };

        /**
         * @description Delete multiple selected application users
         * @param $event
         */
        self.removeBulkOUApplicationUsers = function ($event) {
            var selectedOuAppUsers = angular.copy(self.selectedOUApplicationUsers);
            if (self.selectedTab === 'departmentUsers') {
                selectedOuAppUsers = angular.copy(self.selectedDepartmentUsers);
            }
            ouApplicationUserService
                .deleteBulkOUApplicationUsers(selectedOuAppUsers, $event)
                .then(function () {
                    self.reloadOuApplicationUsers(self.appUserGrid.page);
                    self.reloadDepartmentUsers(self.departmentUsersGrid.page);
                    toast.success(langService.get('delete_success'));
                });
        };


        self.departmentUsers = [];
        self.departmentUsersCopy = angular.copy(self.departmentUsers);
        self.selectedDepartmentUsers = [];

        /**
         * @description Contains options for grid configuration
         * @type {{limit: number, page: number, order: string, limitOptions: [*]}}
         */
        self.departmentUsersGrid = {
            name: 'departmentUsersGrid',
            progress: null,
            limit: 5, // default limit
            page: 1, // first page
            //order: 'arName', // default sorting order
            order: '', // default sorting order
            limitOptions: [5, 10, 20, // limit options
                {
                    label: langService.get('all'),
                    value: function () {
                        return (self.departmentUsers.length + 21)
                    }
                }
            ],
            searchColumns: {
                arabicName: 'applicationUser.arFullName',
                englishName: 'applicationUser.enFullName',
                loginName: 'applicationUser.loginName',
                domainName: 'applicationUser.domainName',
                organization: function (record) {
                    return self.getSortingKey('ouId', 'Organization');
                }
            },
            searchText: '',
            searchCallback: function (grid) {
                self.departmentUsers = gridService.searchGridData(self.departmentUsersGrid, self.departmentUsersCopy);
            }
        };
        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedDataDepartmentUser = function () {
            self.departmentUsers = $filter('orderBy')(self.departmentUsers, self.departmentUsersGrid.order);
        };

        /**
         * @description Reload the grid of application user
         * @param pageNumber
         * @return {*|Promise<U>}
         */
        self.reloadDepartmentUsers = function (pageNumber) {
            if (!self.model.hasRegistry) {
                return null;
            }

            var defer = $q.defer();
            self.departmentUsersGrid.progress = defer.promise;

            return ouApplicationUserService
                .loadUnassignedOUApplicationUsers(organization.id)
                .then(function (result) {
                    self.unAssignedUsers = result;

                    return ouApplicationUserService
                        .loadOuApplicationUserByRegOu(organization.id)
                        .then(function (result) {
                            self.departmentUsers = result;
                            self.departmentUsersCopy = angular.copy(self.departmentUsers);
                            self.selectedDepartmentUsers = [];
                            defer.resolve(true);
                            if (pageNumber)
                                self.departmentUsersGrid.page = pageNumber;
                            self.getSortedDataDepartmentUser();
                            self.departmentUsersGrid.searchCallback();
                            return result;
                        });
                });
        };

        /**
         * @description to catch reference plan changes.
         */
        self.referencePlanChanged = function (firstTime) {
            if (!self.organization.referenceNumberPlanId || !self.organization.hasRegistry)
                return;


            var referencePlan = self.organization.referenceNumberPlanId;


            self.organization.referencePlanItemStartSerialList = _.map(self.organization.referenceNumberPlanId.referencePlanItems, function (item) {
                return item.perOu ? new ReferencePlanItemStartSerial({
                    id: self.organization.id ? referencePlan.getStartSerialByCriteriaORNull(self.organization.id, item.id) : null,
                    referencePlanId: referencePlan.getID(),
                    regOUID: self.organization.id,
                    startSerial: referencePlan.getStartSerialByOU(self.organization.id, item.id),
                    referencePlanItemId: item
                }) : self.organization.referenceNumberPlanId.getItemSerial(item) ? self.organization.referenceNumberPlanId.getItemSerial(item) : new ReferencePlanItemStartSerial({
                    referencePlanId: referencePlan.getID(),
                    regOUID: -1,
                    startSerial: 1,
                    referencePlanItemId: item
                });
            });
        };
        /**
         * @description open reference plan Start Serial.
         */
        self.openStartSerialPopup = function () {
            return dialog
                .showDialog({
                    templateUrl: cmsTemplate.getPopup('start-serials'),
                    controller: 'startSerialPopCtrl',
                    controllerAs: 'ctrl',
                    locals: {
                        referencePlanItemStartSerialList: self.organization.referencePlanItemStartSerialList
                    }
                }).then(function (referencePlanItemStartSerialList) {
                    self.organization.referencePlanItemStartSerialList = referencePlanItemStartSerialList
                });
        };
        /**
         * @description to display hit in case of add.
         * @param formField
         * @returns {boolean|*}
         */
        self.showReferenceHintIf = function (formField) {
            return (
                !formField.$invalid || (formField.$invalid && formField.$untouched) && !self.editMode
            );
        };


        /**
         * @description open add private registry Ou Dialog
         * @param $event
         */
        self.openAddPrivateRegistryOUDialog = function ($event) {
            organizationService
                .openPrivateRegistryOUDialog(self.organization, self.privateRegOUs, $event)
                .then(function () {
                    self.reloadPrivateRegOU(self.privateRegOUGrid.page).then(function () {
                        toast.success(langService.get('save_success'));
                    });
                }).catch(function () {

            });
        };

        /**
         * @description remove private registry ou
         */
        self.removePrivateRegistryOu = function (privateRegOU) {
            dialog
                .confirmMessage(langService.get('confirm_delete').change({name: privateRegOU.getTranslatedName()}))
                .then(function () {
                    return organizationService
                        .deletePrivateRegistryOUs(privateRegOU)
                        .then(function () {
                            self.reloadPrivateRegOU(self.privateRegOUGrid.page)
                                .then(function () {
                                    toast.success(langService.get('delete_success'));
                                });
                        });
                });
        };

        /**
         * @description delete bulk private registry ous
         */
        self.removeBulkPrivateRegistryOus = function ($event) {
            dialog
                .confirmMessage(langService.get('confirm_delete_selected_multiple'), null, null, $event || null)
                .then(function () {
                    return organizationService
                        .deleteBulkPrivateRegistryOUs(self.selectedPrivateRegOUs)
                        .then(function () {
                            self.reloadPrivateRegOU(self.privateRegOUGrid.page);
                        });
                });
        };


        /**
         * @description Contains options for grid configuration
         * @type {{limit: number, page: number, order: string, limitOptions: [*]}}
         */
        self.privateRegOUGrid = {
            name: 'privateRegOUGrid',
            progress: null,
            limit: 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: [5, 10, 20, // limit options
                {
                    label: langService.get('all'),
                    value: function () {
                        return (self.privateRegOUs.length + 21)
                    }
                }
            ],
            searchColumns: {
                arabicName: 'ouInfo.arName',
                englishName: 'ouInfo.enName',
            },
            searchText: '',
            searchCallback: function (grid) {
                self.privateRegOUs = gridService.searchGridData(self.privateRegOUGrid, self.privateRegOUsCopy);
            }
        };

        /**
         * @description reload private registry Ou
         * @param pageNumber
         */
        self.reloadPrivateRegOU = function (pageNumber) {
            var defer = $q.defer();
            self.privateRegOUGrid.progress = defer.promise;
            return organizationService
                .loadPrivateRegOUsMapping(organization)
                .then(function (result) {
                    self.privateRegOUs = result;
                    self.privateRegOUsCopy = angular.copy(self.privateRegOUs);
                    self.selectedPrivateRegOUs = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.privateRegOUGrid.page = pageNumber;
                    self.getSortedDataPrivateRegOUs();
                    self.privateRegOUGrid.searchCallback();
                    return result;
                });
        };

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedDataPrivateRegOUs = function () {
            self.privateRegOUs = $filter('orderBy')(self.privateRegOUs, self.privateRegOUGrid.order);
        };


        self.ouDistributionListGrid = {
            name: 'ouDistributionListGrid',
            progress: null,
            limit: 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: [5, 10, 20, // limit options
                {
                    label: langService.get('all'),
                    value: function () {
                        return (self.ouDistributionLists.length + 21)
                    }
                }
            ],
            searchColumns: {
                arabicName: 'arName',
                englishName: 'enName',
            },
            searchText: '',
            searchCallback: function (grid) {
                self.ouDistributionLists = gridService.searchGridData(self.ouDistributionListGrid, self.ouDistributionListsCopy);
            }
        };

        self.openAddOUDistributionList = function ($event) {
            organizationService
                .openOUDistributionListsDialog(organization, self.ouDistributionLists, $event)
                .then(function () {
                    self.reloadOUDistributionList(self.ouDistributionListGrid.page).then(function () {
                        toast.success(langService.get('save_success'));
                    });
                }).catch(function () {

            });
        };


        self.reloadOUDistributionList = function (pageNumber) {
            var defer = $q.defer();
            self.ouDistributionListGrid.progress = defer.promise;
            return organizationService
                .loadOUDistributionList(organization)
                .then(function (result) {
                    self.ouDistributionLists = result;
                    self.ouDistributionListsCopy = angular.copy(self.ouDistributionLists);
                    self.selectedOUDistributionLists = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.ouDistributionListGrid.page = pageNumber;
                    self.getSortedOUDistributionList();
                    self.ouDistributionListGrid.searchCallback();
                    return result;
                });
        };

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedOUDistributionList = function () {
            self.ouDistributionLists = $filter('orderBy')(self.ouDistributionLists, self.ouDistributionListGrid.order);
        };

        self.removeOUDistributionList = function (distributionList, $event) {
            dialog
                .confirmMessage(langService.get('confirm_delete').change({name: distributionList.getTranslatedName()}))
                .then(function () {
                    organizationService.deleteOUDistributionList(organization, distributionList)
                        .then(function () {
                            self.reloadOUDistributionList(self.ouDistributionListGrid.page).then(function () {
                                toast.success(langService.get('delete_success'));
                            });
                        });
                });
        };


        self.referencePlanChanged(true);

        /**
         *@description Contains methods for CRUD operations for job titles
         */
        self.statusServices = {
            'activate': ouApplicationUserService.activateBulkOUApplicationUsers,
            'deactivate': ouApplicationUserService.deactivateBulkOUApplicationUsers,
            'true': ouApplicationUserService.activateOUApplicationUser,
            'false': ouApplicationUserService.deactivateOUApplicationUser
        };

        /**
         * @description Handles the change of ouApplicationUser status
         * @param ouApplicationUser
         * @param $event
         */
        self.changeOUApplicationUserStatus = function (ouApplicationUser, $event) {
            self.statusServices[ouApplicationUser.status](ouApplicationUser)
                .then(function () {
                    // reload the users tab which is not selected
                    if (self.selectedTab === 'departmentUsers') {
                        self.reloadOuApplicationUsers(self.appUserGrid.page);
                    } else {
                        self.reloadDepartmentUsers(self.departmentUsersGrid.page);
                    }
                    toast.success(langService.get('status_success'));
                })
                .catch(function () {
                    ouApplicationUser.status = !ouApplicationUser.status;
                    dialog.errorMessage(langService.get('something_happened_when_update_status'));
                });
        };

        self.enableEscalationChanged = function ($event) {
            self.organization.escalationProcess = (self.organization.enableEscalation) ? self.organizationCopy.escalationProcess : null;
        };
        /**
         * @description Change the status of selected job titles
         * @param status
         */
        self.changeStatusBulkOUApplicationUsers = function (status) {
            var selectedOuAppUsers = angular.copy(self.selectedOUApplicationUsers);
            if (self.selectedTab === 'departmentUsers') {
                selectedOuAppUsers = angular.copy(self.selectedDepartmentUsers);
            }

            var statusCheck = (status === 'activate');
            if (!generator.checkCollectionStatus(selectedOuAppUsers, statusCheck)) {
                toast.success(langService.get(statusCheck ? 'success_activate_selected' : 'success_deactivate_selected'));
                return;
            }
            self.statusServices[status](selectedOuAppUsers).then(function () {
                self.reloadOuApplicationUsers(self.appUserGrid.page);
                self.reloadDepartmentUsers(self.departmentUsersGrid.page);
            });
        };

        self.reloadSerials = function () {
            if (!self.selectedSerialYear || !self.model.hasRegistry) {
                return null;
            }

            return referencePlanNumberService
                .loadSerials(self.selectedSerialYear, [self.organization.id])
                .then(function (result) {
                    return self.serials = result;
                });
        };
        /**
         * @description print serials function
         */
        self.printSerials = function () {
            printService.printData(self.serials, Object.keys(self.serials[0].getExportedData()), langService.get('menu_item_serials') + ' : ' + self.selectedSerialYear);
        };

        self.tabsData = {
            'basic': {show: true, loaded: true},
            'securitySettings': {show: true, loaded: true},
            'workflowSettings': {show: true, loaded: true},
            'documentTemplates': {show: true, loaded: false, callback: self.reloadDocumentTemplates},
            'documentStamps': {show: true, loaded: false, callback: self.reloadDocumentStamps},
            'children': {show: true, loaded: false, callback: self.reloadChildren},
            'serials': {show: true, loaded: false, callback: self.reloadSerials},
            'classifications': {show: true, loaded: false, callback: self.reloadOUClassifications},
            'correspondenceSites': {show: true, loaded: false, callback: self.reloadOUCorrespondenceSites},
            'privateRegistryOU': {show: true, loaded: false, callback: self.reloadPrivateRegOU},
            'propertyConfiguration': {show: true, loaded: false},
            'users': {show: true, loaded: false, callback: self.reloadOuApplicationUsers},
            'departmentUsers': {show: true, loaded: false, callback: self.reloadDepartmentUsers}
        };

        self.setCurrentTab = function (tabName) {
            if (tabName === 'basic' || tabName === 'securitySettings' || tabName === 'workflowSettings') {
                self.selectedTab = tabName;
                self.selectedTabIndex = _getTabIndex(self.selectedTab);
                return;
            }
            var defer = $q.defer();

            if (self.tabsData[tabName].loaded) {
                defer.resolve(tabName);
            } else {
                if (!self.tabsData[tabName].callback) {
                    defer.resolve(tabName);
                } else {
                    self.tabsData[tabName].callback()
                        .then(function (result) {
                            defer.resolve(tabName);
                        });
                }
            }
            return defer.promise.then(function (tab) {
                self.selectedTab = tab;
                self.selectedTabIndex = _getTabIndex(self.selectedTab);
                self.tabsData[tab].loaded = true;
            });
        };

        function _getAvailableTabs() {
            var availableTabs = {};
            _.map(self.tabsData, function (item, key) {
                if (self.showTab(key)) {
                    availableTabs[key] = item;
                }
            });
            return availableTabs;
        }

        function _getTabIndex(tabName) {
            var index = -1,
                tabFound = _.find(_getAvailableTabs(), function (tab, key) {
                    index++;
                    return key.toLowerCase() === tabName.toLowerCase();
                });
            return index;
        }

        self.showTab = function (tabName) {
            if (!self.tabsData.hasOwnProperty(tabName) || !self.tabsData[tabName].show) {
                return false;
            }
            if (tabName === 'departmentUsers') {
                return self.organization.hasRegistry;
            } else if (tabName === 'documentStamps') {
                return rootEntity.hasPSPDFViewer() && self.globalSettings.isStampModuleEnabled() && employeeService.hasPermissionTo('MANAGE_STAMPS');
            } else if (tabName === 'privateRegistryOU') {
                return self.model.isPrivateRegistry;
            } else {
                if (tabName === 'serials' || tabName === 'classifications' || tabName === 'correspondenceSites') {
                    if (!self.model.hasRegistry) {
                        return false;
                    }
                    if (tabName === 'serials') {
                        return employeeService.hasPermissionTo('MANAGE_REFERENCE_NUMBER_PLANS');
                    }
                }
                return true;
            }
        };

        function _setDefaultSelectedTab() {
            var activeTab = 'basic';
            if (defaultTab && self.showTab(defaultTab)) {
                activeTab = defaultTab;
            }
            self.setCurrentTab(activeTab);
        }

        self.selectedTab = 'basic';
        self.selectedTabIndex = 0;
        _setDefaultSelectedTab();


        /**
         * @description to close the current dialog and send the current model to catch block.
         */
        self.closeOrganizationDialog = function () {
            dialog.cancel(self.model);
        };
    });
};
