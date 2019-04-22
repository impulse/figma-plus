import { getNode } from './scene';
import { registerKeyboardShortcut } from './keyboardShortcut';
import { showUI, hideUI } from './ui';
import { addMenuItem, injectMenuItem } from './menuItem';
import Vue from 'vue';
import React from 'react';
import ReactDOM from 'react-dom';

Vue.config.productionTip = false;

export const figmaPlus = {
	Vue: Vue,
	React: React,
	ReactDOM: ReactDOM,
	getNodeById: nodeId => {
		return getNode(nodeId);
	},
	getStyleById: styleId => {
		const styles = figmaPlus.styles.local.concat(figmaPlus.styles.published);
		return styles.find(style => style.id === styleId);
	},
	onFileBrowserLoaded: action => {
		window.addEventListener('fileBrowserLoaded', () => {
			action();
		});
	},
	onFileBrowserChanged: action => {
		window.addEventListener('fileBrowserChanged', () => {
			action();
		});
	},
	onFileBrowserUnloaded: action => {
		window.addEventListener('fileBrowserUnloaded', () => {
			action();
		});
	},
	onFileLoaded: action => {
		window.addEventListener('fileLoaded', () => {
			action();
		});
	},
	onFileUnloaded: action => {
		window.addEventListener('fileUnloaded', () => {
			action();
		});
	},
	onModalOpened: action => {
		window.addEventListener('modalOpened', event => {
			action(event.detail);
		});
	},
	onModalClosed: action => {
		window.addEventListener('modalClosed', () => {
			action();
		});
	},
	onMenuOpened: action => {
		window.addEventListener('menuOpened', event => {
			action(event.detail.type, event.detail.hasMoreOptions);
		});
	},
	onSubmenuOpened: action => {
		window.addEventListener('submenuOpened', event => {
			action(event.detail.type, event.detail.highlightedOption);
		});
	},
	onMenuClosed: action => {
		window.addEventListener('menuClosed', () => {
			action();
		});
	},
	onDomChanged: action => {
		window.addEventListener('domChanged', event => {
			action(event.detail);
		});
	},
	onAppLoaded: action => {
		window.addEventListener('appLoaded', () => {
			action();
		});
	},
	addCommand: ({
		label,
		action,
		condition,
		shortcut,
		submenu,
		showInCanvasMenu,
		showInSelectionMenu,
		hideInMainMenu
	}) => {
		if (!action) action = () => {};
		if (!hideInMainMenu) {
			window.addEventListener('pluginOptionsFound', () => {
				if (typeof condition === 'function') {
					if (condition()) {
						injectMenuItem('fullscreen-menu-dropdown', false, label, action, shortcut, submenu);
					}
				} else injectMenuItem('fullscreen-menu-dropdown', false, label, action, shortcut, submenu);
			});
		}
		if (showInCanvasMenu) addMenuItem('DROPDOWN_TYPE_CANVAS_CONTEXT_MENU', label, action, condition, shortcut, submenu);
		if (showInSelectionMenu) {
			addMenuItem('DROPDOWN_TYPE_SELECTION_CONTEXT_MENU', label, action, condition, shortcut, submenu);
			addMenuItem('DROPDOWN_TYPE_OBJECTS_PANEL_CONTEXT_MENU', label, action, condition, shortcut, submenu);
		}
		if (shortcut && !submenu) registerKeyboardShortcut(shortcut, action, condition);
		if (submenu)
			submenu.forEach(menuItem => {
				if (menuItem.shortcut) registerKeyboardShortcut(menuItem.shortcut, menuItem.action, menuItem.condition);
			});
	},
	registerKeyboardShortcut: ({ shortcut, action, condition }) => {
		registerKeyboardShortcut(shortcut, action, condition);
	},
	addTooltip: ({ element, text, showAfterDelay }) => {
		element.addEventListener('mousemove', () => {
			const currentTooltip = App._state.tooltip;
			if (
				JSON.stringify(currentTooltip.targetRect) === JSON.stringify(element.getBoundingClientRect()) &&
				currentTooltip.state === 2
			) {
				App._dispatch({ type: 'TOOLTIP_CANCEL_HIDE_AFTER_DELAY', payload: {} });
			} else if (
				JSON.stringify(currentTooltip.targetRect) !== JSON.stringify(element.getBoundingClientRect()) &&
				currentTooltip.state === 2
			) {
				window.App._dispatch({
					type: 'TOOLTIP_UPDATE',
					payload: {
						tooltip: {
							state: 2,
							position: currentTooltip.position,
							target: { kind: 2, text: text },
							targetRect: element.getBoundingClientRect(),
							timeoutID: null,
							interactive: false
						}
					}
				});
			} else {
				window.App._dispatch({
					type: showAfterDelay === false ? 'TOOLTIP_SHOW_IMMEDIATELY' : 'TOOLTIP_SHOW_AFTER_DELAY',
					payload: {
						interactive: false,
						position: 0,
						target: { kind: 2, text: text },
						targetRect: element.getBoundingClientRect(),
						timeoutDelay: 500
					}
				});
			}
		});
		element.addEventListener('click', () => {
			if (window.App._state.tooltip.state === 1) window.App._dispatch({ type: 'TOOLTIP_HIDE' });
		});
	},
	showToast: ({ message, timeoutInSeconds, buttonText, buttonAction }) => {
		const toast = {
			type: 'VISUAL_BELL_ENQUEUE',
			payload: {
				type: 'installed_plugin',
				message: message,
				timeout: timeoutInSeconds ? timeoutInSeconds * 1000 : 3000
			}
		};
		buttonText && buttonAction
			? Object.assign(toast.payload, {
					button: {
						text: buttonText,
						action: buttonAction
					}
			  })
			: null;
		window.App._dispatch(toast);
	},
	showUI: ({ title, callback, width, height, positionX, positionY, overlay, paddings, tabs }) => {
		showUI(title, callback, width, height, positionX, positionY, overlay, paddings, tabs);
	},
	hideUI: title => {
		hideUI(title);
	},
	viewport: {
		scrollAndZoomIntoView: nodes => {
			const selectedNodes = Object.keys(App._state.mirror.sceneGraphSelection);
			if (nodes.length === 0) return;
			nodes = typeof nodes[0] === 'object' ? nodes.map(node => node.id) : nodes;
			App.sendMessage('clearSelection');
			App.sendMessage('addToSelection', { nodeIds: nodes });
			App.triggerAction('zoom-to-selection');
			App.sendMessage('clearSelection');
			if (selectedNodes.length > 0) App.sendMessage('addToSelection', { nodeIds: selectedNodes });
		},
		panToNode: node => {
			node = typeof node === 'object' ? node.id : node;
			App.panToNode(node);
		}
	},
	toggleShowNodeId: () => App.triggerAction('toggle-show-guids'),
	isDesktop: () => window.__figmaDesktop !== undefined,
	getOrgs: () => App._state.orgById,
	getMyOrgId: () => App._state.currentOrgId,
	getTeams: () => App._state.teams,
	getMyTeams: () => App._state.user.teams,
	getFileKey: () => App._state.editingFileKey
};

