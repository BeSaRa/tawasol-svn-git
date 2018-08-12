module.exports = function (app) {
    app.controller('globalSettingCtrl', function (lookupService,
                                                  globalSettingService,
                                                  globalSetting,
                                                  fileTypes,
                                                  $timeout,
                                                  $element,
                                                  $q,
                                                  $scope,
                                                  langService,
                                                  toast,
                                                  entity,
                                                  applicationUsers,
                                                  applicationUserService,
                                                  themes,
                                                  validationService,
                                                  generator,
                                                  contextHelpService,
                                                  rootEntity,
                                                  dialog) {
        'ngInject';
        var self = this;

        self.controllerName = 'globalSettingCtrl';

        self.progress = null;
        contextHelpService.setHelpTo('global-settings');
        /**
         * @description global setting
         * @type {*}
         */
        self.globalSetting = globalSetting;
        self.globalSettingCopy = angular.copy(self.globalSetting);
        self.entity = entity;
        self.entityForGlobalSetting = angular.copy(entity);
        self.entityProperties = ['appArName', 'appEnName', 'arName', 'enName', 'identifier', 'groupPrefix'];
        self.globalSetting.rootEntityId = self.entityForGlobalSetting.id;
        self.applicationUsers = applicationUsers;
        self.themes = themes;

        self.fileTypes = fileTypes;
        self.fileSizes = lookupService.returnLookups(lookupService.fileSize);
        self.escalationProcesses = lookupService.returnLookups(lookupService.escalationProcess);
        self.documentSecuritySchemas = lookupService.returnLookups(lookupService.securitySchema);
        self.workFlowSecurities = lookupService.returnLookups(lookupService.workflowSecurity);
        self.securityLevels = lookupService.returnLookups(lookupService.securityLevel);
        self.correspondenceSiteSearchTypeOptions = [
            {
                key: 'search_type_simple',
                value: true
            },
            {
                key: 'search_type_advanced',
                value: false
            }
        ];

        /**
         * @description Contains the list of tabs that can be shown
         * @type {string[]}
         */
        self.tabsToShow = [
            'basic',
            'appearance',
            'auditlog',
            'docsecurity',
            'workflowsecurity',
            'workflownotification',
            'upload',
            'barcodeSettings',
            'watermarkSettings'
        ];

        self.showTab = function (tabName) {
            return self.tabsToShow.indexOf(tabName) > -1;
        };

        /**
         * @description Contains the selected tab name
         * @type {string}
         */
        self.selectedTabName = "basic";

        /**
         * @description Set the current tab name
         * @param tabName
         */
        self.setCurrentTab = function (tabName) {
            self.selectedTabName = tabName;
        };

        self.imageDimensionsInfo = langService.get('image_dimensions_info').change({height: 283, width: 283});

        /**
         * @description Open the popup to select users to exclude from audit log
         * @param $event
         */
        self.selectExcludedApplicationUsers = function ($event) {
            applicationUserService
                .controllerMethod
                .selectApplicationUsers(self.globalSetting.excludedUsersFromAudit, "excluded_users", $event)
                .then(function (applicationUsers) {
                    self.globalSetting.excludedUsersFromAudit = applicationUsers;
                });
        };

        self.validateLabels = {
            searchAmount: 'default_max_row_search',
            searchAmountLimit: 'limited_max_row_search',
            inboxRefreshInterval: 'inbox_refresh_interval',
            sessionTimeout: 'session_time_out',
            enableMobileAccess: 'enable_mobile_access',
            canChangePassword: 'can_change_password',
            showCopyrightText: 'show_copyright',
            copyrightText: 'copyright_text',
            tamcontent: 'usage_terms_and_condition',
            auditLogin: 'register_login_logout_operations',
            auditDocumentView: 'register_document_view_operation',
            auditAdminOperation: 'register_administration_operation',
            attachmentInheritSecurity: 'attachment_inherit_main_document_security',
            exportAttachment: 'export_outgoing_with_attachment',
            exportLinkedDoc: 'export_outgoing_with_linked_documents',
            exportDocHistory: 'export_outgoing_with_workflow_history',
            exportLinkedObj: 'export_outgoing_with_linked_objects',
            securitySchema: 'documents_security_schema',
            wfsecurity: 'workflow_governance_rules',
            securityLevels: 'security_levels',
            escalationNotifySender: 'notify_sender_when_deadline',
            escalationNotifyReceiver: 'notify_receiver_when_deadline',
            enableSMSNotification: 'enable_sms_notification',
            enableEmailNotification: 'enable_email_notification',
            enableEscalation: 'enable_escalation_process',
            useCentralArchiveInternally: 'use_central_archive_internally',
            escalationProcess: 'choose_escalation_process',
            simpleCorsSiteSearch: 'correspondence_Site_search_type',
            theme: 'default_application_theme'
        };

        /**
         * Load globalSetting
         * @return globalSetting
         */
        self.reloadGlobalSetting = function () {
            return globalSettingService
                .getGlobalSettingByRootIdentifier(self.entity)
                .then(function (result) {
                    self.globalSetting = result;
                    self.globalSettingCopy = angular.copy(self.globalSetting);
                    return result;
                });
        };

        /**
         * @description Add new global setting
         */
        self.addGlobalSettingFromCtrl = function () {
            generator.replaceWithOriginalValues(self.globalSetting, self.entityForGlobalSetting, self.entityProperties);
            validationService
                .createValidation('ADD_GLOBAL_SETTING')
                .addStep('check_required', true, generator.checkRequiredFields, self.globalSetting, function (result) {
                    return !result.length;
                })
                .notifyFailure(function (step, result) {
                    var labels = _.map(result, function (label) {
                        return self.validateLabels[label];
                    });
                    generator.generateErrorFields('check_this_fields', labels);
                })
                .validate()
                .then(function () {
                    globalSettingService
                        .addGlobalSetting(self.globalSetting)
                        .then(function () {
                            self.reloadGlobalSetting()
                                .then(function () {
                                    toast.success(langService.get('save_success'));
                                });
                        });
                })
                .catch(function () {

                });
        };

        self.disableSecurityLevel = function (securityLevel) {
            return !!self.globalSettingCopy.id && !!_.find(self.globalSettingCopy.securityLevels, function (globalSecurityLevel) {
                return globalSecurityLevel.lookupKey === securityLevel.lookupKey;
            });
        };

        self.checkMinimumSecurityLevel = function (globalSetting) {
            return generator.getResultFromSelectedCollection(globalSetting.securityLevels, 'lookupKey') >= generator.getResultFromSelectedCollection(self.globalSettingCopy.securityLevels, 'lookupKey');
        };

        self.confirmChangeSecuritySchema = function ($event) {
            var defer = $q.defer();
            if (self.globalSetting.securitySchema === 1) {
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
                    self.globalSetting.securitySchema = 0;
                })
        };

        /**
         * @description Edit global setting
         */
        self.editGlobalSettingFromCtrl = function () {
            debugger;
            generator.replaceWithOriginalValues(self.globalSetting, self.entityForGlobalSetting, self.entityProperties);
            validationService
                .createValidation('EDIT_GLOBAL_SETTING')
                .addStep('check_required', true, generator.checkRequiredFields, self.globalSetting, function (result) {
                    return !result.length;
                })
                .notifyFailure(function (step, result) {
                    var labels = _.map(result, function (label) {
                        return self.validateLabels[label];
                    });
                    generator.generateErrorFields('check_this_fields', labels);
                })
                .addStep('check_security_level', true, self.checkMinimumSecurityLevel, self.globalSetting, function (result) {
                    return result;
                })
                .notifyFailure(function (step, result) {
                    var labels = _.map(self.globalSettingCopy.securityLevels, function (securityLevel) {
                        return securityLevel.getTranslatedName();
                    });
                    generator.generateErrorFields('minimum_selected_security_level', labels, true);
                })
                .validate()
                .then(function () {
                    globalSettingService
                        .updateGlobalSetting(self.globalSetting)
                        .then(function () {
                            self.reloadGlobalSetting()
                                .then(function () {
                                    rootEntity.loadInformation(rootEntity.getRootEntityIdentifier());
                                    toast.success(langService.get('edited_successfully'));
                                });
                        });
                })
                .catch(function () {

                });
        };

        /**
         * Save Uploaded Image File (add or edit)
         * @param modelName
         * Save Banner Image
         */
        self.saveBannerImage = function (modelName) {
            globalSettingService
                .saveLogoImage(self.globalSetting, self.currentFileData, modelName)
                .then(function () {
                    self.reloadGlobalSetting()
                        .then(function () {
                            self.saveBanner = true;
                            rootEntity.loadInformation(rootEntity.getRootEntityIdentifier()).then(function () {
                                toast.success(langService.get('banner_logo_success'));
                            });
                        });
                });
        };

        /**
         * Save Uploaded Image File (add or edit)
         * @param modelName
         * Save Logo Image
         */
        self.saveLoginLogoImage = function (modelName) {
            globalSettingService
                .saveLogoImage(self.globalSetting, self.currentFileData, modelName)
                .then(function () {
                    self.reloadGlobalSetting()
                        .then(function () {
                            self.saveLogo = true;
                            rootEntity.loadInformation(rootEntity.getRootEntityIdentifier()).then(function () {
                                toast.success(langService.get('login_logo_success'));
                            });
                        });
                });

        };
        self.currentFileData = null;
        /**
         * Open the popup and call the right controller function (add or edit)
         * @param file
         * @param modelName
         */
        self.viewImage = function (file, modelName) {
            var image;
            self.currentFileData = file;
            var reader = new FileReader();
            reader.onload = function () {
                image = new Blob([reader.result], {type: file.type});
                if (self.globalSetting[modelName]) {
                    // self.globalSetting[modelName].id = self.globalSetting[modelName].id;
                    self.globalSetting[modelName].mimeType = file.type;
                    self.globalSetting[modelName].fileSize = file.size;
                    self.globalSetting[modelName].extension = file.name.split('.').pop();
                    self.globalSetting[modelName].fileUrl = URL.createObjectURL(image);
                }

                self[modelName] = URL.createObjectURL(image);
                if (modelName === "loginLogo") {
                    self.saveLogo = false;
                }
                else {
                    self.saveBanner = false;
                }
                if (!$scope.$$phase) {
                    $scope.$apply();
                }
            };
            reader.readAsArrayBuffer(file);
        };
    });
};