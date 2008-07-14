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
	showErrorDialog: function(title, message) {
		Frontend.errorMessageController.set('errorTitle', title);
		Frontend.errorMessageController.set('errorMessage', message);
		SC.page.get('errorDialog').set('isVisible', true);
	},
	hideErrorDialog: function() {
		SC.page.get('errorDialog').set('isVisible', false);
	},
});
