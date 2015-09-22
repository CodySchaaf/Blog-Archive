---
layout: post
title: Angular Form Errors
date: 2015-09-14T22:11:38-07:00
comments: true
categories:
---

One of the most frustrating UX pitfalls, one which people new to Angular often utilize, is disabling buttons
to show that a form is not yet valid (ng-disabled). A user that is looking for the input button probably thinks they have finished
entering their details, but a disabled button leaves them stuck. A better solution is an interactive form, that
highlights errors when a user attempts to advance when the form is invalid.
 
To solve this I have created 3 core directives which will be placed throughout a form to allow for a much better user experience.
 
To start we will implement a simpler version with the first two directives, then add the third one in after. 

In angular each form element (or ng-form attribute) will create a new formController. This controller--stored on the scope
under the form's name--can be leveraged to determine the validity of the form. The 3 directives will be `csErrorsSubmit`, 
`csErrorsForm`, and `csErrors`. The way they will work is that all errors will start 
hidden from the user, regardless of the forms current validity state. Once the user is done submitting their 
information they will hit the submit button which will have the `csErrorsSubmit` directive on it. 
This directive will ensure that the form is valid before submitting. If the form is 
invalid it will block the ng-submit/ng-click action of the button, and then signal the `csErrorsForm` directive that an invalid submission 
was triggered. Then the `csErrorsForm` directive will apply the `reveal-errors` class to the form, as well as find the first 
invalid input field and scroll to that position. With the new class applied we will have the error revealed for the user to fix.
The `csErrors` directive will allow for greater fine tuning as well as house the communication data (class names and event names). 

To start we need a new module, or use your existing app. I have written these in typescript for legibility, but
you can view their javascript equivalents by using the toggle. I definitely recommend learning TypeScript though, as
it makes writing and maintaining large apps much easier. 


<div data-toggle></div>
<div data-toggle-TS-JS>
```ts csErrors module setup
module cs {
	export var csErrors: ng.IModule = angular.module("csErrors", []);
}
```


```javascript csErrors module setup
var cs = cs || {};
cs.csErrors = angular.module("csErrors", []);

```
</div>

#csErrorsSubmit

Let's setup the first directive's definition.

We give the `csErrorsSubmit` directive a scope false, because this directive isn't applying any new elements or any new packaged 
content that would require a new scope context, it is simply adding additional functionality to what already functions.
It will also need access to the form, require the form using `^form` to have access to the current scope's form for validity checks. 

It needs a priority of -1 to ensure that the link function is run before the link function of ng-click and ng-submit which both
have the default priority of 0. We use -1 because although the controller functions are run according to their priority, the
link function is run in reverse order of priority. Since the click event is added in the link function for ng-click, we will
do the same. We also want to use the link function because it is taboo to inject the element into the controller, as well as we are doing mostly
DOM work. 

*You'll notice I'm prefixing my directives with cs (CodySchaaf) since errors is a bit common, this will prevent any 
clashes with future angular version that might release a directive with the same name, or future html standards that 
could release an attribute with the same name; sort of like Angular's ng*

<div data-toggle></div>
<div data-toggle-TS-JS>

