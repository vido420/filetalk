// ==========================================================================
// Frontend.LoginController
// ==========================================================================

require('core');

/** @class

  (Document Your View Here)

  @extends SC.Object
  @author AuthorName
  @version 0.1
  @static
*/
Frontend.loginController = SC.Object.create(
/** @scope Frontend.loginController */ {

	login: function() {
		SC.page.get('loginProgresDialog').set('isVisible', true);
		var request = new Ajax.Request('/backend/login', {
			method: 'GET',
			parameters: {
				name: SC.page.getPath('loginView.loginForm.loginName.value'),
				pass: SC.page.getPath('loginView.loginForm.loginPassword.value'),
			},
			evalJS: false,
			evalJSON: false,
			onSuccess: function(response) {
				SC.page.get('loginProgresDialog').set('isVisible', false);
				Frontend.appController.set('tab', 'chat');
			},
		   	onFailure: function() {
				SC.page.get('loginProgresDialog').set('isVisible', false);
				SC.page.get('loginFailureDialog').set('isVisible', true);
			}
		});
	},
	hideFailureDialog: function() {
		SC.page.get('loginFailureDialog').set('isVisible', false);
	},
}) ;
