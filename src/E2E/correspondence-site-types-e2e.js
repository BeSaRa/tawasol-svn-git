module.exports = function (app) {
    app.run(function ($httpBackend, urlService, generator, Response, CorrespondenceSiteType) {
        'ngInject';
        var urlWithId = new RegExp(urlService.correspondenceSiteTypes + '\/(\\d+)');
        var urlActivateWithId = new RegExp(urlService.correspondenceSiteTypes + '/activate' + '\/(\\d+)');
        var urlDeactivateWithId = new RegExp(urlService.correspondenceSiteTypes + '/deactivate' + '\/(\\d+)');

        var correspondenceSiteTypes = [
            {
                "id": 192,
                "category": 2,
                "lookupKey": 3,
                "lookupStrKey": null,
                "arName": "نوع موقع المراسلات1",
                "enName": "Correspondence Site Type1",
                "status": true,
                "parent": null,
                "itemOrder": 1
            },
            {
                "id": 217,
                "category": 2,
                "lookupKey": 4,
                "lookupStrKey": "testing",
                "arName": "Correspondence Site Type 3",
                "enName": "Correspondence Site Type 3",
                "status": true,
                "parent": null,
                "itemOrder": 2
            },
            {
                "id": 218,
                "category": 2,
                "lookupKey": 5,
                "lookupStrKey": null,
                "arName": "Correspondence Site Type 2",
                "enName": "Correspondence Site Type 2",
                "status": false,
                "parent": null,
                "itemOrder": 3
            }
        ];

        var response = new Response();

        // get all correspondenceSiteTypes
        $httpBackend
            .whenGET(urlService.correspondenceSiteTypes)
            .respond(function () {
                return [200, response.setResponse(correspondenceSiteTypes)];
            });

        // add new correspondenceSiteType
        $httpBackend
            .whenPOST(urlService.correspondenceSiteTypes)
            .respond(function (method, url, data) {
                var correspondenceSiteType = JSON.parse(data);
                // create new id for model
                correspondenceSiteType.id = generator.createNewID(correspondenceSiteTypes, 'id');
                // push model to collections
                correspondenceSiteTypes.push(correspondenceSiteType);
                return [200, response.setResponse(correspondenceSiteType.id)];
            });

        // edit correspondenceSiteType
        $httpBackend.whenPUT(urlService.correspondenceSiteTypes)
            .respond(function (method, url, data) {
                var correspondenceSiteType = new CorrespondenceSiteType(JSON.parse(data));

                for (var i = 0; i < correspondenceSiteTypes.length; i++) {
                    if (correspondenceSiteTypes[i].id === correspondenceSiteType.id) {
                        correspondenceSiteTypes[i] = correspondenceSiteType;
                        break;
                    }
                }
                return [200, response.setResponse(correspondenceSiteType)];
            });

        // delete correspondenceSiteType bulk
        $httpBackend.whenDELETE(urlService.correspondenceSiteTypes + '/bulk').respond(function (method, url, data) {
            var correspondenceSiteTypesToDelete = JSON.parse(data);
            for (var i = 0; i < correspondenceSiteTypesToDelete.length; i++) {
                for (var j = 0; j < correspondenceSiteTypes.length; j++) {
                    if (correspondenceSiteTypes[j].id === correspondenceSiteTypesToDelete[i]) {
                        correspondenceSiteTypes.splice(j, 1);
                        break;
                    }
                }
            }
            return [200, response.setResponse(true)];
        });

        // delete correspondenceSiteType single
        $httpBackend.whenDELETE(function (url) {
            return urlWithId.test(url);
        }).respond(function (method, url, data) {
            var id = url.split('/').pop();
            for (var i = 0; i < correspondenceSiteTypes.length; i++) {
                if (correspondenceSiteTypes[i].id === id) {
                    correspondenceSiteTypes.splice(i, 1);
                }
            }
            return [200, response.setResponse(true)];
        });

        // activate correspondenceSiteType status single
        $httpBackend.whenPUT(function (url) {
            return urlActivateWithId.test(url);
        }).respond(function (method, url, data) {
            var id = url.split('/').pop();
            var correspondenceSiteType = correspondenceSiteTypes.filter(function (e) {
                return e.id === parseInt(id);
            })[0];

            correspondenceSiteType.status = true;

            return [200, response.setResponse(true)];
        });

        // deactivate correspondenceSiteType status single
        $httpBackend.whenPUT(function (url) {
            return urlDeactivateWithId.test(url);
        }).respond(function (method, url, data) {
            var id = url.split('/').pop();
            var correspondenceSiteType = correspondenceSiteTypes.filter(function (e) {
                return e.id === parseInt(id);
            })[0];

            correspondenceSiteType.status = false;

            return [200, response.setResponse(true)];
        });

        // activate correspondenceSiteType status bulk
        $httpBackend.whenPUT((urlService.correspondenceSiteTypes + '/activate/bulk')).respond(function (method, url, data) {
            var correspondenceSiteTypesToActivate = JSON.parse(data);
            for (var i = 0; i < correspondenceSiteTypesToActivate.length; i++) {
                for (var j = 0; j < correspondenceSiteTypes.length; j++) {
                    if (correspondenceSiteTypes[j].id === correspondenceSiteTypesToActivate[i]) {
                        correspondenceSiteTypes[j].status = true;
                        break;
                    }
                }
            }
            return [200, response.setResponse(true)];
        });

        // Deactivate correspondenceSiteType status bulk
        $httpBackend.whenPUT((urlService.correspondenceSiteTypes + '/deactivate/bulk')).respond(function (method, url, data) {
            var correspondenceSiteTypesToActivate = JSON.parse(data);
            for (var i = 0; i < correspondenceSiteTypesToActivate.length; i++) {
                for (var j = 0; j < correspondenceSiteTypes.length; j++) {
                    if (correspondenceSiteTypes[j].id === correspondenceSiteTypesToActivate[i]) {
                        correspondenceSiteTypes[j].status = false;
                        break;
                    }
                }
            }
            return [200, response.setResponse(true)];
        });

    });
};