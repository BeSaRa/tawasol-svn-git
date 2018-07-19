module.exports = function (app) {
    require('./document-security-co-ordinates-style.scss');
    app.directive('documentSecurityCoOrdinatesDirective', function ($timeout,
                                                                    toast,
                                                                    langService,
                                                                    $q) {
        'ngInject';
        return {
            template: require('./document-security-co-ordinate-template.html'),
            controller: 'documentSecurityCoOrdinatesDirectiveCtrl',
            controllerAs: 'ctrl',
            bindToController: true,
            scope: {
                globalSetting: '=',
                documentSecurity: '=',
                documentSecuritySetting: '=',
                barcodeSpecs: '=',
                barcodeSpecsMethod: '='
            },
            link: function (scope, element, attrs) {
                element = angular.element(element[0].querySelector('#barcode-box'));
                var pageSpecs = scope.ctrl.barcodeSpecs.pageSettings,
                    barcodeSize = scope.ctrl.barcodeSpecs.barcodeSize,
                    barcodeSizeSpecs = scope.ctrl.barcodeSpecs.barcodeSizePx,
                    defer = null;

                if (element) {
                    element.draggable({
                        containment: "#co-ordinates-container",
                        scroll: false,
                        opacity: 0.2,
                        cursor: 'move',
                        stop: function (event, ui) {
                            $timeout(function () {
                                defer.promise.then(function (result) {
                                    scope.ctrl.documentSecurity.locationX2D = ui.position.left;
                                    scope.ctrl.documentSecurity.locationY2D = pageSpecs.height - (ui.position.top + barcodeSize.height);
                                    scope.ctrl.barcodeSpecsMethod();
                                })
                                    .catch(function (error) {
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

                /*scope.$watch(function () {
                    return scope.ctrl.documentSecuritySetting.status2D;
                }, function (oldValue, newValue) {
                    if (newValue) {

                    }
                    else {

                    }
                })*/
            }
        }
    })
};