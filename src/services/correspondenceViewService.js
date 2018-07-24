module.exports = function (app) {
    app.service('correspondenceViewService', function (urlService,
                                                       $http,
                                                       $q,
                                                       generator,
                                                       SiteView,
                                                       _) {
        'ngInject';
        var self = this;
        self.serviceName = 'correspondenceViewService';

        self.correspondenceViews = [];

        self.parents = [];
        self.children = {};

        function _createSearchUrl(searchType, details) {
            var url = [];

            // _.map(details, function (value, key) {
            //     url.push(key + '=' + (value ? value : ''));
            // });
            // return (urlService.correspondenceViews + '/search/' + searchType  + '?' + url.join('&'));
            return urlService.correspondenceViews + '/search/' + searchType /* + '?' + url.join('&')*/;
        }

        //cms-entity/correspondence/correspondence-site-view/search/main?criteria=1&type=1

        /**
         * search for correspondence sites.
         * @param searchType
         * @param details
         */
        self.correspondenceSiteSearch = function (searchType, details) {
            var url = _createSearchUrl(searchType, details);
            return $http.post(url, details).then(function (result) {
                var siteViews = generator.generateCollection(result.data.rs, SiteView, self._sharedMethods);
                return generator.interceptReceivedCollection('SiteView', siteViews);
            });
        };

        self.getCorrespondenceSitesByDistributionListId = function (distributionListId) {
            distributionListId = distributionListId.hasOwnProperty('id') ? distributionListId.id : distributionListId;
            return $http.get(urlService.distributionLists + '/get-core-sites/' + distributionListId).then(function (result) {
                var siteViews = generator.generateCollection(result.data.rs, SiteView, self._sharedMethods);
                return generator.interceptReceivedCollection('SiteView', siteViews);
            });
        };

        /**
         * @description load correspondenceViews from server.
         * @returns {Promise|correspondenceViews}
         */
        self.loadSiteViews = function () {
            return $http.get(urlService.correspondenceViews).then(function (result) {
                self.correspondenceViews = generator.generateCollection(result.data.rs, SiteView, self._sharedMethods);
                self.correspondenceViews = generator.interceptReceivedCollection('SiteView', self.correspondenceViews);
                return self.correspondenceViews;
            });
        };
        /**
         *
         */
        self.getParent = function () {
            self.parents = [];
            self.children = {};
            _.map(self.correspondenceViews, function (item) {
                if (item.parent) {
                    if (!self.children.hasOwnProperty(item.parent)) {
                        self.children[item.parent] = [];
                    }
                    self.children[item.parent].push(item);
                } else {
                    self.parents.push(item);
                }
            });
            return self;
        };

        self.getHierarchy = function () {
            for (var i = 0; i < self.parents.length; i++) {
                self.parents[i].children = self.children.hasOwnProperty(self.parents[i].id) ? self.children[self.parents[i].id] : [];
            }
            return self.parents;
        };
        /**
         *
         * @return {Array|*}
         */
        self.getSitesView = function () {
            return self.correspondenceViews;
        };

        /**
         * @description Get the global correspondence sites.
         * Used in organization structure for binding g2g Id(Code).
         */
        self.getGlobalCorrespondenceSitesForG2GId = function () {
            $http.get(urlService.adminCorrespondenceViews + '/g2g-codes')
                .then(function (result) {
                    result = generator.generateCollection(result.data.rs, SiteView);
                    result = generator.interceptReceivedCollection('SiteView', result);
                    return result;
                })
                .catch(function (error) {
                    return [];
                });
        }
    });
};
