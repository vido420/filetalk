// ==========================================================================
// Frontend.Conversation
// ==========================================================================

require('core');

/** @class

  (Document your class here)

  @extends SC.Record
  @author AuthorName
  @version 0.1
*/
Frontend.Conversation = SC.Record.extend(
/** @scope Frontend.Conversation.prototype */ {
	scrollOffset: 0,
	chatHTML: '&nbsp',
	userlist: [],
}) ;
