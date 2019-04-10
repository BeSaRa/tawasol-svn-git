module.exports = function (app) {
    app.directive('piechartDirective', function ($timeout, employeeService, $state, counterService, langService, $window) {
        'ngInject';
        return {
            restrict: 'E',
            template: '<div class=\'max-width-100-percent\'><canvas class="pie-chart"></canvas></div>',
            replace: true,
            scope: {
                options: '='
            },
            link: function (scope, element) {
                // dataSource
                var dataSource = {
                    items: ['menu_item_dep_returned', 'menu_item_dep_incoming', 'menu_item_dep_ready_to_export'],
                    stats: ['app.department-inbox.returned', 'app.department-inbox.incoming', 'app.department-inbox.ready-to-export']
                };
                var myChart;
                var canvas = element.find('canvas');
                var config = {
                    type: 'pie',
                    data: {

                        labels: ["menu_item_dep_returned", "menu_item_dep_incoming", "menu_item_dep_ready_to_export"],
                        datasets: [{
                            label: '# of Votes',
                            data: [
                                counterService.counter.getCount('menu_item_dep_returned', 'first'),
                                counterService.counter.getCount('menu_item_dep_incoming', 'first'),
                                counterService.counter.getCount('menu_item_dep_ready_to_export', 'first')
                            ],
                            backgroundColor: [
                                'rgba(54, 162, 235, 0.7)',
                                'rgba(255, 206, 86, 0.7)',
                                'rgba(75, 192, 192, 0.7)'
                            ],
                            borderColor: [
                                'rgba(54, 162, 235, 1)',
                                'rgba(255, 206, 86, 1)',
                                'rgba(75, 192, 192, 1)'
                            ]
                        }]
                    },
                    options: {
                        onClick: function ($event) {
                            var element = myChart.getElementAtEvent($event);
                            if (!element.length)
                                return;

                            var index = element[0]._index;
                            if (employeeService.employeeHasPermissionTo(dataSource.items[index])) {
                                $state.go(dataSource.stats[index]);
                            }
                        },
                        animation: {
                            duration: 500,
                            easing: "easeOutQuart",
                            onProgress: function () {
                                var chart = this.chart;
                                var ctx = chart.ctx;
                                ctx.font = Chart.helpers.fontString(Chart.defaults.global.defaultFontFamily, 'normal', Chart.defaults.global.defaultFontFamily);
                                ctx.textAlign = 'center';
                                ctx.textBaseline = 'bottom';

                                this.data.datasets.forEach(function (dataset) {
                                    for (var i = 0; i < dataset.data.length; i++) {
                                        var hidden = dataset._meta[Object.keys(dataset._meta)[0]].data[i].hidden;
                                        if (hidden)
                                            continue;

                                        var model = dataset._meta[Object.keys(dataset._meta)[0]].data[i]._model,
                                            total = dataset._meta[Object.keys(dataset._meta)[0]].total,
                                            mid_radius = model.innerRadius + (model.outerRadius - model.innerRadius) / 2,
                                            start_angle = model.startAngle,
                                            end_angle = model.endAngle,
                                            mid_angle = start_angle + (end_angle - start_angle) / 2;

                                        var x = mid_radius * Math.cos(mid_angle);
                                        var y = mid_radius * Math.sin(mid_angle);

                                        //ctx.fillStyle = '#fff';
                                        //if (i === 3) { // Darker text color for lighter background
                                        ctx.fillStyle = '#444';
                                        //}
                                        var percent = String(Math.round(dataset.data[i] / total * 100)) + "%";
                                        ctx.fillText(dataset.data[i], model.x + x, model.y + y);
                                        // Display percent in another line, line break doesn't work for fillText
                                        //ctx.fillText(percent, model.x + x, model.y + y + 15);
                                    }
                                });
                            }
                        },
                        responsive: true,
                        layout: {
                            padding: {
                                left: 10,
                                right: 10,
                                top: 0,
                                bottom: 0
                            }
                        }
                    }
                };

                $timeout(function () {
                    myChart = new Chart(canvas, config);
                });


                // resize function
                function _resize() {
                    if (myChart)
                        myChart.resize();
                }


                // resize detector
                $($window).on('resize', _resize);

                var translations = ["menu_item_dep_returned", "menu_item_dep_incoming", "menu_item_dep_ready_to_export"];

                function _updateLabels() {
                    config.data.labels = _.map(config.data.labels, function (value, index) {
                        return langService.get(translations[index]);
                    });
                    if (myChart)
                        myChart.update(config);
                }

                scope.$watch(function () {
                    return langService.current;
                }, function () {
                    _updateLabels();
                });

            }
        }
    })
};
