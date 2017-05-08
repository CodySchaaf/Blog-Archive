---
layout: post
title: Button Loaders
date: 2015-09-28T19:44:26-07:00
comments: true
categories: angular
---

This post will detail how to build a simple button loader using AngularJs.

<p data-height="203" data-theme-id="19100" data-slug-hash="pjNLEQ" data-default-tab="result" data-user="codyschaaf" class='codepen'>See the Pen <a href='http://codepen.io/codyschaaf/pen/pjNLEQ/'>Button Loader</a> by Cody Schaaf (<a href='http://codepen.io/codyschaaf'>@codyschaaf</a>) on <a href='http://codepen.io'>CodePen</a>.</p>
<script async src="//assets.codepen.io/assets/embed/ei.js"></script>

This directive allows for a busy state to quickly and simply be applied to a form button in an Angular app. To use this directive
define a button as you normally would, and then apply the `btn-busy` directive with the scope variable that controls the
toggle `btn-busy="isProcessing"`.

```html example usage
<button ng-click="submit()" btn-busy="isSubmitting" ng-disabled="isSubmitting">Submit</button>
```

Optionally you can add an [ng-disabled](https://docs.angularjs.org/api/ng/directive/ngDisabled)
to prevent additional clicks while the form is processing. Typically I'm against ng-disabled, but I think this
is a great use case for it.

#btnBusy Directive

For the directive definition we have a template, and an isolate scope which will get its busy attribute from the directive definition.
By having `busy: "=btnBusy"` in the scope definition angular will look for btn-busy on the directive instance (seen above),
but it will make the variable available for usage in the directive's template via the busy variable for clarity. This allows our
directive to be compact and not require an additional attribute.

Finally we want [transclude](https://docs.angularjs.org/api/ng/directive/ngTransclude)
true to be set. Transclude can be a bit scary at first, but all it does is it allows for the directive
to extract the content in the directive instance (markup that is between the opening and closing `button` tags, which is 'Submit' in the example above), and
inject that at some point into the directive's template. This point is specified by the ng-transclude tag.

<div data-toggle></div>
<div data-toggle-TS-JS>

```ts btnBusy directive definition
myApp.directive("btnBusy", () => {
    return {
        template: ...,
        transclude: true,
        scope: {
            busy: "=btnBusy"
        },
        restrict: "A",
    };
});

```
```javascript btnBusy directive definition

myApp.directive("btnBusy", function () {
    return {
        template: ...,
        transclude: true,
        scope: {
            busy: "=btnBusy"
        },
        restrict: "A",
    };
});

```
</div>

For the directive template we start with a containing `div`, this will be the element that gets a `position: relative`, and
will allow the button to remain at the same width as it was when it had text in it, before we replaced it with a spinner.

If we just allowed Angular's default hidden state the text would get a `display: none` and the button would collapse down
to the size of the spinner. This way we get a much more polished experience, as well as a nice directive to hide all
the logic that would be a pain to repeat every time.

Inside this container element we place a `div` with ng-transclude, remember this is the place holder for our injected content.
This is the element that allows our directive to be reusable with any content. We add `ng-hide='busy'` so that we can control the
state of button. When busy is true the content will be hidden.

The busy container will hold the busy animation, and will get a `position: absolute` so that it can be positioned to not take up space,
and will be placed on top of the content. When the directive switches to its busy state the content will be hidden, but will continue to
take up space. This will prevent the button from collapsing, but will force us to absolutely position the busy animation on top
of the content.


```html btnBusy template

<div>
    <div ng-transclude ng-hide="busy" class="btn-busy-text"></div>
    <div class="busy-container">
        <div class="busy" ng-show="busy"></div>
    </div>
</div>

```


All together we have:

<div data-toggle></div>
<div data-toggle-TS-JS>

```ts btnBusy directive definition
myApp.directive("btnBusy", () => {
    return {
        template: `<div>
                      <div ng-transclude ng-hide="busy" class="btn-busy-text"></div>
                      <div class="busy-container">
                          <div class="busy" ng-show="busy"></div>
                      </div>
                  </div>`,
        transclude: true,
        scope: {
            busy: "=btnBusy"
        },
        restrict: "A",
    };
});

```
```javascript btnBusy directive definition

myApp.directive("btnBusy", function () {
    return {
        template: "<div>\n" +
                  "<div ng-transclude ng-hide=\"busy\" class=\"btn-busy-text\"></div>\n" +
                  "<div class=\"busy-container\">\n" +
                  "<div class=\"busy\" ng-show=\"busy\"></div>\n" +
                  "</div>\n"+
                  "</div>",
        transclude: true,
        scope: {
            busy: "=btnBusy"
        },
        restrict: "A",
    };
});

```
</div>

For the css, we need to define a processing animation. I have chosen a spinner because it fits nicely, but you can substitute
your favorite loading state.

First we have the keyframe definition, then inside our directive name space we have directive specific styles.

We have the containing div with a relative position, this allows the position absolute to be positioned relative to this
parent element.

The busy class gets all of the animation styles including the animation definition. Notice `infinite` which allows the
animation to repeat itself. We define a boarder as well as a border radius to get our circular spinner.
We also need to override the animation with a 0s animation once ng-hide-add class is added to the element, but only if you have
the ngAnimate module installed.

For a quick aside on animations which only apply if you have the [ngAnimate](https://docs.angularjs.org/api/ngAnimate) module installed,
once the scope variable becomes true for [ng-hide](https://docs.angularjs.org/api/ng/directive/ngHide)
[angular will apply an `ng-hide-add` class as well as an `ng-animate`](https://docs.angularjs.org/api/ng/directive/ngHide#a-note-about-animations-with-nghide-).
After this class is added it will scan the element for any transitions or animations. It will store the specified time, and then
it will add the `ng-hide-add-active` and `ng-hide` classes. Once these classes are applied it will wait for the above
stored time until it removes the element from view by removing the ng-animate class which was blocking the affects of ng-hide.
It does this because it assumes the applied animation or transition is meant to transition the element out of view.
Typically this is exactly what we want, but for this use case we don't want the element to remain in view for an extra
.8 seconds, so we override it to 0 seconds before angular does its check.

For the `btn-busy-text` class we need to override the default `ng-hide` styles. The default styles apply a `display: none !important`
and would cause the element to disappear and collapse the button. We want it to remain a block level element even when hidden so we add `display: block !important;`
Note the `!important` which is required to override Angular's `!important`. We also give it an opacity of 0 so that it appears hidden.

Then we give the `busy-container` an absolute position. Then we position it and give it
a full width so it appears centered.

I have also added a default height and width, as well as a larger version, these will be specific to your site's button dimensions.

```scss btnBusy scss

@keyframes rotate-360 {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

[btn-busy] {
    > div {
        position: relative;
    }
    .busy {
        animation: rotate-360 0.8s infinite linear;
        border: 1px solid slategray;
        border-radius: 50%;
        border-right-color: midnightblue;
        border-top-color: midnightblue;
        display: inline-block;
        &.ng-hide-add {
            animation: none 0s; //allow for quick removal (ignore .8 second animation from rotate-360)
        }
    }
    .btn-busy-text {
        &.ng-hide {
            display: block !important; //override angular's default
            opacity: 0;
        }
    }
    .busy-container {
        position: absolute;
        top: 0px;
        left: 0px;
        width: 100%;
    }
    .busy {
        height: 20px;
        width: 20px;
    }

    &.btn-busy-large .busy {
        height: 32px;
        width: 32px;
    }

}

```

Finally to see it in action we can make a form and apply the directive to our submit button.


```html btnBusy in action

<div ng-app="myApp">
  <div ng-controller="Main as MainCtrl" class="container">
    <form name="timeForm" class="form-inline" novalidate>
      <h5>How long should we wait (ms)?</h5>
      <div class="form-group">
        <input type="text" class="input-s form-control" name="time" ng-model="MainCtrl.waitTime" placeholder="time" ng-required="true" />
      </div>

      <button class="btn btn-primary" ng-click="MainCtrl.wait()" btn-busy="MainCtrl.waiting" ng-disabled="MainCtrl.waiting">Let's Wait!</button>
    </form>

  </div>
</div>

```