```ts csErrorsSubmit directive
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

```javascript csErrorsSubmit directive
cs.csErrors.directive("csErrorsSubmit", function () {
	return {
		restrict: "A",
		scope: false,
		require: "^form",
		priority: -1,
		link: function (scope, element, attrs, formCtrl) {
			return new Link(scope, element, attrs, formCtrl);
		}
	};
});
```

</div>

In the link function we will setup the on click event. The handler will check that the formCtrl is valid, if it is invalid
it will emit an event. This event is composed of the `REVEAL_ERRORS_EVENT` name and the form's name. We want to make it specific
to the form because we could have these setups nested and we want to ensure that we are talking to the correct form. We use $emit instead 
of broadcast because the submit button will be nested inside the form and emit propagates up the scope. 

This works because of Angular's awesome form handling. As long as you attach the appropriate ng-modal validating directives
to your inputs, this will be able to tell if the form is valid. This is because a form is only valid if all of the children
ng-models are valid. So--for example--by adding ng-required to all fields, the form will only be valid if all fields are answered and thus
this will only submit if all fields are answered.
  
<div data-toggle></div>
<div data-toggle-TS-JS>

```ts csErrorsSubmit's link function
class Link {
	constructor(scope: Scope, element: ng.IAugmentedJQuery, attrs: Attr, formCtrl: ng.IFormController) {
		element.on("click", (event: JQueryEventObject) => {
			if (formCtrl.$invalid) {
				scope.$emit(cs.errors.Link.REVEAL_ERRORS_EVENT + formCtrl.$name);
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

```javascript csErrorsSubmit's link function
var Link = (function () {
	function Link(scope, element, attrs, formCtrl) {
		element.on("click", function (event) {
			if (formCtrl.$invalid) {
				scope.$emit(cs.errors.Link.REVEAL_ERRORS_EVENT + formCtrl.$name);
				event.preventDefault();
				event.stopImmediatePropagation();
			}
		});
	}
	return Link;
})();
```
</div>

Additionally we can bake in some protection by checking that this button corresponds with the intended target form. We will
require that users of the directive pass in the name of the intended form. Then we check it against the name of the form
that require found `errors-submit='form-name'`.

This leaves us with:

<div data-toggle></div>
<div data-toggle-TS-JS>
```ts csErrorsSubmit's link function
class Link {
	constructor(scope: Scope, element: ng.IAugmentedJQuery, attrs: Attr, formCtrl: ng.IFormController) {
		element.on("click", (event: JQueryEventObject) => {
			if (attrs.errorsSubmit !== formCtrl.$name) {
				throw "Provided name (" + attrs.errorsSubmit + ") of form does not match:" + formCtrl.$name;
			}
			if (formCtrl.$invalid) {
				scope.$emit(cs.errors.Link.REVEAL_ERRORS_EVENT + formCtrl.$name);
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

```javascript csErrorsSubmit's link function
var Link = (function () {
	function Link(scope, element, attrs, formCtrl) {
		element.on("click", function (event) {
			if (attrs.errorsSubmit !== formCtrl.$name) {
				throw "Provided name (" + attrs.errorsSubmit + ") of form does not match:" + formCtrl.$name;
			}
			if (formCtrl.$invalid) {
				scope.$emit(cs.errors.Link.REVEAL_ERRORS_EVENT + formCtrl.$name);
				event.preventDefault();
				event.stopImmediatePropagation();
			}
		});
	}
	return Link;
})();
```
</div>

#csErrorsForm

Once this directive emits its event we will need something to catch it, in comes `csErrorsForm`.

We will start with the directive definition, with just a scope false and link function:

For the implementation of the link function, we need access to the scope, the element, and the element's attributes.
 
The element is needed to add and remove the error classes. It will add a hide errors class on initialization, and then 
remove that class, as well as add a reveal errors class once it receives the event from the `csErrorsSubmit` directive.
This even will be listened to by the scope, with a scope.$on, and finally the attributes to get the form name and whether or 
not you want the directive to scroll to fields that are invalid.

<div data-toggle></div>
<div data-toggle-TS-JS>

```ts csErrorsForm directive
cs.csErrors.directive("csErrorsForm", (): ng.IDirective => {
	return {
		restrict: "A",
		scope:    false,
		link:     (scope: ng.IScope, element: ng.IAugmentedJQuery, attrs: Attrs): Link => {
			return new Link(scope, element, attrs);
		}
	}
});
```
```javascript csErrorsForm directive
cs.csErrors.directive("csErrorsForm", function () {
	return {
		restrict: "A",
		scope: false,
		link: function (scope, element, attrs) {
			return new Link(scope, element, attrs);
		}
	};
});
```

</div>

First thing we do during initialization is add the `HIDE_ERRORS_CLASS`, this will allow you to target the form
with pre-validation specific css. 

Next we listen for the `REVEAL_ERRORS_EVENT` that was emitted by `csErrorsSubmit` with `scope.$on(cs.errors.Link.REVEAL_ERRORS_EVENT + attrs.name...`
You can see here that we are adding the form name to the event name to ensure that the message is intended for this form. 
This is to allow form nesting, you could also accomplish this by stopping the propagation, but I think this is more precise.
The form name is pulled in from the form or ng-form element that this directive is placed on, since all forms should have a name attribute. 

Once we received this event we will add and remove the `REVEAL_ERRORS_CLASS` and `HIDE_ERRORS_CLASS` respectively. This will allow 
your css to apply errors for the invalid fields based on the form's current class coupled with Angular's invalid classes on inputs with
`ng-model`.

Finally we will want to determine if the implementation wants us to scroll, specified by omitting the no-scroll string 
to the directive instance `<div cs-errors-form>` instead of `<div cs-errors-form='no-scroll'>`. If no-scroll is passed in we just return,
otherwise we search for the first instance of an elements with the ng-invalid class `element.find(".ng-invalid").first()`. If we find one
we use the baked in jquery scroll animation to scroll to it. 

*Tip: us no scroll for small forms like login where scrolling would be more distracting than helpful*

<div data-toggle></div>
<div data-toggle-TS-JS>

```ts csErrorsForm's link function
class Link {
	constructor(scope: ng.IScope, element: ng.IAugmentedJQuery, attrs: Attrs) {
		element.addClass(cs.cs.errors.Link.HIDE_ERRORS_CLASS);
		scope.$on(cs.errors.Link.REVEAL_ERRORS_EVENT + attrs.name, (): void => {
			element.addClass(cs.errors.Link.REVEAL_ERRORS_CLASS).removeClass(cs.errors.Link.HIDE_ERRORS_CLASS);
			if (attrs.csErrorsForm === "no-scroll") {return}

			var firstErroredElement: JQuery = element.find(".ng-invalid").first();
			if (firstErroredElement.length !== 0) {
				angular.element('html, body').animate({ //animate the scroll to the invalid input
					scrollTop: firstErroredElement.offset().top - 100 //100 px padding on scroll to top
				}, 600);
			}
		});
	}
}

interface Attrs extends ng.IAttributes {
	name: string;
	csErrorsForm?: string;
}
  
```

```javascript csErrorsForm's link function

var Link = (function () {
	function Link(scope, element, attrs) {
		element.addClass(cs.errors.Link.HIDE_ERRORS_CLASS);
		scope.$on(cs.errors.Link.REVEAL_ERRORS_EVENT + attrs.name, function () {
			element.addClass(cs.errors.Link.REVEAL_ERRORS_CLASS).removeClass(cs.errors.Link.HIDE_ERRORS_CLASS);
			if (attrs.csErrorsForm === "no-scroll") {
				return;
			}
			var firstErroredElement = element.find(".ng-invalid").first();
			if (firstErroredElement.length !== 0) {
				angular.element('html, body').animate({
					scrollTop: firstErroredElement.offset().top - 100 //100 px padding on scroll to top
				}, 600);
			}
		});
	}
	return Link;
})();
  
```
</div>

Now for the styling. The first thing you will want to apply your non-error state styles to elements with the `ng-invalid` class.
Most Angular apps will have invalid styles applied to their ui components by targeting the `ng-invalid` class.
  
```css 
input.ng-invalid {
	border-color: red;
}
```

Undo this styling if the element is located inside the `cs-errors-form` directive.
This will allow the input element to appear valid even if the user has failed to enter a valid input yet. Allowing the form
to look pristine even if the user has yet to interact with it. There is also the ability to target ng-pristine, but that leaves
you helpless when a user has left a field pristine and is trying to submit the form. Ng-pristine is also clumsy and not super 
cross browser friendly (I'm looking at you IE).
 
As the comment suggests this is also where you could add custom directives that utilize ng-model validations, like a
date picker for example.
  
```sass 

[cs-errors-form] {
	//place any additional custom input field un-styling in here
	input.ng-invalid, textarea.ng-invalid, select.ng-invalid { // [date-picker].ng-invalid input
		//override standard invalid state
		@include valid-input;
	}
}
```

Followed by adding back in your error mixins if the `cs-errors-form` has the `reveal-errors` class. Adding a little 
polish by again applying the valid styles if the element is focused.

```sass

[cs-errors-form] {
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
	}
}
```

Finally lets add some styles to our error messages, that will utilize Angualr's `ng-messages` directive. And tying it all together
we have:

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
	.text-danger {
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

		.text-danger {
			@include cs-errors-reveal-error;
		}
	}
}
```

Let's see what that would like like in your view. Bellow I'm utilizing ng-messages to show the errors. This
allows for really clean and consistent error handling. 

*Remember that when installing ng-messages you have to include the new script tag, as well as inject the module into your app.*

```html
<form name="userForm" cs-errors-form novalidate>
	<div class="form-group">
		<input type="text"  name="name" ng-model="user.name" ng-required="true" placeholder="name"/>
		<div ng-messages="userForm.name.$error">
			<p class="text-danger" ng-message="required">You forgot your name.</p>
		</div>
	</div>

	<div class="form-group">
		<input type="text"  name="number" ng-model="user.number" ng-minlength="7" ng-required="true" placeholder="number"/>
		<div ng-messages="userForm.number.$error">
			<p class="text-danger" ng-message="required">You forgot your number.</p>
			<p class="text-danger" ng-message="minlength">Your number is too short.</p>
		</div>
	</div>

	<button cs-errors-submit="userForm" ng-click="save()">Create User</button>
</form>

```
 
At this point we have a working yet admittedly naive error handling. It will provide a good user experience for users that 
have forgotten to fill out a field, but for users that have incorrectly filled out a field, they will have to wait till
they try to submit it to see an error. 
 
To fix this we will introduce another directive, the `cs-errors` directive. This will attach a blur event handler to
the field as well as apply the `reveal-errors` class to this element on blur. At this point we should transition to targeting this
class for most input specific error styles. 
 
Doing this will give the user instant feedback on invalid fields, but won't mark the field as invalid until they are
done trying to enter valid information. It would be annoying to do this on focus because then they would be berated with 
errors before they were done. 

This directive will be attached to all form-groups (optional to add the class, but helps if you are using bootstrap). We'll start with 
the directive declaration. 
 
We give it a scope false, because this directive isn't applying any new elements or any new packaged 
content that would require a new scope context, it is simply adding additional functionality to what already exists. 
 
I'm using the link function here because we need access to the directive element and we are doing mostly DOM logic. Also
we want this to run after the DOM has been rendered, as well as to have access to Angular's formController. 

<div data-toggle></div>
<div data-toggle-TS-JS>
```ts csErrors directive
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
```javascript csErrors directive
cs.csErrors.directive("csErrors", function () {
	return {
		restrict: "A",
		scope: false,
		link: function (scope, elem) {
			if (!elem.hasClass("form-group")) {
				throw "errors element does not have the 'form-group' class";
			}
			return new Link(scope, elem);
		}
	};
});

```
</div>
   
This is where I have chosen to store the static variables used in the other directives, at the top we have the 
`REVEAL_ERRORS_CLASS` which is the name of the class we need to add to the element when it 
is time to reveal the errors, as well as the `REVEAL_ERRORS_EVENT`. We pass the scope and the element to the constructor. 

First we want to do a quick check to ensure we have the correct elements in the form-group to work with, so we check for
an element with a name. This allows this directive to work with any ui component that uses `ng-model` validation, since we 
are not limiting it to inputs, with a name we can even just have an inner ng-form that monitors the directives validity. 

After that we will set up our on blur handler. If you need to get fancier with your on blur you can pass in a a config object that
will allow you to select on different elements, which will allow you to use more advanced/custome ui-components (more on this is 
part 2).

With the scope we listen for `REVEAL_ERRORS_EVENT` which we will catch after it is emitted from `csErrorsForm`. 

With these two methods of adding a class we cover both uses cases, of a person entering wrong info and then moving on, as well
as missing the field and attempting to submit the invalid form. 

<div data-toggle></div>
<div data-toggle-TS-JS>
```ts csErrors's link function
module cs.errors {
	export class Link {
		public static REVEAL_ERRORS_EVENT: string = "RevealErrors:";
		public static REVEAL_ERRORS_CLASS: string = "reveal-errors";
		public static HIDE_ERRORS_CLASS:   string = "hide-errors";

		constructor(
			private scope:          ng.IScope,
			private element:        ng.IAugmentedJQuery
		) {
			var inputEl: ng.IAugmentedJQuery = element.find("[name]");
			var inputName: string            = inputEl.attr("name");
			if (!inputName) {throw "cs-errors element has no child input elements with a 'name' attribute";}

			inputEl.on("blur", this.toggleClasses.bind(this));
			this.scope.$on(Link.REVEAL_ERRORS_EVENT, this.toggleClasses.bind(this));
		}

		private enableErrors(): void {
			this.element.addClass(Link.REVEAL_ERRORS_CLASS);
		}
	}
}

```
```javascript csErrors's link function

var cs = cs || {};
var cs.errors = cs.errors || {}; //just extra code to export so other directives can use static members
cs.errors.Link = (function () {
	function Link(scope, element) {
		this.scope = scope;
		this.element = element;
		var inputEl = element.find("[name]");
		var inputName = inputEl.attr("name");
		if (!inputName) {
			throw "cs-errors element has no child input elements with a 'name' attribute";
		}
		inputEl.on("blur", this.toggleClasses.bind(this));
		this.scope.$on(Link.REVEAL_ERRORS_EVENT, this.toggleClasses.bind(this));
	}
	Link.prototype.enableErrors = function () {
		this.element.addClass(Link.REVEAL_ERRORS_CLASS);
	};
	Link.REVEAL_ERRORS_EVENT = "RevealErrors:";
	Link.REVEAL_ERRORS_CLASS = "reveal-errors";
	Link.HIDE_ERRORS_CLASS   = "hide-errors";
	return Link;
})();

```
</div>
Now lets update our `csErrorsForm` link function to communicate the event received from the `csErrorsSubmit` to all the `form-groups`
it contains.

```javascript
scope.$broadcast(cs.errors.Link.REVEAL_ERRORS_EVENT); //no longer needs form name namespace since broadcasting down to all children
```

All together we have

<div data-toggle></div>
<div data-toggle-TS-JS>
```ts csErrors's link function

class Link {
	constructor(scope: ng.IScope, element: ng.IAugmentedJQuery, attrs: Attrs) {
		element.addClass(cs.errors.Link.HIDE_ERRORS_CLASS);
		scope.$on(cs.errors.Link.REVEAL_ERRORS_EVENT + attrs.name, (): void => {
			scope.$broadcast(cs.errors.Link.REVEAL_ERRORS_EVENT); //no longer needs form name namespace since broadcasting down to all children
			element.addClass(cs.errors.Link.REVEAL_ERRORS_CLASS).removeClass(cs.errors.Link.HIDE_ERRORS_CLASS);
			if (attrs.csErrorsForm === "no-scroll") {return}

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
	csErrorsForm?: string;
}

```
```javascript csErrors's link function

var Link = (function () {
	function Link(scope, element, attrs) {
		element.addClass(cs.errors.Link.HIDE_ERRORS_CLASS);
		scope.$on(cs.errors.Link.REVEAL_ERRORS_EVENT + attrs.name, function () {
			scope.$broadcast(cs.errors.Link.REVEAL_ERRORS_EVENT); //no longer needs form name namespace since broadcasting down to all children
			element.addClass(cs.errors.Link.REVEAL_ERRORS_CLASS).removeClass(cs.errors.Link.HIDE_ERRORS_CLASS);
			if (attrs.csErrorsForm === "no-scroll") {
				return;
			}
			var firstErroredElement = element.find(".ng-invalid").first();
			if (firstErroredElement.length !== 0) {
				angular.element('html, body').animate({
					scrollTop: firstErroredElement.offset().top - 100 //100 px padding on scroll to top
				}, 600);
			}
		});
	}
	return Link;
})();

```
</div>
And now to update the styles to target the `form-groups`

```sass 

[cs-errors-form] [cs-errors].form-group {
	.text-danger {
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

		.text-danger {
			@include cs-errors-reveal-error;
		}
	}
}
```

And finally updated html 

```html
<form name="userForm" cs-errors-form novalidate>
	<div class="form-group" cs-errors>
		<input type="text"  name="name" ng-model="user.name" ng-required="true"/>
		<div ng-messages="userForm.name.$error">
			<p class="text-danger" ng-message="required">You forgot your name.</p>
		</div>
	</div>

	<div class="form-group" cs-errors>
		<input type="text"  name="name" ng-model="user.number" ng-minlength="7" ng-required="true"/>
		<div ng-messages="userForm.name.$error">
			<p class="text-danger" ng-message="required">You forgot your number.</p>
			<p class="text-danger" ng-message="minlength">Your number is too short.</p>
		</div>
	</div>

	<button cs-errors-submit="userForm" ng-click="save()">Create User</button>
</form>

```

Here is a working example using my [csErrors](https://github.com/CodySchaaf/CsAngularErrors) module which can also be installed
as a bower plugin with the name cs-angular-errors.

<p data-height="257" data-theme-id="19100" data-slug-hash="qONaJw" data-default-tab="result" data-user="codyschaaf" class='codepen'>See the Pen <a href='http://codepen.io/codyschaaf/pen/qONaJw/'>CsAngularErrors</a> by Cody Schaaf (<a href='http://codepen.io/codyschaaf'>@codyschaaf</a>) on <a href='http://codepen.io'>CodePen</a>.</p>
<script async src="//assets.codepen.io/assets/embed/ei.js"></script>

This is enough to get most basic forms up and running, there are a few edge cases that we need to work out in part 2;
such as when you have a directive that encapsulates a ui component that is used for input. This will not be rendered in time
to get the form setup. As well as if you have multiple inputs for a single model (like seperate first and last name fields).

And finally check back for part 3 where I will go over the animations.