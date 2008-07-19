// ==========================================================================
// Frontend.PrivateMessageController
// ==========================================================================

require('core');

/** @class

  (Document Your View Here)

  @extends SC.Object
  @author AuthorName
  @version 0.1
  @static
*/
Frontend.privateMessageController = SC.Object.create(
/** @scope Frontend.privateMessageController */ {
	dialogHeader: 'error',
	sendPM: function() {
		var selection = Frontend.userlistController.get('selection');
		if (!selection || selection.length < 1) {
			alert('Please select user to send a Private Message to.');
		} else if (selection.length > 1) {
			alert('You may only send a Private Message to one user at a time.')
		} else {
			Frontend.privateMessageController.set('dialogHeader', 'Private Message to: ' + selection[0].get('nick'));
			SC.page.getPath('privateMessageDialog.messageField').set('value', '');
			SC.page.get('privateMessageDialog').set('isVisible', true);
			SC.page.getPath('privateMessageDialog.messageField').rootElement.select();
		}
	},
	hideDialog: function() {
		SC.page.get('privateMessageDialog').set('isVisible', false);		
	},
	send: function() {
		var msg = SC.page.getPath('privateMessageDialog.messageField.value');
		var selection = Frontend.userlistController.get('selection');
		if (msg && selection && selection.length == 1) {
			var request = new Ajax.Request('/backend/pm', {
				method: 'GET',
				parameters: {
					m: msg,
					to: selection[0].get('guid'),
				},
				evalJS: false,
				evalJSON: false,
				onSuccess: function(response) {
				},
			   	onFailure: function() {
				}
			});
		}
		SC.page.get('privateMessageDialog').set('isVisible', false);		
	},
}) ;
