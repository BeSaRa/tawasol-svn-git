module.exports = function (app) {
    app.controller('counterWidgetCtrl', function ($element,
                                                  $timeout,
                                                  langService,
                                                  counterService,
                                                  LayoutWidgetOption,
                                                  employeeService,
                                                  $scope) {
        'ngInject';
        var self = this;
        self.controllerName = 'counterWidgetCtrl';
        self.employeeService = employeeService;

        self.colors = [
            'bg-red',
            'bg-blue',
            'bg-orange',
            'bg-purple',
            'bg-green'
        ];

        self.dataSources = [
            {
                id: 1,
                ar: langService.getKey('counter_user_inbox', 'ar'),
                en: langService.getKey('counter_user_inbox', 'en'),
                value: 'userInbox'
            },
            {
                id: 2,
                ar: langService.getKey('counter_outgoing_accepted', 'ar'),
                en: langService.getKey('counter_outgoing_accepted', 'en'),
                value: 'outgoingAccepted'
            },
            {
                id: 3,
                ar: langService.getKey('counter_outgoing_draft', 'ar'),
                en: langService.getKey('counter_outgoing_draft', 'en'),
                value: 'outgoingDraft'
            },
            {
                id: 4,
                ar: langService.getKey('counter_outgoing_prepare', 'ar'),
                en: langService.getKey('counter_outgoing_prepare', 'en'),
                value: 'outgoingPrepare'
            },
            {
                id: 5,
                ar: langService.getKey('counter_outgoing_rejected', 'ar'),
                en: langService.getKey('counter_outgoing_rejected', 'en'),
                value: 'outgoingRejected'
            },
            {
                id: 6,
                ar: langService.getKey('counter_outgoing_export', 'ar'),
                en: langService.getKey('counter_outgoing_export', 'en'),
                value: 'readyToExport'
            }
        ];

        self.defaultColor = 'bg-blue';

        self.options = angular.extend({
            color: new LayoutWidgetOption({
                optionValue: self.defaultColor,
                optionKey: 'color'
            }),
            arName: new LayoutWidgetOption({
                optionValue: langService.getKey('counter_widget', 'ar'),
                optionKey: 'arName'
            }),
            enName: new LayoutWidgetOption({
                optionValue: langService.getKey('counter_widget', 'en'),
                optionKey: 'enName'
            }),
            dataSource: new LayoutWidgetOption({
                optionValue: self.dataSources[0].value,
                optionKey: 'dataSource'
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
            if (!self.employeeService.hasPermissionTo('LANDING_PAGE'))
                return false;
            self.hideLabel = true;
            $timeout(function () {
                $('#title-' + $scope.widget.id).focus();
            })
        };

        self.onLabelBlur = function () {
            _updateModel(true);
            self.hideLabel = false;
        };

        self.counter = {
            from: 0,
            to: counterService.counter[currentDataSource()].first,
            update: true
        };

        function currentDataSource() {
            return self.options.dataSource.optionValue;
        }

        function _setCountTo(count) {
            self.counter = null;
            self.counter = {
                from: 0,
                to: count
            };
        }

        self.onLabelKeyPress = function ($event) {
            var code = $event.keyCode || $event.which;
            if (code === 13) {
                self.options[langService.current + 'Name']
                    .setLayoutWidgetId($scope.widget)
                    .setInCaseOfEmptyValue(langService.get('counter_widget'))
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

        self.setCurrentSelectedColor = function (color) {
            self.options
                .color
                .setLayoutWidgetId($scope.widget)
                .setOptionValue(color)
                .save()
                .then(function () {
                    var removed = _.filter(self.colors, function (item) {
                        return item !== color;
                    });
                    $element.addClass(color).removeClass(removed.join(' '));
                });
        };

        self.setCurrentSelectedDataSource = function (source) {
            self.options
                .dataSource
                .setLayoutWidgetId($scope.widget)
                .setOptionValue(source.value)
                .save()
                .then(function () {
                    self.reloadCounter();
                })

        };

        self.reloadCounter = function () {
            counterService
                .loadCounters()
                .then(function (result) {
                    _setCountTo(result[self.options.dataSource.optionValue]);
                })
        };

        self.removeCounter = function () {
            $scope.widget
                .delete()
                .then(function () {
                    $($scope.widget.getWidgetTagId('#')).remove()
                })
        }

    });
};
