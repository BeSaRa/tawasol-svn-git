module.exports = function (app) {
    app.run(function ($httpBackend) {
        'ngInject';
        $httpBackend.whenPOST(/.*/).passThrough();
        $httpBackend.whenGET(/.*/).passThrough();
        $httpBackend.whenPUT(/.*/).passThrough();
        $httpBackend.whenDELETE(/.*/).passThrough();
        $httpBackend.whenJSONP(/.*/).passThrough();
        $httpBackend.whenPATCH(/.*/).passThrough();
        $httpBackend.whenHEAD(/.*/).passThrough();
    })
};