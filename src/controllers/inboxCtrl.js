module.exports = function (app) {
    app.controller('inboxCtrl', function (langService) {
        'ngInject';
        var self = this;
        self.controllerName = 'inboxCtrl';
        self.selectedEmails = [];
        self.copy=[];
        self.emails = [{
            'subject': 'Document Titles 1',
            'serial': '12345/2017',
            'received': '1/8/2017',
            'due': '21/05/17',
            'sender': 'Another sender 1',
            'mainSite': 'Main Name 1',
            'subSite': 'Sub Name 1',
            'days': '1'
        },{
            'subject': 'Document Titles 2',
            'serial': '54321/2017',
            'received': '2/8/2017',
            'due': '22/05/17',
            'sender': 'Another sender 2',
            'mainSite': 'Main Name 2',
            'subSite': 'Sub Name 2',
            'days': '2'
        },{
            'subject': 'Document Titles 3',
            'serial': '45213/2017',
            'received': '3/8/2017',
            'due': '23/05/17',
            'sender': 'Another sender 3',
            'mainSite': 'Main Name 3',
            'subSite': 'Sub Name 3',
            'days': '3'
        },{
            'subject': 'Document Titles 4',
            'serial': '23512/2017',
            'received': '4/8/2017',
            'due': '24/05/17',
            'sender': 'Another sender 4',
            'mainSite': 'Main Name 4',
            'subSite': 'Sub Name 4',
            'days': '4'
        }];
        self.copy = angular.copy(self.emails);
        /**
         * @description pagination for grid
         */
        self.grid = {
            limit: 10, // default limit
            page: 1, // first page
            //order: 'arName', // default sorting order
            order: '', // default sorting order
            limitOptions: [5, 10, 20, // limit options
                {
                    label: langService.get('all'),
                    value: function () {
                        return (self.emails.length + 21)
                    }
                }
            ]
        };
        /**
         * @description reload the updated emails
         */
        self.reloadEmails= function () {
            self.emails = angular.copy(self.copy);
        };
        /**
         * @description remove email
         * @param email
         */
        self.removeInboxEmailFrmCtrl= function (email) {
            var index = self.emails.indexOf(email);
            self.emails.splice(index, 1);
        };
        /**
         * @description remove inbox email in bulk
         */
        self.removeInboxEmailBulkFrmCtrl = function()
        {
            for(var i in self.selectedEmails)
            {
                self.removeInboxEmailFrmCtrl(self.selectedEmails[i]);
            }
            self.selectedEmails=[];
        };
    });
};