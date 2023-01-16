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
                                                  dialog,
                                                  employeeService,
                                                  permissions,
                                                  roleService,
                                                  $filter,
                                                  ministerWorkflowActions,
                                                  distributionWFService,
                                                  organizationService,
                                                  _) {
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
        self.editMode = !!self.globalSetting.id;

        self.entity = entity;
        self.entityForGlobalSetting = angular.copy(entity);
        self.entityProperties = ['appArName', 'appEnName', 'arName', 'enName', 'identifier', 'groupPrefix'];
        self.globalSetting.rootEntityId = self.entityForGlobalSetting.id;
        self.applicationUsers = applicationUsers;
        self.themes = themes;
        self.saveBanner = true;
        self.saveLogo = true;
        self.fileTypes = fileTypes;
        self.hasPSPDFViewer = rootEntity.hasPSPDFViewer();
        self.kwtAlDiyarDigitalEnabled = rootEntity.returnRootEntity().rootEntity.kwtAlDiyarDigitalEnabled;

        var filterExcludedFileTypes = ["xlsx", "docx", "doc", "pptx"];
        self.excludedFileTypes = _.filter(self.fileTypes, function (fileType) {
            return filterExcludedFileTypes.indexOf(fileType.getExtension()) !== -1;
        });
        self.fileSizes = lookupService.returnLookups(lookupService.fileSize);
        self.escalationProcesses = lookupService.returnLookups(lookupService.escalationProcess);
        self.documentSecuritySchemas = lookupService.returnLookups(lookupService.securitySchema);
        self.workFlowSecurities = lookupService.returnLookups(lookupService.workflowSecurity);
        self.securityLevels = lookupService.returnLookups(lookupService.securityLevel);
        self.thumbnailModes = lookupService.returnLookups(lookupService.thumbnailMode);
        self.languages = lookupService.returnLookups(lookupService.language);
        self.digitalCertificateModesList = lookupService.returnLookups(lookupService.digitalCertificateMode);
        self.employeeService = employeeService;
        self.permissionsList = permissions;
        self.sendRelatedDocsStatusList = lookupService.returnLookups(lookupService.wfRelatedBookStatus);
        self.ministerWorkflowActions = ministerWorkflowActions;

        self.loginLogoExtensions = ['.png'];
        self.bannerLogoExtensions = ['.png'];

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
        self.exportTypeList = [
            {key: 'export_by_selection', value: false},
            {key: 'export_by_group', value: true}
        ];

        self.search = ''; // permission search
        self.permissions = {};
        self.totalPermissionsCount = 0;

        // for the first time the controller initialize
        self.permissions = _getPermissions(langService.current);

        _.map(self.permissions, function (keys) {
            _.map(keys, function (permissionsArr) {
                _.map(permissionsArr, function (value) {
                    if (value)
                        self.totalPermissionsCount++;
                })
            })
        });
        // for any change happened in language rebuild the permissions with the current corrected key.
        langService.listeningToChange(_getPermissions);
        _mapSelectedExcludedPermissions();

        function _mapSelectedExcludedPermissions() {
            if (self.employeeService.isSuperAdminUser()) {
                self.globalSetting.excludedPermissionList = _.filter(roleService.permissionListFromAppUserView, function (permission) {
                    return (self.globalSetting.excludedPermissionList.indexOf(permission.id) > -1);
                });
            }
        }

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
            'watermarkSettings',
            'limitPrivileges',
            'ministerAssistants'
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
            var defer = $q.defer();
            if (tabName === 'ministerAssistants') {
                $q.all([
                    organizationService.loadOrganizations(true),
                    distributionWFService.loadMinisterAssistants()
                ]).then(function (result) {
                    self.ministerAssistants = result[1];
                    defer.resolve(tabName);
                });
            } else {
                defer.resolve(tabName);
            }
            return defer.promise.then(function (tab) {
                self.selectedTabName = tab;
            });
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
            defaultDisplayLang: 'default_language',
            inboxRefreshInterval: 'inbox_refresh_interval',
            sessionTimeout: 'session_time_out',
            thumbnailMode: 'thumbnail_mode',
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
            theme: 'default_application_theme',
            digitalCertificateMode: 'digital_certificate_mode',
            wFRelatedBookStatus: 'send_related_documents'
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
            } else {
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
                                    rootEntity.loadInformation(rootEntity.getRootEntityIdentifier(), true);
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
                            rootEntity.loadInformation(rootEntity.getRootEntityIdentifier(), true).then(function () {
                                toast.success(langService.get('banner_logo_success'));
                            });
                        });
                });
        };

        self.onChangeRemoveMAIPSecurity = function ($event) {
            if (self.globalSetting.removeMAIPSecurity && !self.entityForGlobalSetting.maipServiceURL)
                dialog.alertMessage(langService.get('can_not_enable_remove_maip_security')).then(function () {
                    self.globalSetting.removeMAIPSecurity = false;
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
                            rootEntity.loadInformation(rootEntity.getRootEntityIdentifier(), true).then(function () {
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
                } else {
                    self.saveBanner = false;
                }
                if (!$scope.$$phase) {
                    $scope.$apply();
                }
            };
            reader.readAsArrayBuffer(file);
        };

        self.enableEscalationChanged = function ($event) {
            self.globalSetting.escalationProcess = (self.globalSetting.enableEscalation) ? self.globalSettingCopy.escalationProcess : null;
        };

        self.getMaxSearchAmountLimit = function () {
            return Number(self.globalSetting.searchAmountLimit || 0) + 1;
        };

        /**
         * @description Handles the change of digitalCertificateEnabled
         */
        self.onChangeIsDigitalCertificate = function ($event) {
            self.globalSetting.digitalCertificateMode = null;
        };

        self.permissionsExists = function (item) {
            var i;
            for (i = 0; i < self.globalSetting.excludedPermissionList.length; i++) {
                var selectedExcludedPermission = self.globalSetting.excludedPermissionList[i];
                var id = selectedExcludedPermission.hasOwnProperty('id') ? selectedExcludedPermission.id : selectedExcludedPermission;
                if (id === item.id) {
                    return true;
                }
            }
        };
        self.selectPermissions = function (item) {
            if (item) {
                var idx = false;
                var i;
                var index;
                for (i = 0; i < self.globalSetting.excludedPermissionList.length; i++) {
                    var selectedExcludedPermission = self.globalSetting.excludedPermissionList[i];
                    var id = selectedExcludedPermission.hasOwnProperty('id') ? selectedExcludedPermission.id : selectedExcludedPermission;
                    if (id === item.id) {
                        idx = true;
                        index = i;
                    }
                }
                if (idx) {
                    self.globalSetting.excludedPermissionList.splice(index, 1);
                } else {
                    self.globalSetting.excludedPermissionList.push(item);
                }
            }
        };

        self.selectAllGroupPermissions = function (allGroupPermissions, key) {
            for (var i = 0; i < allGroupPermissions.length; i++) {
                for (var j = 0; j < allGroupPermissions[i].length; j++) {
                    if (allGroupPermissions[i][j]) {
                        var isPermissionExist = _.filter(self.globalSetting.excludedPermissionList, function (permission) {
                            var id = permission.hasOwnProperty('id') ? permission.id : permission;
                            return allGroupPermissions[i][j].id === id;
                        })[0];
                        //on click event get previous value of checkbox (true/false)
                        if (!self[key]) {
                            if (!isPermissionExist) {
                                self.globalSetting.excludedPermissionList.push(allGroupPermissions[i][j]);
                            }
                        } else {
                            if (isPermissionExist) {
                                var indexOfPermission = _.findIndex(self.globalSetting.excludedPermissionList, function (permission) {
                                    var id = permission.hasOwnProperty('id') ? permission.id : permission;
                                    return id === (isPermissionExist.hasOwnProperty('id') ? isPermissionExist.id : isPermissionExist);
                                });
                                self.globalSetting.excludedPermissionList.splice(indexOfPermission, 1);
                            }
                        }
                    }
                }
            }
        };

        self.selectParentCheckbox = function (allGroupPermissions, key) {
            var count = 0;
            for (var i = 0; i < allGroupPermissions.length; i++) {
                for (var j = 0; j < allGroupPermissions[i].length; j++) {
                    if (allGroupPermissions[i][j]) {
                        var isPermissionExist = _.filter(self.globalSetting.excludedPermissionList, function (permission) {
                            var id = permission.hasOwnProperty('id') ? permission.id : permission;
                            return allGroupPermissions[i][j].id === id;
                        })[0];
                        if (!isPermissionExist) {
                            return false;
                        } else {
                            count = i;
                        }
                    }
                }
            }
            if ((count + 1) === allGroupPermissions.length) {
                return true;
            }
        }


        function _getPermissions(current) {
            return current === 'en' ? self.permissionsList[0] : self.permissionsList[1];
        }

        self.searchChanges = function () {
            self.permissions = $filter('permissionFilter')(_getPermissions(langService.current), self.search);
        };

        self.isIndeterminate = function () {
            return (self.globalSetting.excludedPermissionList.length !== 0 && self.globalSetting.excludedPermissionList.length !== self.totalPermissionsCount);
        };

        self.isChecked = function () {
            return self.globalSetting.excludedPermissionList.length === self.totalPermissionsCount;
        };

        self.isStampModuleDisabled = function () {
            return rootEntity.isQatarVersion() ? !self.hasPSPDFViewer : (!self.hasPSPDFViewer || !self.kwtAlDiyarDigitalEnabled);
        }

        /**
         * @description parent checkbox
         */
        self.toggleAll = function () {
            if (self.isChecked()) {
                self.globalSetting.excludedPermissionList = [];
            } else {
                for (var key in self.permissions) {
                    var permission = self.permissions[key];
                    for (var i = 0; i < permission.length; i++) {
                        for (var j = 0; j < permission[i].length; j++) {
                            if (permission[i][j]) {
                                var customRolePermissionIds = _.map(self.globalSetting.excludedPermissionList, (permission) => {
                                    return permission.hasOwnProperty('id') ? permission.id : permission;
                                });
                                if (customRolePermissionIds.indexOf(permission[i][j]['id']) === -1) {
                                    self.globalSetting.excludedPermissionList.push(permission[i][j]);
                                }
                            }
                        }
                    }
                }
            }
        };

        self.sendMinisterChanged = function () {
            self.globalSetting.defaultMinisterAction = null;
        }

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
    });
};
