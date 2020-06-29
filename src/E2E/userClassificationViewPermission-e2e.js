module.exports = function (app) {
    app.run(function ($httpBackend, urlService, generator, Response, UserClassificationViewPermission) {
        'ngInject';
        var urlWithId = new RegExp(urlService.userClassificationViewPermissions + '\/(\\d+)');

        var userClassificationViewPermissions = [
            {
                "id": 1,
                "userId": 1,
                "classificationId": 194,
                "securityLevels": 3
            }
        ];

        var response = new Response();

        // get all user classification view permission
        $httpBackend
            .whenGET(urlService.userClassificationViewPermissions)
            .respond(function () {
                return [200, response.setResponse(userClassificationViewPermissions)];
            });

        // add new user classification view permissions
        $httpBackend
            .whenPOST(urlService.userClassificationViewPermissions)
            .respond(function (method, url, data) {
                var userClassificationViewPermission = JSON.parse(data);

                // create new id for model
                userClassificationViewPermission.id = generator.createNewID(userClassificationViewPermissions, 'id');
                // push model to collections
                userClassificationViewPermissions.push(userClassificationViewPermission);
                console.log(userClassificationViewPermissions);
                return [200, response.setResponse(userClassificationViewPermission.id)];
            });

        // edit user classification view permission
        $httpBackend.whenPUT(urlService.userClassificationViewPermissions)
            .respond(function (method, url, data) {

                var userClassificationViewPermission = new UserClassificationViewPermission(JSON.parse(data));

                for (var i = 0; i < userClassificationViewPermissions.length; i++) {
                    if (userClassificationViewPermissions[i].id == userClassificationViewPermission.id) {
                        userClassificationViewPermissions[i] = userClassificationViewPermission;
                        break;
                    }
                }
                return [200, response.setResponse(userClassificationViewPermission)];
            });

        // delete user classification view permission single
        $httpBackend.whenDELETE(function (url) {
            return urlWithId.test(url);
        }).respond(function (method, url, data) {

            var id = url.split('/').pop();
            for (var i = 0; i < userClassificationViewPermissions.length; i++) {
                if (userClassificationViewPermissions[i].id == id) {
                    userClassificationViewPermissions.splice(i, 1);
                }
            }
            return [200, response.setResponse(true)];
        });


    });
};
