module.exports = function (app) {
    app.controller('pspdfViewerDirectiveCtrl', function (PSPDFKit, PDFService, configurationService, rootEntity, employeeService, $timeout, $element, downloadService) {
        'ngInject';
        var self = this;
        self.controllerName = 'pspdfViewerDirectiveCtrl';

        self.docUrl = null;

        self.excludedPermissions = [];

        self.container = $element[0];

        self.instance = null;

        self.licenseKey = rootEntity.returnRootEntity().rootEntity.psPDFLicenseKey;

        var bookmarkButton = {
            type: "custom",
            id: "bookmark-shortcut",
            title: "Export",
            icon: "./assets/images/bookmark.svg",
            onPress: function () {
                self.instance.setViewState((state) => {
                    return state.set('sidebarMode', PSPDFKit.SidebarMode.BOOKMARKS);
                });
            }
        };

        self.destroyInstance = function () {
            try {
                PSPDFKit.unload(self.container)
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

            var configuration = {
                baseUrl: (location.protocol + '//' + location.host + '/' + (configurationService.APP_CONTEXT ? configurationService.APP_CONTEXT + '/' : '')),
                container: self.container,
                printMode: PSPDFKit.PrintMode.EXPORT_PDF,
                toolbarItems: PSPDFKit.defaultToolbarItems.concat(bookmarkButton),
                document: typeof self.docUrl === 'object' ? self.docUrl.$$unwrapTrustedValue() : self.docUrl,
                licenseKey: configurationService.PSPDF_LICENSE_KEY ? configurationService.PSPDF_LICENSE_KEY : self.licenseKey,
                initialViewState: initialViewState,
                customFonts: PDFService.customFonts,
                isAPStreamRendered: () => false
            }

            if (configurationService.PSPDF_LICENSE_KEY) {
                delete configuration.licenseKey;
            }

            PSPDFKit.load(configuration).then(function (instance) {
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
