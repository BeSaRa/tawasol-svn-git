module.exports = function (app) {
    app.controller('importOrganizationPopCtrl', function (lookupService,
                                                          $q,
                                                          langService,
                                                          toast,
                                                          dialog,
                                                          organizationService) {
        'ngInject';
        var self = this;

        self.controllerName = 'importOrganizationPopCtrl';

        self.progress = null;

        /*  /!**
         * @description All entity names
         * @type {*}
         *!/
         self.importOrganizationPops = importOrganizationPops;
         */
        /**
         * @description Contains the selected entity names
         * @type {Array}
         */
        self.selectedImportOrganizationPops = [];

        /**
         * @description Contains options for grid configuration
         * @type {{limit: number, page: number, order: string, limitOptions: [*]}}
         */
        self.grid = {
            limit: 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: [5, 10, 20, 50] // limit options
        };

        self.validateURL = null;
        self.uploadExcelFile = function () {
            self.organizations = [];
            var fileToUpload = document.getElementById('uploadExcelFile').files[0];
            if (!fileToUpload) {
                dialog.alertMessage(langService.get('file_required'));
                return false;
            }
            if (fileToUpload.name.split('.')[1] !== "xls" && fileToUpload.name.split('.')[1] !== "xlsx") {
                dialog.alertMessage(langService.get('excel_file_required'));
                return false;
            }

            document.getElementById('uploadExcelFile').value = null;
            organizationService.uploadExcelFile(fileToUpload).then(function (result) {
                self.validateURL = null;
                self.validateURL = result;
                toast.success(langService.get('file_upload_success'));
                //self.validateExcelFile(result)
            })
        };

        self.validateExcelFile = function () {
            if (self.validateURL) {
                organizationService.validateExcelFile(self.validateURL).then(function (result) {
                    self.organizations = [];
                    angular.forEach(result, function (value, key) {
                        self.organizations.push(value);
                    });
                    self.validateURL = null;
                })
            } else {
                dialog.alertMessage(langService.get('file_required'));
            }

        };

        self.saveImportOrganizations = function () {
            /* for (var i = 0; i < self.organizations; i++) {

             }*/
        }

    });
};
