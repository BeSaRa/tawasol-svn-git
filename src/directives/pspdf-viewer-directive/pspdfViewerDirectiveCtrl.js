module.exports = function (app) {
    app.controller('pspdfViewerDirectiveCtrl', function (PSPDFKit, configurationService, rootEntity, employeeService, $timeout, $element, generator) {
        'ngInject';
        var self = this;
        self.controllerName = 'pspdfViewerDirectiveCtrl';

        self.docUrl = null;

        self.excludedPermissions = [];

        self.container = $element[0];

        self.instance = null;

        self.licenseKey = rootEntity.returnRootEntity().rootEntity.psPDFLicenseKey;

        self.destroyInstance = function () {
            try {
                PSPDFKit.unload('#' + self.container.id)
            } catch (e) {
                // mute cannot find container from PSPDFKit
            }

        };

        self.renderViewer = function () {
            var initialViewState = new PSPDFKit.ViewState({
                readOnly: true,
                allowPrinting: employeeService.hasPermissionTo('PRINT_DOCUMENT')
            });
            self.destroyInstance();
            PSPDFKit.load({
                baseUrl: (location.protocol + '//' + location.host + '/' + (configurationService.APP_CONTEXT ? configurationService.APP_CONTEXT + '/' : '')),
                container: self.container,
                printMode: PSPDFKit.PrintMode.EXPORT_PDF,
                document: typeof self.docUrl === 'object' ? self.docUrl.$$unwrapTrustedValue() : self.docUrl,
                licenseKey: configurationService.PSPDF_LICENSE_KEY ? configurationService.PSPDF_LICENSE_KEY : self.licenseKey,
                initialViewState: initialViewState
            }).then(function (instance) {
                self.instance = instance;
            });
        };

        self.$onInit = function () {
            $timeout(function () {
                self.renderViewer();
            });
        }
    });
};
