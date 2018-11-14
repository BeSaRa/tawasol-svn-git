module.exports = function (app) {
    app.controller('gridSearchDirectiveCtrl', function (LangWatcher,
                                                        $scope,
                                                        $q,
                                                        $timeout) {
        'ngInject';
        var self = this;
        self.controllerName = 'gridSearchDirectiveCtrl';
        LangWatcher($scope);

        self.search = function () {
            self.grid.searchCallback();
        };

        /*var pendingSearch, cancelSearch = angular.noop;
        var lastSearch;

        function refreshDebounce() {
            lastSearch = 0;
            pendingSearch = null;
            cancelSearch = angular.noop;
        }

        /!**
         * Debounce if querying faster than 300ms
         *!/
        function debounceSearch() {
            var now = new Date().getMilliseconds();
            lastSearch = lastSearch || now;

            return ((now - lastSearch) < 300);
        }

        self.search = function () {
            if (!pendingSearch || !debounceSearch()) {
                cancelSearch();

                return pendingSearch = $q(function (resolve, reject) {
                    cancelSearch = reject;
                    $timeout(function () {
                        resolve(self.grid.searchCallback());
                        refreshDebounce();
                    }, 500, true)
                });
            }

            return pendingSearch;
        };*/
    });
};