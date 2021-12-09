module.exports = function (app) {
    require('./document-security-co-ordinates-style.scss');
    app.directive('documentSecurityCoOrdinatesDirective', function ($timeout,
                                                                    toast,
                                                                    cmsTemplate,
                                                                    langService,
                                                                    $q) {
        'ngInject';
        return {
            templateUrl: cmsTemplate.getDirective('document-security-co-ordinate-template.html'),
            controller: 'documentSecurityCoOrdinatesDirectiveCtrl',
            controllerAs: 'ctrl',
            bindToController: true,
            scope: {
                globalSetting: '=',
                documentSecurity: '=',
                documentSecuritySetting: '='
            },
            link: function (scope, element, attrs) {
                element = angular.element(element[0].querySelector('#barcode-box'));
                var defer = null, newTop, newLeft;

                var documentSecurityPage = scope.ctrl.documentSecurityPage,
                    calculatedPageDimensions = documentSecurityPage.getCalculatedDimensions(),
                    barcodeBox = scope.ctrl.documentSecurityBarcodeBox,
                    barcodeBoxDimensions = barcodeBox.getCalculatedDimensions();

                if (element) {
                    element.draggable({
                        containment: "#co-ordinates-container",
                        scroll: false,
                        opacity: 0.2,
                        cursor: 'move',
                        stop: function (event, ui) {
                            $timeout(function () {
                                defer.promise.then(function (result) {
                                    newTop = ui.position.top < 0 ? 0 : ui.position.top;
                                    newLeft = ui.position.left < 0 ? 0 : ui.position.left;
                                    newTop = (calculatedPageDimensions.height - (newTop + barcodeBoxDimensions.height));
                                    var updatedDimensions = barcodeBox.calculatePositionsAndDimensions(false, newTop, newLeft, false);
                                    scope.ctrl.documentSecurity.locationX2D = Math.round(updatedDimensions.left);
                                    scope.ctrl.documentSecurity.locationY2D = Math.round(updatedDimensions.top);
                                }).catch(function (error) {
                                    toast.info(langService.get('can_not_reposition_disabled_2D'));
                                });
                            });
                        },
                        revert: function () {
                            defer = $q.defer();
                            if (scope.ctrl.documentSecuritySetting.status2D) {
                                defer.resolve('enabled');
                                return false;
                            }
                            else {
                                defer.reject('disabled');
                                return true;
                            }
                        },
                        revertDuration: 200
                    })
                }

                $timeout(function () {
                    scope.$watch(function () {
                        return scope.ctrl.documentSecuritySetting.textOrientation;
                    }, function (oldValue, newValue) {
                        if ((oldValue !== newValue)) {
                            scope.ctrl.makeDocumentSecurityCopy();
                            scope.ctrl.getWatermarkTextClass();
                            scope.ctrl.getWatermarkTextStyle();
                        }
                    });
                    scope.$watch(function () {
                        return scope.ctrl.documentSecuritySetting.textSize;
                    }, function (oldValue, newValue) {
                        if ((oldValue !== newValue)) {
                            scope.ctrl.makeDocumentSecurityCopy();
                            scope.ctrl.getWatermarkTextClass();
                            scope.ctrl.getWatermarkTextStyle();
                        }
                    });
                    scope.$watch(function () {
                        return scope.ctrl.documentSecurity.opacity;
                    }, function (oldValue, newValue) {
                        if ((oldValue !== newValue)) {
                            scope.ctrl.makeDocumentSecurityCopy();
                            scope.ctrl.getWatermarkTextClass();
                            scope.ctrl.getWatermarkTextStyle();
                        }
                    });
                })
            }
        }
    })
};
