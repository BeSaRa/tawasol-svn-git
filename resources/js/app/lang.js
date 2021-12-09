app.controller('langCtrl', function ($scope, $http) {
    'ngInject';
    $scope.data = [];
    $scope.selected = {};

    $scope.getData = function () {
        $http.get("api.php?action=get").then(function (result) {
            $scope.convertToArray(result.data);
        });
    };

    $scope.convertToArray = function (object) {
        var array = [];
        for (var i in object) {
            array.push({key: i, ar: object[i].ar, en: object[i].en});
        }
        $scope.data = array;
    };

    $scope.addKey = function (object) {
        $http.get('api.php?action=add&key=' + object.key + '&ar=' + object.ar + '&en=' + object.en).then(function (result) {
            result = result.data;
            if (result.done === true) {
                $scope.getData();
                $scope.data.push({key: object.key, ar: object.ar, en: object.en});
                $scope.new = {};
            } else {
                alert(result.msg);
                $scope.search = object.key;

            }
        });
    };

    $scope.edit = function (object) {
        $scope.selected = angular.copy(object);
        $scope.currentSelected = object;
    };

    $scope.cancel = function (object) {
        $scope.selected = false;
        $scope.currentSelected = object;
    };
    $scope.delete = function (object) {

        $http.get('api.php?action=delete&key=' + object.key).then(function (result) {
            result = result.data;
            if (result.done === true) {
                console.log($scope.data.splice($scope.data.indexOf(object), 1));
                $scope.cancel();
            } else {
                alert(result);
            }
        });

    };

    $scope.update = function (selected, object) {
        if (object.key.trim().length < 3) {
            alert('please fill key field');

        } else if (object.ar.trim().length === 0) {
            alert('please fill Arabic Translation');
        } else if (object.en.trim().length === 0) {
            alert("Please fill English Translation");
        } else {
            $http.get('api.php?action=update', {params: object}).then(function (result) {
                result = result.data;
                $scope.data.splice($scope.data.indexOf(selected), 1, object);
            });
        }
    };

    $scope.getData();
});