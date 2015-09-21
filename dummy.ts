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