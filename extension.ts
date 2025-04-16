import { Facet, Extension, RangeSet } from '@codemirror/state';
import {
	WidgetType,
	EditorView,
	Decoration,
	ViewPlugin,
	DecorationSet,
	ViewUpdate,
	MatchDecorator,
} from '@codemirror/view';

interface MorgenPluginSettings {
	decorateIDs: 'show' | 'hide' | 'replace_with_emoji';
	idFormat: 'original' | 'dataview';
}

const DEFAULT_SETTINGS: MorgenPluginSettings = {
	decorateIDs: 'show',
	idFormat: 'original',
};

class IDWidget extends WidgetType {
	constructor(readonly id: string) {
		super();
	}

	toDOM() {
		const wrap = document.createElement('span');
		wrap.setAttribute('aria-label', `ID: ${this.id}`);
		const box = wrap.appendChild(document.createElement('span'));
		box.innerText = '▫️';
		box.style.opacity = '0.7';
		box.style.filter = 'grayscale()';
		return wrap;
	}
}

const settingsFacet = Facet.define<MorgenPluginSettings, MorgenPluginSettings>({
	combine: (allSettings) => allSettings[0] ?? DEFAULT_SETTINGS,
});

function hideIdsDeco(view: EditorView): DecorationSet {
	const settings = view.state.facet(settingsFacet);
	const prefix = settings.idFormat === 'original' ? '🆔 ' : '\\[id:: ';
	const suffix = settings.idFormat === 'original' ? '' : '\\]';
	return new MatchDecorator({
		regexp: new RegExp(prefix + '([A-Za-z0-9]+)' + suffix, 'g'),
		decoration: (match) => {
			return Decoration.replace({
				widget:
					settings.decorateIDs === 'hide'
						? undefined
						: new IDWidget(match[1]),
			});
		},
	}).createDeco(view);
}

const hideIDsPlugin = ViewPlugin.fromClass(
	class {
		decorations: DecorationSet;
		placeholderMatcher: MatchDecorator;
		previousSettingsHash: string;

		constructor(view: EditorView) {
			this.previousSettingsHash = JSON.stringify(view.state.facet(settingsFacet));
			this.decorations =
				view.state.facet(settingsFacet).decorateIDs === 'show'
					? RangeSet.empty
					: hideIdsDeco(view);
		}

		update(update: ViewUpdate) {
			if (
				update.docChanged ||
				this.previousSettingsHash !== JSON.stringify(update.view.state.facet(settingsFacet))
			) {
				this.previousSettingsHash = JSON.stringify(update.view.state.facet(settingsFacet));
				this.decorations =
					update.view.state.facet(settingsFacet).decorateIDs === 'show'
						? RangeSet.empty
						: hideIdsDeco(update.view);
			}
		}
	},
	{
		decorations: (v) => v.decorations,
		provide: (plugin) =>
			EditorView.atomicRanges.of(
				(view) => view.plugin(plugin)?.decorations || Decoration.none,
			),
	},
);

export function hideIDsExtension(settings: MorgenPluginSettings = DEFAULT_SETTINGS): Extension {
	return [settingsFacet.of(settings), hideIDsPlugin];
}
