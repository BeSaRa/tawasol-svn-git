(function (app) {
    app.directive('iconsDirective', function (iconService) {
        'ngInject';
        return {
            restrict: 'E',
            template: "<div layout='column'>" +
            "<textarea id='copy-text'></textarea>" +
            "<md-input-container flex>" +
            "<label>Search</label>" +
            "<input type='text' id='search-changed' ng-model='keyword'> " +
            "</md-input-container>" +
            "<div layout='row'><md-icon id='code-icon' md-svg-icon='{{selected}}'></md-icon><code flex>&lt;md-icon md-svg-icon=&quot;<span id='name'>{{selected}}</span>&quot;&gt;&lt;/md-icon&gt;</code></div>" +
            "<div id='icons-list'></div>" +
            "</div>",
            controller: function ($scope, iconService, $element, $compile, $filter, menuService) {
                var wrapper = $element.find('#icons-list');
                var list = _.chunk(iconService.getIcons(), 6);
                var input = $element.find('#search-changed');
                var textarea = $element.find('#copy-text');
                $scope.selected = 'account';

                $scope.search = function (text) {
                    var searchList = $filter('filter')(iconService.getIcons(), text);
                    $scope.render(_.chunk(searchList, 6));
                };

                $scope.setCodeIcon = function (icon) {
                    $scope.selected = icon;
                };

                $scope.createIcon = function (icon) {
                    return '<md-icon class="md-icon-class" ng-dblclick="copy(\'' + icon.name + '\')" ng-click="setIconTo(\'' + icon.name + '\')" md-svg-icon="' + icon.name + '"></md-icon>'
                };

                $scope.insertRow = function (row) {
                    var rowDom = angular.element('<div />', {layout: 'row', class: 'row-in-layout'});
                    for (var i = 0; i < row.length; i++) {
                        rowDom.append($scope.createIcon(row[i]));
                    }
                    return rowDom;
                };
                $scope.render = function (list) {
                    wrapper.empty();
                    for (var i = 0; i < list.length; i++) {
                        wrapper.append($scope.insertRow(list[i]));
                    }
                    $compile(wrapper)($scope);
                };
                $scope.setIconTo = function (iconName) {
                    $scope.setCodeIcon(iconName);
                };
                $scope.setSelectedIcon = function (text) {
                    if (!menuService.hasSelectedItem())
                        return null;

                    menuService.setSelectedItemIcon(text).then(function () {
                        menuService.loadMenus();
                    })

                };
                $scope.copy = function (text) {
                    var copyFrom = document.createElement('textarea');
                    copyFrom.setAttribute("style", "position:fixed;opacity:0;top:100px;left:100px;");
                    copyFrom.value = text;
                    document.body.appendChild(copyFrom);
                    copyFrom.select();
                    document.execCommand('copy');
                    var copied = document.createElement('div');
                    copied.setAttribute('class', 'copied');
                    copied.appendChild(document.createTextNode('Copied to Clipboard'));
                    document.body.appendChild(copied);
                    setTimeout(function () {
                        document.body.removeChild(copyFrom);
                        document.body.removeChild(copied);
                    }, 1500);

                    $scope.setSelectedIcon(text);
                };
                $scope.render(list);

                input.on('input', function () {
                    $scope.search(this.value);
                })
            }
        }
    })
})(app);