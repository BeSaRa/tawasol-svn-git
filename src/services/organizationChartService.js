module.exports = function (app) {
    app.service('organizationChartService', function (_) {
        'ngInject';
        var self = this;
        self.serviceName = 'organizationChartService';
        // all organizations
        self.organizations = [];
        // root organization
        self.rootOrganizations = [];
        // children organizations
        self.childrenOrganizations = {};

        /**
         * get current hierarchy
         * @return {*|{}}
         */
        self.getHierarchy = function () {
            return self.rootOrganizations;
        };
        /**
         * @description create hierarchy for the organization tree.
         * @returns {*|Organization}
         */
        self.createHierarchy = function (organizations) {
            self.organizations = angular.copy(organizations);
            return self.emptyParentsAndChildren().separateRootFromChild().getChildrenForParents().getHierarchy();
        };
        /**
         * @description empty parents and children.
         * @returns {organizationService}
         */
        self.emptyParentsAndChildren = function () {
            self.rootOrganizations = [];
            self.childrenOrganizations = {};
            return self;
        };
        /**
         * @description separate root node from others children.
         * @returns {organizationService}
         */
        self.separateRootFromChild = function () {
            if (!self.organizations)
                return self;

            _.map(self.organizations, function (organization) {
                // if it is root
                if (!organization.parent) {
                    // self.rootOrganizations = organization;
                    self.rootOrganizations.push(organization);
                } else {
                    // if it is child
                    var parent = organization.parent.hasOwnProperty('id') ? organization.parent.id : organization.parent;
                    if (!self.childrenOrganizations.hasOwnProperty(parent)) {
                        self.childrenOrganizations[parent] = [];
                    }
                    self.childrenOrganizations[parent].push(organization);
                }
                return organization;
            });
            return self;
        };
        /**
         * get children organizations for given organization
         * @param organization
         * @return {*|Array}
         */
        self.getChildrenOrganization = function (organization) {
            var id = organization.id;
            if (self.childrenOrganizations.hasOwnProperty(id)) {
                for (var i = 0; i < self.childrenOrganizations[id].length; i++) {
                    self.childrenOrganizations[id][i].children = self.getChildrenOrganization(self.childrenOrganizations[id][i]);
                }
            }
            return self.childrenOrganizations[id] || [];
        };
        /**
         * get children for root organization
         * @return {*}
         */
        self.getChildrenForParents = function () {
            if (!self.organizations)
                return self;

            _.map(self.rootOrganizations, function (value, index) {
                self.rootOrganizations[index].children = self.getChildrenOrganization(self.rootOrganizations[index]);
            });
            return self;
        }
    });
};