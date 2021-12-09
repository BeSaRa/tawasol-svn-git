module.exports = function (app) {
    app.run(function ($httpBackend, urlService, generator, Response, CorrespondenceSite) {
        'ngInject';
        var urlWithId = new RegExp(urlService.correspondenceSites + '\/(\\d+)');
        var ouURLWithId = new RegExp(urlService.ouCorrespondenceSites + '\/(\\d+)');
        var urlActivateWithId = new RegExp(urlService.correspondenceSites + '/activate' + '\/(\\d+)');
        var urlDeactivateWithId = new RegExp(urlService.correspondenceSites + '/deactivate' + '\/(\\d+)');

        var correspondenceSites = [
            {
                "id": 1,
                "correspondenceTypeId": 218,
                "relatedOus": null,
                "correspondenceSiteType": null,
                "parent": 1,
                "isGlobal": true,
                "arName": "11",
                "enName": "ss",
                "status": true,
                "arDisplayName": null,
                "enDisplayName": null
            },
            {
                "id": 31,
                "correspondenceTypeId": 218,
                "relatedOus": null,
                "correspondenceSiteType": null,
                "parent": 1,
                "isGlobal": true,
                "arName": "11",
                "enName": "ss",
                "status": true,
                "arDisplayName": null,
                "enDisplayName": null
            },
            {
                "id": 32,
                "correspondenceTypeId": 218,
                "relatedOus": null,
                "correspondenceSiteType": null,
                "parent": 1,
                "isGlobal": true,
                "arName": "11",
                "enName": "ss",
                "status": true,
                "arDisplayName": null,
                "enDisplayName": null
            },
            {
                "id": 33,
                "correspondenceTypeId": 218,
                "relatedOus": null,
                "correspondenceSiteType": null,
                "parent": 1,
                "isGlobal": true,
                "arName": "11",
                "enName": "ss",
                "status": true,
                "arDisplayName": null,
                "enDisplayName": null
            },
            {
                "id": 38,
                "correspondenceTypeId": 218,
                "relatedOus": null,
                "correspondenceSiteType": null,
                "parent": null,
                "isGlobal": true,
                "arName": "شقشلاهؤ ىشةث701",
                "enName": "en name 701",
                "status": true,
                "arDisplayName": null,
                "enDisplayName": null
            },
            {
                "id": 39,
                "correspondenceTypeId": 218,
                "relatedOus": null,
                "correspondenceSiteType": null,
                "parent": 38,
                "isGlobal": true,
                "arName": "شقشلاهؤ 701 سعلا",
                "enName": "en 701 sub",
                "status": false,
                "arDisplayName": null,
                "enDisplayName": null
            },
            {
                "id": 40,
                "correspondenceTypeId": 218,
                "relatedOus": null,
                "correspondenceSiteType": null,
                "parent": null,
                "isGlobal": false,
                "arName": "شسشسشس",
                "enName": "sasasasasa",
                "status": false,
                "arDisplayName": null,
                "enDisplayName": null
            },
            {
                "id": 41,
                "correspondenceTypeId": 218,
                "relatedOus": null,
                "correspondenceSiteType": null,
                "parent": null,
                "isGlobal": false,
                "arName": "شسشسشسش",
                "enName": "asasasasasa",
                "status": true,
                "arDisplayName": null,
                "enDisplayName": null
            },
            {
                "id": 42,
                "correspondenceTypeId": 218,
                "relatedOus": null,
                "correspondenceSiteType": null,
                "parent": null,
                "isGlobal": false,
                "arName": "ءؤءؤءؤءؤ",
                "enName": "zxzxzxz",
                "status": true,
                "arDisplayName": null,
                "enDisplayName": null
            },
            {
                "id": 43,
                "correspondenceTypeId": 218,
                "relatedOus": null,
                "correspondenceSiteType": null,
                "parent": null,
                "isGlobal": true,
                "arName": "فقفقفقف",
                "enName": "rtrtrtrt",
                "status": true,
                "arDisplayName": null,
                "enDisplayName": null
            },
            {
                "id": 44,
                "correspondenceTypeId": 218,
                "relatedOus": null,
                "correspondenceSiteType": null,
                "parent": null,
                "isGlobal": true,
                "arName": "فغفغفغفغف",
                "enName": "tytytytytyt",
                "status": true,
                "arDisplayName": null,
                "enDisplayName": null
            },
            {
                "id": 45,
                "correspondenceTypeId": 218,
                "relatedOus": null,
                "correspondenceSiteType": null,
                "parent": null,
                "isGlobal": true,
                "arName": "يبيبيبيبيبيب",
                "enName": "dfdfdfdfdf",
                "status": true,
                "arDisplayName": null,
                "enDisplayName": null
            },
            {
                "id": 46,
                "correspondenceTypeId": 218,
                "relatedOus": null,
                "correspondenceSiteType": null,
                "parent": 42,
                "isGlobal": false,
                "arName": "سعلا1",
                "enName": "sub1",
                "status": true,
                "arDisplayName": null,
                "enDisplayName": null
            }
        ];

        var ouCorrespondenceSites = [
            {
                "id": 163,
                "correspondenceSite": {
                    "id": 31,
                    "correspondenceTypeId": 218,
                    "relatedOus": null,
                    "correspondenceSiteType": null,
                    "parent": 1,
                    "isGlobal": true,
                    "arName": "correspondence site2",
                    "enName": "correspondence site2",
                    "status": true,
                    "arDisplayName": null,
                    "enDisplayName": null
                },
                "ouid": 5,
                "code": null,
                "itemOrder": null,
                "status": null
            },
            {
                "id": 171,
                "correspondenceSite": {
                    "id": 38,
                    "correspondenceTypeId": 218,
                    "relatedOus": null,
                    "correspondenceSiteType": null,
                    "parent": null,
                    "isGlobal": true,
                    "arName": "correspondence site5",
                    "enName": "correspondence site5",
                    "status": true,
                    "arDisplayName": null,
                    "enDisplayName": null
                },
                "ouid": 1,
                "code": null,
                "itemOrder": null,
                "status": null
            }
        ];

        var response = new Response();

        // get all correspondenceSites
        $httpBackend
            .whenGET(urlService.correspondenceSites)
            .respond(function () {
                return [200, response.setResponse(correspondenceSites)];
            });

        // add new correspondenceSite
        $httpBackend
            .whenPOST(urlService.correspondenceSites)
            .respond(function (method, url, data) {
                var correspondenceSite = JSON.parse(data);
                // create new id for model
                correspondenceSite.id = generator.createNewID(correspondenceSites, 'id');
                // push model to collections
                correspondenceSites.push(correspondenceSite);
                return [200, response.setResponse(correspondenceSite.id)];
            });

        // edit correspondenceSite
        $httpBackend.whenPUT(urlService.correspondenceSites)
            .respond(function (method, url, data) {
                var correspondenceSite = new CorrespondenceSite(JSON.parse(data));

                for (var i = 0; i < correspondenceSites.length; i++) {
                    if (correspondenceSites[i].id === correspondenceSite.id) {
                        correspondenceSites[i] = correspondenceSite;
                        break;
                    }
                }
                return [200, response.setResponse(correspondenceSite)];
            });

        // delete correspondenceSite bulk
        $httpBackend.whenDELETE(urlService.correspondenceSites + '/bulk').respond(function (method, url, data) {
            var correspondenceSitesToDelete = JSON.parse(data);
            for (var i = 0; i < correspondenceSitesToDelete.length; i++) {
                for (var j = 0; j < correspondenceSites.length; j++) {
                    if (correspondenceSites[j].id === correspondenceSitesToDelete[i]) {
                        correspondenceSites.splice(j, 1);
                        break;
                    }
                }
            }
            return [200, response.setResponse(true)];
        });

        // delete correspondenceSite single
        $httpBackend.whenDELETE(function (url) {
            return urlWithId.test(url);
        }).respond(function (method, url, data) {
            var id = url.split('/').pop();
            for (var i = 0; i < correspondenceSites.length; i++) {
                if (correspondenceSites[i].id === id) {
                    correspondenceSites.splice(i, 1);
                }
            }
            return [200, response.setResponse(true)];
        });

        // get all correspondenceSites OU
        $httpBackend
            .whenGET(urlService.ouCorrespondenceSites)
            .respond(function () {
                return [200, response.setResponse(ouCorrespondenceSites)];
            });

        // add new correspondenceSites organization
        $httpBackend
            .whenPOST(urlService.ouCorrespondenceSites)
            .respond(function (method, url, data) {
                var ouCorrespondenceSite = JSON.parse(data);
                // create new id for model
                ouCorrespondenceSite.id = generator.createNewID(ouCorrespondenceSites, 'id');
                // push model to collections
                ouCorrespondenceSites.push(ouCorrespondenceSite);

                return [200, response.setResponse(ouCorrespondenceSite.id)];
            });

        // add bulk correspondenceSites organization
        $httpBackend
            .whenPOST(urlService.ouCorrespondenceSites + '/bulk')
            .respond(function (method, url, data) {
                var ouCorrespondenceSiteIDs = JSON.parse(data);
                var newOUIds = [];
                for (var i = 0; i < ouCorrespondenceSiteIDs.length; i++) {
                    ouCorrespondenceSiteIDs[i].id = generator.createNewID(ouCorrespondenceSites, 'id');
                    ouCorrespondenceSites.push(ouCorrespondenceSiteIDs[i]);
                    newOUIds.push(ouCorrespondenceSiteIDs[i].id);
                }
                return [200, response.setResponse(newOUIds)];
            });

        // delete single correspondenceSite OU
        $httpBackend.whenDELETE(function (url) {
            return ouURLWithId.test(url);
        }).respond(function (method, url, data) {
            var id = url.split('/').pop();
            for (var i = 0; i < ouCorrespondenceSites.length; i++) {
                if (ouCorrespondenceSites[i].id === id) {
                    ouCorrespondenceSites.splice(i, 1);
                }
            }
            return [200, response.setResponse(true)];
        });

        // delete bulk correspondenceSite OU
        $httpBackend.whenDELETE(urlService.ouCorrespondenceSites + '/bulk').respond(function (method, url, data) {
            var correspondenceSitesOUToDelete = JSON.parse(data);
            for (var i = 0; i < correspondenceSitesOUToDelete.length; i++) {
                for (var j = 0; j < ouCorrespondenceSites.length; j++) {
                    if (ouCorrespondenceSites[j].id === correspondenceSitesOUToDelete[i]) {
                        ouCorrespondenceSites.splice(j, 1);
                        break;
                    }
                }
            }
            return [200, response.setResponse(true)];
        });

        // activate correspondenceSite status single
        $httpBackend.whenPUT(function (url) {
            return urlActivateWithId.test(url);
        }).respond(function (method, url, data) {
            var id = url.split('/').pop();
            var correspondenceSite = correspondenceSites.filter(function (e) {
                return e.id === parseInt(id);
            })[0];

            correspondenceSite.status = true;

            return [200, response.setResponse(true)];
        });

        // deactivate correspondenceSite status single
        $httpBackend.whenPUT(function (url) {
            return urlDeactivateWithId.test(url);
        }).respond(function (method, url, data) {
            var id = url.split('/').pop();
            var correspondenceSite = correspondenceSites.filter(function (e) {
                return e.id === parseInt(id);
            })[0];

            correspondenceSite.status = false;

            return [200, response.setResponse(true)];
        });

        // activate correspondenceSite status bulk
        $httpBackend.whenPUT((urlService.correspondenceSites + '/activate/bulk')).respond(function (method, url, data) {
            var correspondenceSitesToActivate = JSON.parse(data);
            for (var i = 0; i < correspondenceSitesToActivate.length; i++) {
                for (var j = 0; j < correspondenceSites.length; j++) {
                    if (correspondenceSites[j].id === correspondenceSitesToActivate[i]) {
                        correspondenceSites[j].status = true;
                        break;
                    }
                }
            }
            return [200, response.setResponse(true)];
        });

        // Deactivate correspondenceSite status bulk
        $httpBackend.whenPUT((urlService.correspondenceSites + '/deactivate/bulk')).respond(function (method, url, data) {
            var correspondenceSitesToActivate = JSON.parse(data);
            for (var i = 0; i < correspondenceSitesToActivate.length; i++) {
                for (var j = 0; j < correspondenceSites.length; j++) {
                    if (correspondenceSites[j].id === correspondenceSitesToActivate[i]) {
                        correspondenceSites[j].status = false;
                        break;
                    }
                }
            }
            return [200, response.setResponse(true)];
        });

    });
};