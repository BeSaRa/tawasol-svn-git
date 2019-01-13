module.exports = function (app) {
    app.controller('urlParserDirectiveCtrl', function (LangWatcher, langService, dialog, lookupService, $timeout, $scope) {
        'ngInject';
        var self = this;
        self.controllerName = 'urlParserDirectiveCtrl';
        LangWatcher($scope);
        self.dynamicMenuItem = null;
        self.scanning = false;
        self.scannedVariables = [];

        self.availableDynamicMenuItemParams = lookupService.returnLookups(lookupService.menuItemParam);

        function _scanURL() {
            self.dynamicMenuItem
                .scanURLVariablesCatchDuplicate()
                .then(function (result) {
                    self.scannedVariables = result;
                    self.dynamicMenuItem.removeUnusedParsedURLParams();
                })
                .catch(function (duplicatedVariables) {
                    dialog.errorMessage(langService.get('url_variables_duplicated').change({variables: duplicatedVariables.join(', ')}));
                });
            self.scanning = false;
        }

        self.scanURL = function (timeout) {
            self.scanning = true;
            timeout ? $timeout(function () {
                _scanURL();
            }, 1000) : _scanURL();
        };

        self.hasVariable = function (variableName) {
            return self.dynamicMenuItem.parsedURLParams.hasOwnProperty(variableName) && self.dynamicMenuItem.parsedURLParams[variableName];
        };

        self.deleteVariableValue = function (variableName) {
            self.dynamicMenuItem.parsedURLParams[variableName] = null;
        };

        self.getVariableValue = function (variableName) {
            return self.dynamicMenuItem.parsedURLParams[variableName];
        };

        self.setVariableValue = function (variableName, value) {
            self.dynamicMenuItem.parsedURLParams[variableName] = value;
        };


        $timeout(function () {
            self.dynamicMenuItem.parseURLParams();
            self.scanURL(false);
        })


    });

};
