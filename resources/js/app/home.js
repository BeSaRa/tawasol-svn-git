(function (app) {
    app.controller('homeCtrl', function ($scope) {
        'ngInject';
        $scope.items = [
            'Languages',
            'Menus'
        ];
        console.log($scope);
    })
})(app);