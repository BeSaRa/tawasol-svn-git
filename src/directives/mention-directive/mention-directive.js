module.exports = function (app) {
    app.directive('mentionDirective', function ($timeout) {
        'ngInject';
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                $timeout(function () {
                    $(element)
                        .textcomplete([{
                                match: /\B@(\w*)$/,
                                search: function (term, callback) {
                                    callback($.map(scope.$eval(attrs.mentionDirective), function (word) {
                                        return word.toLowerCase().indexOf(term.toLowerCase()) === 0 ? word : null;
                                    }));
                                },
                                index: 1,
                                replace: function (word) {
                                    return '#{' + word + '}';
                                }
                        }])
                        .overlay([
                            {
                                match: /\B(#{)\w+}/g,
                                css: {
                                    'background-color': '#d8dfea'
                                }
                            }
                        ]);
                }, 500);

                /*$timeout(function () {
                    $(element)
                        .textcomplete(
                            [
                                { // tech companies
                                    id: 'tech-companies',
                                    mentions: [
                                        'DocumentSubject',
                                        'CurrentDate',
                                        'DocumentCreationDate',
                                        'DocumentApprovalDate',
                                        'EntityName',
                                        'EntityIdentifier'
                                    ],
                                    match: /\B@(\w*)$/,
                                    search: function (term, callback) {
                                        callback($.map(this.mentions, function (word) {
                                            return word.toLowerCase().indexOf(term.toLowerCase()) === 0 ? word : null;
                                        }));
                                    },
                                    index: 1,
                                    replace: function (word) {
                                        return '@' + word + '@';
                                    }
                                }
                            ]
                        )
                        .overlay([
                            {
                                match: /\B@\w+@/g,
                                css: {
                                    'background-color': '#d8dfea'
                                }
                            }
                        ]);
                }, 500);*/
            }
        }
    })
};
