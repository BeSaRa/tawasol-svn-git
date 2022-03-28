module.exports = function (app) {
    app.controller('managerWidgetCtrl', function ($scope,
                                                  langService,
                                                  employeeService,
                                                  $timeout,
                                                  LayoutWidgetOption,
                                                  organizationService,
                                                  followUpUserService,
                                                  printService,
                                                  _) {
        'ngInject';
        var self = this;
        self.controllerName = 'managerWidgetCtrl';

        self.options = angular.extend({
            arName: new LayoutWidgetOption({
                optionValue: langService.getKey('employees_followups', 'ar'),
                optionKey: 'arName'
            }),
            enName: new LayoutWidgetOption({
                optionValue: langService.getKey('employees_followups', 'en'),
                optionKey: 'enName'
            }),
            selectedOrganization: new LayoutWidgetOption({
                optionValue: 0,
                optionKey: 'selectedOrganization'
            })
        }, $scope.options);

        self.hideLabel = false;

        self.model = angular.copy(self.options);

        self.loaded = false;

        self.data = [];

        self.organizations = [];

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
            self.loadOrganizations()
        }

        self.selectOrganization = function (organization) {
            self.options.selectedOrganization
                .setLayoutWidgetId($scope.widget)
                .setOptionValue(organization.id)
                .setInCaseOfEmptyValue(employeeService.getEmployee().getOUID())
                .save()
                .then(function () {
                    _updateModel();
                    self.selected = organization;
                    self.loadFollowupForSelectedOrganization();
                })
        }

        self.loadOrganizations = function () {
            organizationService
                .getFollowUpOrganizations()
                .then((organizations) => {
                    var ids = organizations.map(org => org.id)
                    self.organizations = organizations.filter(({id}, index) => !ids.includes(id, index + 1))
                    self.selected = organizations.find(item => item.id === Number(self.options.selectedOrganization.optionValue || employeeService.getEmployee().getOUID()));
                    return self.selected;
                })
                .then(function () {
                    self.loadFollowupForSelectedOrganization()
                })
        }

        self.loadFollowupForSelectedOrganization = function () {
            if (!this.selected) {
                return;
            }
            self.loaded = false;
            followUpUserService.loadEmployeesFollowupChartData(this.selected.id)
                .then(function (result) {
                    self.data = result;
                    self.loaded = true;
                })
                .catch(function () {
                    self.loaded = true;
                })
        }

        self.reload = function () {
            if (!this.selected) {
                return;
            }
            self.loadFollowupForSelectedOrganization();
        }

        self.print = function () {
            var printTitle = langService.get('employees_followups') + ' - ' + self.selected.getTranslatedName(),
                headers = [
                    'arabic_full_name',
                    'english_full_name',
                    'count'
                ];
            printService
                .printData(self.data, headers, printTitle);
        }

    });
};
