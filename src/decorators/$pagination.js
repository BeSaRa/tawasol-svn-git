module.exports = function(app){
    app.config(function($provide){
        'ngInject';
        $provide.decorator('mdTablePaginationDirective', ['$delegate', function ($delegate) {
            $delegate[0].controller = function Controller($attrs, langService ,$mdUtil, $scope) {
                'ngInject';
                var self = this;
                var defaultLabel = {
                    page: 'Page:',
                    rowsPerPage: 'Rows per page:',
                    of: 'of'
                };

                self.label = angular.copy(defaultLabel);

                function isPositive(number) {
                    return parseInt(number, 10) > 0;
                }

                self.eval = function (expression) {
                    var all = [langService.getKey('all','ar'),langService.getKey('all','en')];
                    return  (typeof expression === 'function') ? $scope.$eval(expression) : (
                        all.indexOf(expression) !== -1 ? $scope.$eval(function(){
                            return langService.get('all');
                        }): expression
                    ) ;
                };

                self.first = function () {
                    self.page = 1;
                    self.onPaginationChange();
                };

                self.hasNext = function () {
                    return self.page * self.limit < self.total;
                };

                self.hasPrevious = function () {
                    return self.page > 1;
                };

                self.last = function () {
                    self.page = self.pages();
                    self.onPaginationChange();
                };

                self.max = function () {
                    return self.hasNext() ? self.page * self.limit : self.total;
                };

                self.min = function () {
                    return isPositive(self.total) ? self.page * self.limit - self.limit + 1 : 0;
                };

                self.next = function () {
                    self.page++;
                    self.onPaginationChange();
                };

                self.onPaginationChange = function () {
                    if(angular.isFunction(self.onPaginate)) {
                        $mdUtil.nextTick(function () {
                            self.onPaginate(self.page, self.limit);
                        });
                    }
                };

                self.pages = function () {
                    return isPositive(self.total) ? Math.ceil(self.total / (isPositive(self.limit) ? self.limit : 1)) : 1;
                };

                self.previous = function () {
                    self.page--;
                    self.onPaginationChange();
                };

                self.showBoundaryLinks = function () {
                    return $attrs.mdBoundaryLinks === '' || self.boundaryLinks;
                };

                self.showPageSelect = function () {
                    return $attrs.mdPageSelect === '' || self.pageSelect;
                };

                $scope.$watch('$pagination.limit', function (newValue, oldValue) {
                    if(isNaN(newValue) || isNaN(oldValue) || newValue === oldValue) {
                        return;
                    }

                    // find closest page from previous min
                    self.page = Math.floor(((self.page * oldValue - oldValue) + newValue) / (isPositive(newValue) ? newValue : 1));
                    self.onPaginationChange();
                });

                $attrs.$observe('mdLabel', function (label) {
                    angular.extend(self.label, defaultLabel, $scope.$eval(label));
                });

                $scope.$watch('$pagination.total', function (newValue, oldValue) {
                    if(isNaN(newValue) || newValue === oldValue) {
                        return;
                    }

                    if(self.page > self.pages()) {
                        self.last();
                    }
                });
            };
            return $delegate;
        }]);
    })
};