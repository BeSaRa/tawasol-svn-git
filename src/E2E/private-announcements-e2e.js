module.exports = function (app) {
    app.run(function ($httpBackend, urlService, generator, Response, PrivateAnnouncement) {
        'ngInject';
        var urlWithId = new RegExp(urlService.privateAnnouncements + '\/(\\d+)');
        var urlActivateWithId = new RegExp(urlService.privateAnnouncements + '/activate' + '\/(\\d+)');
        var urlDeactivateWithId = new RegExp(urlService.privateAnnouncements + '/deactivate' + '\/(\\d+)');

        var privateAnnouncements = [{
            "id": 12,
            "creator": 1,
            "startDate": "2017-07-11",
            "endDate": "2017-07-26",
            "status": true,
            "arSubject": "حقهرشفث شىىخعىؤثةثىف 101",
            "enSubject": "private announcement 101",
            "arBody": "<div><!--block-->private announcement 101</div>",
            "enBody": "<div><!--block-->private announcement 101</div>",
            "itemOrder": 1,
            "creationDate": 1500997247650,
            "subscribers": [{"id": 27, "ouId": 1, "relatedOu": null, "announcementType": 0, "withSubOus": false}],
            "creatorApplicationUser": null
        }, {
            "id": 13,
            "creator": 1,
            "startDate": "2017-07-04",
            "endDate": "2017-07-27",
            "status": true,
            "arSubject": "حقهرشفث شىىخعىؤثةثىف 102",
            "enSubject": "private announcement 102",
            "arBody": "<div><!--block-->حقهرشفث شىىخعىؤثةثىف 102</div>",
            "enBody": "<div><!--block-->private announcement 102</div>",
            "itemOrder": 2,
            "creationDate": 1500997434213,
            "subscribers": [{
                "id": 31,
                "ouId": 2,
                "relatedOu": null,
                "announcementType": 1,
                "withSubOus": false
            },
                {"id": 28, "ouId": 1, "relatedOu": null, "announcementType": 0, "withSubOus": true}, {
                    "id": 29,
                    "ouId": 75,
                    "relatedOu": null,
                    "announcementType": 1,
                    "withSubOus": false
                },
                {"id": 30, "ouId": 76, "relatedOu": null, "announcementType": 1, "withSubOus": false},
                {
                    "id": 32,
                    "ouId": 5,
                    "relatedOu": null,
                    "announcementType": 1,
                    "withSubOus": false
                }],
            "creatorApplicationUser": null
        }];

        var response = new Response();

        // get all privateAnnouncements
        $httpBackend
            .whenGET(urlService.privateAnnouncements)
            .respond(function () {
                return [200, response.setResponse(privateAnnouncements)];
            });

        // add new privateAnnouncement
        $httpBackend
            .whenPOST(urlService.privateAnnouncements)
            .respond(function (method, url, data) {
                var privateAnnouncement = JSON.parse(data);
                // create new id for model
                privateAnnouncement.id = generator.createNewID(privateAnnouncements, 'id');

                // push model to collections
                privateAnnouncements.push(privateAnnouncement);
                return [200, response.setResponse(privateAnnouncement.id)];
            });

        // edit privateAnnouncement
        $httpBackend.whenPUT(urlService.privateAnnouncements)
            .respond(function (method, url, data) {
                var privateAnnouncement = new PrivateAnnouncement(JSON.parse(data));

                for (var i = 0; i < privateAnnouncements.length; i++) {
                    if (privateAnnouncements[i].id === privateAnnouncement.id) {
                        privateAnnouncements[i] = privateAnnouncement;
                        break;
                    }
                }

                return [200, response.setResponse(privateAnnouncement)];
            });

        // delete privateAnnouncements bulk
        $httpBackend.whenDELETE(urlService.privateAnnouncements + '/bulk').respond(function (method, url, data) {
            var privateAnnouncementsToDelete = JSON.parse(data);

            for (var i = 0; i < privateAnnouncementsToDelete.length; i++) {
                for (var j = 0; j < privateAnnouncements.length; j++) {
                    if (privateAnnouncements[j].id === privateAnnouncementsToDelete[i]) {
                        privateAnnouncements.splice(j, 1);
                        break;
                    }
                }
            }
            return [200, response.setResponse(true)];
        });

        // delete privateAnnouncement single
        $httpBackend.whenDELETE(function (url) {
            return urlWithId.test(url);
        }).respond(function (method, url, data) {
            var id = url.split('/').pop();
            for (var i = 0; i < privateAnnouncements.length; i++) {
                if (privateAnnouncements[i].id === parseInt(id)) {
                    privateAnnouncements.splice(i, 1);
                }
            }
            return [200, response.setResponse(true)];
        });

        // activate privateAnnouncement status single
        $httpBackend.whenPUT(function (url) {
            return urlActivateWithId.test(url);
        }).respond(function (method, url, data) {
            var id = url.split('/').pop();

            var privateAnnouncement = privateAnnouncements.filter(function (e) {
                return e.id === parseInt(id);
            })[0];

            privateAnnouncement.status = true;

            return [200, response.setResponse(true)];
        });

        // deactivate privateAnnouncement status single
        $httpBackend.whenPUT(function (url) {
            return urlDeactivateWithId.test(url);
        }).respond(function (method, url, data) {
            var id = url.split('/').pop();

            var privateAnnouncement = privateAnnouncements.filter(function (e) {
                return e.id === parseInt(id);
            })[0];

            privateAnnouncement.status = false;

            return [200, response.setResponse(true)];
        });

        // activate privateAnnouncement status bulk
        $httpBackend.whenPUT((urlService.privateAnnouncements + '/activate/bulk')).respond(function (method, url, data) {
            var privateAnnouncementsToActivate = JSON.parse(data);
            for (var i = 0; i < privateAnnouncementsToActivate.length; i++) {
                for (var j = 0; j < privateAnnouncements.length; j++) {
                    if (privateAnnouncements[j].id === privateAnnouncementsToActivate[i]) {
                        privateAnnouncements[j].status = true;
                        break;
                    }
                }
            }
            return [200, response.setResponse(true)];
        });

        // Deactivate privateAnnouncement status bulk
        $httpBackend.whenPUT((urlService.privateAnnouncements + '/deactivate/bulk')).respond(function (method, url, data) {
            var privateAnnouncementsToActivate = JSON.parse(data);
            for (var i = 0; i < privateAnnouncementsToActivate.length; i++) {
                for (var j = 0; j < privateAnnouncements.length; j++) {
                    if (privateAnnouncements[j].id === privateAnnouncementsToActivate[i]) {
                        privateAnnouncements[j].status = false;
                        break;
                    }
                }
            }
            return [200, response.setResponse(true)];
        });


    })
};
