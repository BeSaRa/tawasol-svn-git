module.exports = function (app) {
    app.run(function ($httpBackend, urlService, generator, Response, WorkflowAction) {
        'ngInject';
        var urlWithId = new RegExp(urlService.workflowActions + '\/(\\d+)');
        var urlActivateWithId = new RegExp(urlService.workflowActions + '/activate' + '\/(\\d+)');
        var urlDeactivateWithId = new RegExp(urlService.workflowActions + '/deactivate' + '\/(\\d+)');

        var workflowActions = [
            {
                "id": 9,
                "arName": "4444",
                "enName": "5555",
                "global": false,
                "exportable": true,
                "relatedUsers": null
            },
            {
                "id": 11,
                "arName": "test",
                "enName": "ssss",
                "global": true,
                "exportable": true,
                "relatedUsers": null
            }];

        var response = new Response();

        // get all workflowActions
        $httpBackend
            .whenGET(urlService.workflowActions)
            .respond(function () {
                return [200, response.setResponse(workflowActions)];
            });

        // add new document Type
        $httpBackend
            .whenPOST(urlService.workflowActions)
            .respond(function (method, url, data) {
                var workflowAction = JSON.parse(data);
                // create new id for model
                workflowAction.id = generator.createNewID(workflowActions, 'id');

                // push model to collections
                workflowActions.push(workflowAction);
                return [200, response.setResponse(workflowAction.id)];
            });

        // edit document Type
        $httpBackend.whenPUT(urlService.workflowActions)
            .respond(function (method, url, data) {
                var workflowAction = new WorkflowAction(JSON.parse(data));

                for (var i = 0; i < workflowActions.length; i++) {
                    if (workflowActions[i].id === workflowAction.id) {
                        workflowActions[i] = workflowAction;
                        break;
                    }
                }

                return [200, response.setResponse(workflowAction)];
            });

        // delete workflowActions bulk
        $httpBackend.whenDELETE(urlService.workflowActions + '/bulk').respond(function (method, url, data) {
            var workflowActionsToDelete = JSON.parse(data);

            for (var i = 0; i < workflowActionsToDelete.length; i++) {
                for (var j = 0; j < workflowActions.length; j++) {
                    if (workflowActions[j].id === workflowActionsToDelete[i]) {
                        workflowActions.splice(j, 1);
                        break;
                    }
                }
            }
            return [200, response.setResponse(true)];
        });

        // delete workflowAction single
        $httpBackend.whenDELETE(function (url) {
            return urlWithId.test(url);
        }).respond(function (method, url, data) {
            var id = url.split('/').pop();
            for (var i = 0; i < workflowActions.length; i++) {
                if (workflowActions[i].id === parseInt(id)) {
                    workflowActions.splice(i, 1);
                }
            }
            return [200, response.setResponse(true)];
        });

        // activate workflowAction status single
        $httpBackend.whenPUT(function (url) {
            return urlActivateWithId.test(url);
        }).respond(function (method, url, data) {
            var id = url.split('/').pop();

            var workflowAction = workflowActions.filter(function (e) {
                return e.id === parseInt(id);
            })[0];

            workflowAction.status = true;

            return [200, response.setResponse(true)];
        });

        // deactivate workflowAction status single
        $httpBackend.whenPUT(function (url) {
            return urlDeactivateWithId.test(url);
        }).respond(function (method, url, data) {
            var id = url.split('/').pop();

            var workflowAction = workflowActions.filter(function (e) {
                return e.id === parseInt(id);
            })[0];

            workflowAction.status = false;

            return [200, response.setResponse(true)];
        });

        // activate workflowAction status bulk
        $httpBackend.whenPUT((urlService.workflowActions + '/activate/bulk')).respond(function (method, url, data) {
            var workflowActionsToActivate = JSON.parse(data);
            for (var i = 0; i < workflowActionsToActivate.length; i++) {
                for (var j = 0; j < workflowActions.length; j++) {
                    if (workflowActions[j].id === workflowActionsToActivate[i]) {
                        workflowActions[j].status = true;
                        break;
                    }
                }
            }
            return [200, response.setResponse(true)];
        });

        // Deactivate workflowAction status bulk
        $httpBackend.whenPUT((urlService.workflowActions + '/deactivate/bulk')).respond(function (method, url, data) {
            var workflowActionsToActivate = JSON.parse(data);
            for (var i = 0; i < workflowActionsToActivate.length; i++) {
                for (var j = 0; j < workflowActions.length; j++) {
                    if (workflowActions[j].id === workflowActionsToActivate[i]) {
                        workflowActions[j].status = false;
                        break;
                    }
                }
            }
            return [200, response.setResponse(true)];
        });


    })
};
