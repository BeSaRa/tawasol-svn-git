module.exports = function (app) {
    app.controller('manageEntitiesDirectiveCtrl', function ($scope,
                                                            LangWatcher,
                                                            langService,
                                                            LinkedObject,
                                                            dialog,
                                                            outgoingService,
                                                            managerService,
                                                            $timeout,
                                                            toast,
                                                            correspondenceService,
                                                            rootEntity,
                                                            employeeService,
                                                            cmsTemplate,
                                                            _,
                                                            customValidationService,
                                                            applicationUserService,
                                                            smsTemplateService) {
        'ngInject';
        var self = this;
        self.controllerName = 'manageEntitiesDirectiveCtrl';
        LangWatcher($scope);
        self.defaultEntityTypes = [];
        self.entityTypes = [];
        self.employeeService = employeeService;
        $timeout(function () {
            self.defaultEntityTypes = correspondenceService.getDefaultEntityTypesForDocumentClass(self.documentClass);
            self.entityTypes = correspondenceService.getCustomEntityTypesForDocumentClass(self.documentClass);

            applicationUserService.getApplicationUsers()
                .then(function () {
                    smsTemplateService.loadActiveSmsTemplates()
                        .then(function (result) {
                            self.smsTemplates = result;
                        });
                })
        });
        self.rootEntity = rootEntity.returnRootEntity().rootEntity;


        self.showEntityFrom = false;

        self.editMode = false;

        self.fromDialog = false;

        self.icons = {
            EMPLOYEE: 'account',
            EXTERNAL_USER: 'account-outline',
            COMPANY: 'domain'
        };

        self.entity = null;

        self.entityTypesMap = {
            EMPLOYEE: 0,
            EXTERNAL_USER: 2,
            COMPANY: 3,
            OTHER: 1
        };

        self.linkedEntities = [];

        self.selectedEntities = [];

        self.grid = {
            limit: 5, // default limit
            page: 1, // first page
            order: 'description', // default sorting order
            limitOptions: [5, 10, 20, // limit options
                {
                    label: langService.get('all'),
                    value: function () {
                        return (self.linkedEntities.length + 21);
                    }
                }
            ]
        };

        self.labels = {
            name: 'entities_name',
            description: 'entities_description',
            mobileNumber: 'entities_mobile_number',
            qid: 'entities_qid',
            employeeNum: 'entities_employee_number',
            crNumber: 'entities_registration_number',
            email: 'entities_email',
            address: 'entities_address',
            fullNameAr: 'entities_full_arabic_name',
            fullNameEn: 'entities_full_english_name',
            nationality: 'entities_nationality'
        };

        function _currentFields(entityType) {
            self.currentFields = _.chunk(_.filter(_.map(self.entity.getLinkedTypeFields(entityType), function (field, key) {
                return angular.extend({}, field, {label: key})
            }), function (field) {
                return ['typeId'].indexOf(field.label) === -1;
            }), 3);
        }

        function _createEntity(entityType) {
            self.entity = (new LinkedObject({typeId: entityType})).preparedType();
            self.selectedEntityType = angular.copy(entityType);
            _currentFields(entityType);
        }


        function _editEntity(entity) {
            self.entity = entity.preparedType();
            self.selectedEntityType = angular.copy(entity.typeId);
            self.selectedLinkedEntityCopy = angular.copy(entity);
            self.editMode = true;
            _currentFields(entity.typeId);
        }

        /**
         * @description Checks if field has valid value according to custom validation
         * @param field
         * @returns {boolean}
         */
        self.isValidValues = function (field) {
            var isValid = true;
            if (field.fieldIdentifier === 'qid') {
                if (field.required) {
                    isValid = typeof self.entity[field.label] !== 'undefined' && self.entity[field.label] !== null && self.entity[field.label] !== '';
                }
                if (isValid) {
                    isValid = customValidationService.validateInput(self.entity[field.label], field.customValidation.type);
                }
            }
            return isValid;
        };

        /**
         * @description Search the linked person by field value
         * @param field
         * @param $event
         * @returns {*[]}
         */
        self.searchRecordsByField = function (field, $event) {
            if (self.isValidValues(field)) {
                if (self.rootEntity.hrEnabled && self.selectedEntityType.lookupStrKey && self.selectedEntityType.lookupStrKey.toLowerCase() === 'external_user' && field.fieldIdentifier === 'qid') {
                    correspondenceService.searchLinkedPersonByCriteria({qid: self.entity.qid})
                        .then(function (result) {
                            if (result && result.length) {
                                result[0].typeId = self.selectedEntityType;
                                self.entity = angular.copy(result[0]);
                            } else {
                                self.pushEntityType(self.selectedEntityType);
                            }
                        })
                }
                return [];
            }
        };

        /**
         * @description Handles the keydown event of the entity field
         * @param field
         * @param $event
         */
        self.handleFieldKeyDown = function (field, $event) {
            if ($event) {
                if (self.rootEntity.hrEnabled && self.selectedEntityType.lookupStrKey.toLowerCase() === 'external_user' && field.fieldIdentifier === 'qid') {
                    var code = $event.which || $event.keyCode;
                    // if enter key pressed, load from server with search text
                    if (code === 13) {
                        self.searchRecordsByField(field, $event)
                    }
                }
            }
        };

        /**
         * @description Reset the smsTemplateId if sendSMS = false
         * @param entity
         * @param $event
         */
        self.resetSMSTemplate = function (entity, $event) {
            entity.smsTemplateId = null;
        };

        /**
         * select entity type to add
         * @param entityType
         */
        self.pushEntityType = function (entityType) {
            _createEntity(entityType);
            if (entityType.lookupStrKey && entityType.lookupStrKey.toLowerCase() === 'employee' && self.rootEntity.hrEnabled) {
                self.openHREmployeeIntegrationDialog()
                    .then(function (employees) {
                        self.editMode = false; // rest editMode in case you edited existing employee and add new
                        self.entity = employees;
                        self.addEntityToDocument();
                    })
                    .catch(function (error) {
                        if (error && error === 'close')
                            self.closeEntityForm();
                    });
            } else {
                self.showEntityFrom = true;
                self.editMode = false;
            }
        };


        /**
         * close entity form
         */
        self.closeEntityForm = function () {
            self.showEntityFrom = false;
            self.currentFields = [];
            self.entity = null;
            self.selectedEntityType = null;
        };

        var _checkDuplicateExternalUser = function () {
            return _.some(self.linkedEntities, function (linkedEntity) {
                if (self.editMode) {
                    if (linkedEntity.typeId.lookupStrKey.toLowerCase() !== 'external_user')
                        return false;

                    return (self.entity.qid === self.selectedLinkedEntityCopy.qid) ? false : linkedEntity.qid === self.entity.qid;
                }

                return linkedEntity.typeId.lookupStrKey.toLowerCase() === 'external_user' && linkedEntity.qid === self.entity.qid;
            })
        };

        /**
         * add entity document
         */
        self.addEntityToDocument = function () {
            if (self.selectedEntityType.lookupStrKey.toLowerCase() === 'external_user') {
                if (_checkDuplicateExternalUser()) {
                    toast.error(langService.get('record_already_exists').change({entity: langService.get('entities_qid')}));
                    return;
                }
                if (self.entity.sendSMS && !self.entity.smsTemplateId) {
                    toast.error(langService.get('please_select_sms_template'));
                    return;
                }
            }

            var promise = null;

            if (self.vsId) {
                var document = {
                    vsId: self.vsId,
                    docClassName: self.documentClass
                };

                if (self.editMode) {
                    self.linkedEntities.splice(self.editIndex, 1, self.entity);
                    document.linkedEntities = self.linkedEntities;
                } else {
                    // used when add multiple linked object using hr employee integration
                    if (angular.isArray(self.entity)) {
                        self.linkedEntities = self.linkedEntities.concat(self.entity)
                    } else {
                        self.linkedEntities.push(self.entity);
                    }
                    document.linkedEntities = self.linkedEntities;
                }

                promise = outgoingService
                    .addLinkedObject(document);

            } else {
                if (self.editMode) {
                    promise = $timeout(function () {
                        self.linkedEntities.splice(self.editIndex, 1, self.entity);
                        return self.linkedEntities;
                    });
                } else {
                    promise = $timeout(function () {
                        // used when add multiple linked object using hr employee integration
                        if (angular.isArray(self.entity)) {
                            self.linkedEntities = self.linkedEntities.concat(self.entity)
                        } else {
                            self.linkedEntities.push(self.entity);
                        }

                        return self.linkedEntities;
                    });
                }

            }
            promise.then(function () {
                // for multiple selection of search result hr employees
                if (self.rootEntity.hrEnabled && self.entity.length) {
                    toast.success(langService.get('save_success'));
                } else {
                    toast.success(langService.get(self.editMode ? 'save_success' : 'add_success').change({name: self.entity.getTranslatedName()}));
                }
                self.closeEntityForm();
            });
        };
        /**
         * delete bulk document entities
         */
        self.removeBulkDocumentEntities = function ($event) {
            dialog
                .confirmMessage(langService.get('confirm_delete_selected_multiple'), null, null, $event)
                .then(function () {
                    var copyVersion = angular.copy(self.linkedEntities);
                    var promise = null;
                    for (var i = 0; i < self.selectedEntities.length; i++) {
                        copyVersion.splice(copyVersion.indexOf(self.selectedEntities[i]), 1);
                    }

                    if (self.vsId) {
                        promise = outgoingService.addLinkedObject({
                            vsId: self.vsId,
                            docClassName: self.documentClass,
                            linkedEntities: copyVersion
                        });
                    } else {
                        promise = $timeout(function () {
                            return copyVersion;
                        });
                    }

                    promise.then(function (linkedEntities) {
                        toast.success(langService.get('delete_success'));
                        self.selectedEntities = [];
                        self.linkedEntities = linkedEntities;
                    });
                })

        };
        /**
         * remove document entity from document
         */
        self.removeDocumentEntity = function (entity, $index, $event) {
            dialog
                .confirmMessage(langService.get('confirm_delete').change({name: entity.name}), null, null, $event)
                .then(function () {
                    var promise = null, copyVersion = angular.copy(self.linkedEntities);
                    copyVersion.splice($index, 1);
                    if (self.vsId) {
                        promise = outgoingService.addLinkedObject({
                            vsId: self.vsId,
                            docClassName: self.documentClass,
                            linkedEntities: copyVersion
                        });
                    } else {
                        promise = $timeout(function () {
                            return copyVersion;
                        });
                    }

                    promise.then(function () {
                        self.linkedEntities = copyVersion;
                        toast.success(langService.get('delete_success'));
                        self.selectedEntities = [];
                    });
                })
        };
        /**
         * edit document entity
         */
        self.editDocumentEntity = function (entity, $index, $event) {
            _editEntity(angular.copy(entity));
            self.showEntityFrom = true;
            self.editIndex = $index;
        };

        self.openEntityTypeMenu = function ($mdMenu, $event) {
            var length = self.defaultEntityTypes.length + self.entityTypes.length;
            if (length) {
                $mdMenu.open();
            } else {
                dialog.infoMessage(langService.get('no_entity_types_to_add'), null, null, $event);
            }
        };

        /**
         * @description Opens the entity in read-only mode
         * @param linkedEntity
         * @param $event
         * @returns {promise|*}
         */
        self.viewEntity = function (linkedEntity, $event) {
            return dialog
                .showDialog({
                    targetEvent: $event,
                    templateUrl: cmsTemplate.getPopup('view-linked-entity'),
                    controller: 'viewLinkedEntityPopCtrl',
                    controllerAs: 'ctrl',
                    bindToController: true,
                    locals: {
                        linkedEntity: linkedEntity.preparedType()
                    }
                });
        };

        /**
         *
         * @param $event open hr employee search dialog
         * @returns {promise}
         */
        self.openHREmployeeIntegrationDialog = function ($event) {
            return managerService.openHREmployeeIntegration($event, self.linkedEntities);
        };

    });
};
