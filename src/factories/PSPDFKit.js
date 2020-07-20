module.exports = function (app) {
    app.factory('PSPDFKit', function () {
        return require('pspdfkit');
    });
};
