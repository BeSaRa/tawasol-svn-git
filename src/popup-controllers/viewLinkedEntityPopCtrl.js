module.exports = function (app) {
    app.controller('viewLinkedEntityPopCtrl', function ($scope,
                                                        LangWatcher,
                                                        langService,
                                                        dialog,
                                                        $timeout,
                                                        toast,
                                                        correspondenceService,
                                                        _) {
        'ngInject';
        var self = this;
        self.controllerName = 'viewLinkedEntityPopCtrl';
        LangWatcher($scope);

        //self.defaultEntityTypes = [];
        //self.entityTypes = [];
        $timeout(function () {
            //self.defaultEntityTypes = correspondenceService.getDefaultEntityTypesForDocumentClass(self.documentClass);
            //self.entityTypes = correspondenceService.getCustomEntityTypesForDocumentClass(self.documentClass);

            _currentFields(self.linkedEntity.typeId)
        });

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
            nationality: 'entities_nationality',
            xJobRank: 'job_rank',
            xJobTitle: 'job_title',
            xOU: 'organization_unit'
        };

        function _currentFields(entityType) {
            self.currentFields = _.chunk(_.filter(_.map(self.linkedEntity.getLinkedTypeFields(entityType), function (field, key) {
                return angular.extend({}, field, {label: key})
            }), function (field) {
                return ['typeId'].indexOf(field.label) === -1;
            }), 3);
        }


        self.closePopup = function () {
            dialog.cancel();
        }

    });
};
