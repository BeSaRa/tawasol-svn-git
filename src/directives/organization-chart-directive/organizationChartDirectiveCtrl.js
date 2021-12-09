module.exports = function (app) {
    app.controller('organizationChartDirectiveCtrl', function ($element,
                                                               $compile,
                                                               $timeout,
                                                               $scope,
                                                               rootEntity,
                                                               $rootScope,
                                                               LangWatcher,
                                                               organizationChartService,
                                                               organizationService) {
        'ngInject';
        var self = this;
        self.controllerName = 'organizationChartDirectiveCtrl';
        $scope.nodeList = [];
        self.organizations = [];
        $scope.orgChart = null;

        LangWatcher($scope);

        self.toggleHide = function (index) {
            // console.log($scope.nodeList[index]);
        };

        self.render = function (nodes) {
            $scope.nodeList = [];
            $element.css({
                direction: 'ltr'
            });
            $element.html('');
            $element.append(angular.element('<div/>', {style: 'text-align:center'}));
            // console.log("NODES", nodes);
            // // set the nodes to bind it later  with the orgChat directive.
            // nodes = organizationChartService.createHierarchy(nodes);
            // add fake root entity organization;
            var root = angular.copy(rootEntity.returnRootEntity().rootEntity);
            root.children = nodes;
            root.itIsRoot = true;
            root.isFnSynched = true;
            root.manageable = true;

            $timeout(function () {
                $scope.orgChart = $($element.children()).orgchart({
                    data: root,
                    pan: true,
                    nodeContent: 'enName',
                    nodeTitle: 'arName',
                    zoom: true,
                    nodeID: 'id',
                    toggleSiblingsResp: true,
                    createNode: function ($node, data) {
                        angular.element($node).toggleClass('need-sync', (!data.isFnSynched));
                        if (!$scope.hasOwnProperty('nodeList'))
                            $scope.nodeList = [];

                        //$node.find('i').remove(); // remove all i tags

                        var index = $scope.nodeList.push(data) - 1;
                        var nodeId = data.id;

                        var organizationMenuDirective = angular
                            .element('<organization-menu-directive>', {
                                id: 'node-' + nodeId,
                                node: 'nodeList[' + index + ']',
                                'org-chart': 'orgChart',
                                'reload-callback': 'orgCtrl.reloadCallback()'
                            });

                        var title = angular.element('<span />');
                        title.html('{{nodeList[' + index + '].arName}}');

                        var archive = angular.element('<div tooltip="{{lang.has_archive}}" />', {class: 'node-has-archive'});
                        archive.append(angular.element('<md-icon md-svg-icon="archive"></md-icon>'));

                        var inbox = angular.element('<div  tooltip="{{lang.has_registry}}" />', {class: 'node-has-inbox'});
                        inbox.append(angular.element('<md-icon md-svg-icon="inbox"></md-icon>'));

                        var inboxWithPrivateRegistry = angular.element('<div  tooltip="{{lang.private_registry}}" />', {class: 'node-has-inbox'});
                        inboxWithPrivateRegistry.append(angular.element('<md-icon md-svg-icon="inbox" class="red-text"></md-icon>'));

                        var iconsWrapper = angular.element('<div layout="row" layout-align="center center"  />', {class: 'node-icon-wrapper'});

                        var synced = angular.element('<div tooltip="{{lang.organization_not_synced}}" />', {class: 'node-need-sync'});
                        synced.append(angular.element('<md-icon md-svg-icon="sync-alert"></md-icon>'));

                        if (data.hasRegistry) {
                            if (data.isPrivateRegistry) {
                                iconsWrapper.append(inboxWithPrivateRegistry);
                            } else {
                                iconsWrapper.append(inbox);
                            }
                        }

                        if (data.centralArchive)
                            iconsWrapper.append(archive);

                        if (!data.isFnSynched) {
                            iconsWrapper.append(synced);
                            organizationMenuDirective = '';
                        }

                        if (!data.manageable) {
                            organizationMenuDirective = '';
                        }


                        $node
                            .toggleClass('filtered', !!data.filtered)
                            .toggleClass('deactivated', !data.status)
                            .find('.title')
                            .attr('layout', 'row')
                            .attr('layout-align', 'center center')
                            .html('') // empty node from anything
                            .append(title)
                            .append(organizationMenuDirective)
                            .end()
                            .find('.content')
                            .attr('layout', 'row')
                            .attr('layout-align', 'center center');


                        if (data.hasRegistry || data.centralArchive || !data.isFnSynched) {
                            $node.append(iconsWrapper);
                        }
                        $compile($node)($scope);
                    }
                });
            }, 500);
        };

        $timeout(function () {
            self.render(self.organizations);
        });

        $scope.$watch(function () {
            return self.organizations;
        }, function () {
            self.render(self.organizations);
        });

    });
};
