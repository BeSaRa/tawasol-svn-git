module.exports = function (app) {
    app.controller('pspdfViewerDirectiveCtrl', function (PSPDFKit, rootEntity, employeeService, $timeout, $element, generator) {
        'ngInject';
        var self = this;
        self.controllerName = 'pspdfViewerDirectiveCtrl';

        self.docUrl = null;

        self.excludedPermissions = [];

        self.container = $element[0];

        self.instance = null;

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
                baseUrl: location.protocol + '//' + location.host + '/node_modules/pspdfkit/dist/',
                container: self.container,
                document: typeof self.docUrl === 'object' ? self.docUrl.$$unwrapTrustedValue() : self.docUrl,
                licenseKey: rootEntity.returnRootEntity().rootEntity.psPDFLicenseKey,
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
