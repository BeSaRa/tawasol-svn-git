module.exports = function (app) {
    app.config(function ($provide) {
        'ngInject';
        $provide.decorator('$mdColorPicker', ['$delegate', '$mdDialog', 'mdColorPickerHistory', function ($delegate, $mdDialog, colorHistory) {
            var dialog;
            return {
                show: function (options) {
                    if (options === undefined) {
                        options = {};
                    }
                    //console.log( 'DIALOG OPTIONS', options );
                    // Defaults
                    // Dialog Properties
                    options.hasBackdrop = options.hasBackdrop === undefined ? true : options.hasBackdrop;
                    options.clickOutsideToClose = options.clickOutsideToClose === undefined ? true : options.clickOutsideToClose;
                    options.defaultValue = options.defaultValue === undefined ? '#FFFFFF' : options.defaultValue;
                    options.focusOnOpen = options.focusOnOpen === undefined ? false : options.focusOnOpen;
                    options.preserveScope = options.preserveScope === undefined ? true : options.preserveScope;
                    options.skipHide = options.skipHide === undefined ? true : options.skipHide;

                    // mdColorPicker Properties
                    options.mdColorAlphaChannel = options.mdColorAlphaChannel === undefined ? false : options.mdColorAlphaChannel;
                    options.mdColorSpectrum = options.mdColorSpectrum === undefined ? true : options.mdColorSpectrum;
                    options.mdColorSliders = options.mdColorSliders === undefined ? true : options.mdColorSliders;
                    options.mdColorGenericPalette = options.mdColorGenericPalette === undefined ? true : options.mdColorGenericPalette;
                    options.mdColorMaterialPalette = options.mdColorMaterialPalette === undefined ? true : options.mdColorMaterialPalette;
                    options.mdColorHistory = options.mdColorHistory === undefined ? true : options.mdColorHistory;


                    dialog = $mdDialog.show({
                        multiple: true,
                        templateUrl: 'mdColorPickerDialog.tpl.html',
                        hasBackdrop: options.hasBackdrop,
                        clickOutsideToClose: options.clickOutsideToClose,

                        controller: ['$scope', 'options', function ($scope, options) {
                            //console.log( "DIALOG CONTROLLER OPEN", Date.now() - dateClick );
                            $scope.close = function close() {
                                $mdDialog.cancel();
                            };
                            $scope.ok = function ok() {
                                $mdDialog.hide($scope.value);
                            };
                            $scope.hide = $scope.ok;


                            $scope.value = options.value;
                            $scope.default = options.defaultValue;
                            $scope.random = options.random;

                            $scope.mdColorAlphaChannel = options.mdColorAlphaChannel;
                            $scope.mdColorSpectrum = options.mdColorSpectrum;
                            $scope.mdColorSliders = options.mdColorSliders;
                            $scope.mdColorGenericPalette = options.mdColorGenericPalette;
                            $scope.mdColorMaterialPalette = options.mdColorMaterialPalette;
                            $scope.mdColorHistory = options.mdColorHistory;
                            $scope.mdColorDefaultTab = options.mdColorDefaultTab;

                        }],

                        locals: {
                            options: options
                        },
                        preserveScope: options.preserveScope,
                        skipHide: options.skipHide,

                        targetEvent: options.$event,
                        focusOnOpen: options.focusOnOpen,
                        autoWrap: false,
                        onShowing: function () {
                            //		console.log( "DIALOG OPEN START", Date.now() - dateClick );
                        },
                        onComplete: function () {
                            //		console.log( "DIALOG OPEN COMPLETE", Date.now() - dateClick );
                        }
                    });

                    dialog.then(function (value) {
                        colorHistory.add(new tinycolor(value));
                    }, function () {
                    });

                    return dialog;
                },
                hide: function () {
                    return dialog.hide();
                },
                cancel: function () {
                    return dialog.cancel();
                }
            };
        }])
    })
};