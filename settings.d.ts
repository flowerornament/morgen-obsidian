export interface MorgenPluginSettings {
	/**
	 * Whether to show/hide or replace text-based IDs in Tasks plugin tasks
	 * with an emoji.
	 */
	decorateIDs: 'show' | 'hide' | 'replace_with_emoji';
	/**
	 * The format style for task IDs
	 */
	idFormat: 'original' | 'dataview';
}
