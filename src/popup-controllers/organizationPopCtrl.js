module.exports = function (app) {
    app.controller('organizationPopCtrl', function ($scope,
                                                    dialog,
                                                    generator,
                                                    langService,
                                                    lookupService,
                                                    toast,
                                                    editMode,
                                                    rootMode,
                                                    correspondenceSiteService,
                                                    OUClassification,
                                                    OUCorrespondenceSite,
                                                    Organization,
                                                    children,
                                                    organizationService,
                                                    organizationTypeService,
                                                    referencePlanNumberService,
                                                    validationService,
                                                    applicationUserService,
                                                    ouClassifications,
                                                    ouCorrespondenceSites,
                                                    classifications,
                                                    classificationService,
                                                    correspondenceSites,
                                                    organization,
                                                    organizations,
                                                    documentTemplates,
                                                    ReferencePlanItemStartSerial,
                                                    documentTemplateService,
                                                    PropertyConfiguration,
                                                    allPropertyConfigurations,
                                                    propertyConfigurationService,
                                                    $q,
                                                    jobTitleService,
                                                    rankService,
                                                    themeService,
                                                    roleService,
                                                    unAssignedUsers,
                                                    rootEntity,
                                                    ouAssignedUsers,
                                                    correspondenceSiteTypeService,
                                                    OUApplicationUser,
                                                    ouApplicationUserService,
                                                    userClassificationViewPermissionService,
                                                    ApplicationUser,
                                                    cmsTemplate,
                                                    employeeService) {
        'ngInject';

        var self = this;
        self.controllerName = 'organizationPopCtrl';
        // current organization.
        self.parentOrganization = organization;

        self.employeeService = employeeService;
        // to check edit mode.
        self.editMode = editMode;
        // to check add root mode.
        self.rootMode = rootMode;
        // correspondence sites types
        self.correspondenceSiteTypes = correspondenceSiteTypeService.correspondenceSiteTypes;
        // get permissions
        //self.permissions = roleService.permission;
        self.permissions = roleService.permissionsByGroup;
        // set copy of current organization if editMode true.
        self.organization = !self.editMode ? new Organization({
            wfsecurity: lookupService.getLookupByLookupKey(lookupService.workflowSecurity, rootEntity.getGlobalSettings().wfsecurity),
            securitySchema: lookupService.getLookupByLookupKey(lookupService.securitySchema, rootEntity.getGlobalSettings().securitySchema)
        }) : angular.copy(organization);

        /////////////////////////// capture the current workflow security level before update //////////////////////////
        self.initialWFSecurity = self.organization.wfsecurity;

        self.model = new Organization(organization);
        self.selectedDocumentClass = null;
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
        self.organizations = organizationService.organizations;
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
        self.organizationChildren = children;

        self.ouClassifications = ouClassifications;

        self.ouCorrespondenceSites = ouCorrespondenceSites;

        self.documentTemplates = documentTemplates;

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
            deadlineReminder: {
                lang: 'send_a_reminder_before_deadline_date_with',
                tab: 'workflow_settings'
            }
        };

        self.selectedTab = "basic";
        self.tabsToShow = [
            'basic',
            'security_settings',
            'workflow_settings',
            'children',
            'classifications',
            'correspondence_sites',
            'document_templates',
            'property_config',
            'users'
        ];

        self.selectedOUClassifications = [];

        self.classifications = classifications;

        self.selectedOUClassification = new OUClassification({ouid: organization.id});

        self.classificationEditMode = false;


        self.selectedOUCorrespondenceSites = [];

        self.correspondenceSites = correspondenceSites;

        self.selectedOUCorrespondenceSite = new OUCorrespondenceSite({ouid: organization.id});

        self.correspondenceSiteEditMode = false;

        self.grid = {
            classifications: {
                limit: 5, // default limit
                page: 1, // first page
                //order: 'arName', // default sorting order
                order: '', // default sorting order
                limitOptions: [5, 10, 20, {
                    label: langService.get('all'),
                    value: function () {
                        return (self.ouClassifications.length + 21);
                    }
                }]
            },
            correspondenceSites: {
                limit: 5, // default limit
                page: 1, // first page
                //order: 'arName', // default sorting order
                order: '', // default sorting order
                limitOptions: [5, 10, 20, {
                    label: langService.get('all'),
                    value: function () {
                        return (self.ouCorrespondenceSites.length + 21);
                    }
                }]
            }
        };

        self.services = {
            'activate': 'activateBulk',
            'deactivate': 'deactivateBulk'
        };

        self.currentOUClassifiaction = new OUClassification();

        self.userAdded = false;

        self.setCurrentTab = function (tabName) {
            self.selectedTab = tabName;
        };

        self.showTab = function(tabName){
            return self.tabsToShow.indexOf(tabName) > -1;
        };

        self.showSaveButton = function () {
            return !(self.selectedTab === 'property_config'
                || self.selectedTab === 'document_templates'
                || self.selectedTab === 'correspondence_sites'
                || self.selectedTab === 'classifications'
                || self.selectedTab === 'users'
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
                    self.organization.outype = result;
                    self.organizationTypes.unshift(result);
                })
        };
        // TODO: need to add reference plan number from here.
        self.addNewReferencePlanNumber = function () {
            // referencePlanNumberService
        };
        /**
         * centreArchive Change
         * @param centralArchive
         */
        self.centralArchiveChange = function (centralArchive) {
            if (centralArchive) {
                self.organization.setCentralArchiveUnitId(null);
            } else {
                self.organization.setCentralArchiveUnitId(self.listParentsHasCentralArchive[0])
            }
        };
        /**
         * has registry change
         * @param hasRegistry
         */
        self.hasRegistryChange = function (hasRegistry) {
            if (hasRegistry) {
                self.organization.setRegistryParentId(null);
            } else {
                self.organization.referencePlanItemStartSerialList = [];
                self.organization.referenceNumberPlanId = null;
                self.organization.centralArchiveUnitId = null;
            }
        };
        /**
         * @description get reference planNumber Id from registry unit.
         * @param parent
         */
        self.registryParentChanged = function (parent) {
            self.organization.referenceNumberPlanId = parent.referenceNumberPlanId;
        };

        /**
         * @description to select user for admin, manager and vice manager
         * @param property
         * @param $event
         */
        self.selectUser = function (property, $event) {
            ouApplicationUserService
                .controllerMethod
                .selectOUApplicationUserSingle(self.organization, property, self.selectUserLabels[property], $event)
                .then(function (ouApplicationUser) {
                    self.organization[property] = ouApplicationUser;
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
         * to add new organization
         */
        self.addOrganizationFromCtrl = function () {
            validationService
                .createValidation('ADD_ORGANIZATION')
                .addStep('check_required', true, generator.checkRequiredFields, self.organization, function (result) {
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
                        .then(function () {
                            self.model = angular.copy(self.organization);
                            toast.success(langService.get('add_success').change({name: self.organization.getNames()}));
                            self.recreateAllNeeds(self.organization);
                            referencePlanNumberService.loadReferencePlanNumbers().then(function (result) {
                                self.listReferencePlanNumbers = result;
                                organizationService
                                    .loadOrganizations()
                                    .then(function () {
                                        if (self.editMode) {
                                            dialog.hide(self.model);
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
            validationService
                .createValidation('EDIT_ORGANIZATION')
                .addStep('check_required', true, generator.checkRequiredFields, self.organization, function (result) {
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

                    if (selectedWFSecurityKey > initialWFSecurityKey) {
                        isValidWFSecurityLevel = false;
                        dialog.errorMessage(langService.get('error_setting_workflow_security_to_lower_level'));
                    }

                    //////////////////////// if workflow security level is valid , then update /////////////////////////
                    if (isValidWFSecurityLevel) {
                        organizationService
                            .updateOrganization(self.organization)
                            .then(function () {
                                self.model = angular.copy(self.organization);
                                toast.success(langService.get('edit_success').change({name: self.organization.getNames()}));

                                employeeService.getEmployee().loadOrganization();
                                dialog.hide(self.model);
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
        };
        /**
         * @description to close the current dialog and send the current model to catch block.
         */
        self.closeOrganizationDialog = function () {
            dialog.cancel(self.model);
        };

        self.changeOrganizationStatus = function (organization) {
            return organization
                .update()
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
            }
            else {
                defer.resolve(true);
            }
            defer.promise.then(function (response) {

            })
                .catch(function (error) {
                    self.organization.securitySchema =  lookupService.getLookupByLookupKey(lookupService.securitySchema, 0);
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

        self.disableAddOUClassification = function () {
            return generator.checkRequiredFields(self.selectedOUClassification).length;
        };

        self.updateOUClassification = function (selectedOUClassification) {
            return self.organization.updateOUClassification(selectedOUClassification)
                .then(function (selectedOUClassification) {
                    toast.success(langService.get('update_success'));
                    self.classificationEditMode = false;
                    self.selectedOUClassification = null;
                    self.ouClassifications = _.map(self.ouClassifications, function (ouClassification) {
                        console.log(ouClassification.id, selectedOUClassification);
                        if (ouClassification.id === selectedOUClassification.id) {
                            ouClassification = selectedOUClassification;
                        }
                        return ouClassification;
                    });
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
            console.log(ouClassification);
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
            })
        };

        self.editOUClassification = function (ouClassification) {
            self.selectedOUClassification = angular.copy(ouClassification);
            self.classificationEditMode = true;
            self.currentOUClassifiaction = angular.copy(ouClassification);
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
                            toast.success(langService.get('add_success').change({name: langService.get('classifications')}));
                        })
                });
        };

        self.addAllExistsOUClassifications = function () {
            var excluded = _.map(_.map(self.ouClassifications, function (ouClassification) {
                return ouClassification.classification;
            }), 'id');

            var classifications = _.filter(self.classifications, function (classification) {
                return excluded.indexOf(classification.id) === -1 && classification.status && !classification.isGlobal;
            });

            if (!classifications.length) {
                dialog.infoMessage(langService.get('no_records_to_add').change({name: langService.get('classification')}));
                return;
            }

            self.organization
                .assignClassifications(classifications)
                .then(function (ouClassifications) {
                    self.ouClassifications = self.ouClassifications.concat(ouClassifications);
                    toast.success(langService.get('add_success').change({name: langService.get('classifications')}));
                });
        };

        self.addNewOUClassification = function () {
            return classificationService
                .controllerMethod
                .classificationAdd()
                .then(function (classification) {
                    self.classifications.unshift(classification);

                    self.organization
                        .assignClassifications([classification])
                        .then(function (ouClassifications) {
                            self.ouClassifications = self.ouClassifications.concat(ouClassifications);
                            toast.success(langService.get('add_success').change({name: ouClassifications[0].getNames()}));
                        });
                })
                .catch(function (classification) {
                    if (!classification.id)
                        return;

                    self.classifications.unshift(classification);

                    self.organization
                        .assignClassifications([classification])
                        .then(function (ouClassifications) {
                            self.ouClassifications = self.ouClassifications.concat(ouClassifications);
                            toast.success(langService.get('add_success').change({name: ouClassifications[0].getNames()}));
                        });
                })
        };

        /****** correspondence Site section ********/

        self.correspondenceSiteExists = function (correspondenceSite) {
            return _.find(self.ouCorrespondenceSites, function (ouCorrespondenceSite) {
                var id = ouCorrespondenceSite.correspondenceSite.id;
                if (self.correspondenceSiteEditMode) {
                    return ouCorrespondenceSite.id === correspondenceSite.id && ouCorrespondenceSite.id !== self.currentOUClassifiaction.id;
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
                        console.log(ouCorrespondenceSite.id, selectedOUCorrespondenceSite);
                        if (ouCorrespondenceSite.id === selectedOUCorrespondenceSite.id) {
                            ouCorrespondenceSite = selectedOUCorrespondenceSite;
                        }
                        return ouCorrespondenceSite;
                    });
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
            })
        };

        self.editOUCorrespondenceSite = function (ouCorrespondenceSite) {
            self.selectedOUCorrespondenceSite = angular.copy(ouCorrespondenceSite);
            self.correspondenceSiteEditMode = true;
            self.currentOUClassifiaction = angular.copy(ouCorrespondenceSite);
        };

        self.resetEditCorrespondenceSiteMode = function () {
            self.selectedOUCorrespondenceSite = null;
            self.correspondenceSiteEditMode = false;
            self.currentOUClassifiaction = null;
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
                            toast.success(langService.get('add_success').change({name: langService.get('correspondence_sites')}));
                        })
                });
        };

        self.addAllExistsOUCorrespondenceSites = function () {
            var excluded = _.map(_.map(self.ouCorrespondenceSites, function (ouCorrespondenceSites) {
                return ouCorrespondenceSites.correspondenceSite;
            }), 'id');

            var correspondenceSites = _.filter(self.correspondenceSites, function (correspondenceSite) {
                return excluded.indexOf(correspondenceSite.id) === -1 && correspondenceSite.status && !correspondenceSite.isGlobal;
            });

            if (!correspondenceSites.length) {
                dialog.infoMessage(langService.get('no_records_to_add').change({name: langService.get('correspondence_site')}));
                return;
            }

            self.organization
                .assignCorrespondenceSites(correspondenceSites)
                .then(function (ouCorrespondenceSites) {
                    self.ouCorrespondenceSites = self.ouCorrespondenceSites.concat(ouCorrespondenceSites);
                    toast.success(langService.get('add_success').change({name: langService.get('correspondence_sites')}));
                });
        };

        self.addNewOUCorrespondenceSite = function () {
            return correspondenceSiteService
                .controllerMethod
                .correspondenceSiteAdd()
                .then(function (correspondenceSite) {
                    self.correspondenceSites.unshift(correspondenceSite);

                    self.organization
                        .assignCorrespondenceSites([correspondenceSite])
                        .then(function (ouCorrespondenceSites) {
                            self.ouCorrespondenceSites = self.ouCorrespondenceSites.concat(ouCorrespondenceSites);
                            toast.success(langService.get('add_success').change({name: ouCorrespondenceSites[0].getNames()}));
                        });
                })
                .catch(function (correspondenceSite) {
                    if (!correspondenceSite.id)
                        return;

                    self.correspondenceSites.unshift(correspondenceSite);

                    self.organization
                        .assignCorrespondenceSites([correspondenceSite])
                        .then(function (ouCorrespondenceSites) {
                            self.ouCorrespondenceSites = self.ouCorrespondenceSites.concat(ouCorrespondenceSites);
                            toast.success(langService.get('add_success').change({name: ouCorrespondenceSites[0].getNames()}));
                        });
                })
        };

        /**
         * @description Contains the selected document templates
         * @type {Array}
         */
        self.selectedDocumentTemplates = [];

        /**
         * @description Contains options for grid configuration
         * @type {{limit: number, page: number, order: string, limitOptions: [*]}}
         */
        self.documentTemplateGrid = {
            limit: 5, // default limit
            page: 1, // first page
            //order: 'arName', // default sorting order
            order: '', // default sorting order
            limitOptions: [5, 10, 20, // limit options
                {
                    label: langService.get('all'),
                    value: function () {
                        return (self.documentTemplates.length + 21)
                    }
                }
            ]
        };

        self.documentTypes = [
            {text: "Internal", value: 0},
            {text: "External", value: 1},
            {text: "Both", value: -1}
        ];

        self.templateTypes = [
            {text: "Type 1", value: 270},
            {text: "Type 2", value: 271}
        ];

        self.getDocumentTypeName_OU = function (documentTypeId) {
            var matchedDocumentType = _.filter(self.documentTypes, function (documentType) {
                return (documentType.value === documentTypeId);
            });
            if (matchedDocumentType.length)
                return matchedDocumentType[0].text;
        };

        self.getTemplateTypeName_OU = function (templateId) {
            var matchedTemplateType = _.filter(self.templateTypes, function (templateType) {
                return (templateType.value === templateId);
            });
            if (matchedTemplateType.length)
                return matchedTemplateType[0].text;
        };

        /**
         * @description Opens dialog for add new document template
         * @param $event
         */
        self.openAddDocumentTemplateDialog = function ($event) {
            documentTemplateService
                .controllerMethod
                .documentTemplateAdd(organization.id, null, self.documentTypes, self.templateTypes, $event)
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
                .documentTemplateEdit(documentTemplate, organization.id, null, self.documentTypes, self.templateTypes, $event)
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
            self.progress = defer.promise;
            return documentTemplateService
                .loadDocumentTemplates(organization)
                .then(function (result) {
                    self.documentTemplates = result;
                    self.selectedDocumentTemplates = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.documentTemplateGrid.page = pageNumber;
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


        self.selectedPropertyConfigurations = [];

        /**
         * @description Contains options for grid configuration
         * @type {{limit: number, page: number, order: string, limitOptions: [*]}}
         */
        self.propertyConfigurationGrid = {
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
            ]
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

        self.propertyConfigurationProgress = null;
        self.reloadPropertyConfigurations = function (pageNumber) {
            var defer = $q.defer();
            self.propertyConfigurationProgress = defer.promise;

            var docClass = (self.selectedDocumentClass.hasOwnProperty('lookupKey') ? self.selectedDocumentClass.lookupStrKey : self.selectedDocumentClass);
            return propertyConfigurationService
                .loadPropertyConfigurationsByDocumentClassAndOU(docClass.toLowerCase(), self.organization.id)
                .then(function (result) {
                    self.allPropertyConfigurations[docClass.toLowerCase()] = result;
                    self.propertyConfigurations = result;
                    var currentUserOrg = employeeService.getEmployee().userOrganization;
                    var loggedInOuId = currentUserOrg.hasOwnProperty('id') ? currentUserOrg.id : currentUserOrg;
                    if (self.organization.id === loggedInOuId) {
                        return lookupService.replacePropertyConfigurationsByDocumentClass(result, docClass.toLowerCase());
                    }
                    self.selectedPropertyConfigurations = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.propertyConfigurationGrid.page = pageNumber;
                    return result;
                })
        };

        self.filterPropertyConfigurationsForOUByDocumentClass = function () {
            var docClass = (self.selectedDocumentClass.hasOwnProperty('lookupKey') ? self.selectedDocumentClass.lookupStrKey : self.selectedDocumentClass);
            self.propertyConfigurations = self.allPropertyConfigurations[docClass.toLowerCase()];
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
        self.appUserProgress = null;

        self.ouAssignedUsers = ouAssignedUsers;
        self.unAssignedUsers = unAssignedUsers;
        self.selectedUnassignedUser = null;
        /**
         * @description Contains options for grid configuration
         * @type {{limit: number, page: number, order: string, limitOptions: [*]}}
         */
        self.appUserGrid = {
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
            filter: {search: {}}
        };

        /**
         * @description Reload the grid of application user
         * @param pageNumber
         * @return {*|Promise<U>}
         */
        self.reloadOuApplicationUsers = function (pageNumber) {
            var defer = $q.defer();
            self.appUserProgress = defer.promise;


            ouApplicationUserService
                .loadUnassignedOUApplicationUsers(organization.id)
                .then(function (result) {
                    self.unAssignedUsers = result;
                });


            ouApplicationUserService
                .loadRelatedOUApplicationUsers(organization.id)
                .then(function (result) {
                    self.ouAssignedUsers = result;
                    self.selectedOUApplicationUsers = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.appUserGrid.page = pageNumber;
                });
        };


        /**
         * @description Opens dialog for add new application user
         * @param $event
         */
        self.openAddApplicationUserDialog = function ($event) {
            //var ouId = self.organization.hasOwnProperty('id') ? self.organization.id : self.organization;
            applicationUserService
                .controllerMethod
                .applicationUserFromOuAdd(self.jobTitles, self.ranks, organizations, classifications, self.themes, self.roles, self.permissions, null, self.organization, $event)
                .then(function () {
                    self.reloadOuApplicationUsers(self.appUserGrid.page);
                })
                .catch(function () {
                    self.reloadOuApplicationUsers(self.appUserGrid.page);
                });
        };

        /**
         * @description Opens dialog for edit application user
         * @param $event
         * @param {ApplicationUser} applicationUser
         */
        self.openEditApplicationUserDialog = function (applicationUser, $event) {
            var ouId = self.organization.hasOwnProperty('id') ? self.organization.id : self.organization;
            validationService
                .createValidation('LOAD_USER_CLASSIFICATION_VIEW_PERMISSIONS')
                .addStep('load_user_classification', true, userClassificationViewPermissionService.loadUserClassificationViewPermissions, ouId, function (result) {
                    self.userClassificationViewPermissions = result;
                    return result;
                })
                .notifyFailure(function (step, result) {

                })
                .validate()
                .then(function () {
                    applicationUserService
                        .controllerMethod
                        .applicationUserFromOuEdit(new ApplicationUser(applicationUser), self.jobTitles, self.ranks, organizations, classifications, self.themes, self.roles, self.permissions, self.userClassificationViewPermissions, self.organization, $event)
                        .then(function () {
                            self.reloadOuApplicationUsers(self.appUserGrid.page);
                        });
                })
                .catch(function () {

                });
        };
        //console.log('self.organization.centralArchiveUnitId', self.organization.centralArchiveUnitId, self.organization.registryParentId);
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
                    template: cmsTemplate.getPopup('ou-unassigned-user'),
                    controller: 'ouUnassignedUserPopCtrl',
                    controllerAs: 'ctrl',
                    locals: {
                        ouApplicationUser: ouApplicationUser
                    }
                }).then(function (ouApplicationUser) {
                    self.ouAssignedUsers.unshift(ouApplicationUser);
                    self.userAdded = !self.userAdded;
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
                    toast.success(langService.get('delete_success'));
                });
        };

        /**
         * @description Delete multiple selected application users
         * @param $event
         */
        self.removeBulkOUApplicationUsers = function ($event) {
            ouApplicationUserService
                .deleteBulkOUApplicationUsers(self.selectedOUApplicationUsers, $event)
                .then(function () {
                    self.reloadOuApplicationUsers(self.appUserGrid.page);
                    toast.success(langService.get('delete_success'));
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
                    template: cmsTemplate.getPopup('start-serials'),
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

        self.referencePlanChanged(true);
    });
};