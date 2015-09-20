---
layout: post
title: Angular Form Errors
date: 2015-09-14T22:11:38-07:00
comments: true
categories:
---

One of the most frustrating UX pitfalls, one which people new to angular often utilize, is disabling buttons
 to show that a form is not yet valid. A user that is looking for the input button probably thinks they have finished
 entering their details, but a disabled button leaves them stuck. A better solution is an interactive form, that
 highlights errors when a user attempts to advance when the form is invalid.
 
To solve this I have created 3 core directives which will be placed throughout to allow for a much better user experience. 

In angular each form element (or ng-form attribute) will create a new formController. This controller can be leveraged
to determine the validity of the form. The 3 directives will be an `errorsSubmit` directive, an `errorsForm` directive, as well as
just an `errors` directive. The way they will work is that all errors will be hidden from a user regardless of the forms
current validity state. Once the user is done submitting their information they will hit the submit button which will
have the errorsSubmit directive on it. This directive will ensure that the form is valid before submitting. If the form is 
invalid it will block the submit/click action of the button, and then signal the errorsForm directive that an invalid submit 
was triggered. Then the errorsForm directive will apply the reveal-errors class to the form, as well as find the first 
invalid input field and scroll to that position. With the new class applied we will have the error revealed for the user to fix.
The errors directive will allow for greater fine tuning as well as house the communication data. 

  
To start we need a new module, or use your existing app. I have written these in typescript for legibility, but
 you can view their javascript equivalents at their corresponding codepens.
  

<div data-toggle></div>
<div data-toggle-TS-JS>
```javascript
module cs {
  export var csErrors: ng.IModule = angular.module("csErrors", []);
}
```


```javascript
var cs = cs || {};
cs.csErrors = angular.module("csErrors", []);


```
</div>

Then we will setup the first directive, the `errorsSubmit` directive will have the following directive deceleration.

We give it a scope false, because this directive isn't applying any new elements or any new packaged 
content that would require a new scope context, it is simply adding additional functionality to what already functions.
It requires the form from the current scope for validity checks. 

It needs a priority of -1 to ensure that the link function is run before the link function of ng-click and ng-submit which both
have the default priority of 0. We use -1 because although the controller functions are run according to their priority, the
link function is run in reverse order of priority. Since the click event is added in the link function for ng-click, we will
do the same. 

Finally we use the link function because it is taboo to inject the element into the controller, as well as we are doing mostly
dom work. 

*You'll notice I'm prefixing my directives with cs, this will prevent any clashes with future angular version that might release
a directive with the same name, or future html standards that could release an attribute with the same name; sort of like angular's ng*

```javascript 

  cs.csErrors.directive("csErrorsSubmit", (): ng.IDirective => {
    return {
      restrict:   "A",
      scope:      false,
      require:    "^form",
      priority:   -1, //ensure it is run before ng-click with a 0 priority since link functions are run in reverse order
      link:       (scope: Scope, element: ng.IAugmentedJQuery, attrs: Attr, formCtrl: ng.IFormController): Link => {
        return new Link(scope, element, attrs, formCtrl);
      }
    }
  });
  
```

In the link function we will setup the on click event. The handler will check that the formCtrl is valid, if it is invalid
it will emit an event. This event is composed of the `REVEAL_ERRORS_EVENT` name and the form's name. We want to make it specific
to the form because we could have these setups nested and we want to ensure that we are talking to the correct form. We use $emit instead 
of broadcast because the submit button will be nested inside the form and emit propagates up the scope. 
  
```javascript

  class Link {
    constructor(scope: Scope, element: ng.IAugmentedJQuery, attrs: Attr, formCtrl: ng.IFormController) {
      element.on("click", (event: JQueryEventObject) => {
        if (formCtrl.$invalid) {
          scope.$emit(errors.Link.REVEAL_ERRORS_EVENT + formCtrl.$name);
          event.preventDefault();
          event.stopImmediatePropagation();
        }
      })
    }
  }
  
  interface Attr extends ng.IAttributes {
    errorsSubmit: string;
  }

  interface Scope extends ng.IScope {
    formCtrl: FormCtrl;
    attrs:    Attr;
  }

```

