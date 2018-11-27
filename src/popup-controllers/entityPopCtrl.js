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
            /*if (result)
                dialog.successMessage(langService.get('connection_success'));
            else {
                if (errorCode.checkIf(result, 'SEC_LDAP_ADDING_ENTITY')
                    || errorCode.checkIf(result, 'SEC_LDAP_OU_NOT_AVAILABLE')
                    || errorCode.checkIf(result, 'SEC_LDAP_INVALID_SERVER_ADDRESS')
                    || errorCode.checkIf(result, 'SEC_LDAP_INVALID_OP')
                    || errorCode.checkIf(result, 'SEC_ERROR_USER_UN_AUHTORIZED_FOR_SERVICE')) {

                }
            }*/
        }

        /**
         * this method to check if the given args has value or not
         * note the 0 not defined as no value this means if value equal to 0 will pass and return true
         * @param value
         * @return {boolean}
         */
        self.validRequired = function (value) {
            return (
                (typeof value === 'string') ? (value.trim() !== '') : (value !== null && typeof value !== 'undefined')
            );
        };
        /**
         * check validation of required fields
         * @param model
         * @return {Array}
         */
        self.checkRequiredFields = function (model) {
            var required = model.getRequiredFields(), result = [];
            if (model.id) {
                required.splice(required.indexOf('password'), 1);
                required.splice(required.indexOf('cmPassword'), 1);
                required.splice(required.indexOf('smtpPassword'), 1);
                required.splice(required.indexOf('g2gPassword'), 1);
                required.splice(required.indexOf('internalG2gPassword'), 1);
            }
            _.map(required, function (property) {
                if (!generator.validRequired(model[property]))
                    result.push(property);
            });
            return result;
        };

        /**
         * @description Add new entity
         */
        self.addEntityFromCtrl = function () {
            validationService
                .createValidation('ADD_ENTITY')
                .addStep('check_required', true, self.checkRequiredFields, self.entity, function (result) {
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
                .addStep('check_required', true, self.checkRequiredFields, self.entity, function (result) {
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

        self.checkTestLdapConnectionEnabled = function () {
            return self.entity.serverAddress && self.entity.dc && self.entity.userName && self.entity.password && self.entity.tawasolOU;
        };

        /**
         * @description test LDAP connection
         */
        self.testLdapConnection = function () {
            entityService.ldapConnectionTest(self.entity).then(function (result) {
                _connectionResult(result);
            }).catch(function (error) {
                _connectionResult(false);
            })
        };

        self.checkTestFileNetConnectionEnabled = function () {
            return self.entity.cmUserName && self.entity.cmPassword && self.entity.cmEJBaddress && self.entity.cmStanza && self.entity.osName && self.entity.peRouterName;
        };
        /**
         * @description test file net connection
         */
        self.testFileNetConnection = function () {
            entityService.fileNetConnectionTest(self.entity).then(function (result) {
                _connectionResult(result);
            }).catch(function (error) {
                _connectionResult(false);
            })
        };

        self.checkTestSmtpConnectionEnabled = function () {
            return self.entity.smtpServerAddress && self.entity.smtpUserName && self.entity.smtpPassword && self.entity.smtpFromEmail && self.entity.smtpSubject && self.entity.smtpPort;
        };
        /**
         * @description test SMTP connection
         */
        self.testSmtpConnection = function () {
            entityService.smtpConnectionTest(self.entity).then(function (result) {
                _connectionResult(result);
            }).catch(function (error) {
                _connectionResult(false);
            })
        };

        self.checkG2GRequired = function (isInternalG2g, entityForm) {
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

        self.changeG2GServerAddress = function (field, $event) {
            if (field === 'internalG2gServerAddress') {
                if (!self.entity.g2gServerAddress) {
                    self.entity.internalG2gUserName = null;
                    self.entity.internalG2gPassword = null;
                    self.entity.internalG2gGECode = null;
                }
            }
            else if (field === 'g2gServerAddress') {
                if (!self.entity.g2gServerAddress) {
                    self.entity.g2gUserName = null;
                    self.entity.g2gPassword = null;
                    self.entity.g2gGECode = null;
                    self.entity.g2gPrivateKey = null;
                }
            }
        }

    });
};