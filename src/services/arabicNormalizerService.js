module.exports = function (app) {
    app.service('arabicNormalizerService', function (customValidationService, _) {
        'ngInject';
        var self = this;

        self.rules = [
            {regex: /\ufc5e/, value: '\u0020\u064c\u0651'},// ligature shadda with  // dammatan isloated
            {regex: /\ufc5f/, value: '\u0020\u064d\u0651'}, // ligature shadda with // kasratan isloated
            {regex: /\ufc60/, value: '\u0020\u064e\u0651'},// ligature shadda with // fatha isloated
            {regex: /\ufc61/, value: '\u0020\u064f\u0651'},  // ligature shadda with // damma isloated
            {regex: /\ufc62/, value: '\u0020\u0650\u0651'},// ligature shadda with // kasra isloated
            // Arabic Presentation Form-B to Logical Form
            {regex: /\ufe80/, value: '\u0621'},// isolated hamza
            {regex: /[\ufe81\ufe82]/, value: '\u0622'},// alef with madda
            {regex: /[\ufe83\ufe84]/, value: '\u0623'}, // alef with hamza above
            {regex: /[\ufe85\ufe86]/, value: '\u0624'}, // waw with hamza above}

            {regex: /[\ufe87\ufe88]/, value: '\u0625'}, // alef with hamza below
            {regex: /[\ufe89\ufe8a\ufe8b\ufe8c]/, value: '\u0626'}, // yeh with hamza
            // above
            {regex: /[\ufe8d\ufe8e]/, value: '\u0627'}, // alef
            {regex: /[\ufe8f\ufe90\ufe91\ufe92]/, value: '\u0628'}, // beh
            {regex: /[\ufe93\ufe94\u0629]/, value: '\u0647'}, // teh marbuta
            {regex: /[\ufe95\ufe96\ufe97\ufe98]/, value: '\u062a'}, // teh
            {regex: /[\ufe99\ufe9a\ufe9b\ufe9c]/, value: '\u062b'}, // theh
            {regex: /[\ufe9d\ufe9e\ufe9f\ufea0]/, value: '\u062c'}, // jeem
            {regex: /[\ufea1\ufea2\ufea3\ufea4]/, value: '\u062d'}, // haa
            {regex: /[\ufea5\ufea6\ufea7\ufea8]/, value: '\u062e'}, // khaa
            {regex: /[\ufea9\ufeaa]/, value: '\u062f'}, // dal
            {regex: /[\ufeab\ufeac]/, value: '\u0630'}, // dhal
            {regex: /[\ufead\ufeae]/, value: '\u0631'}, // reh
            {regex: /[\ufeaf\ufeb0]/, value: '\u0632'}, // zain
            {regex: /[\ufeb1\ufeb2\ufeb3\ufeb4]/, value: '\u0633'}, // seen
            {regex: /[\ufeb5\ufeb6\ufeb7\ufeb8]/, value: '\u0634'}, // sheen
            {regex: /[\ufeb9\ufeba\ufebb\ufebc]/, value: '\u0635'}, // sad
            {regex: /[\ufebd\ufebe\ufebf\ufec0]/, value: '\u0636'}, // dad
            {regex: /[\ufec1\ufec2\ufec3\ufec4]/, value: '\u0637'}, // tah
            {regex: /[\ufec5\ufec6\ufec7\ufec8]/, value: '\u0638'}, // zah
            {regex: /[\ufec9\ufeca\ufecb\ufecc]/, value: '\u0639'}, // ain
            {regex: /[\ufecd\ufece\ufecf\ufed0]/, value: '\u063a'}, // ghain
            {regex: /[\ufed1\ufed2\ufed3\ufed4]/, value: '\u0641'}, // feh
            {regex: /[\ufed5\ufed6\ufed7\ufed8]/, value: '\u0642'}, // qaf
            {regex: /[\ufed9\ufeda\ufedb\ufedc]/, value: '\u0643'}, // kaf
            {regex: /[\ufedd\ufede\ufedf\ufee0]/, value: '\u0644'}, // ghain
            {regex: /[\ufee1\ufee2\ufee3\ufee4]/, value: '\u0645'}, // meem
            {regex: /[\ufee5\ufee6\ufee7\ufee8]/, value: '\u0646'}, // noon
            {regex: /[\ufee9\ufeea\ufeeb\ufeec]/, value: '\u0647'}, // heh
            {regex: /[\ufeed\ufeee\u0624]/, value: '\u0648'}, // waw
            {regex: /[\ufeef\ufef0]/, value: '\u0649'}, // alef maksura
            {regex: /[\ufef1\ufef2\ufef3\ufef4]/, value: '\u064a'}, // yeh
            {regex: /[\ufef5\ufef6]/, value: '\u0644\u0622'}, // ligature: lam and alef // with madda above
            {regex: /[\ufef7\ufef8]/, value: '\u0644\u0623'}, // ligature: lam and alef // with hamza above
            {regex: /[\ufef9\ufefa]/, value: '\u0644\u0625'}, // ligature: lam and alef // with hamza below
            {regex: /[\ufefb\ufefc]/, value: '\u0644\u0627'}, // ligature: lam and alef

            {regex: /[\u0622\u0623\u0625]/, value: '\u0627'}, // hamza normalization: // maddah-n-alef, // hamza-on-alef, // hamza-under-alef // mapped to bare alef

            {regex: /[\u0649]/, value: '\u064A'}, // 'alif maqSuura mapped to yaa

            {regex: /[\u064B\u064C\u064D\u064E\u064F\u0650\u0651\u0652\u0653\u0670]/, value: ''}, // fatHatayn,
            // Dammatayn, // kasratayn, // fatHa, // Damma, // kasra, // shaddah,// sukuun,// and // dagger // alef // (delete)

            {regex: /\u0640(?=\s*\S)/, value: ''}, // tatweel, delete except when  // trailing
            {regex: /(\S)\u0640/, value: '$1'}, // tatweel, delete if preceeded by // non-white-space
            {regex: /[\ufeff\u00a0]/, value: ' '}, // white space normalization
            // punctuation normalization
            {regex: /\u060c/, value: ','}, // Arabic comma
            {regex: /\u061b/, value: ';'}, // Arabic semicolon
            {regex: /\u061f/, value: '?'}, // Arabic question mark
            {regex: /\u066a/, value: '%'}, // Arabic percent sign
            {regex: /\u066b/, value: '.'}, // Arabic decimal separator
            {regex: /\u066c/, value: ','}, // Arabic thousand separator (comma)
            {regex: /\u066d/, value: '*'}, // Arabic asterisk
            {regex: /\u06d4/, value: '.'}, // Arabic full stop

            // Arabic/Arabic indic/eastern Arabic/ digits normalization

            {regex: /[\u0660\u06f0\u0966]/, value: '0'},
            {regex: /[\u0661\u06f1\u0967]/, value: '1'},
            {regex: /[\u0662\u06f2\u0968]/, value: '2'},
            {regex: /[\u0663\u06f3\u0969]/, value: '3'},
            {regex: /[\u0664\u06f4\u096a]/, value: '4'},
            {regex: /[\u0665\u06f5\u096b]/, value: '5'},
            {regex: /[\u0666\u06f6\u096c]/, value: '6'},
            {regex: /[\u0667\u06f7\u096d]/, value: '7'},
            {regex: /[\u0668\u06f8\u096e]/, value: '8'},
            {regex: /[\u0669\u06f9\u096f]/, value: '9'},

            // Arabic combining hamza above/below and dagger(superscript) alef
            {regex: /[\u0654\u0655\u0670]/, value: ''},

            // replace yaa followed by hamza with hamza on kursi (yaa)
            {regex: /\u064A\u0621/, value: '\u0626'},

            // Normalization Rules Suggested by Ralf Brown (CMU):

            {regex: /\u2013/, value: '-'}, // EN-dash to ASCII hyphen
            {regex: /\u2014/, value: '--'}, // EM-dash to double ASII hyphen

            // code point 0x91 - latin-1 left single quote
            // code point 0x92 - latin-1 right single quote
            // code point 0x2018 = left single quote; convert to ASCII single quote
            // code point 0x2019 = right single quote; convert to ASCII single quote

            {regex: /[\u0091\u0092\u2018\u2019]/, value: '\''},

            // code point 0x93 - latin-1 left double quote
            // code point 0x94 - latin-1 right double quote
            // code points 0x201C/201D = left/right double quote -> ASCII double
            // quote

            //Remove special charachters
            {regex: /['\",;:{}?\[\]<>\\\|/\\+\.!@#\$%\^&\*\(\)=-]/, value: ''},
            // Remove White Spaces
            {regex: /\s+/, value: ' '},
            {regex: /[\u0093\u0094\u201C\u201D]/, value: '\"'},
        ];

        self.normalize = function (searchCriteria, joinStr) {
            if (!searchCriteria) {
                return searchCriteria;
            }

            searchCriteria = searchCriteria.toLowerCase();
            var searchCriteriaWords = searchCriteria.split(/\s+/);
            var normalizedWords = [];
            searchCriteriaWords.forEach(function (word) {
                if (word && customValidationService.validateInput(word, 'A')) {
                    _.forEach(self.rules, function (rule) {
                        if (rule.regex.test(word)) {
                            word = _.replace(word, new RegExp(rule.regex, "g"), rule.value);
                        }
                    });

                    normalizedWords.push(word);
                } else {
                    normalizedWords.push(word);
                }
            });

            return normalizedWords.join(joinStr);
        }
    })
};
