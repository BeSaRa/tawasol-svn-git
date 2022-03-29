module.exports = function (app) {
    app.controller('personalWidgetCtrl', function ($scope, langService, $timeout, LayoutWidgetOption, followUpUserService, printService) {
        'ngInject';
        var self = this;
        self.controllerName = 'personalWidgetCtrl';

        self.options = angular.extend({
            arName: new LayoutWidgetOption({
                optionValue: langService.getKey('personal_widget_chart', 'ar'),
                optionKey: 'arName'
            }),
            enName: new LayoutWidgetOption({
                optionValue: langService.getKey('personal_widget_chart', 'en'),
                optionKey: 'enName'
            })
        }, $scope.options);

        self.hideLabel = false;

        self.model = angular.copy(self.options);

        self.loaded = false;
        self.data = [];

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
                    .setInCaseOfEmptyValue(langService.get('bar_chart'))
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

        self.$onInit = function () {
            self.reload();
        }

        self.reload = function () {
            self.loaded = false;
            followUpUserService.loadPersonalFollowupChartData()
                .then((data) => {
                    self.loaded = true;
                    self.data = data;
                })
                .catch(function () {
                    self.loaded = true;
                })
        }

        self.print = function () {
            var printTitle = langService.get('personal_widget_chart'),
                headers = [
                    'arabic_folder_name',
                    'english_folder_name',
                    'count'
                ];
            printService
                .printData(self.data, headers, printTitle);
        }

    });
};
