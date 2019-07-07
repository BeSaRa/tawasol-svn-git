module.exports = function (app) {
    app.controller('manageDocumentContentPopCtrl', function (dialog,
                                                             queueStatusService,
                                                             counterService,
                                                             toast,
                                                             $timeout,
                                                             fromDialog,
                                                             langService) {
        'ngInject';
        var self = this;
        self.controllerName = 'manageDocumentContentPopCtrl';


        self.saveDocumentContent = function () {
            if (self.documentInformation || self.correspondence.contentFile) {
                var promise = null;
                /*No document information(No prepare document selected)*/
                if (self.documentInformation) {
                    /*if (status) {
                     self.correspondence.docStatus = queueStatusService.getDocumentStatus(status);
                     }*/
                    promise = self.correspondence
                        .saveDocumentWithContent(self.documentInformation, false);
                } else {
                    promise = $timeout(function () {
                        return self.correspondence;
                    })
                }
                promise.then(function (result) {
                    self.correspondence = result;
                    self.model = angular.copy(self.correspondence);

                    /*If content file was attached */
                    if (self.correspondence.contentFile) {
                        self.correspondence.addDocumentContentFile()
                            .then(function () {
                                saveCorrespondenceFinished();
                            })
                    }
                    else {
                        saveCorrespondenceFinished();
                    }
                });
            }
            else {
                toast.error(langService.get('please_select_or_upload_document'))
            }
        };

        var saveCorrespondenceFinished = function () {

            if (self.documentInformation)
                self.correspondence.contentSize = 1;
            else if (self.correspondence.contentFile && self.correspondence.contentFile.size)
                self.correspondence.contentSize = self.correspondence.contentFile.size;

            self.requestCompleted = true;
            counterService.loadCounters();
            toast.success(langService.get('content_updated_successfully'));
            dialog.hide();
        };


        self.closePopup = function () {
            dialog.cancel();
        };
    });
};
