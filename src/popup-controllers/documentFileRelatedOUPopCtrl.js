module.exports = function (app) {
    app.controller('documentFileRelatedOUPopCtrl', function (lookupService,
                                                             documentFileRelatedOU,
                                                             $q,
                                                             $filter,
                                                             langService,
                                                             toast,
                                                             dialog,
                                                             documentFile,
                                                             relatedOUDocumentFileService,
                                                             documentFileService) {
        'ngInject';
        var self = this;
        self.controllerName = 'documentFileRelatedOUPopCtrl';
        self.documentFile = documentFile;

        /**
         *@description All document file related ous
         */
        self.documentFileRelatedOUs = documentFileRelatedOU;

        self.promise = null;
        self.selectedRelatedOUs = [];

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedData = function () {
            self.documentFileRelatedOUs = $filter('orderBy')(self.documentFileRelatedOUs, self.grid.order);
        };

        self.grid = {
            limit: 5, // default limit
            page: 1, // first page
            order: 'arName', // default sorting order
            limitOptions: [5, 10, 20, // limit options
                {
                    label: langService.get('all'),
                    value: function () {
                        return (self.documentFileRelatedOUs.length + 21)
                    }
                }
            ]
        };
        /**
         * @description remove document file related organization
         */
        self.removeSelectedOrganization = function (ouId) {
            dialog.confirmMessage((langService.get('confirm_delete_msg'))).then(function () {
                relatedOUDocumentFileService.deleteRelatedOUDocumentFile(ouId).then(function (result) {
                    var index = -1;
                    var comArr = eval(self.documentFileRelatedOUs);
                    for (var i = 0; i < comArr.length; i++) {
                        if (comArr[i].id === result.id) {
                            index = i;
                            break;
                        }
                    }
                    if (index === -1) {
                    }
                    self.documentFileRelatedOUs.splice(index, 1);
                    if (self.documentFileRelatedOUs.length > 0) {
                        self.documentFile.global = false;
                    }
                    else {
                        self.documentFile.global = true;
                    }
                    relatedOUDocumentFileService.loadRelatedOUDocumentFiles().then(function () {
                        documentFileService.updateDocumentFile(self.documentFile).then(function () {
                            toast.success(langService.get('delete_success'));
                        });
                    });
                });

            }, function () {

            });
        };
        /**
         * @description remove document file related organization bulk
         */
        self.removeBulkDocumentFilesRelatedOUs = function () {
            dialog.confirmMessage((langService.get('confirm_delete_msg'))).then(function () {
                relatedOUDocumentFileService.deleteBulkRelatedOUDocumentFiles(self.selectedRelatedOUs).then(function (result) {
                    var index = -1;
                    for (var j = 0; j < result.length; j++) {
                        index = self.documentFileRelatedOUs.indexOf(result[j]);
                        if (index > -1) {
                            self.documentFileRelatedOUs.splice(index, 1);
                        }
                    }
                    if (self.documentFileRelatedOUs.length > 0) {
                        self.documentFile.global = false;
                    }
                    else {
                        self.documentFile.global = true;
                    }
                    relatedOUDocumentFileService.loadRelatedOUDocumentFiles().then(function () {
                        documentFileService.updateDocumentFile(self.documentFile).then(function () {
                            toast.success(langService.get('delete_success'));
                        });
                    });
                });
            }, function () {

            });
        };
    });
};