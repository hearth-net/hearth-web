'use strict';

/**
 * @ngdoc directive
 * @name hearth.directives.infoBubble
 * @description Directive that creates an information bubble on hover next to an element
 * @restrict A
 */

angular.module('hearth.directives').directive('infoBubble', ['$timeout', '$window', '$document', '$compile', '$rootScope', 'InfoBubbleModel', 'InfoBubbleSetup', '$templateCache', function($timeout, $window, $document, $compile, $rootScope, InfoBubbleModel, InfoBubbleSetup, $templateCache) {

  const INFO_BUBBLE_SELECTOR = '[info-bubble-focusser]'
  const INTENT_DELAY = 300
  const INTENT_HIDE_DELAY = 300 // must be smaller or equal to INTENT_DELAY
  const BUBBLE_MARGIN = 10

  const validTypes = InfoBubbleSetup.typeMap

  var intent
  var hideIntent

  var bubbleElement
  var hoveredElement
  var bubbleScope

	return {
		restrict: 'A',
		scope: {},
    bindToController: {
			infoBubble: '=',
      infoBubbleType: '='
		},
    controllerAs: 'vm',
    controller: ['$element', function($element) {

      const ctrl = this

      ctrl.$onInit = () => {
        ctrl.bubble = InfoBubbleModel
      }

      ctrl.$onDestroy = () => {
        InfoBubbleModel.shown = false

        bubbleElement = void 0
        hoveredElement = void 0

        $timeout.cancel(intent)
        $timeout.cancel(cancelIntent)

        $element.off('mouseenter', initIntent)
        $element.off('mouseleave', cancelIntent)
      }

    }],
		link: function(scope, element, attrs, ctrl) {

      element.on('mouseenter', initIntent.bind(null, { ctrl, type: ctrl.infoBubbleType, element }))
      element.on('mouseleave', cancelIntent.bind(null, { ctrl }))

    }
  }

  //////////////////

  function show({ ctrl, type, element }) {

    $timeout.cancel(cancelIntent)
    if (InfoBubbleModel.shown) return

    // make sure the bubble element exists
    getBubble(type)

    // here I have to make sure that the element is in the variable, because I may have removed it in hide
    hoveredElement = element[0]

    if (ctrl) InfoBubbleModel.model = ctrl.infoBubble
    element.after(bubbleElement)
    InfoBubbleModel.shown = true
    InfoBubbleModel.opacity = 0

    $timeout(() => positionBubble(element))

  }

  function positionBubble(element) {
    const rpp = findRelativePositionParent(element[0])
    const rppBb = rpp.getBoundingClientRect()

    const bb = element[0].getBoundingClientRect()

    const windowWidth = Math.max($document[0].documentElement.clientWidth, $window.innerWidth || 0)
    const offsetLeft = (bb.right + BUBBLE_MARGIN - rppBb.left)

    // doesn't work, don't know why
    const bubbleWidth = bubbleElement.getBoundingClientRect().width// || 300

    const positionOnRight = (bb.right + bubbleWidth + BUBBLE_MARGIN) > windowWidth ? false : true

    InfoBubbleModel.position.top = (bb.top - rppBb.top) + 'px'
    if (positionOnRight) {
      InfoBubbleModel.position.left = offsetLeft + 'px'
    } else {
      InfoBubbleModel.position.left = (bb.left - bubbleWidth - BUBBLE_MARGIN) + 'px'
    }

    InfoBubbleModel.opacity = 1
  }

  function findRelativePositionParent(el) {
    if (!el) return $document[0].body
    while (el && el !== $document[0].body && (['relative', 'absolute', 'fixed'].indexOf($window.getComputedStyle(el).getPropertyValue('position')) === -1)) el = el.parentNode
    return el
  }

  function hide() {
    InfoBubbleModel.shown = false
    hoveredElement = void 0
    if (!$rootScope.$$phase) $rootScope.$apply()
  }

  function initIntent(argObject) {

    if (argObject.element[0] === hoveredElement) return $timeout.cancel(hideIntent)
    hoveredElement = argObject.element[0]

    intent = $timeout(show.bind(null, argObject), INTENT_DELAY)
  }

  function cancelIntent() {
    $timeout.cancel(intent)
    hideIntent = $timeout(hide, INTENT_HIDE_DELAY)
  }

  /**
   * Creates the html element of a bubble, if it has not been created yet
   */
  function getBubble(type) {

    // standardize
    type = type.toLowerCase()

    if (!validTypes[type]) throw new TypeError(`Invalid info bubble type: ${type}`)

    if (bubbleElement) return reinit({scope: bubbleScope, type: validTypes[type]})

    bubbleElement = $document[0].querySelector(INFO_BUBBLE_SELECTOR)
    if (bubbleElement) return reinit({scope: bubbleScope, type: validTypes[type]})

    bubbleScope = bubbleScope || $rootScope.$new(true)
    bubbleScope.bubble = InfoBubbleModel
    bubbleScope.type = validTypes[type.toLowerCase()]
    bubbleScope.templateGet = InfoBubbleSetup.templateGet
    angular.element($document[0].body).append($compile($templateCache.get(`assets/components/infoBubble/templates/infoBubbleWrapper.html`))(bubbleScope))

    bubbleElement = $document[0].querySelector(INFO_BUBBLE_SELECTOR)

    bindEvents($document[0].querySelector(INFO_BUBBLE_SELECTOR))
  }

  function reinit({scope, type}) {
    scope.type = type
  }


  function bindEvents(bubble) {
    if (!bubble) throw new TypeError('Bubble has to be a DOM Node. Got:', bubble)
    bubble = angular.element(bubble)

    bubble.on('mouseenter', () => $timeout.cancel(hideIntent))
    bubble.on('mouseleave', cancelIntent)
  }

}])