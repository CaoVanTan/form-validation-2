const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);

// Đối tượng Validator
function Validator(formSelector) {
    function getParentElement(element, selector) {
        while (element.parentElement) {
            if(element.parentElement.matches(selector)) {
                return element.parentElement;
            } else {
                element = element.parentElement;
            }
        }
    }

    var _this = this;
    var formRules = {};

    /**
     * Quy ước tạo rule:
     * - Nếu có lỗi thì return "error message"
     * - Nếu không có lỗi thì return "undefined"
     */
    var validatorRules = {
        required: function(value) {
            return value ? undefined : "Vui lòng nhập trường này!";
        },
        email: function(value) {
            var regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
            return regex.test(value) ? undefined : "Vui lòng nhập email!";
        },
        min: function(min) {
            return function(value) {
                return value.length >= min ? undefined : `Vui lòng nhập tối thiểu ${min} kí tự!`;
            }
        },
        max: function(max) {
            return function(value) {
                return value.length <= max ? undefined : `Vui lòng nhập tối đa ${max} kí tự!`;
            }
        },
        confirm: function(value) {
            var passwordValue = $("#password").value;
            return value.trim() && value === passwordValue ? undefined : "Mật khẩu xác nhận không khớp, vui lòng nhập lại!";
        },
        check: function(value) {
            return value ? undefined : "Vui lòng chọn trường này!";
        }
    };


    // Lấy ra form element trong DOM theo formSelector
    var formElement = $(formSelector);
    
    // Chỉ xử lý khi có element trong DOM
    if(formElement) {
        var inputs = formElement.querySelectorAll("[name][rules]");
        
        for(var input of inputs) {
            var rules = input.getAttribute("rules").split("|");

            for(var rule of rules) {
                var ruleInfo;
                var isRuleHasValue = rule.includes(":");
                
                if(isRuleHasValue) {
                    ruleInfo = rule.split(":");
                    rule = ruleInfo[0];
                }
                
                var ruleFunc = validatorRules[rule];

                if(isRuleHasValue) {
                    ruleFunc = ruleFunc(ruleInfo[1]);
                }
                
                if(Array.isArray(formRules[input.name])) {
                    formRules[input.name].push(ruleFunc);
                } else {
                    formRules[input.name] = [ruleFunc];
                }
            }

            // Lắng nghe sự kiện để validate (change, blur, ...)
            input.onblur = handleValidate;
            input.oninput = handleClearError;
        }

        // Hàm thực hiện validate
        function handleValidate(event) {
            var formGroup = getParentElement(event.target, ".form-group");
            var rules = formRules[event.target.name];
            var errorMessage;

            for(var rule of rules) {
                switch(event.target.type) {
                    case 'checkbox':
                    case 'radio':
                        errorMessage =  rule(formGroup.querySelector("input:checked"));
                        break;

                    default:
                        errorMessage =  rule(event.target.value);
                }
                if(errorMessage) break;
            }

            // Nếu có lỗi thì hiển thị ra UI
            if(errorMessage) {
                var formGroup = getParentElement(event.target, ".form-group");

                if(formGroup) {
                    formGroup.classList.add("invalid");
                    var formMessage = formGroup.querySelector(".form-message");

                    if(formMessage) {
                        formMessage.innerText = errorMessage;
                    }
                }
            }

            return !errorMessage;
        }

        // Hàm clear error message
        function handleClearError(event) {
            var formGroup = getParentElement(event.target, ".form-group");

            if(formGroup.classList.contains("invalid")) {
                formGroup.classList.remove("invalid");
                var formMessage = formGroup.querySelector(".form-message");

                if(formMessage) {
                    formMessage.innerText = "";
                }
            }
        }
    }

    // Xử lý hành vi submit form
    formElement.onsubmit = function(event) {
        event.preventDefault();

        var inputs = formElement.querySelectorAll("[name][rules]");
        var isValid = true;
        
        for(var input of inputs) {
            if(!handleValidate({ target: input})) {
                isValid = false;
            }
        }

        // Khi không có lỗi thì submit form
        if(isValid) {
            if(typeof _this.onSubmit === 'function') {
                var enableInputs = formElement.querySelectorAll("[name]:not([disabled])");

                var formValues = Array.from(enableInputs).reduce(function (values, input) {
                    switch(input.type) {
                        case "radio":
                            values[input.name] = formElement.querySelector('input[name="' + input.name + '"]:checked').value;
                            break;
                        case "checkbox":
                            if(input.matches(":checked")) {
                                if(!Array.isArray(values[input.name])) {
                                    values[input.name] = [];
                                }
                                values[input.name].push(input.value);
                            } else if(!values[input.name]) {
                                values[input.name] = "";
                            }
                            break;
                        case 'file': 
                            values[input.name] = input.files;
                            break;
                        default:
                            values[input.name] = input.value;

                    }
                    return values;
                }, {});

                // Gọi lại hàm onSubmit và trả về giá trị của form
                _this.onSubmit(formValues);
            } else {
                formElement.submit();
            }
        }
    }
}