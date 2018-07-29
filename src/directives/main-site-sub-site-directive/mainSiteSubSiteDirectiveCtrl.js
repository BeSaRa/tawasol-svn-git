module.exports = function (app) {
    app.controller('mainSiteSubSiteDirectiveCtrl', function (cmsTemplate,
                                                             correspondenceService,
                                                             $q,
                                                             dialog) {
        'ngInject';
        var self = this;

        self.controllerName = 'mainSiteSubSiteDirectiveCtrl';

        self.showCorrespondenceSites = function () {
            return self.item.getInfo().documentClass !== 'internal';
        };

        self.viewCorrespondenceSites = function ($event) {
            var info = self.item.getInfo();
            if (self.type && self.type.toLowerCase() === 'g2g') {
                return dialog.showDialog({
                    template: cmsTemplate.getPopup('manage-grid-correspondence-sites'),
                    controller: 'manageGridCorrespondenceSitesPopCtrl',
                    targetEvent: $event || false,
                    controllerAs: 'ctrl',
                    bindToController: true,
                    escapeToClose: false,
                    locals: {
                        documentSubject: info.title,
                        type: self.type.toLowerCase(),
                        correspondence: self.item.correspondence,
                        sites: []
                    }
                });
            }
            else if (self.type && self.type.toLowerCase() === 'g2gmessaginghistory') {
                return dialog.showDialog({
                    template: cmsTemplate.getPopup('manage-grid-correspondence-sites'),
                    controller: 'manageGridCorrespondenceSitesPopCtrl',
                    targetEvent: $event || false,
                    controllerAs: 'ctrl',
                    bindToController: true,
                    escapeToClose: false,
                    locals: {
                        documentSubject: info.title,
                        type: self.type.toLowerCase(),
                        correspondence: self.item,
                        sites: []
                    }
                });
            }else {
                var defer = $q.defer();
                return dialog.showDialog({
                    template: cmsTemplate.getPopup('manage-grid-correspondence-sites'),
                    controller: 'manageGridCorrespondenceSitesPopCtrl',
                    targetEvent: $event || false,
                    controllerAs: 'ctrl',
                    bindToController: true,
                    escapeToClose: false,
                    locals: {
                        fromDialog: true,
                        vsId: info.vsId,
                        documentClass: info.documentClass,
                        documentSubject: info.title
                    },
                    resolve: {
                        correspondence: function () {
                            'ngInject';
                            return correspondenceService
                                .loadCorrespondenceByVsIdClass(info.vsId, info.documentClass)
                                .then(function (correspondence) {
                                    defer.resolve(correspondence);
                                    return correspondence;
                                });
                        },
                        sites: function (correspondenceService) {
                            'ngInject';
                            if (info.documentClass.toLowerCase() === 'incoming') {
                                return [];
                            }
                            return defer.promise.then(function (correspondence) {
                                return correspondenceService
                                    .loadCorrespondenceSites(correspondence)
                            });
                        }
                    }
                });
            }
        };
    });
};