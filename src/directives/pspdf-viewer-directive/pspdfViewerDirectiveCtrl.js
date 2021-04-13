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
            PSPDFKit.load({
                baseUrl: (location.protocol + '//' + location.host + '/' + (configurationService.APP_CONTEXT ? configurationService.APP_CONTEXT + '/' : '')),
                container: self.container,
                printMode: PSPDFKit.PrintMode.EXPORT_PDF,
                toolbarItems: PSPDFKit.defaultToolbarItems.concat(bookmarkButton),
                document: typeof self.docUrl === 'object' ? self.docUrl.$$unwrapTrustedValue() : self.docUrl,
                licenseKey: configurationService.PSPDF_LICENSE_KEY ? configurationService.PSPDF_LICENSE_KEY : self.licenseKey,
                initialViewState: initialViewState
            }).then(function (instance) {
                self.instance = instance;

                if (self.correspondence && self.correspondence.highlights) {
                    self.createHighlights(self.correspondence.highlights);
                }
            });
        };

        self.createHighlights = function (highlights) {
            if (!highlights.length)
                return;

            var annotations = highlights.map(item => {
                var list = PSPDFKit.Immutable.List(self.getReactsFromPercentage(item));
                return new PSPDFKit.Annotations.HighlightAnnotation({
                    pageIndex: item.pageIndex,
                    rects: list,
                    boundingBox: PSPDFKit.Geometry.Rect.union(list)
                });
            });

            self.instance.create(annotations).then(function (list) {
                console.log('list', list);
            });
        }

        self.getReactsFromPercentage = function (highlight) {
            var page = self.instance.pageInfoForIndex(highlight.pageIndex);
            return PSPDFKit.Immutable.List(highlight.reacts.map(function (item) {
                return new PSPDFKit.Geometry.Rect({
                    left: (item.left * page.width) / 100,
                    top: (item.top * page.height) / 100,
                    width: (item.width * page.width) / 100,
                    height: (item.height * page.height) / 100
                })
            }));
        }

        self.$onInit = function () {
            $timeout(function () {
                self.renderViewer();
            });
        }
    });
};
