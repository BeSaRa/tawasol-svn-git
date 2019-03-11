module.exports = function (app) {
    app.filter('translatedNameFilter', function (_, langService) {
        'ngInject';
        return function (records, searchText, searchCallback) {
            if (!searchText)
                return records;
            return _.filter(records, function (record) {
                var recordText = '';
                if (searchCallback) {
                    recordText = record[searchCallback](langService.current);
                }
                else {
                    recordText = record.getNameByLanguage(langService.current);
                }
                if (recordText && recordText.length)
                    return recordText.toLowerCase().indexOf(searchText.toLowerCase()) !== -1;
                return false;
            });
        };
    });
};
