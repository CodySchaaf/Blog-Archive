---
layout: post
title: Angular Currency Input Directive
date: 2015-10-07T00:02:00-07:00
comments: true
categories: angular
---

This directive turns a regular input element into an auto formatting currency input directive.
It adds the correct number of commas into the number as you type. This is something, that if done
poorly, can be incredibly annoying, but&mdash;as I hope I have done&mdash;if implemented well
can be a very helpful ux enhancement.

To use this directive you can bower install the `cs-angular-currency-input`
package and including the `csCurrencyInput` module in you angular app. Check out the readme on
[GitHub](https://github.com/CodySchaaf/CsCurrencyInput). You could also include the `app/build/index.js`
file directly into your project, or follow along and build your own!


#What you'll be making

<p data-height="268" data-theme-id="19100" data-slug-hash="GprYyR" data-default-tab="result" data-user="codyschaaf" class='codepen'>See the Pen <a href='http://codepen.io/codyschaaf/pen/GprYyR/'>Angular Currency Input</a> by Cody Schaaf (<a href='http://codepen.io/codyschaaf'>@codyschaaf</a>) on <a href='http://codepen.io'>CodePen</a>.</p>
<script async src="//assets.codepen.io/assets/embed/ei.js"></script>


#Directive Implementation

To start we will define the csCurrencyInput directive. Note the cs prefix is used to prevent collisions with
standard HTML attributes. This directive will require ngModel to allow it to hook into the input element's
ngModelController. As well as a Link function definition which will allow us to work with the ngModelController.

<div data-toggle></div>
<div data-toggle-TS-JS>

```ts
csCurrencyInput.directive('csCurrencyInput', (): ng.IDirective => {
    return {
      restrict: 'A',
      require:  'ngModel',
      scope:    true,
      link:     (scope: ng.IScope, element: ng.IAugmentedJQuery, attributes: ng.IAttributes, ngModelController: ng.INgModelController): Link => {
        return new Link(ngModelController);
      },
    };
});

```

```javascript
csCurrencyInput.directive('csCurrencyInput', function () {
    return {
        restrict: 'A',
        require: 'ngModel',
        scope: true,
        link: function (scope, element, attributes, ngModelController) {
            return new Link(ngModelController);
        },
    };
});


```

</div>

For the link function implementation I have made a utility class to help with some of the string manipulation.
Any method called on the Str class can be found [here](https://github.com/CodySchaaf/CsCurrencyInput/blob/master/app/src/strings.ts).
I Will go over some of the more complicated methods at the end.

To start we need to add a new parser and formatter to our ngModelController. Typically you want push parsers
onto ngModelController's $parsers array since they are run in order, and you want to unshift your formatter onto
the $formatters array since formatters are run in reverse order. This is something you'd need to think about
whenever adding a new function since it all depends on the implementation.

###Priority

Parsers and formatters will be added depending on the order the directive is instantiated, so look at the
priority of the directive (defined in the directive definition). If no priority is specified then it default
to 0. Priority queues up the directives controllers in order (highest to lowest), and the directives link functions in reverse order.
Remember a priority can be negative, and is only taken into consideration if two directives are present on the
same element.

Pay specially attention to this relationship if you need to put two directives on a single element that both require
the ngModel.

###Parsers

Parsers are Angular's pipeline that connect the view value to what is stored in the ngModel expression.
For instance by default the input directive will show a string in the view as well as store
a string in the ngModel that is passed into it. Angular allows you to change this behavior by passing
in a type. If you pass in a type of number, then angular will add a parser that converts the string into
a number. This will mean that the internal ngModelController will have a viewValue that is a string and
a modelValue that is a number. All you will know about it the model value that will be passed back to
your ngModel expression as a number.

Parsers are typically triggered by a call to $setViewValue, which is called for you when using an input
element.

For the csCurrencyInput directive we will want to add a parser that converts the string to a number
that the ngModel passed in can better handel. We will also call $setViewValue here to update the
viewValue with a nicely formatted version.

You can think of parsers as pipes that take in user content and parse it into a version that the
code is equipped to deal with.

###Formatters

Formatters are like parsers but they handle the reverse direction. They take changes to the ngModel
expression and format them into a viewValue that the user can better understand.

In our directive we will want to utilise them to convert default values, or values from the backend
that are passed to our directive via the required ngModel directive, and format them for the user.

#Implementation


####Parser
For the parser we take the input value, the value that user has just typed, and we ensure it is not
empty (null undefined '' ect). If it is empty then we return null, this allows us to ensure only valid
values make it back to the model. We also want to test the value against a regular expression to ensure
it is a valid currency. For the current implementation we will use a regexp that allows both positive and negative
currency values. The regex `negativeNumberPattern = /^(?:-\$|\$-|-|\$)?[0-9,]+(?:.[0-9]+)?$/` first optionally matches
$ and/or - in any order, then matches any number of numbers and commas, and finally matches decimal point followed
by any number of additional numbers.

After we validate the input we add we need to break it up into its components. We split the input at
the decimal point. This allows us to add commas to the first component, and leave the second part unchanged.

In order to add the commas we want to utilize number's toLocalString method. For example this will convert
number 1000 to the string 1,000. In my code I call addCommasToString, which is my browser compatible version
of to local string. All browsers handle the decimal places differently, so we stripped them off to handle
them ourselves.

After we have added the commas we need to see if we need to update the view value. To check this we sanitize
the input value and the formatted value. All the sanitation does is strip any character that is not a number
or a comma. This is because we are looking to only add commas to our users number, so that is the only change
we care about. After comparing these values, if we find they do not match, we append the decimal places and any
prefix (such as $) by calling `reassembleInput` and pass that to `$setViewValue` to update the models display value. Finally we render any changes
to the viewValue.

`$setViewValue` will now call the parser again to ensure the correct value is passed to the model. This is a bit
weird, but allows for the smoothest update of the dom while keeping the model in sync as well as keeping the
user happy. This is the reason for the `sanitizeNumberAsString` check, which will ensure this loop only executes
twice for every model change. Finally we return the value that should be stored in the model by calling `stringToFloat`
which turns the string value from the input into a number.

####Formatter

The formatter is a bit simpler. Since its job is updating the view value with its return value, all we have
to do is return the formatted value. In the formatter we want to always ensure the value the backend has is
displayed in the view, not returning null if the value is bad for example. This is because we want to prevent
the values from getting out of sync, and allow the user to fix any bad value. Then we call `addCommasToString` on the integer part of
the number, and finally return the reconstructed number.

<div data-toggle></div>
<div data-toggle-TS-JS>

```ts
class Link {

    private attachModelPipelines(ngModelController: ng.INgModelController): void {
      ngModelController.$parsers.push((inputValue: string): number => {
        if (!inputValue) return null;
        if (!Str.negativeNumberPattern.test(inputValue)) return null;

        var components:  string[] = inputValue.split(".");
        var integerPart: string   = components[0];

        var normalizedString: string = Str.addCommasToString(integerPart);

        if (Str.sanitizeNumberAsString(normalizedString) !== Str.sanitizeNumberAsString(integerPart)) {
          var formattedNumber: string = Link.reassembleInput(inputValue, normalizedString);
          ngModelController.$setViewValue(formattedNumber); //$setViewValue will call parsers again, so ensure sanitized strings match to prevent infinite loop
          ngModelController.$render();
        }
        return Str.stringToFloat(inputValue);
      });

      ngModelController.$formatters.unshift((inputValue: string): string => {
        var stringValue = String(inputValue);
        var formattedString: string = Str.addCommasToString(Str.getIntegerPart(stringValue));
        return Link.reassembleInput(stringValue, formattedString);
      });
    }

    private static reassembleInput(input: string, normalizedString: string): string {
      var decimal:                string = Str.getDecimalPart(input);
      var dollarSignNegativeSign: string = input.match(/^(?:-\$|\$-|-|\$)?/)[0];

      return dollarSignNegativeSign + normalizedString + decimal;
    }
}

```

```javascript
var Link = (function () {
    function Link() {
    }
    Link.prototype.attachModelPipelines = function (ngModelController) {
        ngModelController.$parsers.push(function (inputValue) {
            if (!inputValue)
                return null;
            if (!Str.negativeNumberPattern.test(inputValue))
                return null;
            var components = inputValue.split(".");
            var integerPart = components[0];
            var normalizedString = Str.addCommasToString(integerPart);
            if (Str.sanitizeNumberAsString(normalizedString) !== Str.sanitizeNumberAsString(integerPart)) {
                var formattedNumber = Link.reassembleInput(inputValue, normalizedString);
                ngModelController.$setViewValue(formattedNumber); //$setViewValue will call parsers again, so ensure sanitized strings match to prevent infinite loop
                ngModelController.$render();
            }
            return Str.stringToFloat(inputValue);
        });
        ngModelController.$formatters.unshift(function (inputValue) {
            var stringValue = String(inputValue);
            var formattedString = Str.addCommasToString(Str.getIntegerPart(stringValue));
            return Link.reassembleInput(stringValue, formattedString);
        });
    };
    Link.reassembleInput = function (input, normalizedString) {
        var decimal = Str.getDecimalPart(input);
        var dollarSignNegativeSign = input.match(/^(?:-\$|\$-|-|\$)?/)[0];
        return dollarSignNegativeSign + normalizedString + decimal;
    };
    return Link;
})();




```
</div>

Now we need to call the `attachModelPipelines` method in the constructor to ensure that when
the directive is instantiated the pipelines are installed.

<div data-toggle></div>
<div data-toggle-TS-JS>
```ts
class Link {
    constructor(ngModelController: ng.INgModelController) {
      this.attachModelPipelines(ngModelController);
    }
}
```

```javascript
var Link = (function () {
    function Link(ngModelController) {
        this.attachModelPipelines(ngModelController);
    }
    return Link;
})();


```
</div>
All together we have

<div data-toggle></div>
<div data-toggle-TS-JS>

```ts

class Link {
    constructor(ngModelController: ng.INgModelController) {
      this.attachModelPipelines(ngModelController);
    }

    private attachModelPipelines(ngModelController: ng.INgModelController): void {
      ngModelController.$parsers.push((inputValue: string): number => {
        if (!inputValue) return null;
        if (!Str.negativeNumberPattern.test(inputValue)) return null;

        var components:  string[] = inputValue.split(".");
        var integerPart: string   = components[0];

        var normalizedString: string = Str.addCommasToString(integerPart);

        if (Str.sanitizeNumberAsString(normalizedString) !== Str.sanitizeNumberAsString(integerPart)) {
          var formattedNumber: string = Link.reassembleInput(inputValue, normalizedString);
          ngModelController.$setViewValue(formattedNumber); //$setViewValue will call parsers again, so ensure sanitized strings match to prevent infinite loop
          ngModelController.$render();
        }
        return Str.stringToFloat(inputValue);
      });

      ngModelController.$formatters.unshift((inputValue: string): string => {
        if (!inputValue) return null;
        var stringValue = String(inputValue);
        if (!Str.negativeNumberPattern.test(stringValue)) return null;
        var formattedString: string = Str.addCommasToString(Str.getIntegerPart(stringValue));
        return Link.reassembleInput(stringValue, formattedString);
      });
    }

    private static reassembleInput(input: string, normalizedString: string): string {
      var decimal:                string = Str.getDecimalPart(input);
      var dollarSignNegativeSign: string = input.match(/^(?:-\$|\$-|-|\$)?/)[0];

      return dollarSignNegativeSign + normalizedString + decimal;
    }
}

```

```javascript

var Link = (function () {
    function Link(ngModelController) {
        this.attachModelPipelines(ngModelController);
    }
    Link.prototype.attachModelPipelines = function (ngModelController) {
        ngModelController.$parsers.push(function (inputValue) {
            if (!inputValue)
                return null;
            if (!Str.negativeNumberPattern.test(inputValue))
                return null;
            var components = inputValue.split(".");
            var integerPart = components[0];
            var normalizedString = Str.addCommasToString(integerPart);
            if (Str.sanitizeNumberAsString(normalizedString) !== Str.sanitizeNumberAsString(integerPart)) {
                var formattedNumber = Link.reassembleInput(inputValue, normalizedString);
                ngModelController.$setViewValue(formattedNumber); //$setViewValue will call parsers again, so ensure sanitized strings match to prevent infinite loop
                ngModelController.$render();
            }
            return Str.stringToFloat(inputValue);
        });
        ngModelController.$formatters.unshift(function (inputValue) {
            if (!inputValue)
                return null;
            var stringValue = String(inputValue);
            if (!Str.negativeNumberPattern.test(stringValue))
                return null;
            var formattedString = Str.addCommasToString(Str.getIntegerPart(stringValue));
            return Link.reassembleInput(stringValue, formattedString);
        });
    };
    Link.reassembleInput = function (input, normalizedString) {
        var decimal = Str.getDecimalPart(input);
        var dollarSignNegativeSign = input.match(/^(?:-\$|\$-|-|\$)?/)[0];
        return dollarSignNegativeSign + normalizedString + decimal;
    };
    return Link;
})();


```

</div>

Now lets add some model validation to our directive. A simpel ng-require can handle the
require validation for the directive, but to prevent users of our directive from having to
implement their own pattern validation (as well as allowing us to add custome patterns later),
we will implement a simple pattern validator.

Our angular models have another array on them called `$validators` that will store
any validators that you want to run on your model when the value changes. These validators will
get passed both the modelValue and the viewValue.

Since our model value should be null only if our view value is invalid (see parser above) we will check to
ensure it is null and then decide which value should be focused on based on that.
If it is not null then we should ensure that the value that was stored there is valid, otherwise
we test the view value.

We also want to short circuit this testing if the value is empty, since an empty value in angular is usually
considered a valid pattern and ng-require will take care of the missing validity.

<div data-toggle></div>
<div data-toggle-TS-JS>

```ts
class Link {

    private attachValidation(ngModelController: ng.INgModelController): void {
      ngModelController.$validators['pattern'] = (modelValue: number, viewValue: string): boolean => {
        var value = modelValue == null ? viewValue : String(modelValue);
        return ngModelController.$isEmpty(viewValue) || Str.negativeNumberPattern.test(value)
      };
    }
}

```
```javascript

var Link = (function () {
    function Link() {
    }
    Link.prototype.attachValidation = function (ngModelController) {
        ngModelController.$validators['pattern'] = function (modelValue, viewValue) {
            var value = modelValue == null ? viewValue : String(modelValue);
            return ngModelController.$isEmpty(viewValue) || Str.negativeNumberPattern.test(value);
        };
    };
    return Link;
})();

```
</div>

Lets add this method call to the constructor as well.

<div data-toggle></div>
<div data-toggle-TS-JS>

```ts
class Link {
    constructor(ngModelController: ng.INgModelController) {
      this.attachValidation(ngModelController);
      this.attachModelPipelines(ngModelController);
    }
}


```

```javascript
var Link = (function () {
    function Link(ngModelController) {
        this.attachValidation(ngModelController);
        this.attachModelPipelines(ngModelController);
    }
    return Link;
})();


```

</div>

At this point we have a pretty solid input field, yet it is still a bit naive. It works great when the user is just typing,
but falls apart if they try and select a section, or otherwise edit the inner values. Also it gets a bit out of hand if
they try and delete the commas we added for them.

To remedy this next we will add some key press event handlers to help the user out. This is the make or break part of the
directive, the part that can either feel very professional and polished or annoying and amateur. So lets take some time and get this right.

coming soon...
