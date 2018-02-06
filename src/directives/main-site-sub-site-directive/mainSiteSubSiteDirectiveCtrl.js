module.exports = function (app) {
    app.controller('mainSiteSubSiteDirectiveCtrl', function (/*mainSiteInfo,
                                                             subSiteInfo,*/
                                                             Information,
                                                             $timeout,
                                                             generator) {
        'ngInject';
        var self = this;

        self.controllerName = 'mainSiteSubSiteDirectiveCtrl';

        $timeout(function () {
            self.mainSite = (self.mainSiteInfo.length) ? generator.generateCollection(self.mainSiteInfo, Information) : new Array(new Information());
            self.subSite = (self.subSiteInfo.length) ? generator.generateCollection(self.subSiteInfo, Information) : new Array(new Information());
            self.mainSubSites = self.separateParentChild(self.mainSite, self.subSite);
        });

        self.separateParentChild = function (parents, children) {
            _.map(children, function (child) {
                if (child.id) {
                    var parent = _.find(parents, {id: child.parent});
                    if (!parent.hasOwnProperty('children'))
                        parent.children = [];
                    parent.children.push(child);
                }
                return true;
            });
            return parents;
        };

    });
};