module.exports = function (app) {
    app.directive('personalDirective', function ($timeout, employeeService, dialog, counterService, $state, langService, $window) {
        'ngInject';
        return {
            restrict: 'E',
            template: '<div  class=\'max-width-100-percent\'>' + '<canvas class="bar-chart"></canvas>' + '</div>',
            replace: true,
            scope: {
                reload: '='
            },
            link: function (scope, element) {
                // dataSource
                var dataSource = {
                    items: ['menu_item_dep_returned', 'menu_item_dep_incoming', 'menu_item_dep_ready_to_export'],
                    stats: ['app.department-inbox.returned', 'app.department-inbox.incoming', 'app.department-inbox.ready-to-export']
                };
                var personalWidgetCtrl = scope.$parent.ctrl;
                var myChart;
                var canvas = element.find('canvas');
                var config = {
                    type: 'bar', data: {
                        labels: [], datasets: [{
                            label: 'Books', data: [], backgroundColor: [], borderColor: []
                        }]
                    }, options: {
                        onClick: function ($event) {
                            var element = myChart.getElementAtEvent($event);
                            if (!element.length) return;

                            var index = element[0]._index;
                            $state.go('app.inbox.my-followup', {
                                folder: personalWidgetCtrl.data[index].folderId,
                                isDelayed: true
                            });
                        }, animation: {
                            onProgress: function () {
                                var ctx = this.chart.ctx;
                                ctx.font = Chart.helpers.fontString(Chart.defaults.global.defaultFontFamily, 'normal', Chart.defaults.global.defaultFontFamily);
                                ctx.fillStyle = '#000';
                                ctx.textAlign = 'center';
                                ctx.textBaseline = 'bottom';
                                this.data.datasets.forEach(function (dataset) {
                                    var index = Object.keys(dataset._meta)[0];
                                    dataset._meta[index].data.forEach(function (bar, index) {
                                        var model = bar._model;
                                        ctx.fillText(dataset.data[index], model.x, (model.y + 25));
                                    });
                                })
                            }
                        }, scales: {
                            yAxes: [{
                                stacked: true, ticks: {
                                    beginAtZero: true, userCallback: function (label) {
                                        // when the floored value is the same as the value we have a whole number
                                        if (Math.floor(label) === label) {
                                            return label;
                                        }

                                    }
                                }
                            }]
                        }, legend: {
                            display: false
                        }, responsive: true, layout: {
                            padding: {
                                left: 10, right: 10, top: 0, bottom: 0
                            }
                        }
                    }
                };

                $timeout(function () {
                    myChart = new Chart(canvas, config);
                });

                // resize function
                function _resize() {
                    if (myChart) myChart.resize();
                }


                // resize detector
                $($window).on('resize', _resize);

                function _updateData() {
                    /*
                    backgroundColor: (3) [, 'rgba(255, 206, 86, 0.7)', 'rgba(75, 192, 192, 0.7)']
                    borderColor: (3) ['rgba(54, 162, 235, 1)', 'rgba(255, 206, 86, 1)', 'rgba(75, 192, 192, 1)']
                    data: (3) [4, 7, 4]
                    label: "Books"
                    * */
                    const data = {
                        backgroundColor: [], borderColor: [], data: [], label: 'Books'
                    }, labels = [];
                    personalWidgetCtrl.data.forEach(function (item) {
                        data.backgroundColor.push('rgba(54, 162, 235, 0.7)')
                        data.borderColor.push('rgba(54, 162, 235, 1)')
                        data.data.push(item.count);
                        labels.push(item[langService.current === 'ar' ? 'folderArName' : 'folderEnName']);
                    })
                    if (myChart) {
                        config.data.labels = labels;
                        config.data.datasets[0] = data;
                        myChart.update(config)
                    }
                }

                scope.$watch(function () {
                    return langService.current;
                }, function () {
                    _updateData();
                })

                scope.$watch(function () {
                    return personalWidgetCtrl.loaded;
                }, function () {
                    $timeout(() => {
                        _updateData();
                    })
                })

            }
        }
    })
};
