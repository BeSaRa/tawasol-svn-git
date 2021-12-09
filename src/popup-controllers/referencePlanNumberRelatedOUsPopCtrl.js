module.exports = function (app) {
    app.controller('referencePlanNumberRelatedOUsPopCtrl', function (lookupService,
                                                                     referencePlanNumberService,
                                                                     $q,
                                                                     $filter,
                                                                     langService,
                                                                     organizations,
                                                                     referencePlanNumber,
                                                                     toast,
                                                                     dialog) {
        'ngInject';
        var self = this;

        self.controllerName = 'referencePlanNumberRelatedOUsPopCtrl';
        self.referencePlanNumber = referencePlanNumber;
        self.progress = null;
        self.organizations = organizations;
        /**
         * @description All reference plan number related organization units
         * @type {*}
         */
        // self.referencePlanNumberRelatedOUsPops = referencePlanNumberRelatedOUsPops;

        /**
         * @description Contains the selected reference plan number related organization units
         * @type {Array}
         */
        self.selectedReferencePlanNumberRelatedOUsPops = [];

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedData = function () {
            self.organizations = $filter('orderBy')(self.organizations, self.grid.order);
        };

        /**
         * @description Contains options for grid configuration
         * @type {{limit: number, page: number, order: string, limitOptions: [*]}}
         */
        self.grid = {
            limit: 5, // default limit
            page: 1, // first page
            //order: 'arName', // default sorting order
            order: '', // default sorting order
            limitOptions: [5, 10, 20, // limit options
                {
                    label: langService.get('all'),
                    value: function () {
                        return (self.organizations.length + 21);
                    }
                }
            ]
        };

    });
};