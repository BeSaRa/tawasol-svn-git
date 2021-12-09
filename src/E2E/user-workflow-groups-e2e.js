module.exports = function (app) {
    app.run(function ($httpBackend, urlService, generator, Response, UserWorkflowGroup) {
        'ngInject';
        var urlWithId = new RegExp(urlService.userWorkflowGroups + '\/(\\d+)');
        /*   var urlActivateWithId = new RegExp(urlService.userWorkflowGroups + '/activate' + '\/(\\d+)');
         var urlDeactivateWithId = new RegExp(urlService.userWorkflowGroups + '/deactivate' + '\/(\\d+)');*/

        var userWorkflowGroups = [
            {
                "id": 1,
                "user": {"id": 1},
                "wfGroup": {"id": 1}
            },
            {
                "id": 2,
                "user": {"id": 1},
                "wfGroup": {"id": 18}
            }];

        var response = new Response();

        // get all userWorkflowGroups
        $httpBackend
            .whenGET(urlService.userWorkflowGroups)
            .respond(function () {
                return [200, response.setResponse(userWorkflowGroups)];
            });

        // add new document Type
        $httpBackend
            .whenPOST(urlService.userWorkflowGroups)
            .respond(function (method, url, data) {
                var userWorkflowGroup = JSON.parse(data);
                // create new id for model
                userWorkflowGroup.id = generator.createNewID(userWorkflowGroup, 'id');

                // push model to collections
                userWorkflowGroups.push(userWorkflowGroup);
                return [200, response.setResponse(userWorkflowGroup.id)];
            });

        // edit document Type
        $httpBackend.whenPUT(urlService.userWorkflowGroups)
            .respond(function (method, url, data) {
                var userWorkflowGroup = new UserWorkflowGroup(JSON.parse(data));

                for (var i = 0; i < userWorkflowGroups.length; i++) {
                    if (userWorkflowGroups[i].id === userWorkflowGroup.id) {
                        userWorkflowGroups[i] = userWorkflowGroup;
                        break;
                    }
                }

                return [200, response.setResponse(userWorkflowGroup)];
            });

        // delete userWorkflowGroups bulk
        $httpBackend.whenDELETE(urlService.userWorkflowGroups + '/bulk').respond(function (method, url, data) {
            var userWorkflowGroupsToDelete = JSON.parse(data);

            for (var i = 0; i < userWorkflowGroupsToDelete.length; i++) {
                for (var j = 0; j < userWorkflowGroups.length; j++) {
                    if (userWorkflowGroups[j].id === userWorkflowGroupsToDelete[i]) {
                        userWorkflowGroups.splice(j, 1);
                        break;
                    }
                }
            }
            return [200, response.setResponse(true)];
        });

        // delete userWorkflowGroup single
        $httpBackend.whenDELETE(function (url) {
            return urlWithId.test(url);
        }).respond(function (method, url, data) {
            var id = url.split('/').pop();
            for (var i = 0; i < userWorkflowGroups.length; i++) {
                if (userWorkflowGroups[i].id === parseInt(id)) {
                    userWorkflowGroups.splice(i, 1);
                }
            }
            return [200, response.setResponse(true)];
        });

        // activate userWorkflowGroup status single
        $httpBackend.whenPUT(function (url) {
            return urlActivateWithId.test(url);
        }).respond(function (method, url, data) {
            var id = url.split('/').pop();

            var userWorkflowGroup = userWorkflowGroups.filter(function (e) {
                return e.id === parseInt(id);
            })[0];

            userWorkflowGroup.status = true;

            return [200, response.setResponse(true)];
        });

        // deactivate userWorkflowGroup status single
        $httpBackend.whenPUT(function (url) {
            return urlDeactivateWithId.test(url);
        }).respond(function (method, url, data) {
            var id = url.split('/').pop();

            var userWorkflowGroup = userWorkflowGroups.filter(function (e) {
                return e.id === parseInt(id);
            })[0];

            userWorkflowGroup.status = false;

            return [200, response.setResponse(true)];
        });

        // activate userWorkflowGroup status bulk
        $httpBackend.whenPUT((urlService.userWorkflowGroups + '/activate/bulk')).respond(function (method, url, data) {
            var userWorkflowGroupsToActivate = JSON.parse(data);
            for (var i = 0; i < userWorkflowGroupsToActivate.length; i++) {
                for (var j = 0; j < userWorkflowGroups.length; j++) {
                    if (userWorkflowGroups[j].id === userWorkflowGroupsToActivate[i]) {
                        userWorkflowGroups[j].status = true;
                        break;
                    }
                }
            }
            return [200, response.setResponse(true)];
        });

        // Deactivate userWorkflowGroup status bulk
        $httpBackend.whenPUT((urlService.userWorkflowGroups + '/deactivate/bulk')).respond(function (method, url, data) {
            var userWorkflowGroupsToActivate = JSON.parse(data);
            for (var i = 0; i < userWorkflowGroupsToActivate.length; i++) {
                for (var j = 0; j < userWorkflowGroups.length; j++) {
                    if (userWorkflowGroups[j].id === userWorkflowGroupsToActivate[i]) {
                        userWorkflowGroups[j].status = false;
                        break;
                    }
                }
            }
            return [200, response.setResponse(true)];
        });


    })
};
