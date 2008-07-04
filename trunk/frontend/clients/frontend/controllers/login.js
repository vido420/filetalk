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

  // TODO: Add your own code here.
	login: function() {
		alert(SC.page.getPath('loginForm.loginName.value') + '/' +
			  SC.page.getPath('loginForm.loginPassword.value'));
	}
}) ;
