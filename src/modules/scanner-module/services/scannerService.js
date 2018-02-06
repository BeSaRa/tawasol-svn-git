module.exports = function (app) {
    app.service('scannerService', function (CCToolkit,
                                            ajaxRequest,
                                            FileType,
                                            networkErrorCallback,
                                            dialog,
                                            cmsTemplate,
                                            $q,
                                            $timeout,
                                            toast,
                                            _,
                                            langService,
                                            PixColorFormat,
                                            Uploader,
                                            Tags,
                                            PleaseWaitDialog,
                                            LoadScannerOption) {
        'ngInject';

        var self = this;
        self.serviceName = 'scannerService';
        self.scannerIsOpen = false;

        self.openScanner = function (loadSameScanner, $event) {
            self.scannerIsOpen = true;
            return dialog
                .showDialog({
                    template: require('./../templates/scanner-popup.html'),
                    controller: 'scannerCtrl',
                    controllerAs: 'ctrl',
                    targetEvent: $event || false,
                    locals: {
                        loadSameScanner: loadSameScanner || false
                    }
                });
        };

        function createSession(loadSameScanner) {
            var defer = $q.defer();
            CCToolkit.createSession({
                licenseId: "Some_license",
                applicationId: "SampleApplication",
                closeExistingSessions: true,
                locale: "en-us",
                warnDisableOption: 0
            }, function (sessionID, token) {
                defer.resolve(sessionID);
                self.sessionCreated = true;
                if (loadSameScanner) {
                    self.loadCCScanner(LoadScannerOption.UseLastConfiguration)
                }
            });
            return defer.promise;
        }


        self.convertTiffToPDF = function (file) {
            createSession(true).then(function () {
                console.log("ASDASDASD");
            });
        }


    });
};