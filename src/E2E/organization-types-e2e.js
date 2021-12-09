module.exports = function (app) {
    app.run(function ($httpBackend, urlService, generator, Response, OrganizationType) {
        'ngInject';
        var urlWithId = new RegExp(urlService.organizationTypes + '\/(\\d+)');
        var urlActivateWithId = new RegExp(urlService.organizationTypes + '/activate' + '\/(\\d+)');
        var urlDeactivateWithId = new RegExp(urlService.organizationTypes + '/deactivate' + '\/(\\d+)');

        var organizationTypes = [];

        var response = new Response();

        // get all organizationTypes
        $httpBackend
            .whenGET(urlService.organizationTypes)
            .respond(function () {
                return [200, response.setResponse(organizationTypes)];
            });

        // add new document Type
        $httpBackend
            .whenPOST(urlService.organizationTypes)
            .respond(function (method, url, data) {
                var organizationType = JSON.parse(data);
                // create new id for model
                organizationType.id = generator.createNewID(organizationTypes, 'id');

                // push model to collections
                organizationTypes.push(organizationType);
                return [200, response.setResponse(organizationType.id)];
            });

        // edit document Type
        $httpBackend.whenPUT(urlService.organizationTypes)
            .respond(function (method, url, data) {
                var organizationType = new OrganizationType(JSON.parse(data));

                for (var i = 0; i < organizationTypes.length; i++) {
                    if (organizationTypes[i].id === organizationType.id) {
                        organizationTypes[i] = organizationType;
                        break;
                    }
                }

                return [200, response.setResponse(organizationType)];
            });

        // delete organizationTypes bulk
        $httpBackend.whenDELETE(urlService.organizationTypes + '/bulk').respond(function (method, url, data) {
            var organizationTypesToDelete = JSON.parse(data);

            for (var i = 0; i < organizationTypesToDelete.length; i++) {
                for (var j = 0; j < organizationTypes.length; j++) {
                    if (organizationTypes[j].id === organizationTypesToDelete[i]) {
                        organizationTypes.splice(j, 1);
                        break;
                    }
                }
            }
            return [200, response.setResponse(true)];
        });

        // delete organizationType single
        $httpBackend.whenDELETE(function (url) {
            return urlWithId.test(url);
        }).respond(function (method, url, data) {
            var id = url.split('/').pop();
            for (var i = 0; i < organizationTypes.length; i++) {
                if (organizationTypes[i].id === parseInt(id)) {
                    organizationTypes.splice(i, 1);
                }
            }
            return [200, response.setResponse(true)];
        });

        // activate organizationType status single
        $httpBackend.whenPUT(function (url) {
            return urlActivateWithId.test(url);
        }).respond(function (method, url, data) {
            var id = url.split('/').pop();

            var organizationType = organizationTypes.filter(function (e) {
                return e.id === parseInt(id);
            })[0];

            organizationType.status = true;

            return [200, response.setResponse(true)];
        });

        // deactivate organizationType status single
        $httpBackend.whenPUT(function (url) {
            return urlDeactivateWithId.test(url);
        }).respond(function (method, url, data) {
            var id = url.split('/').pop();

            var organizationType = organizationTypes.filter(function (e) {
                return e.id === parseInt(id);
            })[0];

            organizationType.status = false;

            return [200, response.setResponse(true)];
        });

        // activate organizationType status bulk
        $httpBackend.whenPUT((urlService.organizationTypes + '/activate/bulk')).respond(function (method, url, data) {
            var organizationTypesToActivate = JSON.parse(data);
            for (var i = 0; i < organizationTypesToActivate.length; i++) {
                for (var j = 0; j < organizationTypes.length; j++) {
                    if (organizationTypes[j].id === organizationTypesToActivate[i]) {
                        organizationTypes[j].status = true;
                        break;
                    }
                }
            }
            return [200, response.setResponse(true)];
        });

        // Deactivate organizationType status bulk
        $httpBackend.whenPUT((urlService.organizationTypes + '/deactivate/bulk')).respond(function (method, url, data) {
            var organizationTypesToActivate = JSON.parse(data);
            for (var i = 0; i < organizationTypesToActivate.length; i++) {
                for (var j = 0; j < organizationTypes.length; j++) {
                    if (organizationTypes[j].id === organizationTypesToActivate[i]) {
                        organizationTypes[j].status = false;
                        break;
                    }
                }
            }
            return [200, response.setResponse(true)];
        });


    })
};