Object.defineProperties(figmaPlus.viewport, {
	center: {
		get() {
			const viewportInfo = App.getViewportInfo();
			return { x: viewportInfo.x, y: viewportInfo.y };
		},
		set(val) {
			App.sendMessage('setCanvasSpaceCenter', { x: val.x, y: val.y });
		}
	},
	zoom: {
		get() {
			return App.getViewportInfo().zoomScale;
		},
		set(val) {
			App.sendMessage('updateActiveCanvasCurrentZoom', { zoom: val });
		}
	}
});

Object.defineProperties(figmaPlus, {
	root: {
		get() {
			return getNode('0:0');
		}
	},
	currentPage: {
		get() {
			const currentPage = getNode(App._state.mirror.appModel.currentPage);
			Object.defineProperty(currentPage, 'selection', {
				get() {
					return Object.keys(App._state.mirror.sceneGraphSelection).map(nodeId => getNode(nodeId));
				},
				set(selections) {
					if (selections.length === 0) {
						App.sendMessage('clearSelection');
						return;
					}
					selections = typeof selections[0] === 'object' ? selections.map(selection => selection.id) : selections;
					App.sendMessage('clearSelection');
					App.sendMessage('addToSelection', { nodeIds: selections });
					if (App.fromFullscreen._listenersByEvent.scrollToNode)
						App.fromFullscreen._listenersByEvent.scrollToNode[0]({ nodeId: selections[0] });
				}
			});
			return currentPage;
		}
	}
});

Object.defineProperty(figmaPlus, 'styles', {
	get() {
		const obj = {};
		Object.defineProperties(obj, {
			local: {
				get() {
					return Object.values(App._state.library.local.styles).map(style => {
						const obj = { id: style.key, name: style.name, type: style.style_type, description: style.description };
						if (style.thumbnail_url) obj.thumbnailUrl = style.thumbnail_url;
						if (style.style_type === 'FILL' && style.meta) obj.fills = style.meta.style_thumbnail.fillPaints;
						if (style.style_type === 'EFFECT' && style.meta) obj.effects = style.meta.style_thumbnail.effects;
						if (style.style_type === 'GRID' && style.meta) obj.layoutGrids = style.meta.style_thumbnail.layoutGrids;
						return obj;
					});
				}
			},
			published: {
				get() {
					return Object.values(App._state.library.published.styles)
						.map(org => Object.values(org))
						.flat()
						.map(team => Object.values(team))
						.flat()
						.map(style => {
							const obj = {
								id: style.key,
								name: style.name,
								type: style.style_type,
								description: style.description,
								canvasUrl: style.canvas_url
							};
							if (style.thumbnail_url) obj.thumbnailUrl = style.thumbnail_url;
							if (style.style_type === 'FILL' && style.meta) obj.fills = style.meta.style_thumbnail.fillPaints;
							if (style.style_type === 'EFFECT' && style.meta) obj.effects = style.meta.style_thumbnail.effects;
							if (style.style_type === 'GRID' && style.meta) obj.layoutGrids = style.meta.style_thumbnail.layoutGrids;
							return obj;
						});
				}
			}
		});
		return obj;
	}
});