Additionally we can bake in some protection by checking that this button corrispondes with the enteded target. We will
require that users of the directive pass in the name of the intended form. Then we check it against the name of the form
that require found `errors-submit='form-name'`

This leaves us with:

```javascript

  class Link {
      constructor(scope: Scope, element: ng.IAugmentedJQuery, attrs: Attr, formCtrl: ng.IFormController) {
        element.on("click", (event: JQueryEventObject) => {
          if (attrs.errorsSubmit !== formCtrl.$name) {
            throw "Provided name (" + attrs.errorsSubmit + ") of form does not match:" + formCtrl.$name;
          }
          if (formCtrl.$invalid) {
            scope.$emit(errors.Link.REVEAL_ERRORS_EVENT + formCtrl.$name);
            event.preventDefault();
            event.stopImmediatePropagation();
          }
        })
      }
    }
  
    interface Attr extends ng.IAttributes {
      errorsSubmit: string;
    }
  
    interface Scope extends ng.IScope {
      formCtrl: FormCtrl;
      attrs:    Attr;
    }

```
Once this directive emits its event we will need something to catch it, in comes `csErrorsForm`.

We will start with the directive definition, with just a scope false and link function:

```javascript 

  cs.csErrors.directive("csShowErrorsForm", (): ng.IDirective => {
    return {
      restrict: "A",
      scope:    false,
      link:     (scope: ng.IScope, element: ng.IAugmentedJQuery, attrs: Attrs): Link => {
        return new Link(scope, element, attrs);
      }
    }
  });

```

For the implementation of the link function, we need access to the scope, the element, and the element's attributes.
 
The element is needed to add and remove the error classes. It will add a hide errors class on initialization, and then 
remove that class, as well as add a reveal errors class once it receives the event from the `csErrorsSubmit` directive.
This even will be listened to by the scope, with a scope.$on, and finally the attributes to get the form name and whether or 
not you want the directive to scroll to fields that are invalid.

```javascript 


class Link {
  constructor(scope: ng.IScope, element: ng.IAugmentedJQuery, attrs: Attrs) {
    element.addClass(cs.errors.Link.HIDE_ERRORS_CLASS);
    scope.$on(errors.Link.REVEAL_ERRORS_EVENT + attrs.name, (): void => {
      element.addClass(cs.errors.Link.REVEAL_ERRORS_CLASS).removeClass(cs.errors.Link.HIDE_ERRORS_CLASS);
      if (attrs.scShowErrorsForm === "no-scroll") {return}

      var firstErroredElement: JQuery = element.find(".ng-invalid").first();
      if (firstErroredElement.length !== 0) {
        angular.element('html, body').animate({
          scrollTop: firstErroredElement.offset().top - 100 //100 px padding on scroll to top
        }, 600);
      }
    });
  }
}

interface Attrs extends ng.IAttributes {
  name: string;
  scShowErrorsForm?: string;
}
  
```

First thing we do during initialization is add the `HIDE_ERRORS_CLASS`, this will allow you to target the form
with pre-validation specific css. 

Next we listen for the `REVEAL_ERRORS_EVENT` that was emitted by `csErrorsSubmit` with `scope.$on(errors.Link.REVEAL_ERRORS_EVENT + attrs.name...`
You can see here that we are adding the form name to the event name to ensure that the message is intended for this form. 
This is to allow for nesting of this implementation, you could also accomplish this by stopping the propagation, but I think this is more precise.
The form name is pulled in from the form or ng-form element that this directive is placed on, since all forms should have a name attribute. 

Once we received this event we will add remove the `REVEAL_ERRORS_CLASS` and `HIDE_ERRORS_CLASS` respectively. This will allow 
your css to apply errors for the invalid fields based on the form's class as well as Angular's invalid classes on inputs with
`ng-model`.

