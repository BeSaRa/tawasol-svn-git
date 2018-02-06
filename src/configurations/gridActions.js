module.exports = function (app) {
    app.config(function (CMSActionProvider) {
        'ngInject';
        CMSActionProvider
            .addActionGroup('userInbox');
    });
};