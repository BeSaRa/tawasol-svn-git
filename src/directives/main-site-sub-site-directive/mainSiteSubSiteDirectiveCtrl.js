module.exports = function (app) {
    app.controller('mainSiteSubSiteDirectiveCtrl', function (cmsTemplate,
                                                             correspondenceService,
                                                             $q,
                                                             dialog) {
        'ngInject';
        var self = this;

        self.controllerName = 'mainSiteSubSiteDirectiveCtrl';

        self.hasIndicator = function () {
            return self.item.internalSiteIndicator || self.item.externalSiteIndicator || self.item.g2gSiteIndicator;
        }

        self.showCorrespondenceSites = function () {
            return self.item.getInfo().documentClass !== 'internal';
        };

        self.viewCorrespondenceSites = function ($event) {
            correspondenceService.viewCorrespondenceSites(self.item, self.type, $event);
        }
    });
};
