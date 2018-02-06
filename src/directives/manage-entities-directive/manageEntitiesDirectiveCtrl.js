module.exports = function (app) {
    app.controller('manageEntitiesDirectiveCtrl', function ($scope,
                                                            LangWatcher,
                                                            langService,
                                                            LinkedObject,
                                                            dialog,
                                                            outgoingService,
                                                            $timeout,
                                                            toast,
                                                            correspondenceService,
                                                            _) {
        'ngInject';
        var self = this;
        self.controllerName = 'manageEntitiesDirectiveCtrl';
        LangWatcher($scope);
        self.defaultEntityTypes = [];
        self.entityTypes = [];
        $timeout(function () {
            self.defaultEntityTypes = correspondenceService.getDefaultEntityTypesForDocumentClass(self.documentClass);
            self.entityTypes = correspondenceService.getCustomEntityTypesForDocumentClass(self.documentClass);
        });


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
            // description: 'entities_description',
            mobileNumber: 'entities_mobile_number',
            qid: 'entities_qid',
            employeeNum: 'entities_employee_number',
            crNumber: 'entities_registration_number'
        };

        function _currentFields(entityType) {
            self.currentFields = _.chunk(_.filter(self.entity.getLinkedTypeFields(entityType), function (field) {
                return ['typeId'].indexOf(field) === -1;
            }), 3);
        }

        function _createEntity(entityType) {
            self.entity = (new LinkedObject({typeId: entityType})).preparedType();
            _currentFields(entityType);
        }


        function _editEntity(entity) {
            self.entity = entity.preparedType();
            self.editMode = true;
            _currentFields(entity.typeId);
        }

        /**
         * select entity type to add
         * @param entityType
         */
        self.pushEntityType = function (entityType) {
            _createEntity(entityType);
            self.showEntityFrom = true;
        };
        /**
         * close entity form
         */
        self.closeEntityForm = function () {
            self.showEntityFrom = false;
            self.currentFields = [];
            self.entity = null;
        };
        /**
         * add entity document
         */
        self.addEntityToDocument = function () {
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
                    self.linkedEntities.push(self.entity);
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
                        self.linkedEntities.push(self.entity);
                        return self.linkedEntities;
                    });
                }

            }
            promise.then(function () {
                toast.success(langService.get(self.editMode ? 'save_success' : 'add_success').change({name: self.entity.name}));
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
            _editEntity(entity);
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
        }


    });
};