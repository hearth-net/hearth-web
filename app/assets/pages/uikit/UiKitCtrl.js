'use strict';

/**
 * @ngdoc controller
 * @name hearth.controllers.UiKitCtrl
 * @description
 */

angular.module('hearth.controllers').controller('UiKitCtrl', [
  '$scope', '$sce', '$compile', '$timeout',
  function ($scope, $sce, $compile, $timeout) {

    // @kamil Can't use controllerAs here because I don't know how to bind to ctrl with $compile
    // const ctrl = this;

    $scope.buttons = []
    $scope.typographies = []
    $scope.inputs = []

    /*
     Data section
     attributes:
     name - element name
     code - element html code
     desc - description/comment
     */

    const getTypographiesData = () => {
      return [
        {code: '<h1>Pro lidi s otevřeným srdcem</h1>', name: 'Header 1'},
        {code: '<h2>Sdílejte dary a přání</h2>', name: 'Header 2'},
        {code: '<h3>Prostor pro lidi s otevřeným srdcem</h3>', name: 'Header 3'},
        {
          code: '<p>Co nás baví a naplňuje, posíláme dál. Co sami potřebujeme, dostáváme od druhých. Bez peněz. Bez principu „co za to”. Jen tak, pro radost :-)</p>',
          name: 'Paragraph'
        },

      ];
    };

    const getButtonsData = () => {
      return [
        {code: '<button class="button">primary</button>'},
        {code: '<button class="button secondary">secondary</button>'},
        {code: '<button class="button offer">need</button>', desc: 'The style is set according to post character.'},
        {code: '<button class="button need">offer</button>', desc: 'The style is set according to post character.'},
        {code: '<button class="button dark-gray">dark-gray</button>'},
        {code: '<button class="button"><i class="fa fa-globe"></i><span>text</span></button>'},
        {code: '<button class="button"><i class=\"fa fa-globe\"></i></button>'},
        {code: '<button class="hollow button">primary inv</button>'},
        {code: '<button class="hollow button secondary">secondary inv</button>'},
        {code: '<button class="button disabled">disabled</button>'}
      ];
    };

    const getInputsData = () => {
      return [
        {code: '<input type="text" placeholder="placeholder">'},
        {code: '<input type="number" value="10">'},
        {code: '<textarea placeholder="Text area ..."></textarea>'},
      ];
    };

    function getAvatarData() {
      return {
        code: `<div class="avatar-stack">
  <avatar size="small" src="loggedUser.avatar.normal" type="\'User\'"></avatar>
  <avatar size="small"></avatar>
</div>`,
        selector: '[avatars]',
        scopeId: 'avatars'
      }
    }

    init()

    ///////////////////////////////////////////////////////////////////////

    function init() {
      prepareElementData($scope.buttons, getButtonsData())
      prepareElementData($scope.typographies, getTypographiesData())
      prepareElementData($scope.inputs, getInputsData())
      compileData(getAvatarData())
      compileData(getFormData())
    }

    function getFormData() {

      // every first attempt to submit will end success, every other will simulate an error
      var submitWillBeSuccess = true;

      // prepare models
      $scope.formLoading;
      $scope.savingFormError;
      $scope.savingFormSuccess;
      $scope.validationError;
      $scope.testFormData = {
        name: '',
        surname: ''
      };
      // bind submit function to controller
      // ctrl.testFormSubmit = (data, form) => {
      $scope.testFormSubmit = (data, form) => {
        form.$setDirty();

        $scope.savingFormSuccess = false;
        $scope.savingFormError = false;

        // validation
        $scope.validationError = false;
        if (!form.$valid) return $scope.validationError = true;

        // simulate API call
        $scope.formLoading = true;
        $timeout(() => {
          if (submitWillBeSuccess) {
            $scope.formLoading = false;
            $scope.savingFormSuccess = true;
            form.$setPristine();
            form.$setUntouched();

          } else {
            $scope.formLoading = false;
            $scope.savingFormError = true;
          }
          submitWillBeSuccess = !submitWillBeSuccess;
        }, 1000);

      };

      // and return template
      return {
        code:
`<form name="testForm" id="testForm" ng-submit="testFormSubmit(testFormData, testForm, uiKit)" novalidate>
  <div ng-show="savingFormSuccess" class="callout cursor-pointer success" ng-click="savingFormSuccess = false" translate="FORM.SAVING_SUCCESS"></div>
  <div ng-show="savingFormError" class="callout cursor-pointer error" ng-click="savingFormError = false">
    <div translate="FORM.SAVING_FAILED"></div>
    <span>reason, if any</span>
  </div>
  <label class="block">
    <span translate="PERSON.NAME"></span>
    <input type="text" name="name" ng-model="testFormData.name" translate-attr="{placeholder: 'PERSON.NAME'}" required minlength="2" />
    <div class="help-text" translate="PERSON.NAME.HELPTEXT"></div>
    <div ng-messages="testForm.name.$error" ng-show="testForm.$submitted || testForm.name.$dirty">
      <div ng-messages-include="assets/components/form/ngMessages/required.html"></div>
      <div ng-messages-include="assets/components/form/ngMessages/minlength.html"></div>
    </div>
  </label>
  <label class="block">
    <span translate="PERSON.SURNAME"></span>
    <input type="text" name="surname" ng-model="testFormData.surname" translate-attr="{placeholder: 'PERSON.SURNAME'}" required />
    <div ng-messages="testForm.surname.$error" ng-show="testForm.$submitted || testForm.surname.$dirty">
      <div ng-message="required" translate="PERSON.SURNAME.ERROR_REQUIRED"></div>
    </div>
  </label>
  <div class="flex flex-divided-medium">
    <button class="button" type="submit" translate="FORM.SUBMIT"></button>
    <i class="fa fa-spinner fa-spin" ng-if="formLoading"></i>
  </div>
</form>`,
        selector: '[form-data]',
        scopeId: 'formData',
      };
    }

    ///////////////////////////////////////////////////////////////////////

    /**
     * HELPER FUNCTIONS
     */

    // Bind data directly to template
    function compileData(data) {
      angular.element(data.selector).append($compile(data.code)($scope));
      $scope[data.scopeId] = data.code;
    }

    // Prepare data for binding to html
    function prepareElementData(scopeElementList, inputDataList) {
      inputDataList.forEach(element => {
        scopeElementList.push({
          name: element.name || "",
          code: $sce.trustAsHtml(element.code),
          description: (element.desc || "") + " " + element.code
        });
      });
    }

  }
]);