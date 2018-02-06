module.exports = function (app) {
    app.run(function ($httpBackend, urlService, generator, Response, UserWorkflowAction) {
        'ngInject';
        var urlWithId = new RegExp(urlService.userWorkflowActions + '\/(\\d+)');
        var urlActivateWithId = new RegExp(urlService.userWorkflowActions + '/activate' + '\/(\\d+)');
        var urlDeactivateWithId = new RegExp(urlService.userWorkflowActions + '/deactivate' + '\/(\\d+)');

        var userWorkflowActions = [{
            "id": 204,
            "userId": 1,
            "applicationUser": null,
            "wfAction": {
                "id": 9,
                "arName": "4444",
                "enName": "5555",
                "global": false,
                "exportable": true,
                "relatedUsers": null
            }
        }];

        var response = new Response();

        // get all userWorkflowActions
        $httpBackend
            .whenGET(urlService.userWorkflowActions)
            .respond(function () {
                return [200, response.setResponse(userWorkflowActions)];
            });

        // add new document Type
        $httpBackend
            .whenPOST(urlService.userWorkflowActions)
            .respond(function (method, url, data) {
                var userWorkflowAction = JSON.parse(data);
                // create new id for model
                userWorkflowAction.id = generator.createNewID(userWorkflowAction, 'id');

                // push model to collections
                userWorkflowActions.push(userWorkflowAction);
                return [200, response.setResponse(userWorkflowAction.id)];
            });

        // edit document Type
        $httpBackend.whenPUT(urlService.userWorkflowActions)
            .respond(function (method, url, data) {
                var userWorkflowAction = new UserWorkflowAction(JSON.parse(data));

                for (var i = 0; i < userWorkflowActions.length; i++) {
                    if (userWorkflowActions[i].id === userWorkflowAction.id) {
                        userWorkflowActions[i] = userWorkflowAction;
                        break;
                    }
                }

                return [200, response.setResponse(userWorkflowAction)];
            });

        // delete userWorkflowActions bulk
        $httpBackend.whenDELETE(urlService.userWorkflowActions + '/bulk').respond(function (method, url, data) {
            var userWorkflowActionsToDelete = JSON.parse(data);

            for (var i = 0; i < userWorkflowActionsToDelete.length; i++) {
                for (var j = 0; j < userWorkflowActions.length; j++) {
                    if (userWorkflowActions[j].id === userWorkflowActionsToDelete[i]) {
                        userWorkflowActions.splice(j, 1);
                        break;
                    }
                }
            }
            return [200, response.setResponse(true)];
        });

        // delete userWorkflowAction single
        $httpBackend.whenDELETE(function (url) {
            return urlWithId.test(url);
        }).respond(function (method, url, data) {
            var id = url.split('/').pop();
            for (var i = 0; i < userWorkflowActions.length; i++) {
                if (userWorkflowActions[i].id === parseInt(id)) {
                    userWorkflowActions.splice(i, 1);
                }
            }
            return [200, response.setResponse(true)];
        });

        // activate userWorkflowAction status single
        $httpBackend.whenPUT(function (url) {
            return urlActivateWithId.test(url);
        }).respond(function (method, url, data) {
            var id = url.split('/').pop();

            var userWorkflowAction = userWorkflowActions.filter(function (e) {
                return e.id === parseInt(id);
            })[0];

            userWorkflowAction.status = true;

            return [200, response.setResponse(true)];
        });

        // deactivate userWorkflowAction status single
        $httpBackend.whenPUT(function (url) {
            return urlDeactivateWithId.test(url);
        }).respond(function (method, url, data) {
            var id = url.split('/').pop();

            var userWorkflowAction = userWorkflowActions.filter(function (e) {
                return e.id === parseInt(id);
            })[0];

            userWorkflowAction.status = false;

            return [200, response.setResponse(true)];
        });

        // activate userWorkflowAction status bulk
        $httpBackend.whenPUT((urlService.userWorkflowActions + '/activate/bulk')).respond(function (method, url, data) {
            var userWorkflowActionsToActivate = JSON.parse(data);
            for (var i = 0; i < userWorkflowActionsToActivate.length; i++) {
                for (var j = 0; j < userWorkflowActions.length; j++) {
                    if (userWorkflowActions[j].id === userWorkflowActionsToActivate[i]) {
                        userWorkflowActions[j].status = true;
                        break;
                    }
                }
            }
            return [200, response.setResponse(true)];
        });

        // Deactivate userWorkflowAction status bulk
        $httpBackend.whenPUT((urlService.userWorkflowActions + '/deactivate/bulk')).respond(function (method, url, data) {
            var userWorkflowActionsToActivate = JSON.parse(data);
            for (var i = 0; i < userWorkflowActionsToActivate.length; i++) {
                for (var j = 0; j < userWorkflowActions.length; j++) {
                    if (userWorkflowActions[j].id === userWorkflowActionsToActivate[i]) {
                        userWorkflowActions[j].status = false;
                        break;
                    }
                }
            }
            return [200, response.setResponse(true)];
        });


    })
};
