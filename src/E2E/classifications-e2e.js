module.exports = function (app) {
    app.run(function ($httpBackend, urlService, generator, Response, Classification) {
        'ngInject';
        var urlWithId = new RegExp(urlService.classifications + '\/(\\d+)');
        var ouURLWithId = new RegExp(urlService.ouClassifications + '\/(\\d+)');
        var urlActivateWithId = new RegExp(urlService.classifications + '/activate' + '\/(\\d+)');
        var urlDeactivateWithId = new RegExp(urlService.classifications + '/deactivate' + '\/(\\d+)');

        var classifications = [
            {
                "id": 194,
                "arName": "تشسمبنتسم",
                "enName": "classification1",
                "status": true,
                "isGlobal": false,
                "groupPrefix": 'cl_194',
                "parent": null,
                "securityLevels": 3,
                "relatedOus": null
            },
            {
                "id": 204,
                "arName": "سيشسبي",
                "enName": "classification2",
                "status": true,
                "isGlobal": true,
                "groupPrefix": 'cl_204',
                "parent": null,
                "securityLevels": 1,
                "relatedOus": null
            }
        ];

        var ouClassifications = [
            {
                "id": 533,
                "code": null,
                "status": null,
                "itemOrder": null,
                "ouid": 1,
                "classification": {
                    "id": 194,
                    "arName": "تشسمبنتسم",
                    "enName": "classification1",
                    "status": true,
                    "isGlobal": true,
                    "groupPrefix": null,
                    "parent": null,
                    "securityLevels": 3,
                    "relatedOus": null
                }
            },
            {
                "id": 534,
                "code": null,
                "status": null,
                "itemOrder": null,
                "ouid": 5,
                "classification": {
                    "id": 194,
                    "arName": "تشسمبنتسم",
                    "enName": "classification2",
                    "status": true,
                    "isGlobal": true,
                    "groupPrefix": null,
                    "parent": null,
                    "securityLevels": 3,
                    "relatedOus": null
                }
            }
        ]

        var response = new Response();

        // get all classifications
        $httpBackend
            .whenGET(urlService.classifications)
            .respond(function () {
                return [200, response.setResponse(classifications)];
            });

        // add new classification
        $httpBackend
            .whenPOST(urlService.classifications)
            .respond(function (method, url, data) {
                var classification = JSON.parse(data);
                // create new id for model
                classification.id = generator.createNewID(classifications, 'id');
                // push model to collections
                classifications.push(classification);
                return [200, response.setResponse(classification.id)];
            });

        // edit classification
        $httpBackend.whenPUT(urlService.classifications)
            .respond(function (method, url, data) {
                var classification = new Classification(JSON.parse(data));

                for (var i = 0; i < classifications.length; i++) {
                    if (classifications[i].id === classification.id) {
                        classifications[i] = classification;
                        break;
                    }
                }
                return [200, response.setResponse(classification)];
            });

        // delete classification bulk
        $httpBackend.whenDELETE(urlService.classifications + '/bulk').respond(function (method, url, data) {
            var classificationsToDelete = JSON.parse(data);

            for (var i = 0; i < classificationsToDelete.length; i++) {
                for (var j = 0; j < classifications.length; j++) {
                    if (classifications[j].id === classificationsToDelete[i]) {
                        classifications.splice(j, 1);
                        break;
                    }
                }
            }
            return [200, response.setResponse(true)];
        });

        // delete classification single
        $httpBackend.whenDELETE(function (url) {
            return urlWithId.test(url);
        }).respond(function (method, url, data) {
            var id = url.split('/').pop();
            for (var i = 0; i < classifications.length; i++) {
                if (classifications[i].id === id) {
                    classifications.splice(i, 1);
                }
            }
            return [200, response.setResponse(true)];
        });

        // get all classifications OU
        $httpBackend
            .whenGET(urlService.ouClassifications)
            .respond(function () {
                return [200, response.setResponse(ouClassifications)];
            });

        // add new classifications organization
        $httpBackend
            .whenPOST(urlService.ouClassifications)
            .respond(function (method, url, data) {
                var ouClassification = JSON.parse(data);
                // create new id for model
                ouClassification.id = generator.createNewID(ouClassifications, 'id');
                // push model to collections
                ouClassifications.push(ouClassification);

                return [200, response.setResponse(ouClassification.id)];
            });

        // add bulk classifications organization
        $httpBackend
            .whenPOST(urlService.ouClassifications + '/bulk')
            .respond(function (method, url, data) {
                var ouClassificationIDs = JSON.parse(data);
                var newOUIds = [];
                for (var i = 0; i < ouClassificationIDs.length; i++) {
                    ouClassificationIDs[i].id = generator.createNewID(ouClassifications, 'id');
                    ouClassifications.push(ouClassificationIDs[i]);
                    newOUIds.push(ouClassificationIDs[i].id);
                }
                return [200, response.setResponse(newOUIds)];
            });

        // delete single classification OU
        $httpBackend.whenDELETE(function (url) {
            return ouURLWithId.test(url);
        }).respond(function (method, url, data) {
            var id = url.split('/').pop();
            for (var i = 0; i < ouClassifications.length; i++) {
                if (ouClassifications[i].id === id) {
                    ouClassifications.splice(i, 1);
                }
            }
            return [200, response.setResponse(true)];
        });

        // delete bulk classification OU
        $httpBackend.whenDELETE(urlService.ouClassifications + '/bulk').respond(function (method, url, data) {
            var classificationsOUToDelete = JSON.parse(data);

            for (var i = 0; i < classificationsOUToDelete.length; i++) {
                for (var j = 0; j < ouClassifications.length; j++) {
                    if (ouClassifications[j].id === classificationsOUToDelete[i]) {
                        ouClassifications.splice(j, 1);
                        break;
                    }
                }
            }
            return [200, response.setResponse(true)];
        });

        // activate classification status single
        $httpBackend.whenPUT(function (url) {
            return urlActivateWithId.test(url);
        }).respond(function (method, url, data) {
            var id = url.split('/').pop();

            var classification = classifications.filter(function (e) {
                return e.id === parseInt(id);
            })[0];

            classification.status = true;

            return [200, response.setResponse(true)];
        });

        // deactivate classification status single
        $httpBackend.whenPUT(function (url) {
            return urlDeactivateWithId.test(url);
        }).respond(function (method, url, data) {
            var id = url.split('/').pop();

            var classification = classifications.filter(function (e) {
                return e.id === parseInt(id);
            })[0];

            classification.status = false;

            return [200, response.setResponse(true)];
        });

        // activate classification status bulk
        $httpBackend.whenPUT((urlService.classifications + '/activate/bulk')).respond(function (method, url, data) {
            var classificationsToActivate = JSON.parse(data);
            for (var i = 0; i < classificationsToActivate.length; i++) {
                for (var j = 0; j < classifications.length; j++) {
                    if (classifications[j].id === classificationsToActivate[i]) {
                        classifications[j].status = true;
                        break;
                    }
                }
            }
            return [200, response.setResponse(true)];
        });

        // Deactivate classification status bulk
        $httpBackend.whenPUT((urlService.classifications + '/deactivate/bulk')).respond(function (method, url, data) {
            var classificationsToActivate = JSON.parse(data);
            for (var i = 0; i < classificationsToActivate.length; i++) {
                for (var j = 0; j < classifications.length; j++) {
                    if (classifications[j].id === classificationsToActivate[i]) {
                        classifications[j].status = false;
                        break;
                    }
                }
            }
            return [200, response.setResponse(true)];
        });

    });
};