module.exports = function (app) {
    app.controller('applicationUserPopCtrl', function (applicationUserService,
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
                                                       $q) {
        'ngInject';
        var self = this;
        self.controllerName = 'applicationUserPopCtrl';
        self.editMode = editMode;
        self.globalSetting = rootEntity.returnRootEntity().settings;
        self.applicationUser = angular.copy(applicationUser);
        if (!editMode) {
            self.applicationUser.searchAmountLimit = angular.copy(self.globalSetting.searchAmount);
        }

        self.maxRowCount = angular.copy(self.globalSetting.searchAmountLimit);
        self.model = angular.copy(applicationUser);
        self.currentOrganization = currentOrganization;
        self.notFound = {};

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
        self.classifications = classifications;
        self.permissions = permissions;

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
        //self.ouApplicationUsers = ouApplicationUsers;
        self.ouApplicationUsers = (self.currentOrganization) ? (_.filter(ouApplicationUsers, function (ouAppUser) {
            return ouAppUser.applicationUser.defaultOUID === self.currentOrganization;
        })) : ouApplicationUsers;

        self.organizationsForAppUser = _.map(self.ouApplicationUsers, 'ouid');

        self.securityLevels = rootEntity.getGlobalSettings().securityLevels;
        //console.log('self.securityLevels', self.securityLevels);
        /**
         * @description Model for binding the fields in other organizations tab
         * @type {*}
         */
        self.ouApplicationUser = new OUApplicationUser({
            applicationUser: self.applicationUser
        });
        if (self.currentOrganization) {
            self.ouApplicationUser.id = self.ouApplicationUsers.length ? self.ouApplicationUsers[0].id : null;
            self.ouApplicationUser.securityLevels = self.ouApplicationUsers.length ? self.ouApplicationUsers[0].securityLevels : null;
            self.ouApplicationUser.customRoleId = self.ouApplicationUsers.length ? self.ouApplicationUsers[0].customRoleId : null;
        }

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
            }
            else {
                generator.replaceWithOriginalValues(self.applicationUser, self.model, resetProperties, true);
            }
        };

        /**
         * @description Get the list of Parent Organizations with registry and select default ou with registry.
         */
        self.getParentOrganizationsWithRegistry = function () {
            self.parentsWithRegistryList = organizationService.getAllParentsHasRegistry(self.ouApplicationUser.ouid, false);
            self.ouApplicationUser.ouRegistryID = (self.parentsWithRegistryList && self.parentsWithRegistryList.length)
                ? (self.ouApplicationUserBeforeEdit ? self.ouApplicationUserBeforeEdit.ouRegistryID : self.parentsWithRegistryList[0].id)
                : null;
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
            }
            else {
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
            }
            else {
                generator.replaceWithOriginalValues(self.applicationUser, self.model, ['newItemEmailNotify', 'deadlineEmailNotify', 'reminderEmailNotify']);
            }
            self.resetNotificationsAppUser('newItemEmailNotify', 'newItemEmailPriority', [applicationUserForm.newItemEmailPriority]);
            self.resetNotificationsAppUser('deadlineEmailNotify', 'deadlineEmailPriority', [applicationUserForm.deadlineEmailPriority]);
            self.resetNotificationsAppUser('reminderEmailNotify', ['reminderEmailPriority', 'reminderEmailDays'], [applicationUserForm.reminderEmailPriority, applicationUserForm.reminderEmailDays]);
        };

        /**
         * @description Add new application user
         */
        self.addApplicationUserFromCtrl = function () {
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
                    toast.error(langService.get('name_domain_duplication_message'));
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
                    applicationUserService
                        .addApplicationUser(self.applicationUser)
                        .then(function () {
                            //dialog.hide();
                            self.applicationUser = angular.copy(self.applicationUser);
                            self.model = angular.copy(self.applicationUser);
                            self.editMode = true;
                            toast.success(langService.get('add_success').change({name: self.applicationUser.getNames()}));
                        });
                })
                .catch(function () {

                });
        };

        /**
         * @description Edit application user
         */
        self.editApplicationUserFromCtrl = function () {
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
                    toast.error(langService.get('name_domain_duplication_message'));
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
                            if (employeeService.isCurrentEmployee(self.applicationUser)) {
                                employeeService.setCurrentEmployee(self.applicationUser);
                            }
                            dialog.hide(self.applicationUser);
                        });
                })
                .catch(function () {

                });
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
            self.selectedTab = tabName;
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
                    self.signature.appUserId = applicationUser.id;
                    applicationUserSignatureService
                        .addApplicationUserSignature(self.signature, self.selectedFile).then(function () {
                        var defer = $q.defer();
                        self.signatureProgress = defer.promise;
                        applicationUserSignatureService.loadApplicationUserSignatures(self.ouApplicationUser.applicationUser.id).then(function (result) {
                            self.applicationUser.signature = result;
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
                applicationUserSignatureService.loadApplicationUserSignatures(signature.appUserId).then(function (result) {
                    self.applicationUser.signature = result;
                    defer.resolve(true);
                    toast.success(langService.get('save_success'));
                })
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
                    applicationUserSignatureService.loadApplicationUserSignatures(self.ouApplicationUser.applicationUser.id).then(function (result) {
                        self.applicationUser.signature = result;
                        defer.resolve(true);
                        toast.success(langService.get('delete_success'));
                    })

                });
            })
        };

        self.signatureGrid = {
            limit: 5, // default limit
            page: 1, // first page
            //order: 'arName', // default sorting order
            order: '', // default sorting order
            limitOptions: [5, 10, 20, {
                label: langService.get('all'),
                value: function () {
                    return self.applicationUser.signature.length;
                }
            }]
        };
        self.selectedSignature = [];
        self.selectedFile = null;
        self.fileUrl = null;

        self.viewImage = function (files) {
            attachmentService
                .validateBeforeUpload('userSignature', files[0])
                .then(function (file) {
                    var image;
                    self.selectedFile = file;
                    self.fileUrl = window.URL.createObjectURL(file);
                    var reader = new FileReader();
                    reader.onload = function () {
                        image = new Blob([reader.result], {type: file.type});
                        if (!$scope.$$phase)
                            $scope.$apply();
                    };
                    reader.readAsArrayBuffer(file);
                    self.enableAdd = true;
                })
                .catch(function (availableExtensions) {
                    self.fileUrl = null;
                    self.selectedFile = null;
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
            }
            else {
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
            }
            else {
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
         * @description Adds the selected values of organization, custom role, security level to the grid
         */
        self.addOUApplicationUserFromCtrl = function (ouAppUser, currentOrganization) {

            if (ouAppUser && currentOrganization) {
                self.ouApplicationUser = ouAppUser;
                self.currentOrganization = currentOrganization;
            }
            if (self.ouApplicationUser.ouid && self.ouApplicationUser.customRoleId && self.ouApplicationUser.securityLevels) {
                self.ouApplicationUser.wfsecurity = self.ouApplicationUser.ouid.wfsecurity.lookupKey;
                return ouApplicationUserService
                    .addOUApplicationUser(self.ouApplicationUser)
                    .then(function (result) {
                        if (!self.currentOrganization) {
                            self.cancelOuApplicationUser();
                        }
                        self.ouApplicationUsers.push(result);

                        self.organizationsForAppUser = _.map(self.ouApplicationUsers, 'ouid');
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
                                //if (!self.currentOrganization) {
                                toast.success(langService.get('save_success'));
                                //}
                                return true;
                            })
                            .then(function () {
                                return tokenService.forceTokenRefresh()
                                    .then(function () {
                                        return true;
                                    })
                            });
                    });
            }
            else {
                toast.info(langService.get('select_ou_role_security_level'));
            }
        };

        /**
         * @description Edit the selected values of organization, custom role, security level in the grid
         * @param ouApplicationUser
         * @param $event
         */
        self.ouApplicationUserBeforeEdit = null;
        self.editOUApplicationUserFromCtrl = function (ouApplicationUser, $event) {
            self.ouApplicationUserBeforeEdit = angular.copy(ouApplicationUser);
            self.ouApplicationUser = angular.copy(ouApplicationUser);
            self.getParentOrganizationsWithRegistry();
        };

        /**
         * @description Updates the selected values of organization, custom role, security level to the grid
         */
        self.updateOUApplicationUserFromCtrl = function () {
            var indexOfUpdatedOUApplicationUser = _.findIndex(self.ouApplicationUsers, function (x) {
                return x.ouid.id === self.ouApplicationUserBeforeEdit.ouid.id;
            });
            self.saveOUApplicationUserFromCtrl(self.ouApplicationUser)
                .then(function () {
                    self.ouApplicationUsers.splice(indexOfUpdatedOUApplicationUser, 1, self.ouApplicationUser);
                    self.cancelOuApplicationUser();
                });
        };

        /**
         * @description Remove the selected record of organization, custom role, security level to the grid
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
                    self.organizationsForAppUser = _.map(self.ouApplicationUsers, 'ouid');
                    self.excludedOrganizations = _.filter(self.excludedOrganizations, function (id) {
                        return ouApplicationUser.ouid.id !== id;
                    });
                    self.cancelOuApplicationUser();
                    toast.success(langService.get('delete_success'));
                });
        };

        /**
         * @description Save OU Application User
         * @param ouApplicationUser
         */
        self.saveOUApplicationUserFromCtrl = function (ouApplicationUser) {
            if (ouApplicationUser.id) {
                //console.log(ouApplicationUser.getSelectedProxyId());
                return ouApplicationUserService
                    .updateOUApplicationUser(ouApplicationUser)
                    .then(function () {
                        //if (!self.currentOrganization) {
                        toast.success(langService.get('edited_successfully'));
                        //}
                        if (employeeService.isCurrentEmployee(self.applicationUser)) {

                            employeeService.setCurrentOUApplicationUser(ouApplicationUser);
                            employeeService.setCurrentEmployee(self.ouApplicationUser.applicationUser);
                        }
                        return true;
                    });
            }
            else {
                //ouApplicationUser.wfsecurity = self.globalSetting.wfsecurity;
                return ouApplicationUserService
                    .addOUApplicationUser(ouApplicationUser)
                    .then(function () {
                        var indexOfUpdatedOUApplicationUser = _.findIndex(self.ouApplicationUsers, function (x) {
                            return x.ouid.id === ouApplicationUser.ouid.id;
                        });
                        self.ouApplicationUsers.splice(indexOfUpdatedOUApplicationUser, 1, ouApplicationUser);
                        toast.success(langService.get('save_success'));
                        return true;
                    });
            }
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
                            template: cmsTemplate.getPopup('application-user-edit-permission'),
                            controller: 'applicationUserEditPermissionPopCtrl',
                            controllerAs: 'ctrl',
                            locals: {
                                ouApplicationUser: ouApplicationUser,
                                permissions: permissions,
                                userOuPermissions: userOuPermissions
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
            //console.log('ou application user from grid - workflow participation: ', ouApplicationUser);
            ouApplicationUser.wfsecurity =  ouApplicationUser.wfsecurity || self.globalSetting.wfsecurity;
            return dialog
                .showDialog({
                    targetEvent: $event,
                    template: cmsTemplate.getPopup('application-user-workflow-participation'),
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
            //console.log('ou application user from grid - out of office: ', ouApplicationUser);
            return dialog
                .showDialog({
                    targetEvent: $event,
                    template: cmsTemplate.getPopup('application-user-out-of-office-setting'),
                    controller: 'applicationUserOutOfOfficeSettingPopCtrl',
                    controllerAs: 'ctrl',
                    locals: {
                        ouApplicationUser: ouApplicationUser
                    },
                    resolve: {
                        availableProxies: function (ouApplicationUserService) {
                            'ngInject';
                            return ouApplicationUserService
                                .getAvailableProxies(ouApplicationUser.getRegistryOUID())
                                .then(function (result) {
                                    //console.log(result);
                                    return result
                                })
                        },
                        usersWhoSetYouAsProxy: function(ouApplicationUserService){
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
         * @description Add new application user and add to organization
         */
        self.addApplicationUserAndOUFromCtrl = function () {
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
                    applicationUserService
                        .addApplicationUser(self.applicationUser)
                        .then(function (result) {
                            self.ouApplicationUser.ouid = _.find(self.organizations, function (organization) {
                                return organization.id === self.applicationUser.defaultOUID;
                            });
                            self.ouApplicationUser.applicationUser = result;
                            self.addOUApplicationUserFromCtrl().then(function () {
                                self.applicationUser = angular.copy(self.applicationUser);
                                self.model = angular.copy(self.applicationUser);
                                self.editMode = true;
                                toast.success(langService.get('add_success').change({name: self.applicationUser.getNames()}));
                            });
                        });
                })
                .catch(function () {

                });
        };

        /**
         * @description Edit application user and update organization
         */
        self.editApplicationUserAndOUFromCtrl = function () {
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

                            self.ouApplicationUser.ouid = _.find(self.organizations, function (organization) {
                                return organization.id === self.applicationUser.defaultOUID;
                            });
                            self.ouApplicationUser.applicationUser = self.applicationUser;
                            self.saveOUApplicationUserFromCtrl(self.ouApplicationUser).then(function () {
                                toast.success(langService.get('edit_success').change({name: self.applicationUser.getNames()}));
                                dialog.hide(self.applicationUser);
                            });


                        });
                })
                .catch(function () {

                });
        };


        /**
         * @description Array of actions that can be performed on grid
         * @type {[*]}
         */
        self.gridActions = [
            {
                "type": 'action',
                //"icon": 'delete',
                'text': langService.get('grid_action_edit_permission'),
                'callback': self.openEditPermissionDialog
            },
            {
                "type": 'action',
                //"icon": 'pencil',
                'text': langService.get('grid_action_edit_workflow_participation'),
                'callback': self.openWorkflowParticipationDialog
            },
            {
                "type": 'action',
                //"icon": 'pencil-box',
                'text': langService.get('grid_action_out_of_office_settings'),
                'callback': self.openOutOfOfficeSettingsDialog
            },
            {
                "type": "separator"
            },
            {
                "type": 'action',
                //"icon": 'sitemap',
                'text': langService.get('grid_action_edit'),
                'callback': self.editOUApplicationUserFromCtrl
            },
            {
                "type": 'action',
                //"icon": 'book-open-variant',
                'text': langService.get('grid_action_delete'),
                'callback': self.removeOUApplicationUserFromCtrl
            }
        ];


        /**
         * @description Close the popup
         */
        self.closeApplicationUserPopupFromCtrl = function () {
            dialog.cancel();
        };

    });
};