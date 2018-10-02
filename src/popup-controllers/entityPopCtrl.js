module.exports = function (app) {
    app.controller('entityPopCtrl', function (entityService,
                                              _,
                                              editMode,
                                              $q,
                                              toast,
                                              Entity,
                                              rootEntity,
                                              validationService,
                                              generator,
                                              dialog,
                                              langService,
                                              entity,
                                              customValidationService) {
        'ngInject';
        var self = this;
        self.controllerName = 'entityPopCtrl';
        self.editMode = editMode;
        self.entity = angular.copy(entity);
        self.model = angular.copy(entity);

        self.validateLabels = {
            identifier: 'identifier',
            arName: 'arabic_name',
            enName: 'english_name',
            status: 'status',
            serverAddress: 'server_name_ip',
            dc: 'domain_controller_name',
            userName: 'username',
            password: 'password',
            tawasolOU: 'tawasol_ou',
            cmUserName: 'filenet_content_manager_username',
            cmPassword: 'filenet_content_manager_password',
            cmEJBaddress: 'filenet_content_manager_ejb_address',
            cmStanza: 'filenet_content_manager_stanza',
            osName: 'filenet_object_store_name',
            peRouterName: 'filenet_process_engine_router_name',
            cmsDatabaseName: 'database_name',
            cmsDataSourceName: 'data_source_name'

        };

        self.rootEntity = rootEntity.returnRootEntity();

        function _connectionResult(result) {
            var message = result ? 'connection_success' : 'connection_fail';
            var method = result ? 'successMessage' : 'errorMessage';
            dialog[method](langService.get(message));
        }

        /**
         * @description Add new entity
         */
        self.addEntityFromCtrl = function () {
            validationService
                .createValidation('ADD_ENTITY')
                .addStep('check_required', true, generator.checkRequiredFields, self.entity, function (result) {
                    return !result.length;
                })
                .notifyFailure(function (step, result) {
                    var labels = _.map(result, function (label) {
                        return self.validateLabels[label];
                    });
                    generator.generateErrorFields('check_this_fields', labels);
                })
                .addStep('check_duplicate_name', true, entityService.checkDuplicateEntity, [self.entity, 'name', false], function (result) {
                    return !result;
                }, true)
                .notifyFailure(function () {
                    toast.error(langService.get('name_duplication_message'));
                })
                .addStep('check_duplicate_identifier', true, entityService.checkDuplicateEntity, [self.entity, 'identifier', false], function (result) {
                    return !result;
                }, true)
                .notifyFailure(function () {
                    toast.error(langService.get('identifier_duplication_message'));
                })
                /*.addStep('validate_URL', true, customValidationService.va, [self.entity.helpUrl, "url"], function (result) {
                    return result;
                }, true)
                .notifyFailure(function () {
                    generator.generateErrorFields('check_this_fields', ['url_only']);
                })*/
                .addStep('validate_Email', true, customValidationService.validateInput, [self.entity.smtpFromEmail, "email"], function (result) {
                    return result;
                }, true)
                .notifyFailure(function () {
                    generator.generateErrorFields('check_this_fields', ['invalid_email']);
                })
                .validate()
                .then(function () {
                    entityService.addEntity(self.entity).then(function (result) {
                        //toast.success(langService.get('add_success').change({name: self.entity.getNames()}));
                        dialog.hide(result);
                    });
                })
                .catch(function () {

                });
        };

        /**
         * @description Edit entity
         */
        self.editEntityFromCtrl = function () {
            validationService
                .createValidation('EDIT_ENTITY')
                .addStep('check_required', true, generator.checkRequiredFields, self.entity, function (result) {
                    return !result.length;
                })
                .notifyFailure(function (step, result) {
                    var labels = _.map(result, function (label) {
                        return self.validateLabels[label];
                    });
                    generator.generateErrorFields('check_this_fields', labels);
                })
                .addStep('check_duplicate_name', true, entityService.checkDuplicateEntity, [self.entity, 'name', true], function (result) {
                    return !result;
                }, true)
                .notifyFailure(function () {
                    toast.error(langService.get('name_duplication_message'));
                })
                .addStep('check_duplicate_identifier', true, entityService.checkDuplicateEntity, [self.entity, 'identifier', true], function (result) {
                    return !result;
                }, true)
                .notifyFailure(function () {
                    toast.error(langService.get('identifier_duplication_message'));
                })
                .addStep('validate_URL', true, customValidationService.validateInput, [self.entity.helpUrl, "url"], function (result) {
                    return result;
                }, true)
                .notifyFailure(function () {
                    generator.generateErrorFields('check_this_fields', ['url_only']);
                })
                .addStep('validate_Email', true, customValidationService.validateInput, [self.entity.smtpFromEmail, "email"], function (result) {
                    return result;
                }, true)
                .notifyFailure(function () {
                    generator.generateErrorFields('check_this_fields', ['invalid_email']);
                })
                .validate()
                .then(function () {
                    entityService.updateEntity(self.entity).then(function (result) {
                        rootEntity.loadInformationWithoutCancelDialog().then(function () {
                            dialog.hide(result);
                        });
                    });
                });
                /*.catch(function () {

                });*/
        };

        /**
         * @description Close the popup
         */
        self.closeEntityPopupFromCtrl = function () {
            dialog.cancel();
        };
        /**
         * @description test LDAP connection
         */
        self.testLdapConnection = function () {
            entityService.ldapConnectionTest(self.entity).then(function (result) {
                _connectionResult(result);
            })
        };
        /**
         * @description test file net connection
         */
        self.testFileNetConnection = function () {
            entityService.fileNetConnectionTest(self.entity).then(function (result) {
                _connectionResult(result);
            })
        };
        /**
         * @description test SMTP connection
         */
        self.testSmtpConnection = function () {
            entityService.smtpConnectionTest(self.entity).then(function (result) {
                _connectionResult(result);
            })
        };

        self.checkG2GRequired = function (isInternalG2g,entityForm) {
            var g2gFields = (isInternalG2g) ?
                ["internalG2gServerAddress", "internalG2gUserName", "internalG2gPassword", "internalG2gGECode"] :
                ["g2gServerAddress", "g2gUserName", "g2gPassword", "g2gGECode"];

            var isRequired = false;

            for (var i = 0; i <= g2gFields.length; i++) {

                if (self.entity[g2gFields[i]]) {
                    isRequired = true;
                    break;
                }
            }
            return isRequired;
        };

    });
};