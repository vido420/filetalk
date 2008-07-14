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
				Frontend.chatController.set('userNick', ('' + response.transport.responseText));
				SC.page.get('loginProgresDialog').set('isVisible', false);
				Frontend.appController.set('tab', 'chat');
			},
		   	onFailure: function() {
				SC.page.get('loginProgresDialog').set('isVisible', false);
				Frontend.errorMessageController.showErrorDialog("Login_Failed".loc(), "Login_Failed_Message".loc());
				SC.page.get('loginFailureDialog').set('isVisible', true);
			}
		});
	},
}) ;
