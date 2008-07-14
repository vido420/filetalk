// ==========================================================================
// Frontend.ErrorMessageController
// ==========================================================================

require('core');

/** @class

  (Document Your View Here)

  @extends SC.Object
  @author AuthorName
  @version 0.1
  @static
*/
Frontend.errorMessageController = SC.Object.create(
/** @scope Frontend.errorMessageController */ {
	errorTitle: 'Error',
	errorMessage: 'Error Message',
	errorCloseAction: null,
	showErrorDialog: function(title, message, closeAction) {
		Frontend.errorMessageController.set('errorTitle', title);
		Frontend.errorMessageController.set('errorMessage', message);
		Frontend.errorMessageController.set('errorCloseAction', closeAction);
		SC.page.get('errorDialog').set('isVisible', true);
	},
	hideErrorDialog: function() {
		SC.page.get('errorDialog').set('isVisible', false);
		var closeAction = Frontend.errorMessageController.get('errorCloseAction');
		if (closeAction) { closeAction(); }
	},
});
