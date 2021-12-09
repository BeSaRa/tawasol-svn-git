module.exports = function (app) {
    app.controller('pieChartWidgetCtrl', function ($scope, langService, $timeout, LayoutWidgetOption) {
        'ngInject';
        var self = this;
        self.controllerName = 'pieChartWidgetCtrl';

        self.options = angular.extend({
            arName: new LayoutWidgetOption({
                optionValue: langService.getKey('pie_chart', 'ar'),
                optionKey: 'arName'
            }),
            enName: new LayoutWidgetOption({
                optionValue: langService.getKey('pie_chart', 'en'),
                optionKey: 'enName'
            })
        }, $scope.options);

        self.hideLabel = false;

        self.model = angular.copy(self.options);

        function _updateModel(reverse) {
            if (!reverse)
                self.model = angular.copy(self.options);
            else
                self.options = angular.copy(self.model);
        }

        self.onHideLabel = function () {
            self.hideLabel = true;
            $timeout(function () {
                $('#title-' + $scope.widget.id).focus();
            })
        };

        self.onLabelBlur = function () {
            _updateModel(true);
            self.hideLabel = false;
        };

        self.onLabelKeyPress = function ($event) {
            var code = $event.keyCode || $event.which;
            if (code === 13) {
                self.options[langService.current + 'Name']
                    .setLayoutWidgetId($scope.widget)
                    .setInCaseOfEmptyValue(langService.get('pie_chart'))
                    .save()
                    .then(function () {
                        _updateModel();
                        self.hideLabel = false;
                    })
            } else if (code === 27) {
                _updateModel(true);
                self.hideLabel = false;
            }

        };

    });
};