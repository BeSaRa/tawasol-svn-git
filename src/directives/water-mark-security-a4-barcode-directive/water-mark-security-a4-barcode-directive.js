module.exports = function (app) {
    require('./water-mark-a4-page-style.scss');
    app.directive('waterMarkSecurityA4BarcodeDirective', function (cmsTemplate, $timeout) {
        'ngInject';
        return {
            restrict: 'E',
            replace: true,
            controller: 'waterMarkSecurityA4BarcodeDirectiveCtrl',
            controllerAs: 'ctrl',
            bindToController: true,
            templateUrl: cmsTemplate.getDirective('water-mark-security-a-4-barcode-directive-template.html'),
            scope: {
                documentSecurity: '=',
                documentSecuritySetting: '='
            },
            link: function (scope, element, attrs, ctrl) {
                var barcodeElement = element.find('.water-mark-barcode'), ratio = 2;


                function setElementPositionFromDocumentSecurity(documentSecurity) {
                    barcodeElement.css({
                        left: setQrCodeLeftPosition(documentSecurity.locationX2D),
                        top: setQrCodeTopPosition(documentSecurity.locationY2D)
                    });
                }

                function setQrCodeLeftPosition(locationX2D) {
                    return locationX2D / ratio;
                }

                function setQrCodeTopPosition(locationY2D) {
                    return (element.height() - (locationY2D / ratio) - barcodeElement.height());
                }

                $timeout(function () {
                    setElementPositionFromDocumentSecurity(ctrl.documentSecurity);
                });

                function setSecurityLocationFromQrCodePosition(position) {
                    var bottom = element.height() - (position.top + barcodeElement.height());
                    $timeout(function () {
                        ctrl.documentSecurity.locationX2D = position.left * ratio;
                        ctrl.documentSecurity.locationY2D = bottom > 0 ? (bottom * ratio) : 0;
                    });
                }

                barcodeElement
                    .draggable({
                        cursor: 'move',
                        containment: 'parent',
                        scroll: false,
                        opacity: 0.2,
                        stop: function (el, ui) {
                            var position = ui.position;
                            setSecurityLocationFromQrCodePosition(position);
                        }
                    });


            }
        }
    });
};