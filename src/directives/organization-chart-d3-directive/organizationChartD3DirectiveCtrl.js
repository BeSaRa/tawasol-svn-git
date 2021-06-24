module.exports = function (app) {
    app.controller('organizationChartD3DirectiveCtrl', function ($element, employeeService, LangWatcher, $scope, cmsTemplate, $mdPanel, generator, langService, $timeout, rootEntity, organizationService, d3) {
        'ngInject';

        var self = this;
        self.controllerName = 'organizationChartD3DirectiveCtrl';
        LangWatcher($scope);
        // organizations
        self.rootEntity = angular.copy(rootEntity.returnRootEntity().rootEntity);
        // to make it as root
        self.rootEntity.id = -1;
        self.rootEntity.parent = '';
        // we will use it later
        self.rootEntity.itIsRoot = true;
        self.rootEntity.isFnSynched = true;
        self.rootEntity.manageable = true;
        self.nodes = [];
        self.selectedNode = null;
        self.nodesIds = [];
        // zoom Listener
        self.zoomListener = d3.zoom().scaleExtent([.1, 5]).on('zoom', function () {
            self.mainGroup.attr('transform', d3.event.transform);
        });
        // catch svg element
        self.svg = d3.select($element[0]).select('svg').call(self.zoomListener).style('background-color', '#EEE');
        // create main group to zoom in/out
        self.mainGroup = self.svg.append('g');
        // node size
        self.nodeSize = [60, 350];
        // tree
        self.tree = d3.tree().nodeSize(self.nodeSize);
        // group of links
        self.glink = self.mainGroup.append('g').attr('id', 'link-group').attr('stroke', '#CCC').attr('stroke-width', 4).attr('fill', 'none');
        // group of nodes
        self.gNode = self.mainGroup.append('g').attr('id', 'node-group');
        // the date structure to draw
        self.root = _prepareOrganizations();

        // the diagonal to draw the links between nodes
        self.diagonal = d3.linkHorizontal().x(function (d) {
            return d.y;
        }).y(function (d) {
            return d.x;
        });
        var duration = 750;
        var transition = d3.transition().duration(duration);

        var Node = d3.hierarchy.prototype.constructor;
        var tooltip = d3.select("body")
            .append("div")
            .attr("class", "d3-tooltip")
            .style("opacity", 0);


        function renderNewNode(ou, node) {
            var newNode = new Node(ou);
            newNode.parent = node;
            newNode.depth = (node.depth + 1);
            if (node._children) {
                node.children = node._children;
            }

            if (!node.children) {
                node.children = [];
            }
            node.children.push(newNode);
            self.render(node);
        }

        function _updateNodes(node) {
            self.root = _prepareOrganizations();
            self.root.eachBefore(function (node) {
                node.class = self.nodesIds.indexOf(node.id) !== -1 ? 'found' : null;
            });
            self.collapseAllNotFound(self.root);
            self.clearAll(self.root);
            self.render(self.root);

            if (node) self.centerNode(node);
        }

        function _prepareOrganizations() {
            var organizations = angular.copy(organizationService.allOrganizationsStructureView).map(function (item) {
                item.parent = item.parent ? item.parent : -1;
                return item;
            });

            organizations.push(self.rootEntity);
            self.nodes = organizations.map(function (item) {
                return {
                    ar: item.arName,
                    en: item.enName,
                    id: item.id
                }
            });
            return d3.stratify()
                .id(function (d) {
                    return d.id;
                })
                .parentId(function (d) {
                    return d.parent ? d.parent : '';
                })(organizations);
        }

        function _getViewPortWidth() {
            return angular.element('svg#organization-chart-svg').width();
        }

        function _getViewPortHeight() {
            return angular.element('svg#organization-chart-svg').height();
        }

        function _getViewPort(property) {
            return eval('_getViewPort' + generator.ucFirst(property) + '()');
        }

        function triggerDownload(imgURI) {
            var evt = new MouseEvent('click', {
                view: window,
                bubbles: false,
                cancelable: true
            });

            var a = document.createElement('a');
            a.setAttribute('download', 'Chart.svg');
            a.setAttribute('href', imgURI);
            a.setAttribute('target', '_blank');
            a.dispatchEvent(evt);
        }

        self.render = function (source) {
            self.root.eachBefore(function (d) {
                d.name = d.data[langService.current + 'Name'];
            });
            var nodes = self.root.descendants().reverse();
            var links = self.root.links();
            // compute tree layout
            self.tree(self.root);
            // update nodes
            var node = self.gNode.selectAll('g').data(nodes, function (d) {
                return d.id;
            });


            var nodeEnter = node.enter().append("g")
                .attr("class", "node")
                .attr('id', (d) => d.id)
                .attr("transform", function () {
                    return 'translate(' + source.y0 + ',' + source.x0 + ')';
                })
                .attr("fill-opacity", 0)
                .attr("stroke-opacity", 0);

            nodeEnter.append('circle')
                .attr('class', 'nodeCircle')
                .attr("r", 20)
                .style('stroke', 'steelblue')
                .style("fill", function (d) {
                    return d._children && d._children.length ? "lightsteelblue" : "#fff";
                })
                .style("cursor", function (d) {
                    return (d.children && d.children.length) || (d._children && d._children.length) ? 'pointer' : 'default';
                })
                .on('click', function (node) {
                    self.toggleNode(node);
                })
                .on('contextmenu', function (node) {
                    self.openRightClickMenu(node);
                });

            nodeEnter
                .append('path')
                .attr('class', 'indicators manageable')
                .attr('transform', function (d) {
                    return 'translate(-9,-12)';
                })
                .attr('d', function (d) {
                    var check = 'M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z';
                    return !d.data.itIsRoot ? (d.data.manageable ? check : '') : employeeService.isSuperAdminUser() ? check : '';
                });

            nodeEnter
                .append('path')
                .attr('class', 'indicators hasRegistry')
                .attr('transform', function (d) {
                    return d._children && d._children.length ? 'translate(20,-12)' : 'translate(-44,-12)';
                })
                .attr('d', function (d) {
                    return d.data.hasRegistry ? 'M19,15H15A3,3 0 0,1 12,18A3,3 0 0,1 9,15H5V5H19M19,3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3Z' : '';
                })
                .on('mouseover', function (d) {
                    tooltip.transition()
                        .duration(200)
                        .style("opacity", 1);

                    tooltip.html(d.data.isPrivateRegistry ? langService.get('private_registry') : langService.get('has_registry'))
                        .style("left", (d3.event.pageX) + "px")
                        .style("top", (d3.event.pageY - 28) + "px");
                })
                .on('mouseout', function () {
                    tooltip.transition()
                        .duration(200)
                        .style("opacity", 0);
                });

            nodeEnter
                .append('path')
                .attr('class', 'indicators centralArchive')
                .attr('transform', function (d) {
                    var xChild = !d.data.hasRegistry ? 20 : 40;
                    var xNoChild = !d.data.hasRegistry ? -44 : -88;
                    return (d._children && d._children.length ? 'translate(' + xChild + ',-12)' : 'translate(' + xNoChild + ',-12)');
                })
                .attr('d', function (d) {
                    return d.data.centralArchive ? 'M3,3H21V7H3V3M4,8H20V21H4V8M9.5,11A0.5,0.5 0 0,0 9,11.5V13H15V11.5A0.5,0.5 0 0,0 14.5,11H9.5Z' : '';
                })
                .on('mouseover', function () {
                    tooltip.transition()
                        .duration(200)
                        .style("opacity", 1);
                    tooltip.html(langService.get('has_archive'))
                        .style("left", (d3.event.pageX) + "px")
                        .style("top", (d3.event.pageY - 28) + "px");
                })
                .on('mouseout', function () {
                    tooltip.transition()
                        .duration(200)
                        .style("opacity", 0);
                });


            nodeEnter.append("text")
                .attr("x", function (d) {
                    return d.children || d._children ? -25 : 25;
                })
                .attr("dy", ".35em")
                .attr('class', 'nodeText')
                .attr("text-anchor", function (d) {
                    return d.children || d._children ? 'end' : 'start';
                })
                .text(function (d) {
                    return d.name;
                });

            nodeEnter.insert('text', ':first-child')
                .attr("x", function (d) {
                    return d.children || d._children ? -25 : 25;
                })
                .attr("dy", ".35em")
                .attr('class', 'clone')
                .attr("text-anchor", function (d) {
                    return d.children || d._children ? 'end' : 'start';
                })
                .text(function (d) {
                    return d.name;
                })
                .attr("stroke-linejoin", "round")
                .attr("stroke-width", 3)
                .attr("stroke", "white");

            // Update the text to reflect whether node has children or not.
            var nodeUpdate = node.merge(nodeEnter);


            nodeUpdate.transition(transition)
                .attr("transform", function (d) {
                    return 'translate(' + d.y + ',' + d.x + ')'
                })
                .attr("fill-opacity", 1)
                .attr("stroke-opacity", 1);

            var foundAnimation = function (element) {
                d3.select(element)
                    .transition(transition)
                    .attr('stroke-width', 10)
                    .attr('stroke-opacity', .1)
                    .transition(transition)
                    .attr('stroke-width', 1)
                    .attr('stroke-opacity', 1)
                    .on('end', function (d) {
                        d.match ? foundAnimation(element) : null;
                    });
            };

            nodeUpdate.select('circle')
                .style('fill', function (d) {
                    if (!d.data.status)
                        return '#8E8E8E';

                    if (d.match) {
                        foundAnimation(this);
                    }
                    if (d.class === 'found')
                        return "#ff4136";
                    return d._children && d._children.length ? "lightsteelblue" : "#fff";
                });

            nodeUpdate.select('path.hasRegistry')
                .style('fill', function (d) {
                    return d.data.isPrivateRegistry ? 'red' : null;
                });

            nodeUpdate.select('text.clone')
                .attr("text-anchor", function (d) {
                    return d.children || d._children ? (langService.current === 'en' ? 'end' : 'start') : (langService.current === 'en' ? 'start' : 'end');
                })
                .text(function (d) {
                    return d.name;
                });

            nodeUpdate.select('text:not(.clone)')
                .attr("text-anchor", function (d) {
                    return d.children || d._children ? (langService.current === 'en' ? 'end' : 'start') : (langService.current === 'en' ? 'start' : 'end');
                })
                .text(function (d) {
                    return d.name;
                });


            // Transition exiting nodes to the parent's new position.
            var nodeExit = node.exit().transition(transition)
                .attr("transform", function () {
                    return 'translate(' + source.y + ',' + source.x + ')';
                })
                .attr("fill-opacity", 0)
                .attr("stroke-opacity", 0)
                .remove();

            var link = self.glink.selectAll('path')
                .data(links, function (d) {
                    return d.target.id;
                });

            var linkEnter = link.enter().append("path")
                .attr("d", function () {
                    var o = {x: source.x0, y: source.y0};
                    return self.diagonal({source: o, target: o})
                });

            link.merge(linkEnter).transition(transition)
                .attr("d", self.diagonal)
                .style("stroke", function (d) {
                    if (d.target.class === "found") {
                        return "#ff4136";
                    }
                });

            // Transition exiting nodes to the parent's new position.
            link.exit().transition(transition)
                .attr("d", function () {
                    var o = {x: source.x, y: source.y};
                    return self.diagonal({source: o, target: o});
                })
                .remove();


            self.nodesIds = [];
            // Stash the old positions for transition.
            nodes.forEach(function (d) {
                d.x0 = d.x;
                d.y0 = d.y;

                if (d.children && d.children.length) {
                    self.nodesIds.push(d.id);
                }
            });
        };

        self.centerNode = function (node) {
            var scale = d3.zoomTransform(self.mainGroup.node()).k;
            var x = -node.y0;
            var y = -node.x0;
            x = x * scale + _getViewPort('width') / 2;
            y = y * scale + _getViewPort('height') / 2;
            d3.event && d3.event.stopPropagation();
            self.svg.transition().duration(duration).call(self.zoomListener.transform, d3.zoomIdentity.translate(x, y).scale(scale));
        };

        self.zoomOut = function () {
            self.svg.transition().duration(duration).call(self.zoomListener.scaleBy, 0.5);
        };

        self.zoomIn = function () {
            self.svg.transition().duration(duration).call(self.zoomListener.scaleBy, 2);
        };

        self.printChart = function () {
            var svg = self.svg.node();
            var dimensions = self.mainGroup.node().getBBox();
            var canvas = d3.select('canvas#organization-chart-canvas');
            var serializer = new XMLSerializer();
            var serializedSVG = serializer.serializeToString(svg);
            var DOMUrl = window.URL || window.webkitURL || window;

            if (langService.current === 'ar') {
                serializedSVG = serializedSVG
                    .replace(/text-anchor="start"/g, 'text-anchor="x"')
                    .replace(/text-anchor="end"/g, 'text-anchor="y"')
                    .replace(/text-anchor="x"/g, 'text-anchor="end"')
                    .replace(/text-anchor="y"/g, 'text-anchor="start"');
            }

            serializedSVG = serializedSVG.replace(/<text /g, '<text style="font-size:2rem;" ');

            var img = new Image();
            var svgBlob = new Blob([serializedSVG], {type: 'image/svg+xml;charset=utf-8'});
            triggerDownload(DOMUrl.createObjectURL(svgBlob));
        };

        self.resetZoom = function () {
            var scale = 1;
            var x = self.root.y0 * scale + _getViewPort('width') / 2;
            var y = self.root.x0 + _getViewPort('height') / 2;
            self.svg.transition().duration(duration).call(self.zoomListener.transform, d3.zoomIdentity.translate(x, y).scale(1));
        };

        self.toggleNode = function (node) {
            if (node.children) {
                node._children = node.children;
                node.children = null;
            } else {
                node.children = node._children;
                node._children = null;
            }
            self.render(node);
            self.centerNode(node);
        };

        self.collapseNode = function (node) {
            if (node.children) {
                node._children = node.children;
                node._children.forEach(self.collapseNode);
                node.children = null;
            }
        };

        self.expandNode = function (node) {
            node.children = node._children;
            node._children = null;
        };

        self.collapseAll = function (node, render) {
            if (node.children) {
                node._children = node.children;
                node._children.forEach(self.collapseAll);
                node.children = null;
            } else if (node._children) {
                node._children.forEach(self.collapseAll)
            }
            render && self.render(node);
        };

        self.expandAll = function (node, render) {
            if (node._children) {
                node.children = node._children;
                node.children.forEach(self.expandAll);
                node._children = null;
            } else if (node.children) {
                node.children.forEach(self.expandAll);
            }
            render && self.render(node);
        };

        self.clearAll = function (node) {
            node.class = '';
            node.match = null;
            if (node.children) {
                node.children.forEach(self.clearAll);
            } else if (node._children) {
                node._children.forEach(self.clearAll);
            }
        };

        self.nodeSearch = function (searchText) {
            searchText = ('' + searchText).toLowerCase();
            return self.nodes.filter(function (item) {
                return item[langService.current].toLowerCase().indexOf(searchText) !== -1;
            });
        };

        self.selectedNodeChange = function (node) {
            if (node) {
                self.clearAll(self.root);
                self.expandAll(self.root);
                self.render(self.root);
                self.searchTree(self.root, 'node.name', node[langService.current]);
                self.root.children.forEach(self.collapseAllNotFound);
                self.render(self.root);
            } else {
                self.clearAll(self.root);
                self.render(self.root);
            }
        };

        self.searchTree = function (node, field, text) {
            if (node.children) {
                node.children.forEach(function (item) {
                    self.searchTree(item, field, text);
                });
            }
            var textValue = eval(field);
            if (textValue && textValue.match(text)) {
                node.ancestors().map(function (item) {
                    item.class = 'found';
                });
            }
        };

        self.collapseAllNotFound = function (node) {
            if (node.children) {
                if (node.class !== 'found') {
                    node._children = node.children;
                    node._children.forEach(self.collapseAllNotFound);
                    node.children = null;
                } else {
                    node.children.forEach(self.collapseAllNotFound);
                }
            }
            if (self.selectedNode && self.selectedNode.id === Number(node.id)) {
                node.match = true;
                d3.transition(transition).on('end', function () {
                    self.centerNode(node);
                });
            }
        };

        self.openRightClickMenu = function (node) {
            var event = d3.event;
            event.preventDefault();
            if ((!node.data.itIsRoot && !node.data.manageable) || node.data.itIsRoot && !employeeService.isSuperAdminUser()) {
                return;
            }
            var parent = node.parent;

            var position = $mdPanel.newPanelPosition()
                .relativeTo(angular.element(d3.event.target))
                .addPanelPosition($mdPanel.xPosition.ALIGN_END, $mdPanel.yPosition.BELOW);
            var animation = $mdPanel.newPanelAnimation();

            var menuRef = $mdPanel.open({
                attachTo: angular.element(document.body),
                position: position,
                controller: function (mdPanelRef, LangWatcher, $scope, organizationService, $q) {
                    'ngInject';
                    var ctrl = this;
                    LangWatcher($scope);
                    ctrl.openAddDialog = function (organization, $event) {
                        mdPanelRef.close();
                        organizationService
                            .controllerMethod
                            .organizationAdd(organization, $event)
                            .then(function (ou) {
                                 renderNewNode(ou, node);
                            })
                            .catch(function (ou) {
                                if (!ou.id) {
                                    return;
                                }
                                self.reloadCallback() // this function
                                    .then(function () {
                                        _updateNodes(node);
                                    });
                                /*if (ou.id !== Number(node.id)) {
                                    renderNewNode(ou, node);
                                }*/
                            });
                    };

                    ctrl.openEditDialog = function (organization, $event) {
                        mdPanelRef.close();
                        organizationService
                            .controllerMethod
                            .organizationEdit(organization, $event)
                            .then(function () {
                                self.reloadCallback() // this function
                                    .then(function () {
                                        _updateNodes(node);
                                    });
                            })
                            .catch(function () {
                                return $q.reject(null);
                            })
                    };
                },
                locals: {
                    organization: node.data
                },
                openFrom: event,
                controllerAs: 'ctrl',
                templateUrl: cmsTemplate.getDirective('chart-right-click-menu-template'),
                clickOutsideToClose: true,
                escapeToClose: true
            })

        };

        self.$onInit = function () {
            $timeout(function () {
                self.root.y0 = _getViewPort('width') / 2;
                self.root.x0 = _getViewPort('height') / 2;

                self.root.children.forEach(self.collapseNode);
                self.render(self.root);
                self.centerNode(self.root);

                langService.listeningToChange(function () {
                    self.render(self.root);
                });
            }, 1000);
        };

        $scope.$on('organizations-loaded', function () {
            _updateNodes();
        });

    });
};
