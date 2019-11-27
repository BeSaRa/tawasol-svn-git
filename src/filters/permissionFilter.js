module.exports = function (app) {

    function _searchInPermissionGroup(permissionGroup, text) {
        return permissionGroup.toLowerCase().indexOf(text) !== -1;
    }

    function _searchInPermission(permission, text) {
        if (!permission)
            return false;
        var english = (permission.enName || "").toLowerCase() + '',
            arabic = (permission.arName || '').toLowerCase() + '';
        return english.indexOf(text) !== -1 || arabic.indexOf(text) !== -1;
    }

    app.filter('permissionFilter', function (_) {
        'ngInject';
        return function (permissionGroups, search) {
            var text = search.toLowerCase(), relatedData = {};
            _.filter(permissionGroups, function (permissions, permissionGorp) {

                // if the search text exists in the permissions group return whole permissions group.
                if (_searchInPermissionGroup(permissionGorp, text)) {
                    relatedData[permissionGorp] = permissions;
                } else {

                    // concatenate the permissions because it chucked  to 3 item per row from controller.
                    var concatenated = [];
                    _.map(permissions, function (permissionsArray) {
                        concatenated = concatenated.concat(permissionsArray);
                    });
                    // find in the flat array
                    var founds = _.filter(concatenated, function (permission) {
                        return _searchInPermission(permission, text);
                    });

                    if (founds.length) {
                        relatedData[permissionGorp] = _.chunk(founds, 3);
                    }
                }
            });
            return relatedData;
        }
    });
};