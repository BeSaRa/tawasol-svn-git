module.exports = function (app) {
    app.controller('organizationChartDirectiveCtrl', function ($element,
                                                               $compile,
                                                               $timeout,
                                                               $scope,
                                                               rootEntity,
                                                               $rootScope,
                                                               organizationChartService,
                                                               organizationService) {
        'ngInject';
        var self = this;
        self.controllerName = 'organizationChartDirectiveCtrl';
        $scope.nodeList = [];
        self.organizations = [];

        self.resetView = function () {
            $element.find('.orgchart').css('transform', '');
        };

        self.toggleHide = function (index) {
            console.log($scope.nodeList[index]);
        };

        self.render = function (nodes) {
            $scope.nodeList = [];
            $element.css({
                direction: 'ltr'
            });
            $element.empty();
            $element.append(angular.element('<div/>', {style: 'text-align:center'}));
            // console.log("NODES", nodes);
            // // set the nodes to bind it later  with the orgChat directive.
            // nodes = organizationChartService.createHierarchy(nodes);
            // add fake root entity organization;
            var root = angular.copy(rootEntity.returnRootEntity().rootEntity);
            root.children = nodes;
            root.itIsRoot = true;
            $timeout(function () {
                $($element.children()).orgchart({
                    data: root,
                    pan: true,
                    nodeContent: 'enName',
                    nodeTitle: 'arName',
                    zoom: true,
                    toggleSiblingsResp: true,
                    createNode: function ($node, data) {
                        if (!$scope.hasOwnProperty('nodeList'))
                            $scope.nodeList = [];

                        //$node.find('i').remove(); // remove all i tags

                        var index = $scope.nodeList.push(data) - 1;
                        var nodeId = data.id;

                        var organizationMenuDirective = angular
                            .element('<organization-menu-directive>', {
                                id: 'node-' + nodeId,
                                node: 'nodeList[' + index + ']'
                            });

                        var title = angular.element('<span />');
                        title.html('{{nodeList[' + index + '].arName}}');

                        var archive = angular.element('<div tooltip="{{lang.has_archive}}" />', {class: 'node-has-archive'});
                        archive.append(angular.element('<md-icon md-svg-icon="archive"></md-icon>'));

                        var inbox = angular.element('<div  tooltip="{{lang.has_registry}}" />', {class: 'node-has-inbox'});
                        inbox.append(angular.element('<md-icon md-svg-icon="inbox"></md-icon>'));

                        var iconsWrapper = angular.element('<div layout="row" layout-align="center center"  />', {class: 'node-icon-wrapper'});

                        if (data.hasRegistry)
                            iconsWrapper.append(inbox);

                        if (data.centralArchive)
                            iconsWrapper.append(archive);


                        $node
                            .find('.title')
                            .attr('layout', 'row')
                            .attr('layout-align', 'center center')
                            .html('')
                            .append(title)
                            .append(organizationMenuDirective)
                            .end()
                            .find('.content')
                            .attr('layout', 'row')
                            .attr('layout-align', 'center center');

                        if (data.hasRegistry || data.centralArchive) {
                            $node.append(iconsWrapper);
                        }

                        $compile($node.attr('ng-click', 'orgCtrl.editNode(' + index + ')'))($scope);
                    }
                });
            }, 500);
        };

        $timeout(function () {
            self.render(self.organizations);
        });

        $scope.$watch(function () {
            return self.organizations;
        }, function (value) {
            self.render(self.organizations);
        });

    });
};