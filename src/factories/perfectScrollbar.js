module.exports = function (app) {
    require('perfect-scrollbar/dist/css/perfect-scrollbar.css');
    app.factory('perfectScrollbar',function () {
        'ngInject';
        return require('perfect-scrollbar');
    });
};