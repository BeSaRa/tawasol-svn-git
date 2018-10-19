module.exports = function (app) {
    app.config(function ($stateProvider,
                         cmsTemplateProvider,
                         $urlRouterProvider,
                         $locationProvider,
                         rootEntityProvider,
                         $mdDateLocaleProvider,
                         momentProvider) {
        'ngInject';
        $locationProvider.hashPrefix('');

        var templateProvider = cmsTemplateProvider;

        var moment = momentProvider.$get();

        $urlRouterProvider.otherwise('/404');
        /**
         * md-datepicker settings for default date format
         * @param date
         * @returns {string}
         */
        $mdDateLocaleProvider.formatDate = function (date) {
            var m = moment(date);
            return m.isValid() ? m.format('YYYY-MM-DD') : '';
        };

        $stateProvider
            .state('error', {
                url: '/404',
                template: templateProvider.getView('404')
            })
            .state('access-denied', {
                url: '/access-denied',
                template: templateProvider.getView('access-denied')
            })
            .state('password', {
                url: '/password-encrypt',
                template: templateProvider.getView('password-encrypt'),
                controller: 'passwordEncryptCtrl',
                controllerAs: 'ctrl'
            })
            // loading page
            .state('loading', {
                url: '/loading/entity/:identifier?',
                params: {
                    identifier: null
                },
                template: templateProvider.getView('loading')
            })
            // login page
            .state('login', {
                url: '/login/entity/:identifier?',
                template: templateProvider.getView('login'),
                controller: 'loginCtrl',
                controllerAs: 'login'
            })
            // default application page
            .state('app', {
                abstract: true,
                url: '/entity/:identifier?',
                template: templateProvider.getView('home'),
                params: {
                    identifier: rootEntityProvider.getRootEntityIdentifier()
                },
                resolve: {
                    counters: function (counterService, employeeService) {
                        'ngInject';
                        return !employeeService.isAdminUser() ? counterService.loadCounters() : [];
                    }
                }
            })
            // landing page
            .state('app.landing-page', {
                url: '/landing-page',
                template: templateProvider.getView('landing-page'),
                controller: 'landingPageCtrl',
                controllerAs: 'ctrl'
            })
            // administration
            .state('app.administration', {
                abstract: true,
                url: '/administration',
                template: '<div id="sub-view-wrapper"><ui-view flex layout="column" class="sub-view" /></div>'
            })
            // document types
            .state('app.administration.document-types', {
                url: '/document-types',
                template: templateProvider.getView('document-types'),
                controller: 'documentTypeCtrl',
                controllerAs: 'ctrl',
                permission: 'menu_item_document_types',
                resolve: {
                    documentTypes: function (documentTypeService) {
                        'ngInject';
                        return documentTypeService.loadDocumentTypes();
                    }
                }
            })
            // roles
            .state('app.administration.roles', {
                url: '/roles',
                template: templateProvider.getView('roles'),
                controller: 'roleCtrl',
                controllerAs: 'ctrl',
                permission: 'menu_item_manage_roles',
                resolve: {
                    roles: function (roleService) {
                        'ngInject';
                        return roleService.loadRoles();
                    },
                    permissions: function (roleService) {
                        'ngInject';
                        return roleService.getPermissionByGroup();
                    },
                    /*permissions: function (roleService, permissionGroupLookup) {
                        //return roleService.getPermissions();
                        var permissionByGroup = [];
                        return roleService.getPermissions().then(function (result) {
                            var permissionByGroupEN = {};
                            var permissionByGroupAR = {};
                            for (var i = 0; i < permissionGroupLookup.length; i++) {
                                var getPermissionsForGroup = _.filter(result, function (permission) {
                                    return permission.groupId === permissionGroupLookup[i].id;
                                });
                                if (getPermissionsForGroup.length > 0) {
                                    getPermissionsForGroup = _.chunk(getPermissionsForGroup, 3);
                                    roleService.fillTheRemainingItems(3, getPermissionsForGroup);
                                    permissionByGroupEN[permissionGroupLookup[i].defaultEnName] = getPermissionsForGroup;
                                    permissionByGroupAR[permissionGroupLookup[i].defaultArName] = getPermissionsForGroup;
                                }
                            }
                            permissionByGroup.push(permissionByGroupEN);//for English
                            permissionByGroup.push(permissionByGroupAR);//for Arabic
                            return permissionByGroup;
                        });
                    },
                    permissionGroupLookup: function (lookupService) {
                        return lookupService.lookups.permissionGroup;
                    },*/
                    organizations: function (organizationService) {
                        'ngInject';
                        return organizationService.getOrganizations();
                    },
                    ouApplicationUsers: function (ouApplicationUserService, organizations, roles) {
                        'ngInject';
                        return ouApplicationUserService.loadOUApplicationUsers();
                    }
                }
            })
            // organization-types
            .state('app.administration.organization-types', {
                url: '/organization-types',
                template: templateProvider.getView('organization-types'),
                controller: 'organizationTypeCtrl',
                controllerAs: 'ctrl',
                permission: 'menu_item_organization_types',
                resolve: {
                    organizationTypes: function (organizationTypeService) {
                        'ngInject';
                        return organizationTypeService.loadOrganizationTypes();
                    }
                }
            })
            // document status
            .state('app.administration.document-status', {
                url: '/document-status',
                template: templateProvider.getView('document-status'),
                controller: 'documentStatusCtrl',
                controllerAs: 'ctrl',
                permission: 'menu_item_document_status',
                resolve: {
                    documentStatuses: function (documentStatusService) {
                        'ngInject';
                        return documentStatusService.loadDocumentStatuses();
                    }
                }
            })
            // workflow-group
            .state('app.administration.workflow-group', {
                url: '/workflow-group',
                template: templateProvider.getView('workflow-groups'),
                controller: 'workflowGroupCtrl',
                controllerAs: 'ctrl',
                permission: 'menu_item_manage_workflow_group',
                resolve: {
                    organizations: function (organizationService) {
                        'ngInject';
                        return organizationService.loadOrganizations();
                    },
                    workflowGroups: function (workflowGroupService, organizations) {
                        'ngInject';
                        return workflowGroupService.loadWorkflowGroups();
                    }
                }
            })
            // sms templates
            .state('app.administration.sms-templates', {
                url: '/sms-templates',
                template: templateProvider.getView('sms-templates'),
                controller: 'smsTemplateCtrl',
                controllerAs: 'ctrl',
                permission: 'menu_item_sms_template',
                resolve: {
                    smsTemplates: function (smsTemplateService) {
                        'ngInject';
                        return smsTemplateService.loadSmsTemplates();
                    }
                }
            })
            //classifications
            .state('app.administration.classifications', {
                url: '/classifications',
                template: templateProvider.getView('classifications'),
                controller: 'classificationCtrl',
                controllerAs: 'ctrl',
                permission: 'menu_item_classifications'
            })
            //private-announcements
            .state('app.administration.private-announcements', {
                url: '/private-announcements',
                template: templateProvider.getView('private-announcements'),
                controller: 'privateAnnouncementCtrl',
                controllerAs: 'ctrl',
                permission: 'menu_item_private_announcements',
                resolve: {
                    privateAnnouncements: function (privateAnnouncementService) {
                        'ngInject';
                        return privateAnnouncementService.loadPrivateAnnouncements();
                    },
                    organizations: function (organizationService) {
                        'ngInject';
                        return organizationService.loadOrganizations();
                    },
                    organizationsHasRegistry: function (organizations) {
                        'ngInject';
                        return organizations.filter(function (organizationUnit) {
                            return (organizationUnit.hasRegistry === true);
                        });
                    }
                }
            })
            // organizations
            .state('app.administration.organizations', {
                url: '/organizations',
                template: templateProvider.getView('organizations'),
                controller: 'organizationsCtrl',
                controllerAs: 'ctrl',
                permission: 'menu_item_organization_chart',
                resolve: {
                    jobTitles: function (jobTitleService) {
                        'ngInject';
                        return jobTitleService.loadJobTitles();
                    },
                    ranks: function (rankService) {
                        'ngInject';
                        return rankService.loadRanks();
                    },
                    themes: function (themeService) {
                        'ngInject';
                        return themeService.loadThemes();
                    },
                    roles: function (roleService) {
                        'ngInject';
                        return roleService.loadRoles();
                    },
                    permissions: function (roleService) {
                        'ngInject';
                        return roleService.getPermissionByGroup();
                    },
                    globalCorrespondenceSitesForG2GId: function (correspondenceViewService) {
                        'ngInject';
                        return correspondenceViewService.getGlobalCorrespondenceSitesForG2GId();
                    },
                    globalCorrespondenceSitesForInternalG2GId: function (correspondenceViewService) {
                        'ngInject';
                        return correspondenceViewService.getGlobalCorrespondenceSitesForInternalG2GId();
                    }
                }
            })
            // correspondence site types
            .state('app.administration.correspondence-site-types', {
                url: '/correspondence-site-types',
                template: templateProvider.getView('correspondence-site-types'),
                controller: 'correspondenceSiteTypeCtrl',
                controllerAs: 'ctrl',
                permission: 'menu_item_correspondence_site_type',
                resolve: {
                    correspondenceSiteTypes: function (correspondenceSiteTypeService) {
                        'ngInject';
                        return correspondenceSiteTypeService.loadCorrespondenceSiteTypes();
                    }
                }
            })
            // entity type
            .state('app.administration.entity-types', {
                url: '/entity-types',
                template: templateProvider.getView('entity-types'),
                controller: 'entityTypeCtrl',
                controllerAs: 'ctrl',
                permission: 'menu_item_entity_type',
                resolve: {
                    entityTypes: function (entityTypeService) {
                        'ngInject';
                        return entityTypeService.loadEntityTypes();
                    }
                }
            })
            // job title
            .state('app.administration.job-titles', {
                url: '/job-titles',
                template: templateProvider.getView('job-title'),
                controller: 'jobTitleCtrl',
                controllerAs: 'ctrl',
                permission: 'menu_item_job_title',
                resolve: {
                    jobTitles: function (jobTitleService) {
                        'ngInject';
                        return jobTitleService.loadJobTitles();
                    }
                }
            })
            // rank
            .state('app.administration.ranks', {
                url: '/ranks',
                template: templateProvider.getView('rank'),
                controller: 'rankCtrl',
                controllerAs: 'ctrl',
                permission: 'menu_item_ranks',
                resolve: {
                    ranks: function (rankService) {
                        'ngInject';
                        return rankService.loadRanks();
                    }
                }
            })
            // theme
            .state('app.administration.themes', {
                url: '/themes',
                template: templateProvider.getView('theme'),
                controller: 'themeCtrl',
                controllerAs: 'ctrl',
                permission: 'menu_item_themes',
                resolve: {
                    themes: function (themeService) {
                        'ngInject';
                        return themeService.loadThemes();
                    }
                }
            })
            //entities
            .state('app.administration.entities', {
                url: '/entities',
                template: templateProvider.getView('entities'),
                controller: 'entityCtrl',
                controllerAs: 'ctrl',
                permission: 'menu_item_government_entities',
                resolve: {
                    entities: function (entityService) {
                        'ngInject';
                        return entityService.loadEntities();
                    }
                }
            })
            //public announcements
            .state('app.administration.public-announcements', {
                url: '/public-announcements',
                template: templateProvider.getView('public-announcements'),
                controller: 'publicAnnouncementCtrl',
                controllerAs: 'ctrl',
                permission: 'menu_item_public_announcements',
                resolve: {
                    publicAnnouncements: function (publicAnnouncementService) {
                        'ngInject';
                        return publicAnnouncementService.loadPublicAnnouncements();
                    }
                }
            })
            //public document file
            .state('app.administration.document-files', {
                url: '/document-files',
                template: templateProvider.getView('document-files'),
                controller: 'documentFileCtrl',
                controllerAs: 'ctrl',
                permission: 'menu_item_document_files',
                resolve: {
                    organizations: function (organizationService) {
                        'ngInject';
                        return organizationService.loadOrganizations();
                    },
                    ouDocumentFiles: function (relatedOUDocumentFileService, ouDocumentFileService, organizations) {
                        'ngInject';
                        return ouDocumentFileService.loadOUDocumentFiles();
                    },
                    documentFiles: function (documentFileService, ouDocumentFiles, organizations) {
                        'ngInject';
                        return documentFileService.loadDocumentFiles();
                    }
                }
            })
            // entity-global-settings
            .state('app.administration.entity-global-settings', {
                url: '/root-entity/:entityId/global-settings',
                template: templateProvider.getView('global-setting'),
                controller: 'globalSettingCtrl',
                controllerAs: 'ctrl',
                permission: 'menu_item_global_settings',
                resolve: {
                    fileTypes: function (fileTypeService) {
                        'ngInject';
                        return fileTypeService.getDocumentFileTypes();
                    },
                    entity: function (entityService, employeeService, $stateParams) {
                        'ngInject';
                        return entityService.loadEntityById($stateParams.entityId);
                    },
                    applicationUsers: function (applicationUserService) {
                        'ngInject';
                        return applicationUserService
                            .getApplicationUsers()
                            .catch(function (error) {
                                if (employeeService.isAdminUser()) {
                                    return [];
                                }
                            });
                    },
                    themes: function (themeService) {
                        'ngInject';
                        return themeService
                            .getThemes()
                            .catch(function () {
                                if (employeeService.isAdminUser()) {
                                    return [];
                                }
                            });
                    },
                    globalSetting: function (entity, $q, applicationUsers, themes, GlobalSetting, globalSettingService) {
                        'ngInject';
                        var defer = $q.defer();
                        globalSettingService
                            .getGlobalSettingByRootIdentifier(entity)
                            .then(function (result) {
                                defer.resolve(result);
                            })
                            .catch(function (reason) {
                                /*if (reason.data.ec === 1001) {
                                    defer.resolve(new GlobalSetting());
                                }*/
                                defer.resolve(new GlobalSetting());
                            });
                        return defer.promise;
                    },
                    documentSecurity: function (documentSecurityService, globalSetting) {
                        'ngInject';
                        return documentSecurityService.loadDocumentSecurity();
                    }
                }
            })
            //application users
            .state('app.administration.application-users', {
                url: '/application-users',
                template: templateProvider.getView('application-user'),
                controller: 'applicationUserCtrl',
                controllerAs: 'ctrl',
                permission: 'menu_item_application_users',
                resolve: {
                    jobTitles: function (jobTitleService) {
                        'ngInject';
                        return jobTitleService.loadJobTitles();
                    },
                    ranks: function (rankService) {
                        'ngInject';
                        return rankService.loadRanks();
                    },
                    themes: function (themeService) {
                        'ngInject';
                        return themeService.loadThemes();
                    },
                    organizations: function (organizationService) {
                        'ngInject';
                        return organizationService.loadOrganizations();
                    },
                    classifications: function (classificationService) {
                        'ngInject';
                        return classificationService.loadClassifications();
                    },
                    roles: function (roleService, applicationUsers) {
                        'ngInject';
                        return roleService.loadRoles().then(function (result) {
                            return _.filter(result, 'status');
                        });
                    },
                    ouApplicationUsers: function (ouApplicationUserService, applicationUsers) {
                        'ngInject';
                        return ouApplicationUserService.loadOUApplicationUsers();
                    },
                    userClassificationViewPermissions: function (userClassificationViewPermissionService, classifications) {
                        'ngInject';
                        return userClassificationViewPermissionService.loadUserClassificationViewPermissions();
                    },
                    applicationUsers: function (applicationUserService, jobTitles, ranks, themes, organizations, classifications, permissions, userClassificationViewPermissions) {
                        'ngInject';
                        return applicationUserService.loadApplicationUsers();
                    },
                    permissions: function (roleService) {
                        'ngInject';
                        return roleService.getPermissionByGroup();
                    }
                }
            })
            //distribution lists
            .state('app.administration.distribution-lists', {
                url: '/distribution-lists',
                template: templateProvider.getView('distribution-lists'),
                controller: 'distributionListCtrl',
                controllerAs: 'ctrl',
                permission: 'menu_item_distribution_lists',
                resolve: {
                    organizations: function (organizationService) {
                        'ngInject';
                        return organizationService.loadOrganizations();
                    },
                    ouDistributionList: function (ouDistributionListService, organizations) {
                        'ngInject';
                        return ouDistributionListService.loadOUDistributionLists()
                    },
                    distributionLists: function (distributionListService, ouDistributionList, organizations) {
                        'ngInject';
                        return distributionListService.loadDistributionLists();
                    },
                    correspondenceSiteTypes: function (correspondenceSiteTypeService) {
                        'ngInject';
                        return correspondenceSiteTypeService.loadCorrespondenceSiteTypes();
                    }
                }
            })
            //workflow actions
            .state('app.administration.workflow-actions', {
                url: '/workflow-actions',
                template: templateProvider.getView('workflow-action'),
                controller: 'workflowActionCtrl',
                controllerAs: 'ctrl',
                permission: 'menu_item_workflow_actions',
                resolve: {
                    workflowActions: function (workflowActionService, userWorkflowActions, applicationUserService) {
                        'ngInject';
                        return workflowActionService.loadWorkflowActions();
                    },
                    applicationUsers: function (applicationUserService) {
                        'ngInject';
                        return applicationUserService.loadApplicationUsers();
                    },
                    userWorkflowActions: function (userWorkflowActionService) {
                        'ngInject';
                        return userWorkflowActionService.loadUserWorkflowActions();
                    }

                }
            })
            //reference plans
            .state('app.administration.reference-number-plans', {
                url: '/reference-number-plans',
                template: templateProvider.getView('reference-plan-number'),
                controller: 'referencePlanNumberCtrl',
                controllerAs: 'ctrl',
                permission: 'menu_item_reference_number_plans',
                resolve: {
                    referencePlanNumbers: function (referencePlanNumberService) {
                        'ngInject';
                        return referencePlanNumberService.loadReferencePlanNumbers();
                    }
                }
            })
            //correspondence-sites
            .state('app.administration.correspondence-sites', {
                url: '/correspondence-sites',
                template: templateProvider.getView('correspondence-sites'),
                controller: 'correspondenceSiteCtrl',
                controllerAs: 'ctrl',
                permission: 'menu_item_cross_site_management'
            })
            //global-settings
            .state('app.administration.global-settings', {
                url: '/global-settings',
                template: templateProvider.getView('global-setting'),
                controller: 'globalSettingCtrl',
                controllerAs: 'ctrl',
                permission: 'menu_item_global_settings',
                resolve: {
                    fileTypes: function (fileTypeService) {
                        'ngInject';
                        return fileTypeService.getDocumentFileTypes();
                    },
                    entity: function (entityService, $stateParams, rootEntity) {
                        'ngInject';
                        return entityService.loadEntityById(rootEntity.returnRootEntity().rootEntity.id);
                    },
                    applicationUsers: function (applicationUserService) {
                        'ngInject';
                        return applicationUserService.getApplicationUsers();
                    },
                    themes: function (themeService) {
                        'ngInject';
                        return themeService.getThemes();
                    },
                    globalSetting: function (entity, $q, applicationUsers, themes, GlobalSetting, globalSettingService) {
                        'ngInject';
                        var defer = $q.defer();
                        globalSettingService
                            .getGlobalSettingByRootIdentifier(entity)
                            .then(function (result) {
                                defer.resolve(result);
                            });
                        return defer.promise;
                    },
                    documentSecurity: function (documentSecurityService, globalSetting) {
                        'ngInject';
                        return documentSecurityService.loadDocumentSecurity();
                    }
                }
            })
            //global-localizations-lookups
            .state('app.administration.global-localizations-lookups', {
                url: '/global-localization-lookups',
                template: templateProvider.getView('global-localization-lookups'),
                controller: 'globalLocalizationLookupCtrl',
                controllerAs: 'ctrl',
                permission: 'menu_item_localization',
                resolve: {
                    globalLocalizationLookups: function (globalLocalizationLookupService) {
                        'ngInject';
                        return globalLocalizationLookupService.loadGlobalLocalizationLookups();
                    }
                }
            })
            // attachment types
            .state('app.administration.attachment-types', {
                url: '/attachment-types',
                template: templateProvider.getView('attachment-types'),
                controller: 'attachmentTypeCtrl',
                controllerAs: 'ctrl',
                permission: 'menu_item_attachment_types',
                resolve: {
                    attachmentTypes: function (attachmentTypeService) {
                        'ngInject';
                        return attachmentTypeService.loadAttachmentTypes();
                    }
                }
            })
            .state('app.search', {
                abstract: true,
                url: '/search',
                template: '<div id="sub-view-wrapper"><ui-view flex layout="column" class="sub-view" /></div>',
                resolve: {
                    lookups: function (correspondenceService) {
                        'ngInject';
                        return correspondenceService.getCorrespondenceLookups('common');
                    }
                }
            })
            // Outgoing Search
            .state('app.search.outgoing', {
                url: '/outgoing',
                template: templateProvider.getView('search-outgoing'),
                controller: 'searchOutgoingCtrl',
                controllerAs: 'ctrl',
                permission: 'menu_item_search_module_outgoing',
                resolve: {
                    organizations: function (organizationService) {
                        'ngInject';
                        return organizationService.loadOrganizations()
                            .then(function (result) {
                                return _.filter(result, function (organization) {
                                    return organization.hasRegistry;
                                })
                            });
                    },
                    propertyConfigurations: function (propertyConfigurationService, employeeService) {
                        'ngInject';
                        var ouId = employeeService.getEmployee().organization.ouid;
                        return propertyConfigurationService
                            .loadPropertyConfigurationsByDocumentClassAndOU('outgoing', ouId);
                    },
                    correspondenceSiteTypes: function (correspondenceSiteTypeService) {
                        'ngInject';
                        return correspondenceSiteTypeService.loadCorrespondenceSiteTypes();
                    },
                    approvers: function (ouApplicationUserService, employeeService) {
                        'ngInject';
                        return ouApplicationUserService
                            .searchByCriteria({
                                regOu: employeeService.getEmployee().organization.ouRegistryID
                            });
                    }/*,
                    centralArchives: function ($q, organizations, employeeService, organizationService) {
                        'ngInject';
                        return employeeService.isCentralArchive() ? organizationService.centralArchiveOrganizations() : $q.resolve(false);
                    }*/
                }
            })
            //Incoming Search
            .state('app.search.incoming', {
                url: '/incoming',
                template: templateProvider.getView('search-incoming'),
                controller: 'searchIncomingCtrl',
                controllerAs: 'ctrl',
                permission: 'menu_item_search_module_incoming',
                resolve: {
                    organizations: function (organizationService) {
                        'ngInject';
                        return organizationService.loadOrganizations()
                            .then(function (result) {
                                return _.filter(result, function (organization) {
                                    return organization.hasRegistry;
                                })
                            });
                    },
                    correspondenceSiteTypes: function (correspondenceSiteTypeService) {
                        'ngInject';
                        return correspondenceSiteTypeService.loadCorrespondenceSiteTypes();
                    },
                    propertyConfigurations: function (propertyConfigurationService, employeeService) {
                        'ngInject';
                        var ouId = employeeService.getEmployee().organization.ouid;
                        return propertyConfigurationService
                            .loadPropertyConfigurationsByDocumentClassAndOU('incoming', ouId);
                    },
                    /*documentFiles: function (documentFileService) {
                        'ngInject';
                        return documentFileService.loadDocumentFiles();
                    },
                    documentTypes: function (documentTypeService) {
                        'ngInject';
                        return documentTypeService.loadDocumentTypes();
                    },
                    mainClassifications: function (classificationService) {
                        'ngInject';
                        return classificationService.loadClassifications().then(function (classifications) {
                            return classificationService.getMainClassifications(classifications);
                        });
                    },
                    documentStatuses: function (documentStatusService) {
                        'ngInject';
                        return documentStatusService.getDocumentStatuses();
                    }*/

                    /*,
                    centralArchives: function ($q, organizations, employeeService, organizationService) {
                        'ngInject';
                        return employeeService.isCentralArchive() ? organizationService.centralArchiveOrganizations() : $q.resolve(false);
                    }*/
                }
            })
            // Internal Search
            .state('app.search.internal', {
                url: '/internal',
                template: templateProvider.getView('search-internal'),
                controller: 'searchInternalCtrl',
                controllerAs: 'ctrl',
                permission: 'menu_item_search_module_internal',
                resolve: {
                    organizations: function (organizationService) {
                        'ngInject';
                        return organizationService.loadOrganizations()
                            .then(function (result) {
                                return _.filter(result, function (organization) {
                                    return organization.hasRegistry;
                                })
                            });
                    },
                    correspondenceSiteTypes: function (correspondenceSiteTypeService) {
                        'ngInject';
                        return correspondenceSiteTypeService.loadCorrespondenceSiteTypes();
                    },
                    propertyConfigurations: function (propertyConfigurationService, employeeService) {
                        'ngInject';
                        var ouId = employeeService.getEmployee().organization.ouid;
                        return propertyConfigurationService
                            .loadPropertyConfigurationsByDocumentClassAndOU('internal', ouId);
                    },
                    /*documentFiles: function (documentFileService) {
                        'ngInject';
                        return documentFileService.loadDocumentFiles();
                    },
                    documentTypes: function (documentTypeService) {
                        'ngInject';
                        return documentTypeService.loadDocumentTypes();
                    },
                    mainClassifications: function (classificationService) {
                        'ngInject';
                        return classificationService.loadClassifications().then(function (classifications) {
                            return classificationService.getMainClassifications(classifications);
                        });
                    },
                    documentStatuses: function (documentStatusService) {
                        'ngInject';
                        return documentStatusService.getDocumentStatuses();
                    },*/
                    approvers: function (ouApplicationUserService, employeeService) {
                        'ngInject';
                        return ouApplicationUserService
                            .searchByCriteria({
                                regOu: employeeService.getEmployee().organization.ouRegistryID
                            });
                    }/*,
                    centralArchives: function ($q, organizations, employeeService, organizationService) {
                        'ngInject';
                        return employeeService.isCentralArchive() ? organizationService.centralArchiveOrganizations() : $q.resolve(false);
                    }*/
                }
            })
            //General Search
            .state('app.search.general', {
                url: '/general',
                template: templateProvider.getView('search-general'),
                controller: 'searchGeneralCtrl',
                controllerAs: 'ctrl',
                permission: 'menu_item_search_module_general',
                resolve: {
                    organizations: function (organizationService) {
                        'ngInject';
                        return organizationService.loadOrganizations()
                            .then(function (result) {
                                return _.filter(result, function (organization) {
                                    return organization.hasRegistry;
                                })
                            });
                    },
                    correspondenceSiteTypes: function (correspondenceSiteTypeService) {
                        'ngInject';
                        return correspondenceSiteTypeService.loadCorrespondenceSiteTypes();
                    },
                    propertyConfigurations: function (propertyConfigurationService, employeeService) {
                        'ngInject';
                        var ouId = employeeService.getEmployee().organization.ouid;
                        return propertyConfigurationService
                            .loadPropertyConfigurationsByDocumentClassAndOU('general', ouId);
                    },
                    /*documentFiles: function (documentFileService) {
                        'ngInject';
                        return documentFileService.loadDocumentFiles();
                    },
                    documentTypes: function (documentTypeService) {
                        'ngInject';
                        return documentTypeService.loadDocumentTypes();
                    },
                    mainClassifications: function (classificationService) {
                        'ngInject';
                        return classificationService.loadClassifications().then(function (classifications) {
                            return classificationService.getMainClassifications(classifications);
                        });
                    },
                    documentStatuses: function (documentStatusService) {
                        'ngInject';
                        return documentStatusService.getDocumentStatuses();
                    }*/
                    /*,
                    centralArchives: function ($q, organizations, employeeService, organizationService) {
                        'ngInject';
                        return employeeService.isCentralArchive() ? organizationService.centralArchiveOrganizations() : $q.resolve(false);
                    }*/
                }
            })
            // outgoing
            .state('app.outgoing', {
                abstract: true,
                url: '/outgoing',
                template: '<div id="sub-view-wrapper"><ui-view flex layout="column" class="sub-view" /></div>',
                resolve: {
                    lookups: function (correspondenceService) {
                        'ngInject';
                        return correspondenceService
                            .loadCorrespondenceLookups('outgoing')
                    },
                    attachmentTypes: function (attachmentTypeService, employeeService) {
                        'ngInject';
                        return !employeeService.isCloudUser() ? attachmentTypeService.getAttachmentTypes() : [];
                    }
                }
            })
            // add-outgoing
            .state('app.outgoing.add', {
                url: '/add?vsId?workItem?action',
                template: templateProvider.getView('outgoing-add'),
                controller: 'outgoingCtrl',
                controllerAs: 'ctrl',
                permission: 'menu_item_add_outgoing'
            })
            // add simple outgoing
            .state('app.outgoing.simple-add', {
                url: '/simpleAdd?vsId?workItem?action',
                template: templateProvider.getView('outgoing-simple-add'),
                controller: 'simpleOutgoingCtrl',
                controllerAs: 'ctrl',
                permission: 'menu_item_outgoing_simple_add'
            })
            // prepare outgoing
            .state('app.outgoing.prepare', {
                url: '/prepare',
                template: templateProvider.getView('outgoing-prepare'),
                controller: 'prepareOutgoingCtrl',
                controllerAs: 'ctrl',
                permission: 'menu_item_outgoing_prepare',
                resolve: {
                    prepareOutgoings: function (prepareOutgoingService) {
                        'ngInject';
                        return prepareOutgoingService.loadPrepareOutgoings();
                    }
                }
            })
            // draft outgoing
            .state('app.outgoing.draft', {
                url: '/draft',
                template: templateProvider.getView('outgoing-draft'),
                controller: 'draftOutgoingCtrl',
                controllerAs: 'ctrl',
                permission: 'menu_item_outgoing_draft',
                resolve: {
                    draftOutgoings: function (draftOutgoingService) {
                        'ngInject';
                        return draftOutgoingService.loadDraftOutgoings();
                    }
                }
            })
            // review outgoing
            .state('app.outgoing.review', {
                url: '/review',
                template: templateProvider.getView('outgoing-review'),
                controller: 'reviewOutgoingCtrl',
                controllerAs: 'ctrl',
                permission: 'menu_item_outgoing_review',
                resolve: {
                    reviewOutgoings: function (reviewOutgoingService) {
                        'ngInject';
                        return reviewOutgoingService.loadReviewOutgoings();
                    }
                }
            })
            // send outgoing
            .state('app.outgoing.ready-to-send', {
                url: '/ready-to-send',
                template: templateProvider.getView('outgoing-ready-to-send'),
                controller: 'readyToSendOutgoingCtrl',
                controllerAs: 'ctrl',
                permission: 'menu_item_outgoing_ready_to_send',
                resolve: {
                    readyToSendOutgoings: function (readyToSendOutgoingService, employeeService) {
                        'ngInject';
                        return readyToSendOutgoingService.loadReadyToSendOutgoings();
                    }
                }
            })
            // rejected outgoing
            .state('app.outgoing.rejected', {
                url: '/rejected',
                template: templateProvider.getView('outgoing-rejected'),
                controller: 'rejectedOutgoingCtrl',
                controllerAs: 'ctrl',
                permission: 'menu_item_outgoing_rejected',
                resolve: {
                    rejectedOutgoings: function (rejectedOutgoingService) {
                        'ngInject';
                        return rejectedOutgoingService.loadRejectedOutgoings();
                    }
                }
            })
            //document templates
            .state('app.administration.document-templates', {
                url: '/document-templates',
                template: templateProvider.getView('document-template'),
                controller: 'documentTemplateCtrl',
                controllerAs: 'ctrl',
                permission: 'menu_item_document_templates',
                resolve: {
                    organizations: function (organizationService) {
                        'ngInject';
                        return organizationService.loadOrganizations()
                            .then(function (result) {
                                return _.filter(result, function (organization) {
                                    return organization.hasRegistry;
                                })
                            });
                    },
                    /*currentEmployee: function (employeeService) {
                        'ngInject';
                        return employeeService.getEmployee();
                    },*/
                    documentTemplates: function (documentTemplateService, selectedRegOU) {
                        'ngInject';
                        //return documentTemplateService.loadDocumentTemplates(currentEmployee.defaultOUID || -1);
                        return documentTemplateService.loadDocumentTemplates(selectedRegOU || -1);
                    },
                    selectedRegOU: function (employeeService) {
                        'ngInject';
                        return employeeService.isAdminUser() ? -1 : employeeService.getEmployee().organization.ouRegistryID;
                    }
                }
            })
            // inbox
            .state('app.inbox', {
                abstract: true,
                url: '/inbox',
                template: '<div id="sub-view-wrapper"><ui-view flex layout="column" class="sub-view" /></div>',
                resolve: {
                    lookups: function (correspondenceService) {
                        'ngInject';
                        return correspondenceService.loadCorrespondenceLookups('common')
                    },
                    attachmentTypes: function (attachmentTypeService) {
                        'ngInject';
                        return attachmentTypeService.getAttachmentTypes();
                    }
                }
            })
            // user inbox
            .state('app.inbox.user-inbox', {
                url: '/user-inbox',
                template: templateProvider.getView('user-inbox'),
                controller: 'userInboxCtrl',
                controllerAs: 'ctrl',
                permission: 'menu_item_user_inbox',
                resolve: {
                    userInboxes: function (userInboxService) {
                        'ngInject';
                        return userInboxService.loadUserInboxes();
                    },
                    /*userFolders: function (userFolderService) {
                        'ngInject';
                        return userFolderService.getUserFoldersForApplicationUser();
                    },*/
                    userFilters: function (userFilterService) {
                        'ngInject';
                        return userFilterService.loadUserFilters();
                    },
                    // just to update notifications when opening user inbox
                    notifications: function (mailNotificationService) {
                        'ngInject';
                        return mailNotificationService
                            .loadMailNotifications(mailNotificationService.notificationsRequestCount)
                            .catch(function () {
                                return [];
                            });
                    }

                }
            })
            // department inbox
            .state('app.department-inbox', {
                abstract: true,
                url: '/department-inbox',
                template: '<div id="sub-view-wrapper"><ui-view flex layout="column" class="sub-view" /></div>',
                resolve: {
                    lookups: function (correspondenceService) {
                        'ngInject';
                        return correspondenceService.loadCorrespondenceLookups('common')
                    },
                    attachmentTypes: function (attachmentTypeService) {
                        'ngInject';
                        return attachmentTypeService.getAttachmentTypes();
                    }
                }
            })
            // incoming department inbox
            .state('app.department-inbox.incoming', {
                url: '/incoming',
                template: templateProvider.getView('department-inbox-incoming'),
                controller: 'incomingDepartmentInboxCtrl',
                controllerAs: 'ctrl',
                permission: 'menu_item_dep_incoming',
                resolve: {
                    incomingDepartmentInboxes: function (incomingDepartmentInboxService) {
                        'ngInject';
                        return incomingDepartmentInboxService.loadIncomingDepartmentInboxes();
                    }
                }
            })
            // returned department inbox
            .state('app.department-inbox.returned', {
                url: '/returned',
                template: templateProvider.getView('department-inbox-returned'),
                controller: 'returnedDepartmentInboxCtrl',
                controllerAs: 'ctrl',
                permission: 'menu_item_dep_returned',
                resolve: {
                    returnedDepartmentInboxes: function (returnedDepartmentInboxService) {
                        'ngInject';
                        return returnedDepartmentInboxService.loadReturnedDepartmentInboxes();
                    }
                }
            })
            // ready to export
            .state('app.department-inbox.ready-to-export', {
                url: '/ready-to-export',
                template: templateProvider.getView('department-inbox-ready-to-export'),
                controller: 'readyToExportDepartmentInboxCtrl',
                controllerAs: 'ctrl',
                permission: 'menu_item_dep_ready_to_export',
                resolve: {
                    readyToExports: function (readyToExportService) {
                        'ngInject';
                        return readyToExportService.loadReadyToExports();
                    }
                }
            })
            // sent items
            .state('app.department-inbox.sent-items', {
                url: '/sent-items',
                template: templateProvider.getView('department-inbox-sent-items'),
                controller: 'sentItemDepartmentInboxCtrl',
                controllerAs: 'ctrl',
                permission: 'menu_item_dep_sent_items'
            })
            // quick search
            .state('app.search.quick-search', {
                url: '/quick-search?key&q&random',
                template: templateProvider.getView('quick-search'),
                controller: 'quickSearchCorrespondenceCtrl',
                controllerAs: 'ctrl',
                resolve: {
                    quickSearchCorrespondence: function (quickSearchCorrespondenceService, $stateParams) {
                        'ngInject';
                        if (!$stateParams.key) {
                            return [];
                        }
                        var searchJSON = {};
                        searchJSON[$stateParams.key] = $stateParams.q;
                        return quickSearchCorrespondenceService.loadQuickSearchCorrespondence(searchJSON);
                    }
                }
            })
            // incoming
            .state('app.incoming', {
                abstract: true,
                url: '/incoming',
                template: '<div id="sub-view-wrapper"><ui-view flex layout="column" class="sub-view" /></div>',
                resolve: {
                    lookups: function (correspondenceService) {
                        'ngInject';
                        return correspondenceService
                            .loadCorrespondenceLookups('incoming')
                    },
                    attachmentTypes: function (attachmentTypeService, employeeService) {
                        'ngInject';
                        return !employeeService.isCloudUser() ? attachmentTypeService.getAttachmentTypes() : [];
                    }
                }
            })
            // add incoming
            .state('app.incoming.add', {
                url: '/add?action?workItem?vsId?internalg2g',
                template: templateProvider.getView('incoming-add'),
                controller: 'incomingCtrl',
                controllerAs: 'ctrl',
                permission: 'menu_item_incoming_add'
            })
            // add simple incoming
            .state('app.incoming.simple-add', {
                url: '/simpleAdd?action?workItem?vsId',
                template: templateProvider.getView('incoming-simple-add'),
                controller: 'simpleIncomingCtrl',
                controllerAs: 'ctrl',
                permission: 'menu_item_incoming_simple_add'
            })
            // scan incoming
            .state('app.incoming.scan', {
                url: '/scan',
                template: templateProvider.getView('incoming-scan'),
                controller: 'scanIncomingCtrl',
                controllerAs: 'ctrl',
                permission: 'menu_item_incoming_scan',
                resolve: {
                    scanIncomings: function (scanIncomingService) {
                        'ngInject';
                        return scanIncomingService.loadScanIncomings();
                    }
                }
            })
            // review incoming
            .state('app.incoming.review', {
                url: '/review',
                template: templateProvider.getView('incoming-review'),
                controller: 'reviewIncomingCtrl',
                controllerAs: 'ctrl',
                permission: 'menu_item_incoming_review',
                resolve: {
                    reviewIncomings: function (reviewIncomingService) {
                        'ngInject';
                        return reviewIncomingService.loadReviewIncomings();
                    }
                }
            })
            // send incoming
            .state('app.incoming.ready-to-send', {
                url: '/ready-to-send',
                template: templateProvider.getView('incoming-ready-to-send'),
                controller: 'readyToSendIncomingCtrl',
                controllerAs: 'ctrl',
                permission: 'menu_item_incoming_ready_to_send',
                resolve: {
                    readyToSendIncomings: function (readyToSendIncomingService) {
                        'ngInject';
                        return readyToSendIncomingService.loadReadyToSendIncomings();
                    }
                }
            })
            // rejected incoming
            .state('app.incoming.rejected', {
                url: '/rejected',
                template: templateProvider.getView('incoming-rejected'),
                controller: 'rejectedIncomingCtrl',
                controllerAs: 'ctrl',
                permission: 'menu_item_incoming_rejected',
                resolve: {
                    rejectedIncomings: function (rejectedIncomingService) {
                        'ngInject';
                        return rejectedIncomingService.loadRejectedIncomings();
                    }
                }
            })
            // internal
            .state('app.internal', {
                abstract: true,
                url: '/internal',
                template: '<div id="sub-view-wrapper"><ui-view flex layout="column" class="sub-view" /></div>',
                resolve: {
                    lookups: function (correspondenceService) {
                        'ngInject';
                        return correspondenceService
                            .loadCorrespondenceLookups('internal')
                    },
                    attachmentTypes: function (attachmentTypeService, employeeService) {
                        'ngInject';
                        return !employeeService.isCloudUser() ? attachmentTypeService.getAttachmentTypes() : [];
                    }
                }
            })
            // add-internal
            .state('app.internal.add', {
                url: '/add?vsId?workItem?action',
                template: templateProvider.getView('internal-add'),
                controller: 'internalCtrl',
                controllerAs: 'ctrl',
                permission: 'menu_item_internal_add'
            })

            // add simple internal
            .state('app.internal.simple-add', {
                url: '/simpleAdd?vsId?workItem?action',
                template: templateProvider.getView('internal-simple-add'),
                controller: 'simpleInternalCtrl',
                controllerAs: 'ctrl',
                permission: 'menu_item_internal_simple_add'
            })

            // prepare internal
            .state('app.internal.prepare', {
                url: '/prepare',
                template: templateProvider.getView('internal-prepare'),
                controller: 'prepareInternalCtrl',
                controllerAs: 'ctrl',
                permission: 'menu_item_internal_prepare',
                resolve: {
                    prepareInternals: function (prepareInternalService) {
                        'ngInject';
                        return prepareInternalService.loadPrepareInternals();
                    }
                }
            })
            // draft internal
            .state('app.internal.draft', {
                url: '/draft',
                template: templateProvider.getView('internal-draft'),
                controller: 'draftInternalCtrl',
                controllerAs: 'ctrl',
                permission: 'menu_item_internal_draft',
                resolve: {
                    draftInternals: function (draftInternalService) {
                        'ngInject';
                        return draftInternalService.loadDraftInternals();
                    }
                }
            })
            // review internal
            .state('app.internal.review', {
                url: '/review',
                template: templateProvider.getView('internal-review'),
                controller: 'reviewInternalCtrl',
                controllerAs: 'ctrl',
                permission: 'menu_item_internal_review',
                resolve: {
                    reviewInternals: function (reviewInternalService) {
                        'ngInject';
                        return reviewInternalService.loadReviewInternals();
                    }
                }
            })
            // send internal
            .state('app.internal.ready-to-send', {
                url: '/ready-to-send',
                template: templateProvider.getView('internal-ready-to-send'),
                controller: 'readyToSendInternalCtrl',
                controllerAs: 'ctrl',
                permission: 'menu_item_internal_ready_to_send',
                resolve: {
                    readyToSendInternals: function (readyToSendInternalService) {
                        'ngInject';
                        return readyToSendInternalService.loadReadyToSendInternals();
                    }
                }
            })
            // rejected internal
            .state('app.internal.rejected', {
                url: '/rejected',
                template: templateProvider.getView('internal-rejected'),
                controller: 'rejectedInternalCtrl',
                controllerAs: 'ctrl',
                permission: 'menu_item_internal_rejected',
                resolve: {
                    rejectedInternals: function (rejectedInternalService) {
                        'ngInject';
                        return rejectedInternalService.loadRejectedInternals();
                    }
                }
            })
            // approved internal
            .state('app.internal.approved', {
                url: '/approved',
                template: templateProvider.getView('internal-approved'),
                controller: 'approvedInternalCtrl',
                controllerAs: 'ctrl',
                permission: 'menu_item_approved_internal_queue',
                resolve: {
                    approvedInternals: function (approvedInternalService) {
                        'ngInject';
                        return approvedInternalService.loadApprovedInternals();
                    },
                    userFolders: function (userFolderService) {
                        'ngInject';
                        return userFolderService.getUserFoldersForApplicationUser();
                    }
                }
            })

            // followup employee inbox
            .state('app.inbox.followup-employee-inbox', {
                url: '/followup-employee-inbox',
                template: templateProvider.getView('followup-employee-inbox'),
                controller: 'followupEmployeeInboxCtrl',
                controllerAs: 'ctrl',
                permission: 'menu_item_followup_employee_inbox'
                /*resolve: {
                    userFolders: function (userFolderService) {
                        'ngInject';
                        return userFolderService.getUserFoldersForApplicationUser();
                    }
                }*/
            })
            // proxy mail inbox
            .state('app.inbox.proxy-mail-inbox', {
                url: '/proxy-mail-inbox',
                template: templateProvider.getView('proxy-mail-inbox'),
                controller: 'proxyMailInboxCtrl',
                controllerAs: 'ctrl',
                permission: 'menu_item_proxy_mail_inbox',
                resolve: {
                    userFolders: function (userFolderService) {
                        'ngInject';
                        return userFolderService.getUserFoldersForApplicationUser();
                    },
                    proxyUsers: function (employeeService, ProxyMailUser, generator) {
                        'ngInject';
                        return generator.generateCollection(employeeService.getProxyUsers(), ProxyMailUser, null);
                    }
                }
            })
            // inbox - user sent items
            .state('app.inbox.sent-items', {
                url: '/sent-items',
                template: templateProvider.getView('user-sent-items'),
                controller: 'userSentItemCtrl',
                controllerAs: 'ctrl',
                permission: 'menu_item_sent_items',
                resolve: {
                    userSentItems: function (userSentItemService, rootEntity) {
                        'ngInject';
                        var globalSetting = rootEntity.returnRootEntity().settings;
                        return userSentItemService.loadUserSentItems(1, 5);
                    }
                }
            })
            //user favorite documents
            .state('app.inbox.favorite-documents', {
                url: '/favorite-documents',
                template: templateProvider.getView('favorite-documents'),
                controller: 'favoriteDocumentsCtrl',
                controllerAs: 'ctrl',
                permission: 'menu_item_user_favorite_documents',
                resolve: {
                    favoriteDocuments: function (favoriteDocumentsService, rootEntity) {
                        'ngInject';
                        var globalSetting = rootEntity.returnRootEntity().settings;
                        return favoriteDocumentsService.loadFavoriteDocuments(1, 5);
                    }
                }
            })
            .state('app.administration.localization', {
                url: '/localization',
                template: templateProvider.getView('localization'),
                controller: 'localizationCtrl',
                controllerAs: 'ctrl'
            })
            .state('app.inbox.group-inbox', {
                url: '/group-inbox',
                template: templateProvider.getView('group-inbox'),
                controller: 'groupInboxCtrl',
                controllerAs: 'ctrl',
                permission: 'menu_item_group_inbox'
            })
            .state('app.inbox.folders', {
                url: '/folders?folder',
                template: templateProvider.getView('folders'),
                controller: 'folderCtrl',
                controllerAs: 'ctrl',
                permission: 'menu_item_folders'
            })
            .state('app.central-archive', {
                abstract: true,
                url: '/central-archive',
                template: '<div id="sub-view-wrapper"><ui-view flex layout="column" class="sub-view" /></div>',
                resolve: {
                    lookups: function (correspondenceService) {
                        'ngInject';
                        return correspondenceService
                            .loadCorrespondenceLookups('common');
                    },
                    attachmentTypes: function (attachmentTypeService) {
                        'ngInject';
                        return attachmentTypeService.getAttachmentTypes();
                    }
                }
            })
            .state('app.central-archive.ready-to-export', {
                url: '/ready-to-export',
                template: templateProvider.getView('central-archive-ready-to-export'),
                controller: 'readyToExportArchiveCtrl',
                controllerAs: 'ctrl',
                permission: 'menu_item_central_archive_ready_to_export'
            })

            // temporary route for reports
            .state('app.reports', {
                url: '/reports/:reportName',
                template: '<iframe class="document-viewer-full-width-height" ng-src="{{ctrl.url}}"></iframe>',
                controller: function ($sce, $stateParams, tokenService, urlService, employeeService) {
                    'ngInject';
                    var self = this;
                    var reportName = $stateParams.reportName,
                        reportUrl = urlService.reports.replace('{reportName}', encodeURIComponent(reportName)).replace('{token}', tokenService.getToken()),
                        url = urlService.portal.replace('{reportUrl}', reportUrl);
                    console.log(url);
                    self.url = $sce.trustAsResourceUrl(url);
                },
                controllerAs: 'ctrl'
            })
            .state('app.icn', {
                url: '/icn/archive',
                abstract: false,
                template: '<iframe ng-hide="true" width="0" height="0" ng-src="{{ctrl.url}}"></iframe>' +
                    '<div id="sub-view-wrapper"><ui-view flex layout="column" class="sub-view" /></div>',
                controller: function (credentials, urlService, $sce) {
                    'ngInject';
                    var self = this;
                    self.url = $sce.trustAsResourceUrl(urlService.icnLogin.replace('{{username}}', credentials.username).replace('{{password}}', credentials.password));
                },
                controllerAs: 'ctrl',
                resolve: {
                    credentials: function (authenticationService) {
                        'ngInject';
                        return authenticationService.getUserData();
                    }
                }
            })
            .state('app.icn.add', {
                url: '/add',
                template: '<iframe class="document-viewer-full-width-height" ng-src="{{ctrl.url}}"></iframe>',
                controllerAs: 'ctrl',
                permission: 'menu_item_icn_archive_add',
                controller: function (urlService, $sce) {
                    'ngInject';
                    var self = this;
                    self.url = $sce.trustAsResourceUrl(urlService.icnAdd);
                }
            })
            .state('app.icn.search', {
                url: '/search',
                template: '<iframe class="document-viewer-full-width-height" ng-src="{{ctrl.url}}"></iframe>',
                controllerAs: 'ctrl',
                permission: 'menu_item_icn_archive_search',
                controller: function (urlService, $sce) {
                    'ngInject';
                    var self = this;
                    self.url = $sce.trustAsResourceUrl(urlService.icnSearch);
                }
            })
            .state('app.g2g', {
                abstract: true,
                url: '/g2g',
                template: '<div id="sub-view-wrapper"><ui-view flex layout="column" class="sub-view" /></div>',
                resolve: {
                    lookups: function (correspondenceService) {
                        'ngInject';
                        return correspondenceService.getCorrespondenceLookups('common');
                    },
                    /*g2gLookups: function (g2gLookupService) {
                        'ngInject';
                        return g2gLookupService.getG2gLookups();
                    },
                    g2gInternalLookups: function(g2gLookupService){
                        'ngInject';
                        return g2gLookupService.getG2gInternalLookups();
                    },*/
                    organizations: function (organizationService) {
                        'ngInject';
                        return organizationService.getOrganizations();
                    },
                }
            })
            .state('app.g2g.incoming', {
                url: '/incoming',
                template: cmsTemplateProvider.getView('g2g-incoming'),
                controller: 'g2gIncomingCtrl',
                controllerAs: 'ctrl',
                permission: 'menu_item_g2g',
                resolve: {
                    g2gItems: function (g2gIncomingService) {
                        'ngInject';
                        return g2gIncomingService.loadG2gItems();
                    }
                }
            })
            .state('app.g2g.returned', {
                url: '/returned',
                template: cmsTemplateProvider.getView('g2g-returned'),
                controller: 'g2gReturnedCtrl',
                controllerAs: 'ctrl',
                permission: 'menu_item_g2g',
                resolve: {
                    g2gItems: function (g2gReturnedService) {
                        'ngInject';
                        return g2gReturnedService.loadG2gItems();
                    }
                }
            })
            .state('app.g2g.sent-items', {
                url: '/sent-items',
                template: cmsTemplateProvider.getView('g2g-sent-items'),
                controller: 'g2gSentItemsCtrl',
                controllerAs: 'ctrl',
                permission: 'menu_item_g2g'
            })
    });
};
