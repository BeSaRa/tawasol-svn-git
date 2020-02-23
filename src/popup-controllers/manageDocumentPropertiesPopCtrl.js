module.exports = function (app) {
    app.controller('manageDocumentPropertiesPopCtrl', function (dialog, langService, $timeout, toast, $q, errorCode) {
        'ngInject';
        var self = this;
        self.controllerName = 'manageDocumentPropertiesPopCtrl';

        $timeout(function(){
            self.sourceModel = self.document;
        });

        self.saveProperties = function (skipCheck) {
            self.document.saveDocument(false, true)
                .then(function (result) {
                    self.document = result;
                    toast.success(langService.get('outgoing_metadata_saved_success'));
                    self.model = angular.copy(self.document);
                    dialog.hide(self.model);
                })
                .catch(function (error) {
                    if (errorCode.checkIf(error, 'ALREADY_EXISTS_INCOMING_BOOK_WITH_SAME_REFERENCE_NUMBER') === true) {
                        dialog.confirmMessage(langService.get('incoming_book_exists_same_number_site_year') + "<br/>" + langService.get('confirm_continue_message'))
                            .then(function () {
                                return self.saveProperties(true);
                            }).catch(function () {
                            return $q.reject(error);
                        });
                    }
                    return $q.reject(error);
                });
        };

        self.closeDocumentProperties = function () {
            dialog.cancel(self.model);
        }

    });
};
