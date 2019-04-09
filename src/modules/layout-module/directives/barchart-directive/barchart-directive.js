module.exports = function (app) {
    app.directive('barchartDirective', function ($timeout, counterService, langService, $window) {
        'ngInject';
        return {
            restrict: 'E',
            template: '<div class=\'max-width-100-percent\'><canvas class="bar-chart"></canvas></div>',
            replace: true,
            scope: {
                reload: '='
            },
            link: function (scope, element) {
                var myChart;
                var canvas = element.find('canvas');
                var config = {
                    type: 'bar',
                    data: {
                        labels: ["Blue", "Yellow", "Green"],
                        datasets: [{
                            label: 'Books',
                            data: [
                                counterService.counter.getCount('menu_item_dep_returned','first'),
                                counterService.counter.getCount('menu_item_dep_incoming','first'),
                                counterService.counter.getCount('menu_item_dep_ready_to_export','first')
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
                        animation: {
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
                        },
                        scales: {
                            yAxes: [
                                {
                                    stacked: true,
                                    ticks: {
                                        beginAtZero: true,
                                        userCallback: function (label) {
                                            // when the floored value is the same as the value we have a whole number
                                            if (Math.floor(label) === label) {
                                                return label;
                                            }

                                        }
                                    }
                                }]
                        },
                        legend: {
                            display: false
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
