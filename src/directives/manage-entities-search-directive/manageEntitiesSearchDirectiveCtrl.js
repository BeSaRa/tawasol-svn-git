module.exports = function (app) {
    app.controller('manageEntitiesSearchDirectiveCtrl', function ($scope,
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
        self.controllerName = 'manageEntitiesSearchDirectiveCtrl';
        LangWatcher($scope);

        function _getDocumentClass(documentClass) {
            return documentClass.toLowerCase() === 'correspondence' ? 'outgoing' : documentClass;
        }

        $timeout(function () {
            self.defaultEntityTypes = correspondenceService.getDefaultEntityTypesForDocumentClass(_getDocumentClass(self.documentClass));
            self.entityTypes = correspondenceService.getCustomEntityTypesForDocumentClass(_getDocumentClass(self.documentClass));
            if (self.selectedEntityType) {
                if (self.linkedEntity) {
                    self.editDocumentEntity(self.linkedEntity);
                }
                else {
                    self.pushEntityType(self.selectedEntityType);
                }
            }
        });


        self.showEntityForm = false;

        self.linkedEntity = null;

        /*self.entityTypesMap = {
            EMPLOYEE: 0,
            EXTERNAL_USER: 2,
            COMPANY: 3,
            OTHER: 1
        };*/

        self.linkedEntity = [];

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
            self.currentFields = _.chunk(_.filter(_.map(self.linkedEntity.getLinkedTypeFields(entityType), function (field, key) {
                return angular.extend({}, field, {label: key})
            }), function (field) {
                return ['typeId'].indexOf(field.label) === -1;
            }), 3);
        }

        function _createEntity(entityType) {
            self.linkedEntity = (new LinkedObject({typeId: entityType})).preparedType();
            _currentFields(entityType);
        }


        function _editEntity(entity) {
            self.linkedEntity = entity.preparedType();
            self.editMode = true;
            _currentFields(entity.typeId);
        }

        /**
         * select entity type to add
         * @param entityType
         */
        self.pushEntityType = function (entityType) {
            _createEntity(entityType);
            self.showEntityForm = true;
        };
        /**
         * close entity form
         */
        self.closeEntityForm = function () {
            self.showEntityForm = false;
            self.currentFields = [];
            self.linkedEntity = null;
        };

        self.submitEnabled = function (form, $event) {
            var fields = form.$$controls, formValid = false;
            for (var i = 0; i < fields.length; i++) {
                if (fields[i].$viewValue) {
                    formValid = true;
                    break;
                }
            }
            return formValid;
        };

        /**
         * edit document entity
         */
        self.editDocumentEntity = function (entity, $index, $event) {
            _editEntity(entity);
            self.showEntityForm = true;
            self.editIndex = $index;
        };

    });
};