Finally we will want to determine if the implementation wants us to scroll, specified by omitting the no-scroll string 
to the directive instance `<div cs-show-errors-form>` instead of `<div cs-show-errors-form='no-scroll'>`. If no-scroll is passed in we just return,
otherwise we search for the first instance of an elements with the ng-invalid class `element.find(".ng-invalid").first()`. If we find one
we use the baked in jquery scroll animation to scroll to it. 

*Tip: us no scroll for small forms like login where scrolling would be more distracting than helpful*

Now for the styling. The first thing you will want to apply your non-error states to elements with the `ng-invalid` class.
Most Angular apps will have invalid styles applied to their ui components by targeting the `ng-invalid` class.
  
```css 

input.ng-invalid {
  border-color: red;
}
```

The first thing you will want to do is remove this styling if the element is located inside the `cs-errors-form` directive.
This will allow the input element to appear valid even if the user has failed to enter a valid input. 

```sass 
@mixin cs-errors-hide-error() {
  height: 0px;
  margin-top: 0px;
  margin-bottom: 0px;
  opacity: 0;
}

@mixin cs-errors-reveal-error() {
  $animationLength: .4s;
  height: 20px;
  margin-top: 5px;
  margin-bottom: 10px;
  opacity: 1;
  @extend .cs-animate.slide-and-fade; //see part 3 for the animations, or leave them out, up to you.
}

[cs-errors-form] {
  [cs-errors].form-group .text-danger, &.form-without-form-groups .cs-errors-form-level-error.text-danger {
    @include cs-errors-hide-error;
  }
  //place any additional custom input field un-styling in here
  input.ng-invalid, textarea.ng-invalid, select.ng-invalid { // [date-picker].ng-invalid input
    //override standard invalid state
    @include valid-input;
  }

  &.reveal-errors {
    //place any additional custom input field re-styling in here
    input.ng-invalid, textarea.ng-invalid, select.ng-invalid { //[date-picker].ng-invalid input
      //override standard invalid state
      @include invalid-input;
      &:focus {
        @include valid-input;
      }
    }

    .text-danger, &.form-without-form-groups .cs-errors-form-level-error.text-danger {
      @include cs-errors-reveal-error;
    }
  }
}

```
 
At this point we have a working yet admittedly naive error handling. 

Then we setup the first directive. This is the heavy lifter, that is attached to all form-groups (optional, but helps 
if you are using bootstrap). We'll start with the directive declaration. 
 
We give it a scope false, because this directive isn't applying any new elements or any new packaged 
content that would require a new scope context, it is simply adding additional functionality to what already functions. 
 
 I'm using the link function here because we need access the directive element and we are doing mostly dom logic. Also
 we want this to run after the dom has been rendered, as well as to have access to Angular's formController. 

```javascript
 cs.csErrors.directive("csErrors", (): ng.IDirective => {
     return {
       restrict:   "A",
       scope:      false,
       link:       (scope: ng.IScope, elem: ng.IAugmentedJQuery): Link => {
         if (!elem.hasClass("form-group")) {
           throw "errors element does not have the 'form-group' class";
         }
         return new Link(scope, elem);
       }
     }
   });
```
   
At the top we have the `REVEAL_ERRORS_CLASS` which will be the name of the class we need to add to the element when it 
is time to reveal the errors. We pass the scope and the element to the constructor. With the scope we
listen for `REVEAL_ERRORS_EVENT` which will be emitted on the following directive.

```javascript

export class Link {
  public static REVEAL_ERRORS_EVENT: string = "RevealErrors:";
  public static REVEAL_ERRORS_CLASS: string = "reveal-errors";

  constructor(
    private scope:          ng.IScope,
    private element:        ng.IAugmentedJQuery
  ) {
    this.scope.$on(Link.REVEAL_ERRORS_EVENT, this.toggleClasses.bind(this));
  }

  private enableErrors(): void {
    this.element.addClass(Link.REVEAL_ERRORS_CLASS);
  }
}

```

remember to update styles