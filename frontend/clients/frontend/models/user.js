// ==========================================================================
// Frontend.User
// ==========================================================================

require('core');

/** @class

  (Document your class here)

  @extends SC.Record
  @author AuthorName
  @version 0.1
*/
Frontend.User = SC.Record.extend(
/** @scope Frontend.User.prototype */ {

});

Frontend.User.removeAll = function() {
	var records = Frontend.User.findAll();
	if (records == null) { return; }
	for (var i = records.length - 1; i >= 0; i--) {
		SC.Store.removeRecord(records[i]);
	}
};
