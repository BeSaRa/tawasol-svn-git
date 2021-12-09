/**
 * this directive prevent the user from write any character not specified inside selected pattern.
 */
module.exports = function (app) {
    /**
     * @description Allows user to enter input following the specified pattern
     */
    app.directive('inputLimitDirective', function () {
        'ngInject';
        return {
            restrict: 'A',
            link: function (scope, ele, attrs) {
                var limit = attrs.inputLimitDirective;

                var list = {
                    N: '0123456789',
                    ND: '0123456789.',
                    AEN: ' -/0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZابتثجحخدذرزسشصضطظعغفقكلمنهوىيهءةأؤئلألإ',
                    AES: ' abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZابتثجحخدذرزسشصضطظعغفقكلمنهوىيهءةأؤئلألإ',
                    ANS: ' -/0123456789ابتثجحخدذرزسشصضطظعغفقكلمنهوىيهةءأؤئلألإ',
                    A: ' اـ_إبتثجحخدذرزسشصضطظعغفقكلمنهوىيهةءأؤئلألإ',
                    E: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ ',
                    AE: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZابتثجحخدذرزسشصضطظعغفقكلمنهوىيهءةأؤئلألإ',
                    ALL: '0123456789./\\ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzاأبتثجحخدذرزسشظقكلمنهوي',
                    E_: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_',
                    NP: '+0123456789',
                    AN:' اـ_إبتثجحخدذرزسشصضطظعغفقكلمنهوىيهةءأؤئلألإ1234567890',
                    EN: '1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ '
                };

                var limitTo = limit;


                ele.on('keypress', function (e) {
                    var k = e.keyCode || e.which;

                    if (!list.hasOwnProperty(typeof limitTo === 'string' ? limitTo.toUpperCase() : '')) return true;
                    var AllowableCharacters = list[limitTo];

                    if (k !== 13 && k !== 8 && k !== 0) {
                        if ((e.ctrlKey === false) && (e.altKey === false)) {
                            return (AllowableCharacters.indexOf(String.fromCharCode(k)) !== -1);
                        }
                    }
                    return true;
                });
            }
        }
    });
};