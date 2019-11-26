module.exports = function (app) {
    app.controller('applicationUserFromOuPopCtrl', function (applicationUserService,
                                                             _,
                                                             editMode,
                                                             employeeService,
                                                             toast,
                                                             ApplicationUser,
                                                             tokenService,
                                                             validationService,
                                                             generator,
                                                             dialog,
                                                             langService,
                                                             applicationUser,
                                                             jobTitles,
                                                             ranks,
                                                             rankService,
                                                             organizations,
                                                             classifications,
                                                             lookupService,
                                                             userClassificationViewPermissionService,
                                                             UserClassificationViewPermission,
                                                             OUViewPermission,
                                                             ouViewPermissions,
                                                             themes,
                                                             userClassificationViewPermissions,
                                                             roles,
                                                             permissions,
                                                             OUApplicationUser,
                                                             ouApplicationUsers,
                                                             cmsTemplate,
                                                             ouApplicationUserService,
                                                             UserOuPermission,
                                                             jobTitleService,
                                                             themeService,
                                                             roleService,
                                                             rootEntity,
                                                             applicationUserSignatureService,
                                                             $scope,
                                                             ApplicationUserSignature,
                                                             attachmentService,
                                                             currentOrganization,
                                                             organizationService,
                                                             $q,
                                                             $filter,
                                                             $timeout,
                                                             Information) {
        'ngInject';
        var self = this;
        self.controllerName = 'applicationUserFromOuPopCtrl';
        self.editMode = editMode;
        self.employeeService = employeeService;
        self.globalSetting = rootEntity.returnRootEntity().settings;
        self.applicationUser = angular.copy(applicationUser);
        if (!editMode) {
            self.applicationUser.searchAmountLimit = angular.copy(self.globalSetting.searchAmount);
        }

        self.maxRowCount = angular.copy(self.globalSetting.searchAmountLimit);
        self.model = angular.copy(applicationUser);
        self.currentOrganization = currentOrganization;
        self.notFound = {};
        self.inlineUserOUSearchText = '';
        self.inlineOuSearchText = '';
        self.roleSearchText = '';

        self.rootEntity = rootEntity;

        self.validateLabels = {
            arFullName: 'arabic_full_name',
            enFullName: 'english_full_name',
            loginName: 'login_name',
            gender: 'gender',
            defaultDisplayLang: 'defaultDisplayLang',
            employeeNo: 'employee_number',
            qid: 'qid',
            jobTitle: 'job_title',
            rank: 'rank',
            mobile: 'mobile',
            email: 'email',
            defaultOUID: 'organization_unit',
            domainName: 'domain_name',
            defaultThemeID: 'default_theme',
            searchAmountLimit: 'default_max_row_search',
            subscriptionsmsNotify: 'subscription_sms',
            subscriptionEmailNotify: 'subscription_email',
            newsmsEmailNotify: 'new_item_sms',
            newItemEmailNotify: 'new_item_email',
            deadlinesmsNotify: 'deadline_sms',
            deadlineEmailNotify: 'deadline_email',
            reminderSmsnotify: 'reminder_sms',
            reminderEmailNotify: 'reminder_email',
            newItemSmspriority: 'new_item_sms_priority',
            newItemEmailPriority: 'new_item_email_priority',
            deadlineSmspriority: 'deadline_sms_priority',
            deadlineEmailPriority: 'deadline_email_priority',
            reminderSmsPriority: 'reminder_sms_priority',
            reminderEmailPriority: 'reminder_email_priority',
            reminderSmsdays: 'reminder_sms_days',
            reminderEmailDays: 'reminder_email_days'
        };

        self.validateSignatureLabels = {
            docSubject: 'subject',
            documentTitle: 'title',
            fileUrl: 'upload_signature'
        };

        self.genders = lookupService.returnLookups(lookupService.gender);
        self.languages = lookupService.returnLookups(lookupService.language);
        self.jobTitles = jobTitles;
        self.ranks = ranks;
        self.themes = themes;
        self.roles = roles;
        self.organizations = organizations;
        self.organizationsCopy = _sortRegOusSections(angular.copy(self.organizations), true);
        self.classifications = classifications;
        self.permissions = permissions;

        function _sortRegOusSections(organizations, appendRegOUSection) {
            // filter all regOU (has registry)
            var regOus = _.filter(organizations, function (item) {
                    return item.hasRegistry;
                }),
                // filter all sections (no registry)
                sections = _.filter(organizations, function (ou) {
                    return !ou.hasRegistry;
                }),
                // registry parent organization
                parentRegistryOu;

            // To show (regou - section), append the dummy property "tempRegOUSection"
            regOus = _.map(regOus, function (regOu) {
                regOu.tempRegOUSection = new Information({
                    arName: regOu.arName,
                    enName: regOu.enName
                });
                return regOu;
            });
            sections = _.map(sections, function (section) {
                if (typeof section.registryParentId === 'number') {
                    parentRegistryOu = _.find(regOus, {'id': section.registryParentId});
                } else {
                    parentRegistryOu = section.registryParentId;
                }

                section.tempRegOUSection = new Information({
                    arName: ((parentRegistryOu) ? parentRegistryOu.arName + ' - ' : '') + section.arName,
                    enName: ((parentRegistryOu) ? parentRegistryOu.enName + ' - ' : '') + section.enName
                });
                return section;
            });

            // sort regOu-section
            return _.sortBy([].concat(regOus, sections), [function (ou) {
                return ou.tempRegOUSection[langService.current + 'Name'].toLowerCase();
            }]);
        }

        self.viewInboxAsOptions = [
            {
                key: 'view_magazine',
                value: false
            },
            {
                key: 'view_grid',
                value: true
            }
        ];

        self.notificationProperties = [
            {
                property: 'newsmsEmailNotify',
                dependents: ['newItemSmspriority']
            },
            {
                property: 'newItemEmailNotify',
                dependents: ['newItemEmailPriority']
            },
            {
                property: 'deadlinesmsNotify',
                dependents: ['deadlineSmspriority']
            },
            {
                property: 'deadlineEmailNotify',
                dependents: ['deadlineEmailPriority']
            },
            {
                property: 'reminderSmsnotify',
                dependents: ['reminderSmsPriority', 'reminderSmsdays']
            },
            {
                property: 'reminderEmailNotify',
                dependents: ['reminderEmailPriority', 'reminderEmailDays']
            }
        ];


        /**
         * @description Priority Levels
         */
        self.priorityLevels = lookupService.returnLookups(lookupService.priorityLevel);

        /**
         * @description List of user classification view permissions
         * @type {*}
         */
        self.classificationViewPermissions = userClassificationViewPermissions;

        /**
         * @description Filter already added classification to skip it in dropdown.
         * @returns {Array}
         */
        self.excludedClassifications = _.map(self.classificationViewPermissions, 'classificationId.id');

        self.excludeClassificationsIfExists = function (classification) {
            return self.excludedClassifications.indexOf(classification.id) === -1;
        };


        /**
         * @description List of ou application users
         */
        self.ouApplicationUsersCopy = angular.copy(ouApplicationUsers);
        self.ouApplicationUsers = _.filter(ouApplicationUsers, function (ouAppUser) {
            return ouAppUser.ouid.id === self.currentOrganization.id;
        });

        self.getOrganizationsForAppUser = function (ouAppUser) {
            self.organizationsForAppUser = _.map(self.ouApplicationUsersCopy, function (ouAppUser) {
                return {
                    ou: ouAppUser.ouid,
                    status: (ouAppUser ? ouAppUser.status : ouAppUser.status),
                    id: ouAppUser.id
                }
            });
        };
        self.getOrganizationsForAppUser();

        self.securityLevels = rootEntity.getGlobalSettings().securityLevels;

        /**
         * @description Model for binding the fields in other organizations tab
         * @type {*}
         */
        self.ouApplicationUser = self.editMode ? self.ouApplicationUsers[0] : new OUApplicationUser();

        /**
         * @description Resets the original values if notification is enabled/disabled
         * @param changedProperty
         * @param resetProperties
         * @param fields
         */
        self.resetNotificationsAppUser = function (changedProperty, resetProperties, fields) {
            if (self.applicationUser[changedProperty]) {
                generator.replaceWithOriginalValues(self.applicationUser, self.model, resetProperties);
                for (var i = 0; i < fields.length; i++) {
                    fields[i].$setUntouched();
                }
            } else {
                generator.replaceWithOriginalValues(self.applicationUser, self.model, resetProperties, true);
            }
        };

        /**
         * @description Checks the required fields validation by skipping notification if notification is false
         * @param model
         * @returns {Array}
         */
        self.checkRequiredFieldsAppUser = function (model) {
            var required = new ApplicationUser().getRequiredFields(), result = [];

            /*
             if(!self.applicationUser.id){
             required.splice(required.indexOf('defaultOUID'),1);
             }
             */
            /* If notification property is false, remove the property from required */
            for (var i = 0; i < self.notificationProperties.length; i++) {
                var property = self.notificationProperties[i].property;
                if (!model[property]) {
                    var dependents = self.notificationProperties[i].dependents;
                    for (var j = 0; j < dependents.length; j++) {
                        required.splice(required.indexOf(dependents[j]), 1);
                    }
                }
            }
            _.map(required, function (property) {
                if (!generator.validRequired(model[property]))
                    result.push(property);
            });
            return result;
        };

        self.disabledFields = [];
        if (self.editMode && !employeeService.getEmployee().isAdmin) {
            self.disabledFields.push('loginName', 'domainName');
        }

        if (!self.globalSetting.enableSMSNotification) {
            self.disabledFields.push(
                'subscriptionsmsNotify',
                'newsmsEmailNotify',
                'newItemSmspriority',
                'deadlinesmsNotify',
                'deadlineSmspriority',
                'reminderSmsnotify',
                'reminderSmsPriority',
                'reminderSmsdays'
            );
        }

        if (!self.globalSetting.enableEmailNotification) {
            self.disabledFields.push(
                'subscriptionEmailNotify',
                'newItemEmailNotify',
                'newItemEmailPriority',
                'deadlineEmailNotify',
                'deadlineEmailPriority',
                'reminderEmailNotify',
                'reminderEmailPriority',
                'reminderEmailDays'
            );
        }

        /**
         * @description Changes the sms notifications to null/empty/0 when notifications are set to false or revert them when set to true
         * @param applicationUserForm
         * @param $event
         */
        self.changeSMSNotifications = function (applicationUserForm, $event) {
            if (!self.applicationUser.subscriptionsmsNotify) {
                self.applicationUser.newsmsEmailNotify = false;
                self.applicationUser.deadlinesmsNotify = false;
                self.applicationUser.reminderSmsnotify = false;
            } else {
                generator.replaceWithOriginalValues(self.applicationUser, self.model, ['newsmsEmailNotify', 'deadlinesmsNotify', 'reminderSmsnotify']);
            }
            self.resetNotificationsAppUser('newsmsEmailNotify', 'newItemSmspriority', [applicationUserForm.newItemSmspriority]);
            self.resetNotificationsAppUser('deadlinesmsNotify', 'deadlineSmspriority', [applicationUserForm.deadlineSmspriority]);
            self.resetNotificationsAppUser('reminderSmsnotify', ['reminderSmsPriority', 'reminderSmsdays'], [applicationUserForm.reminderSmsPriority, applicationUserForm.reminderSmsdays]);
        };

        /**
         * @description Changes the email notifications to null/empty/0 when notifications are set to false or revert them when set to true
         * @param applicationUserForm
         * @param $event
         */
        self.changeEmailNotifications = function (applicationUserForm, $event) {
            if (!self.applicationUser.subscriptionEmailNotify) {
                self.applicationUser.newItemEmailNotify = false;
                self.applicationUser.deadlineEmailNotify = false;
                self.applicationUser.reminderEmailNotify = false;
            } else {
                generator.replaceWithOriginalValues(self.applicationUser, self.model, ['newItemEmailNotify', 'deadlineEmailNotify', 'reminderEmailNotify']);
            }
            self.resetNotificationsAppUser('newItemEmailNotify', 'newItemEmailPriority', [applicationUserForm.newItemEmailPriority]);
            self.resetNotificationsAppUser('deadlineEmailNotify', 'deadlineEmailPriority', [applicationUserForm.deadlineEmailPriority]);
            self.resetNotificationsAppUser('reminderEmailNotify', ['reminderEmailPriority', 'reminderEmailDays'], [applicationUserForm.reminderEmailPriority, applicationUserForm.reminderEmailDays]);
        };

        /**
         * @description Contains the selected tab name
         * @type {string}
         */
        self.selectedTab = "basic";

        /**
         * @description Set the current tab name
         * @param tabName
         */
        self.setCurrentTab = function (tabName) {
            //self.selectedTab = tabName;
            var defer = $q.defer();
            if (tabName === 'signature') {
                self.loadSignatures(self.applicationUser.id)
                    .then(function (result) {
                        defer.resolve(tabName);
                    });
            } else {
                defer.resolve(tabName);
            }
            return defer.promise.then(function (tab) {
                self.selectedTab = tab;
            });
        };


        /**
         * @description check upload file
         * @return {Array}
         */
        /*self.checkRequiredFile = function () {
         var result = [];
         if (!self.fileUrl)
         result.push('fileUrl');
         return result;
         };*/

        self.checkRequiredFile = function () {
            return self.selectedFile;
        };

        self.selectedExtension = ['png'];
        self.signature = new ApplicationUserSignature();
        self.signature.appUserId = self.applicationUser.id;
        self.enableAdd = false;


        /**
         * check validation of required fields
         * @param model
         * @return {Array}
         */
        self.checkSignatureRequiredFields = function (model) {
            var required = model.getRequiredFields(), result = [];
            _.map(required, function (property) {
                if (!generator.validRequired(model[property]))
                    result.push(property);
            });
            return result;
        };

        /**
         * @description Loads the signatures
         * @param appUserId
         * @returns {Promise<any>}
         */
        self.loadSignatures = function (appUserId) {
            return applicationUserSignatureService.loadApplicationUserSignatures(appUserId || self.applicationUser.id, true)
                .then(function (result) {
                    self.applicationUser.signature = result;
                    return result;
                });
        };

        /**
         * @description add signature for application User
         */
        self.addApplicationUserSignatureFromCtrl = function () {
            validationService
                .createValidation('ADD_APPLICATION_USER_SIGNATURE')
                .addStep('check_required_fields', true, self.checkSignatureRequiredFields, self.signature, function (result) {
                    return !result.length;
                })
                .notifyFailure(function (step, result) {
                    var labels = _.map(result, function (label) {
                        return self.validateSignatureLabels[label];
                    });
                    generator.generateErrorFields('check_this_fields', labels);
                })
                .addStep('check_required_file', true, self.checkRequiredFile, function (result) {
                    return !result.length;
                })
                .notifyFailure(function (step, result) {
                    var labels = _.map(result, function (label) {
                        return self.validateLabels[label];
                    });
                    generator.generateErrorFields('check_this_fields', labels);
                })
                .addStep('check_duplicate', true, applicationUserSignatureService.checkDuplicateApplicationUserSignature, [self.signature, false], function (result) {
                    return !result;
                }, true)
                .notifyFailure(function () {
                    toast.error(langService.get('subject_duplication_message'));
                })
                .validate()
                .then(function () {
                    self.signature.appUserId = self.applicationUser.id;
                    applicationUserSignatureService
                        .addApplicationUserSignature(self.signature, self.selectedFile).then(function () {
                        var defer = $q.defer();
                        self.signatureProgress = defer.promise;
                        self.loadSignatures(self.ouApplicationUser.applicationUser.id)
                            .then(function (result) {
                                self.signature = new ApplicationUserSignature();
                                self.fileUrl = null;
                                self.enableAdd = false;
                                defer.resolve(true);
                                toast.success(langService.get('save_success'));
                            });
                    });
                })
                .catch(function () {

                });
        };
        /**
         * @description edit signature
         * @param signature
         */
        self.editSignature = function (signature) {
            applicationUserSignatureService
                .controllerMethod
                .applicationUserSignatureEdit(signature).then(function () {
                var defer = $q.defer();
                self.signatureProgress = defer.promise;
                self.loadSignatures(signature.appUserId)
                    .then(function (result) {
                        defer.resolve(true);
                        toast.success(langService.get('save_success'));
                    });
            });
        };
        /**
         * @description remove signature
         * @type {{limit: number, page: number, order: string, limitOptions: [number,number,number,null]}}
         */
        self.removeSignature = function (signature) {
            dialog.confirmMessage((langService.get('confirm_delete_msg'))).then(function () {
                applicationUserSignatureService
                    .deleteApplicationUserSignature(signature).then(function () {
                    var defer = $q.defer();
                    self.signatureProgress = defer.promise;
                    self.loadSignatures(self.ouApplicationUser.applicationUser.id)
                        .then(function (result) {
                            defer.resolve(true);
                            toast.success(langService.get('delete_success'));
                        });
                });
            })
        };

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedData = function () {
            self.applicationUser.signature = $filter('orderBy')(self.applicationUser.signature, self.signatureGrid.order);
        };

        self.signatureGrid = {
            limit: 5, // default limit
            page: 1, // first page
            //order: 'arName', // default sorting order
            order: '', // default sorting order
            limitOptions: [5, 10, 20, {
                label: langService.get('all'),
                value: function () {
                    return (self.applicationUser.signature.length + 21);
                }
            }]
        };
        self.selectedSignature = [];
        self.selectedFile = null;
        self.fileUrl = null;

        self.viewImage = function (files, element) {
            attachmentService
                .validateBeforeUpload('userSignature', files[0])
                .then(function (file) {
                    self.selectedFile = file;
                    var url = window.URL || window.webkitURL;
                    var img = new Image();
                    img.src = self.fileUrl = url.createObjectURL(file);

                    img.onload = function () {
                        /*if (element[0].name === 'upload-sign-app-user') {
                            var width = this.naturalWidth || this.width;
                            var height = this.naturalHeight || this.height;
                            if (width > 283 && height > 283) {
                                toast.error(langService.get('image_dimensions_info').change({width: 283, height: 283}));
                                self.enableAdd = false;
                                return false;
                            }
                        }*/
                        $timeout(function () {
                            self.enableAdd = true;
                        })
                    };
                })
                .catch(function (availableExtensions) {
                    self.fileUrl = null;
                    self.selectedFile = null;
                    self.enableAdd = false;

                    dialog.errorMessage(langService.get('invalid_uploaded_file').addLineBreak(availableExtensions.join(', ')));
                });
        };
        /**
         * @description close signature fields
         */
        self.closeApplicationUserSignatureFromCtrl = function () {
            self.enableAdd = false;
        };

        /**
         * @description Model for binding the classifications and security levels dropdowns for user classification view permission tab
         * @type {*}
         */
        self.classificationViewPermission = new UserClassificationViewPermission({
            userId: self.applicationUser.id
        });

        /**
         * @description Add the selected Classification and security level to table
         */
        self.addClassificationViewPermissionFromCtrl = function () {
            if (self.classificationViewPermission.classificationId && self.classificationViewPermission.securityLevels) {
                validationService
                    .createValidation('ADD_USER_CLASSIFICATION_VIEW_PERMISSION')
                    .addStep('check_duplicate', true, userClassificationViewPermissionService.checkDuplicateUserClassificationViewPermission, [self.classificationViewPermission, false], function (result) {
                        return !result;
                    }, true)
                    .notifyFailure(function () {
                        toast.error(langService.get('classification_view_permission_exists'));
                    })
                    .validate()
                    .then(function () {
                        userClassificationViewPermissionService
                            .addUserClassificationViewPermission(self.classificationViewPermission)
                            .then(function () {
                                self.excludedClassifications = self.excludedClassifications.concat(self.classificationViewPermission.classificationId.id);
                                self.updateGridAndResetClassificationViewPermissionModel('classification_view_permission_success');
                            });
                    })
                    .catch(function () {

                    })
            } else {
                toast.info(langService.get('select_classification_security_level'));
            }
        };

        /**
         * @description Edit the selected classification view permission
         * @param userClassificationViewPermission
         */
        self.editClassificationViewPermission = function (userClassificationViewPermission) {
            self.classificationViewPermission = angular.copy(userClassificationViewPermission);
        };

        /**
         * @description Cancel the edit of classification view permission
         */
        self.cancelClassificationViewPermissionFromCtrl = function () {
            self.classificationViewPermission = new UserClassificationViewPermission({
                userId: self.applicationUser.id
            });
        };

        /**
         * @description Edit the selected classification view permission
         */
        self.updateClassificationViewPermissionFromCtrl = function () {
            if (self.classificationViewPermission.classificationId && self.classificationViewPermission.securityLevels) {
                validationService
                    .createValidation('ADD_USER_CLASSIFICATION_VIEW_PERMISSION')
                    .addStep('check_duplicate', true, userClassificationViewPermissionService.checkDuplicateUserClassificationViewPermission, [self.classificationViewPermission, true], function (result) {
                        return !result;
                    }, true)
                    .notifyFailure(function () {
                        toast.error(langService.get('classification_view_permission_exists'));
                    })
                    .validate()
                    .then(function () {
                        userClassificationViewPermissionService
                            .updateUserClassificationViewPermission(self.classificationViewPermission)
                            .then(function () {
                                self.updateGridAndResetClassificationViewPermissionModel('classification_view_permission_update_success');
                            });
                    });
            } else {
                toast.info(langService.get('select_classification_security_level'));
            }
        };

        /**
         * @description Reset the user classification view permission model to empty
         * @param successKey
         */
        self.updateGridAndResetClassificationViewPermissionModel = function (successKey) {
            self.classificationViewPermissions = userClassificationViewPermissionService
                .getUserClassificationViewPermissionsByUserId(self.classificationViewPermission.userId);

            self.cancelClassificationViewPermissionFromCtrl();
            toast.success(langService.get(successKey));
        };

        /**
         * @description Remove the classification and security level from table
         * @param classificationViewPermission
         * @param $event
         */
        self.removeClassificationViewPermission = function (classificationViewPermission, $event) {
            return dialog
                .confirmMessage(langService.get('confirm_delete').change({name: classificationViewPermission.classificationId.getTranslatedName()}), null, null, $event)
                .then(function () {
                    userClassificationViewPermissionService
                        .deleteUserClassificationViewPermission(classificationViewPermission)
                        .then(function () {
                            self.excludedClassifications = _.filter(self.excludedClassifications, function (id) {
                                return classificationViewPermission.classificationId.id !== id;
                            });
                            self.updateGridAndResetClassificationViewPermissionModel('classification_view_permission_delete_success');
                        });
                });
        };

        /**
         * @description Reset the security levels for classification
         */
        self.resetSecurityLevels = function () {
            self.classificationViewPermission.securityLevels = null;
        };


        /**
         * @description Reset the ou application user model to default(empty) values
         */
        self.cancelOuApplicationUser = function () {
            self.ouApplicationUser = new OUApplicationUser({
                applicationUser: self.applicationUser
            });
            self.ouApplicationUserBeforeEdit = null;
        };

        /**
         * @description Filter already added organizations to skip it in dropdown.
         * @returns {Array}
         */
        self.excludedOrganizations = _.map(self.ouApplicationUsers, 'ouid.id');

        self.excludeOrganizationsIfExists = function (organization) {
            return self.excludedOrganizations.indexOf(organization.id) === -1;
        };

        /**
         * @description Remove the selected record of organization, custom role, security level from the grid
         * @param ouApplicationUser
         * @param $event
         */
        self.removeOUApplicationUserFromCtrl = function (ouApplicationUser, $event) {
            ouApplicationUserService
                .deleteOUApplicationUser(ouApplicationUser, $event)
                .then(function () {
                    var indexOfUpdatedOUApplicationUser = _.findIndex(self.ouApplicationUsers, function (x) {
                        return x.ouid.id === ouApplicationUser.ouid.id;
                    });
                    self.ouApplicationUsers.splice(indexOfUpdatedOUApplicationUser, 1);
                    self.ouApplicationUsersCopy = angular.copy(self.ouApplicationUsers);
                    self.getOrganizationsForAppUser();


                    self.excludedOrganizations = _.filter(self.excludedOrganizations, function (id) {
                        return ouApplicationUser.ouid.id !== id;
                    });
                    self.cancelOuApplicationUser();
                    toast.success(langService.get('delete_success'));
                });
        };

        /**
         * @description Add new application user and add to organization
         */
        self.addApplicationUserAndOUFromCtrl = function () {
            if (self.disabledFields.length)
                generator.replaceWithOriginalValues(self.applicationUser, self.model, self.disabledFields);

            validationService
                .createValidation('ADD_APPLICATION_USER')
                .addStep('check_required', true, self.checkRequiredFieldsAppUser, self.applicationUser, function (result) {
                    return !result.length;
                })
                .notifyFailure(function (step, result) {
                    var labels = _.map(result, function (label) {
                        return self.validateLabels[label];
                    });
                    generator.generateErrorFields('check_this_fields', labels);
                })
                .addStep('check_duplicate', true, applicationUserService.checkDuplicateApplicationUser, [self.applicationUser, false], function (result) {
                    return !result;
                }, true)
                .notifyFailure(function () {
                    toast.error(langService.get('name_duplication_message'));
                })
                .addStep('check_duplicate_employeeNo', true, applicationUserService.checkDuplicateApplicationUserProperties, [self.applicationUser, 'employeeNo', false], function (result) {
                    return !result;
                }, true)
                .notifyFailure(function () {
                    toast.error(langService.get('employee_number_duplication_message'));
                })
                .addStep('check_duplicate_qatari_id', true, applicationUserService.checkDuplicateApplicationUserProperties, [self.applicationUser, 'qid', false], function (result) {
                    return !result;
                }, true)
                .notifyFailure(function () {
                    toast.error(langService.get('qid_duplication_message'));
                })
                .validate()
                .then(function () {
                    return applicationUserService
                        .addApplicationUser(self.applicationUser)
                        .then(function (result) {
                            self.ouApplicationUser.ouid = self.currentOrganization;
                            self.ouApplicationUser.applicationUser = result;
                            self.classificationViewPermissions = _.filter(userClassificationViewPermissions, function (userClassificationViewPermission) {
                                return Number(userClassificationViewPermission.userId) === Number(self.applicationUser.id);
                            });
                            self.cancelClassificationViewPermissionFromCtrl();

                            self.addOUApplicationUserFromCtrl().then(function () {
                                // reload/update the application users to avoid the duplicate users.
                                applicationUserService.loadApplicationUsers()
                                    .then(function () {
                                        // assigning the application user copy to update id in this variable after save
                                        self.applicationUser = angular.copy(self.applicationUser);
                                        self.model = angular.copy(self.applicationUser);
                                        self.editMode = true;
                                    });
                                toast.success(langService.get('add_success').change({name: self.applicationUser.getNames()}));
                            });
                        });
                })
                .catch(function () {
                    // console.log('add app user failed');
                });
        };

        /**
         * @description Edit application user and update organization
         */
        self.editApplicationUserAndOUFromCtrl = function () {
            if (self.disabledFields.length)
                generator.replaceWithOriginalValues(self.applicationUser, self.model, self.disabledFields);

            validationService
                .createValidation('EDIT_APPLICATION_USER')
                .addStep('check_required', true, self.checkRequiredFieldsAppUser, self.applicationUser, function (result) {
                    return !result.length;
                })
                .notifyFailure(function (step, result) {
                    var labels = _.map(result, function (label) {
                        return self.validateLabels[label];
                    });
                    generator.generateErrorFields('check_this_fields', labels);
                })
                .addStep('check_duplicate', true, applicationUserService.checkDuplicateApplicationUser, [self.applicationUser, true], function (result) {
                    return !result;
                }, true)
                .notifyFailure(function () {
                    toast.error(langService.get('name_duplication_message'));
                })
                .addStep('check_duplicate_employeeNo', true, applicationUserService.checkDuplicateApplicationUserProperties, [self.applicationUser, 'employeeNo', true], function (result) {
                    return !result;
                }, true)
                .notifyFailure(function () {
                    toast.error(langService.get('employee_number_duplication_message'));
                })
                .addStep('check_duplicate_qatari_id', true, applicationUserService.checkDuplicateApplicationUserProperties, [self.applicationUser, 'qid', true], function (result) {
                    return !result;
                }, true)
                .notifyFailure(function () {
                    toast.error(langService.get('qid_duplication_message'));
                })
                .validate()
                .then(function () {
                    applicationUserService
                        .updateApplicationUser(self.applicationUser)
                        .then(function () {
                            self.ouApplicationUser.applicationUser = self.applicationUser;
                            self.saveOUApplicationUserFromCtrl(self.ouApplicationUser).then(function () {
                                //toast.success(langService.get('edit_success').change({name: self.applicationUser.getNames()}));

                                // reload/update the application users to avoid the duplicate users.
                                applicationUserService.loadApplicationUsers()
                                    .then(function () {
                                        dialog.hide(self.applicationUser);
                                    });
                            });
                        });
                })
                .catch(function () {

                });
        };


        /**
         *@description Check if status switch will be disabled for default organization of current user.
         * @param ouApplicationUser
         * @returns {boolean}
         */
        self.disableOUApplicationUserActions = function (ouApplicationUser) {
            return self.applicationUser.defaultOUID === ouApplicationUser.ouid.id && employeeService.isCurrentEmployee(self.applicationUser.id);
        };

        /**
         * @description Adds the selected values of organization, custom role, security level to the grid
         */
        self.addOUApplicationUserFromCtrl = function () {
            if (self.ouApplicationUser.ouid && self.ouApplicationUser.customRoleId && self.ouApplicationUser.securityLevels && self.ouApplicationUser.archiveSecurityLevels) {
                self.ouApplicationUser.wfsecurity = self.ouApplicationUser.ouid.wfsecurity.lookupKey;
                return ouApplicationUserService
                    .addOUApplicationUser(self.ouApplicationUser)
                    .then(function (result) {
                        self.ouApplicationUsers.push(result);
                        self.ouApplicationUsersCopy = angular.copy(self.ouApplicationUsers);
                        self.getOrganizationsForAppUser();

                        self.excludedOrganizations = self.excludedOrganizations.concat(result.ouid.id);

                        var userOuPermissions = [];
                        for (var i = 0; i < result.customRoleId.customRolePermission.length; i++) {
                            userOuPermissions.push(new UserOuPermission({
                                userId: result.applicationUser.id,
                                ouId: result.ouid.id,
                                customRoleId: result.customRoleId.id,
                                permissionId: result.customRoleId.customRolePermission[i].id
                            }));
                        }

                        return ouApplicationUserService
                            .addUserOuPermission(userOuPermissions)
                            .then(function () {
                                //toast.success(langService.get('save_success'));
                                return true;
                            })
                            .then(function () {
                                return tokenService.forceTokenRefresh()
                                    .then(function () {
                                        return true;
                                    })
                            });
                    });
            } else {
                toast.info(langService.get('select_ou_role_security_level'));
            }
        };

        /**
         * @description Save OU Application User
         * @param ouApplicationUser
         */
        self.saveOUApplicationUserFromCtrl = function (ouApplicationUser) {
            if (ouApplicationUser.id) {
                return ouApplicationUserService
                    .updateOUApplicationUser(ouApplicationUser)
                    .then(function () {

                        if (employeeService.isCurrentOUApplicationUser(ouApplicationUser)) {
                            employeeService.setCurrentOUApplicationUser(ouApplicationUser);
                            employeeService.setCurrentEmployee(self.ouApplicationUser.applicationUser);
                        }
                        var indexOfUpdatedOUApplicationUserCopy = _.findIndex(self.ouApplicationUsersCopy, function (x) {
                            return x.ouid.id === ouApplicationUser.ouid.id;
                        });
                        self.ouApplicationUsersCopy.splice(indexOfUpdatedOUApplicationUserCopy, 1, ouApplicationUser);
                        self.getOrganizationsForAppUser(ouApplicationUser);
                        toast.success(langService.get('edited_successfully'));
                        return true;
                    });
            }
        };

        /**
         * @description Opens dialog for add new job title
         * @param $event
         */
        self.openAddJobTitleDialog = function ($event) {
            jobTitleService
                .controllerMethod
                .jobTitleAdd($event)
                .then(function (result) {
                    self.applicationUser.jobTitle = result;
                    self.jobTitles.unshift(result);
                });
        };

        /**
         * @description Opens dialog for add new rank
         * @param $event
         */
        self.openAddRankDialog = function ($event) {
            rankService
                .controllerMethod
                .rankAdd($event)
                .then(function (result) {
                    self.applicationUser.rank = result;
                    self.ranks.unshift(result);
                });
        };

        /**
         * @description Opens dialog for add new theme
         * @param $event
         */
        self.openAddThemeDialog = function ($event) {
            themeService
                .controllerMethod
                .themeAdd($event)
                .then(function (result) {
                    self.applicationUser.defaultThemeID = result;
                    self.theme.unshift(result);
                });
        };

        /**
         * @description Opens the dialog for all permissions
         * @param ouApplicationUser
         * @param $event
         */
        self.openEditPermissionDialog = function (ouApplicationUser, $event) {
            return ouApplicationUserService
                .getUserOuPermissionByUserIdAndOuId(ouApplicationUser.applicationUser.id, ouApplicationUser.ouid.id)
                .then(function (userOuPermissions) {
                    return dialog
                        .showDialog({
                            targetEvent: $event,
                            templateUrl: cmsTemplate.getPopup('application-user-permission'),
                            controller: 'applicationUserPermissionPopCtrl',
                            controllerAs: 'ctrl',
                            locals: {
                                ouApplicationUser: ouApplicationUser,
                                permissions: permissions,
                                userOuPermissions: userOuPermissions
                            },
                            resolve: {
                                dynamicMenuItems: function (dynamicMenuItemService, UserMenuItem) {
                                    'ngInject';
                                    return dynamicMenuItemService.loadPrivateDynamicMenuItems()
                                        .then(function (result) {
                                            return _.map(result, function (item) {
                                                return new UserMenuItem({
                                                    menuItem: item,
                                                    userId: ouApplicationUser.applicationUser.id,
                                                    ouId: ouApplicationUser.ouid.id
                                                });
                                            })
                                        });
                                },
                                userMenuItems: function (dynamicMenuItemService) {
                                    'ngInject';
                                    return dynamicMenuItemService.loadUserMenuItems(ouApplicationUser.applicationUser.id, ouApplicationUser.ouid.id);
                                }
                            }
                        });
                });

        };

        /**
         * @description Opens the dialog for Workflow participation
         * @param ouApplicationUser
         * @param $event
         */
        self.openWorkflowParticipationDialog = function (ouApplicationUser, $event) {
            ouApplicationUser.wfsecurity = (typeof ouApplicationUser.wfsecurity === 'undefined') ? self.globalSetting.wfsecurity : ouApplicationUser.wfsecurity;
            return dialog
                .showDialog({
                    targetEvent: $event,
                    templateUrl: cmsTemplate.getPopup('application-user-workflow-participation'),
                    controller: 'applicationUserWorkflowParticipationPopCtrl',
                    controllerAs: 'ctrl',
                    locals: {
                        ouApplicationUser: ouApplicationUser
                    },
                    resolve: {
                        organizations: function (organizationService) {
                            'ngInject';
                            return organizationService.loadOrganizations();
                        },
                        privateUsers: function (ouApplicationUserService) {
                            'ngInject'
                            return ouApplicationUserService.loadAllPrivateUsers();
                        }
                    }
                })
                .then(function (result) {
                    var indexOfUpdatedOUApplicationUser = _.findIndex(self.ouApplicationUsers, function (x) {
                        return x.ouid.id === result.ouid.id;
                    });
                    self.ouApplicationUsers.splice(indexOfUpdatedOUApplicationUser, 1, result);
                });
        };

        /**
         * @description Opens the dialog for Out Of Office Settings
         * @param ouApplicationUser
         * @param $event
         * @param $index
         */
        self.openOutOfOfficeSettingsDialog = function (ouApplicationUser, $event, $index) {
            return dialog
                .showDialog({
                    targetEvent: $event,
                    templateUrl: cmsTemplate.getPopup('application-user-out-of-office-setting'),
                    controller: 'applicationUserOutOfOfficeSettingPopCtrl',
                    controllerAs: 'ctrl',
                    locals: {
                        ouApplicationUser: ouApplicationUser
                    },
                    resolve: {
                        availableProxies: function (ouApplicationUserService) {
                            'ngInject';
                            return ouApplicationUserService
                                .getAvailableProxies(null, true, ouApplicationUser.applicationUser.id)
                                .then(function (result) {
                                    return result;
                                });
                        },
                        usersWhoSetYouAsProxy: function (ouApplicationUserService) {
                            'ngInject';
                            return ouApplicationUserService
                                .getUsersWhoSetYouAsProxy(ouApplicationUser.applicationUser.id)
                                .then(function (result) {
                                    return result
                                })
                        }
                    }
                })
                .then(function (result) {
                    self.ouApplicationUsers.splice($index, 1, result);
                });
        };

        /**
         * @description open follow up organization dialog
         */
        self.openFollowupOrganizationDialog = function (ouApplicationUser, $event) {
            return dialog
                .showDialog({
                    targetEvent: $event,
                    templateUrl: cmsTemplate.getPopup('followup-user-organization'),
                    controller: 'followupUserOrganizationPopCtrl',
                    controllerAs: 'ctrl',
                    locals: {
                        ouApplicationUser: ouApplicationUser
                    },
                    resolve: {
                        followupOrganizations: function () {
                            'ngInject';
                            return ouApplicationUserService.loadFollowupUserOrganization(ouApplicationUser);
                        }
                    }
                });
        };

        /**
         * @description Array of actions that can be performed on grid
         * @type {[*]}
         */
        self.gridActions = [
            {
                type: 'action',
                text: 'grid_action_edit_permission',
                callback: self.openEditPermissionDialog,
                checkShow: function (action, model) {
                    return true;
                }
            },
            {
                type: 'action',
                text: 'grid_action_edit_workflow_participation',
                callback: self.openWorkflowParticipationDialog,
                checkShow: function (action, model) {
                    return true;
                }
            },
            {
                type: 'action',
                text: 'grid_action_out_of_office_settings',
                callback: self.openOutOfOfficeSettingsDialog,
                checkShow: function (action, model) {
                    return true;
                }
            },
            {
                type: 'action',
                text: 'followup_organization',
                callback: self.openFollowupOrganizationDialog,
                checkShow: function (action, model) {
                    return true;
                }
            }
        ];


        self.ouViewPermissions = ouViewPermissions;
        self.selectedOUViewPermissions = [];
        var _resetOUViewPermissionModel = function () {
            self.ouViewPermission = self.editMode ? new OUViewPermission({
                userId: self.ouApplicationUser.applicationUser.id
            }) : new OUViewPermission();
        };
        _resetOUViewPermissionModel();

        self.addOuViewPermissionFromCtrl = function () {
            var ouViewPermissionCopy = angular.copy(self.ouViewPermissions);
            ouViewPermissionCopy.push(self.ouViewPermission);

            ouApplicationUserService.addOuViewPermissionForUser(ouViewPermissionCopy, self.ouApplicationUser.applicationUser.id)
                .then(function (result) {
                    ouApplicationUserService.getOUsViewPermissionForUser(self.ouApplicationUser.applicationUser.id).then(function (result) {
                        self.ouViewPermissions = result;
                        self.selectedOUViewPermissions = [];
                        toast.success(langService.get('add_success').change({name: new Information(self.ouViewPermission.ouId).getTranslatedName()}));
                        _resetOUViewPermissionModel();
                    })
                }).catch(function () {

            })
        };


        /**
         * @description remove OU view Permission
         * @param ouViewPermission
         * @param $event
         */
        self.removeOUViewPermission = function (ouViewPermission, $event) {
            return dialog
                .confirmMessage(langService.get('confirm_remove').change({name: ouViewPermission.ouInfo.getTranslatedName()}), null, null, $event)
                .then(function () {
                    ouApplicationUserService.removeBulkOuViewPermissionsForUser(ouViewPermission)
                        .then(function (result) {
                            ouApplicationUserService.getOUsViewPermissionForUser(self.ouApplicationUser.applicationUser.id).then(function (result) {
                                self.ouViewPermissions = result;
                                self.selectedOUViewPermissions = [];
                                toast.success(langService.get('delete_success'));
                            })
                        })
                });
        };

        /**
         * @description remove B ulk OU View Permission
         * @param $event
         */
        self.removeBulkOUViewPermissions = function ($event) {
            return dialog
                .confirmMessage(langService.get('confirm_delete_selected_multiple'), null, null, $event)
                .then(function () {
                    ouApplicationUserService.removeBulkOuViewPermissionsForUser(self.selectedOUViewPermissions)
                        .then(function (result) {
                            ouApplicationUserService.getOUsViewPermissionForUser(self.ouApplicationUser.applicationUser.id).then(function (result) {
                                self.ouViewPermissions = result;
                                toast.success(langService.get('delete_success'));
                            })
                        })
                });
        };

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedDataOUViewPermissions = function () {
            self.ouViewPermissions = $filter('orderBy')(self.ouViewPermissions, self.ouViewPermissionsGrid.order);
        };

        self.excludeOuViewPermissionIfExists = function (organization) {
            return _.map(self.ouViewPermissions, 'ouId').indexOf(organization.id) === -1 &&
                _.map(self.organizationsForAppUser, 'ou.id').indexOf(organization.id) === -1;
        };

        self.ouViewPermissionsGrid = {
            limit: 5, // default limit
            page: 1, // first page
            //order: 'arName', // default sorting order
            order: '', // default sorting order
            limitOptions: [5, 10, 20, {
                label: langService.get('all'),
                value: function () {
                    return (self.ouViewPermissions.length + 21);
                }
            }]
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

        /**
         * @description Close the popup
         */
        self.closeApplicationUserPopupFromCtrl = function () {
            dialog.cancel();
        };
    });
};
