module.exports = function (app) {
    app.factory('Outgoing', function (CMSModelInterceptor,
                                      generator,
                                      Site,
                                      Correspondence,
                                      Indicator) {
        'ngInject';
        return function Outgoing(model) {
            var self = this, correspondenceService;
            Correspondence.call(this);
            self.docClassName = 'Outgoing';
            self.classDescription = 'Outgoing';
            self.docStatus = 2; // by default
            self.sitesInfoTo = [];
            self.sitesInfoCC = [];
            self.ccSitesList = [];
            self.toSitesList = [];
            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);


            Outgoing.prototype.fetchOutgoingData = function () {
                var info = this.getInfo();
                this.sitesInfoCC = _.map(this.ccSitesList, function (item) {
                    item.docClassName = info.documentClass;
                    return generator.interceptReceivedInstance('Site', new Site(item));
                });
                this.sitesInfoTo = _.map(this.toSitesList, function (item) {
                    item.docClassName = info.documentClass;
                    return generator.interceptReceivedInstance('Site', new Site(item));
                });
            };

            Outgoing.prototype.updateSites = function () {
                correspondenceService = this.getCorrespondenceService();
                return correspondenceService.updateCorrespondenceSites(this);
            };

            Outgoing.prototype.hasSiteTO = function () {
                return this.sitesInfoTo && this.sitesInfoTo.length;
            };

            Outgoing.prototype.hasSiteCC = function () {
                return this.sitesInfoCC && this.sitesInfoCC.length;
            };

            var indicator = new Indicator();
            Outgoing.prototype.getIsPaperIndicator = function ($event) {
                return indicator.getIsPaperIndicator(this.addMethod);
            };

            Outgoing.prototype.getSecurityLevelIndicator = function (securityLevel) {
                return indicator.getSecurityLevelIndicator(securityLevel);
            };

            Outgoing.prototype.getDocClassIndicator = function () {
                return indicator.getDocClassIndicator('outgoing');
            };

            Outgoing.prototype.getPriorityLevelIndicator = function (priorityLevel) {
                return indicator.getPriorityLevelIndicator(priorityLevel);
            };


            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('Outgoing', 'init', this);
        }
    })
};