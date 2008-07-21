// ==========================================================================
// Frontend.UserlistController
// ==========================================================================

require('core');

/** @class

  (Document Your View Here)

  @extends SC.Object
  @author AuthorName
  @version 0.1
  @static
*/
Frontend.userlistController = SC.CollectionController.create(
/** @scope Frontend.userlistController */ {
	getUserInfo: function() {
		var selection = Frontend.userlistController.get('selection');
		if (!selection || selection.length < 1) {
			alert('Please select a user to get information about.');
		} else if (selection.length > 1) {
			alert('You may only get information about one user at a time.')
		} else {
			var request = new Ajax.Request('/backend/user/info', {
				method: 'GET',
				parameters: { u: selection[0].get('guid') },
				evalJS: false,
				evalJSON: false,
				onSuccess: function(response) {
				},
			   	onFailure: function() {
				}
			});
		}
	},
	showUserInfoDialog: function(info) {
		SC.page.getPath('userInfoDialog.userInfoField').set('value', info);
		SC.page.get('userInfoDialog').set('isVisible', true);
	},
	hideUserInfoDialog: function() {
		SC.page.get('userInfoDialog').set('isVisible', false);
	},
});
