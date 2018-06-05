module.exports = function (app) {

    function _filterRole(role, text) {
        var arabic = role.arName.toLowerCase(),
            english = role.enName.toLowerCase();
        text = text.toLowerCase();
        return arabic && arabic.indexOf(text) !== -1 || english && english.indexOf(text) !== -1
    }


    app.filter('roleFilter', function (_) {
        'ngInject';
        return function (array, search) {
            return _.filter(array, function (item) {
                return search ? _filterRole(item, search) : item;
            });
        }
    });
};