module.exports = function (app) {
    app.controller('manageDocumentEntitiesSearchPopCtrl', function (dialog,
                                                                    $timeout) {
        'ngInject';
        var self = this;
        self.controllerName = 'manageDocumentEntitiesSearchPopCtrl';

        $timeout(function () {
            self.selectedEntityTypeCopy = angular.copy(self.selectedEntityType);
            self.linkedEntityCopy = angular.copy(self.linkedEntity);
            self.formValid = !!self.linkedEntityCopy;
        });

        self.setDocumentEntities = function () {
            var linkedEntity = self.linkedEntity ? self.linkedEntity : null;
            dialog.hide({
                linkedEntity: linkedEntity,
                selectedEntityType: linkedEntity ? linkedEntity.typeId : null
            });
        };

        self.closeDocumentEntities = function () {
            var linkedEntity = self.linkedEntityCopy ? self.linkedEntityCopy : null;
            dialog.cancel({
                linkedEntity: linkedEntity,
                selectedEntityType: self.selectedEntityTypeCopy
            });
        }
    });
};