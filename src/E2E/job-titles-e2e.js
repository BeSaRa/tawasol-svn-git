module.exports = function (app) {
    app.run(function ($httpBackend, urlService, generator, Response, JobTitle) {
        'ngInject';
        var urlWithId = new RegExp(urlService.jobTitles + '\/(\\d+)');
        var urlActivateWithId = new RegExp(urlService.jobTitles + '/activate' + '\/(\\d+)');
        var urlDeactivateWithId = new RegExp(urlService.jobTitles + '/deactivate' + '\/(\\d+)');

        var jobTitles = [{
            "lookupKey": 2,
            "lookupStrKey": "FrontendDeveloper",
            "arName": "Frontend Developer",
            "enName": "Frontend Developers",
            "status": true,
            "parent": null,
            "itemOrder": 2,
            "category": 0,
            "id": 108
        }, {
            "lookupKey": 3,
            "lookupStrKey": null,
            "arName": "مهندس",
            "enName": "welcome",
            "status": true,
            "parent": null,
            "itemOrder": 3,
            "category": 0,
            "id": 222
        }, {
            "lookupKey": 4,
            "lookupStrKey": "565",
            "arName": "عميد",
            "enName": "General",
            "status": true,
            "parent": null,
            "itemOrder": 4,
            "category": 0,
            "id": 223
        }];

        var response = new Response();

        // get all jobTitles
        $httpBackend
            .whenGET(urlService.jobTitles)
            .respond(function () {
                return [200, response.setResponse(jobTitles)];
            });

        // add new jobTitle
        $httpBackend
            .whenPOST(urlService.jobTitles)
            .respond(function (method, url, data) {
                var jobTitle = JSON.parse(data);
                // create new id for model
                jobTitle.id = generator.createNewID(jobTitles, 'id');

                // push model to collections
                jobTitles.push(jobTitle);
                return [200, response.setResponse(jobTitle.id)];
            });

        // edit jobTitle
        $httpBackend.whenPUT(urlService.jobTitles)
            .respond(function (method, url, data) {
                var jobTitle = new JobTitle(JSON.parse(data));

                for (var i = 0; i < jobTitles.length; i++) {
                    if (jobTitles[i].id === jobTitle.id) {
                        jobTitles[i] = jobTitle;
                        break;
                    }
                }

                return [200, response.setResponse(jobTitle)];
            });

        // delete jobTitles bulk
        $httpBackend.whenDELETE(urlService.jobTitles + '/bulk').respond(function (method, url, data) {
            var jobTitlesToDelete = JSON.parse(data);

            for (var i = 0; i < jobTitlesToDelete.length; i++) {
                for (var j = 0; j < jobTitles.length; j++) {
                    if (jobTitles[j].id === jobTitlesToDelete[i]) {
                        jobTitles.splice(j, 1);
                        break;
                    }
                }
            }
            return [200, response.setResponse(true)];
        });

        // delete jobTitle single
        $httpBackend.whenDELETE(function (url) {
            return urlWithId.test(url);
        }).respond(function (method, url, data) {
            var id = url.split('/').pop();
            for (var i = 0; i < jobTitles.length; i++) {
                if (jobTitles[i].id === parseInt(id)) {
                    jobTitles.splice(i, 1);
                }
            }
            return [200, response.setResponse(true)];
        });

        // activate jobTitle status single
        $httpBackend.whenPUT(function (url) {
            return urlActivateWithId.test(url);
        }).respond(function (method, url, data) {
            var id = url.split('/').pop();

            var jobTitle = jobTitles.filter(function (e) {
                return e.id === parseInt(id);
            })[0];

            jobTitle.status = true;

            return [200, response.setResponse(true)];
        });

        // deactivate jobTitle status single
        $httpBackend.whenPUT(function (url) {
            return urlDeactivateWithId.test(url);
        }).respond(function (method, url, data) {
            var id = url.split('/').pop();

            var jobTitle = jobTitles.filter(function (e) {
                return e.id === parseInt(id);
            })[0];

            jobTitle.status = false;

            return [200, response.setResponse(true)];
        });

        // activate jobTitle status bulk
        $httpBackend.whenPUT((urlService.jobTitles + '/activate/bulk')).respond(function (method, url, data) {
            var jobTitlesToActivate = JSON.parse(data);
            for (var i = 0; i < jobTitlesToActivate.length; i++) {
                for (var j = 0; j < jobTitles.length; j++) {
                    if (jobTitles[j].id === jobTitlesToActivate[i]) {
                        jobTitles[j].status = true;
                        break;
                    }
                }
            }
            return [200, response.setResponse(true)];
        });

        // Deactivate jobTitle status bulk
        $httpBackend.whenPUT((urlService.jobTitles + '/deactivate/bulk')).respond(function (method, url, data) {
            var jobTitlesToActivate = JSON.parse(data);
            for (var i = 0; i < jobTitlesToActivate.length; i++) {
                for (var j = 0; j < jobTitles.length; j++) {
                    if (jobTitles[j].id === jobTitlesToActivate[i]) {
                        jobTitles[j].status = false;
                        break;
                    }
                }
            }
            return [200, response.setResponse(true)];
        });


    })
};
