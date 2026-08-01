function uniCoder(textInput) {
    if (!textInput || textInput === "") return textInput;
    return textInput
        .replace(/aa/g, "ā")
        .replace(/ii/g, "ī")
        .replace(/uu/g, "ū")
        .replace(/\"n/g, "ṅ")
        .replace(/\~n/g, "ñ")
        .replace(/\.t/g, "ṭ")
        .replace(/\.d/g, "ḍ")
        .replace(/\.n/g, "ṇ")
        .replace(/\.m/g, "ṃ")
        .replace(/\.l/g, "ḷ")
        .replace(/\.h/g, "ḥ");
}

document.addEventListener('DOMContentLoaded', function() {
    let paliauto = document.getElementById("paliauto");

    if (paliauto) {
        paliauto.addEventListener("input", function () {
            let textInput = paliauto.value;
            let convertedText = uniCoder(textInput);
            paliauto.value = convertedText;
        });

        // Добавляем обработчик клика по пустому инпуту
        paliauto.addEventListener("click", function() {
            if (paliauto.value === "") {
                // Триггерим событие поиска с пустым запросом
                $(paliauto).autocomplete("search", "");
            }
        });
    }

    // Отслеживаем клик и фокус в главном поле поиска
    let searchBoxInput = document.getElementById("search-box");
    if (searchBoxInput) {
        const triggerEmptySearch = function() {
            if (searchBoxInput.value === "") {
                $(searchBoxInput).autocomplete("search", "");
            }
        };
        searchBoxInput.addEventListener("click", triggerEmptySearch);
        searchBoxInput.addEventListener("focus", triggerEmptySearch);
    }
 
  $.ajax({
        url: "./static/sutta_words.txt",
        dataType: "text",
        success: function(data) {
            var accentMap = {
                "ā": "a", "ī": "i", "ū": "u", "ḍ": "d", "ḷ": "l",
                "ṃ": "ṁ", "ṁ": "n", "ṁ": "m", "ṅ": "n", "ṇ": "n",
                "ṭ": "t", "ñ": "n", "ññ": "n", "ss": "s", "aa": "a",
                "ii": "i", "uu": "u", "dd": "d", "kk": "k", "ḍḍ": "d",
                "ḷḷ": "l", "ṇṇ": "n", "ṭṭ": "t", "cc": "c", "pp": "p",
                "cch": "c", "ch": "c", "kh": "k", "ph": "p", "th": "t", "ṭh": "t"
            };

            var normalize = function(term) {
                var ret = "";
                for (var i = 0; i < term.length; i++) {
                    ret += accentMap[term.charAt(i)] || term.charAt(i);
                }
                return ret;
            };

            var allWords = data.split('\n');
            
            // Защита от быстрого нажатия Enter (мгновенный перехват отправки)
            const ruToEnMap = {
                'а': 'f', 'в': 'd', 'е': 't', 'к': 'r', 'м': 'v',
                'н': 'y', 'о': 'j', 'п': 'g', 'р': 'h', 'с': 'c',
                'т': 'n', 'у': 'e', 'х': '[', 'ъ': ']', 'ы': 's',
                'ь': 'm', 'э': "'", 'ё': '`', 'я': 'z', 'ж': ';',
                'з': 'p', 'и': 'b', 'й': 'q', 'л': 'k', 'д': 'l',
                'г': 'u', 'ф': 'a', 'ц': 'w', 'ч': 'x', 'ш': 'i',
                'щ': 'o', 'б': ',', 'ю': '.', ' ': ' '
            };
            
            const purePaliWords = allWords.map(w => {
                let val = w.label || w.value || w;
                return normalize(val.split(/\s+/)[0].toLowerCase());
            });

            document.getElementById('search-form').addEventListener('submit', function(e) {
                let box = document.getElementById('search-box');
                if (!box) return;
                let val = box.value.trim();
                
                // Если есть русские буквы и нет цифр (не паттерн сутт, которые обрабатываются в extra.js)
                if (/[а-яё]/i.test(val) && !/\d/.test(val)) {
                    let converted = val.toLowerCase().replace(/[а-яё]/g, char => ruToEnMap[char] || char);
                    let normConverted = normalize(converted);
                    
                    // Проверяем, совпадает ли исправленный текст с каким-либо словом из словаря
                    let isPali = purePaliWords.some(w => w.startsWith(normConverted));
                    if (isPali) {
                        box.value = converted; // Подменяем текст до сохранения в историю
                    }
                }
            }, true); 
            // Конец блока защиты

            $("#search-box").autocomplete({
                autoFocus: true, // ВАЖНО: При нажатии Enter автоматически выберет первое слово
                position: {
                    my: "left bottom",
                    at: "left top",
                    collision: "flip"
                },
                minLength: 0,
                multiple: /[\s\*]/,
                
                source: function(request, response) {
                    
                    function normalizeTerm(term) {
                        return term.trim().toLowerCase()
                            .replace(/[а-яё]/g, char => ruToEnMap[char] || char)
                            .replace(/([a-zA-Z]+)\s+(\d+)\s+(\d+)/g, "$1$2.$3")
                            .replace(/([a-zA-Z]+)(\d+)\s+(\d+)/g, "$1$2.$3")
                            .replace(/([a-zA-Z]+)\s+(\d+)\.(\d+)/g, "$1$2.$3")
                            .replace(/([a-zA-Z]+)\s+(\d+)/g, "$1$2");
                    }

                    var normalizedTerm = normalizeTerm(request.term);
                    var terms = normalizedTerm.split(/[\|\s\*]/);
                    var lastTerm = terms.pop().trim();
                    var minLengthForSearch = 3;

                    var history = JSON.parse(localStorage.getItem("history-list")) || [];

                    if (!lastTerm) {
                        response(history);
                        return;
                    }

                    var filteredHistory = history.filter(key => {
                        var normKey = normalizeTerm(key).toLowerCase();
                        var rawKey = key.toLowerCase();
                        return normKey.startsWith(lastTerm.toLowerCase()) || rawKey.startsWith(lastTerm.toLowerCase());
                    });

                    if (lastTerm.length < minLengthForSearch) {
                        response(filteredHistory);
                        return;
                    }

                    var normalizedForSearch = normalize(lastTerm);
                    var re = $.ui.autocomplete.escapeRegex(normalizedForSearch);
                    var modifiedRe = re.replace(/([a-zA-Z])/g, "$1{1,2}");
                    var matchbeginonly = new RegExp("^" + modifiedRe, "i");
                    var matchall = new RegExp(modifiedRe, "i");

                    var listBeginOnly = $.grep(allWords, function(value) {
                        value = value.label || value.value || value;
                        return matchbeginonly.test(normalize(value));
                    });

                    var listAll = $.grep(allWords, function(value) {
                        value = value.label || value.value || value;
                        return matchall.test(normalize(value));
                    });

                    listAll = listAll.filter(function(el) {
                        return !listBeginOnly.includes(el);
                    });

                    var maxRecord = 1000;
                    var resultList = listBeginOnly.concat(listAll).slice(0, maxRecord);

                    var finalResult = Array.from(new Set([...filteredHistory, ...resultList]));

                    response(finalResult);
                },

                focus: function(event, ui) {
                    return false;
                },
                select: function(event, ui) {
                    var terms = this.value.split(/([\|\s\*])/);
                    terms.pop();
                    
                    var selectedValue = ui.item.value;
                    if (/\s+\d+$/.test(selectedValue)) {
                        selectedValue = selectedValue.split(/\s+/)[0];
                    }
                    
                    if (/\d+\s+/.test(selectedValue)) {
                        selectedValue = selectedValue.split(/\s+/)[0];
                    }
                    
                    if (/b[ui]pm|b[ui]-pm|pm/.test(selectedValue)) {
                        selectedValue = selectedValue.split(/\s+/)[0];
                    }
                    
                    terms.push(selectedValue);

                    for (var i = 1; i < terms.length; i += 2) {
                        if (terms[i] === "*") {
                            terms[i] = "*";
                        } else if (terms[i] === "|") {
                            terms[i] = "|";
                        } else {
                            terms[i] = " ";
                        }
                    }

                    this.value = terms.join("");
                   
                    $(this).autocomplete("close");

                    // Запускаем отправку формы
                    if (typeof handleFormSubmit === 'function') {
                        handleFormSubmit(new Event('submit'));
                    } else if (typeof window.handleFormSubmit === 'function') {
                        window.handleFormSubmit(new Event('submit'));
                    }

                    return false;
                }
            }).autocomplete("widget").addClass("fixed-height");
        }
    });
});

document.addEventListener('DOMContentLoaded', function() {
    let paliauto = document.getElementById("paliauto");

    if (paliauto) {
        paliauto.addEventListener("input", function () {
            let textInput = paliauto.value;
            let convertedText = uniCoder(textInput);
            paliauto.value = convertedText;
        });

        // Добавляем обработчик клика по пустому инпуту
        paliauto.addEventListener("click", function() {
            if (paliauto.value === "") {
                // Триггерим событие поиска с пустым запросом
                $(paliauto).autocomplete("search", "");
            }
        });
    }

    // НОВЫЙ БЛОК: Отслеживаем клик и фокус в главном поле поиска
    let searchBoxInput = document.getElementById("search-box");
    if (searchBoxInput) {
        const triggerEmptySearch = function() {
            if (searchBoxInput.value === "") {
                // Запускаем автокомплит с пустой строкой
                $(searchBoxInput).autocomplete("search", "");
            }
        };
        // Срабатывает и при клике мышкой, и при переходе табом (фокусе)
        searchBoxInput.addEventListener("click", triggerEmptySearch);
        searchBoxInput.addEventListener("focus", triggerEmptySearch);
    }
 
  $.ajax({
        url: "./static/sutta_words.txt",
        dataType: "text",
        success: function(data) {
            var accentMap = {
                "ā": "a",
                "ī": "i",
                "ū": "u",
                "ḍ": "d",
                "ḷ": "l",
                "ṃ": "ṁ",
                "ṁ": "n",
                "ṁ": "m",
                "ṅ": "n",
                "ṇ": "n",
                "ṭ": "t",
                "ñ": "n",
                "ññ": "n",
                "ss": "s",
                "aa": "a",
                "ii": "i",
                "uu": "u",
                "dd": "d",
                "kk": "k",
                "ḍḍ": "d",
                "ḷḷ": "l",
                "ṇṇ": "n",
                "ṭṭ": "t",
                "cc": "c",
                "pp": "p",
                "cch": "c",
                "ch": "c",
                "kh": "k",
                "ph": "p",
                "th": "t",
                "ṭh": "t"
            };

            var normalize = function(term) {
                var ret = "";
                for (var i = 0; i < term.length; i++) {
                    ret += accentMap[term.charAt(i)] || term.charAt(i);
                }
                return ret;
            };

            var allWords = data.split('\n');

            $("#search-box").autocomplete({
                position: {
                    my: "left bottom",
                    at: "left top",
                    collision: "flip"
                },
                minLength: 0,
                multiple: /[\s\*]/,
                
                source: function(request, response) {
                    
                    function normalizeTerm(term) {
                        const ruToEn = {
                            'а': 'f', 'в': 'd', 'е': 't', 'к': 'r', 'м': 'v',
                            'н': 'y', 'о': 'j', 'п': 'g', 'р': 'h', 'с': 'c',
                            'т': 'n', 'у': 'e', 'х': '[', 'ъ': ']', 'ы': 's',
                            'ь': 'm', 'э': "'", 'ё': '`', 'я': 'z', 'ж': ';',
                            'з': 'p', 'и': 'b', 'й': 'q', 'л': 'k', 'д': 'l',
                            'г': 'u', 'ф': 'a', 'ц': 'w', 'ч': 'x', 'ш': 'i',
                            'щ': 'o', 'б': ',', 'ю': '.', ' ': ' '
                        };

                        return term.trim()
                            .replace(/[а-яё]/g, char => ruToEn[char] || char)
                            .replace(/([a-zA-Z]+)\s+(\d+)\s+(\d+)/g, "$1$2.$3")
                            .replace(/([a-zA-Z]+)(\d+)\s+(\d+)/g, "$1$2.$3")
                            .replace(/([a-zA-Z]+)\s+(\d+)\.(\d+)/g, "$1$2.$3")
                            .replace(/([a-zA-Z]+)\s+(\d+)/g, "$1$2");
                    }

                    var normalizedTerm = normalizeTerm(request.term);
                    var terms = normalizedTerm.split(/[\|\s\*]/);
                    var lastTerm = terms.pop().trim();
                    var minLengthForSearch = 3;

                    // 1. Берем общую историю (ключ должен быть "history-list")
                    var history = JSON.parse(localStorage.getItem("history-list")) || [];

                    // 2. Если поле пустое — показываем всю историю
                    if (!lastTerm) {
                        response(history);
                        return;
                    }

                    // 3. Умная фильтрация истории (учитываем сжатие пробелов в номерах сутт)
                    var filteredHistory = history.filter(key => {
                        var normKey = normalizeTerm(key).toLowerCase();
                        var rawKey = key.toLowerCase();
                        return normKey.startsWith(lastTerm.toLowerCase()) || rawKey.startsWith(lastTerm.toLowerCase());
                    });

                    // 4. Если введено меньше 3 символов, отдаем ТОЛЬКО историю
                    if (lastTerm.length < minLengthForSearch) {
                        response(filteredHistory);
                        return;
                    }

                    // 5. Поиск по словарю (для слов от 3 символов)
                    var normalizedForSearch = normalize(lastTerm);
                    var re = $.ui.autocomplete.escapeRegex(normalizedForSearch);
                    var modifiedRe = re.replace(/([a-zA-Z])/g, "$1{1,2}");
                    var matchbeginonly = new RegExp("^" + modifiedRe, "i");
                    var matchall = new RegExp(modifiedRe, "i");

                    var listBeginOnly = $.grep(allWords, function(value) {
                        value = value.label || value.value || value;
                        return matchbeginonly.test(normalize(value));
                    });

                    var listAll = $.grep(allWords, function(value) {
                        value = value.label || value.value || value;
                        return matchall.test(normalize(value));
                    });

                    listAll = listAll.filter(function(el) {
                        return !listBeginOnly.includes(el);
                    });

                    var maxRecord = 1000;
                    var resultList = listBeginOnly.concat(listAll).slice(0, maxRecord);

                    // 6. ФИНАЛ: Объединяем отфильтрованную историю и найденные слова, убирая дубликаты
                    var finalResult = Array.from(new Set([...filteredHistory, ...resultList]));

                    response(finalResult);
                },

      
                focus: function(event, ui) {
                    return false;
                },
                select: function(event, ui) {
                    var terms = this.value.split(/([\|\s\*])/);
                    terms.pop();
                    
                    var selectedValue = ui.item.value;
                    if (/\s+\d+$/.test(selectedValue)) {
                        selectedValue = selectedValue.split(/\s+/)[0];
                    }
                    
                    if (/\d+\s+/.test(selectedValue)) {
                        selectedValue = selectedValue.split(/\s+/)[0];
                    }
                    
                    if (/b[ui]pm|b[ui]-pm|pm/.test(selectedValue)) {
                        selectedValue = selectedValue.split(/\s+/)[0];
                    }
                    
                    terms.push(selectedValue);

                    for (var i = 1; i < terms.length; i += 2) {
                        if (terms[i] === "*") {
                            terms[i] = "*";
                        } else if (terms[i] === "|") {
                            terms[i] = "|";
                        } else {
                            terms[i] = " ";
                        }
                    }

                    this.value = terms.join("");
                   

           // Закрываем автоподсказки
           $(this).autocomplete("close");

           // Инициируем поиск
           handleFormSubmit();

                    return false;
                }
            }).autocomplete("widget").addClass("fixed-height");
        }
    });
});


