const { ContentTab, openTab } = await require('@bridge/tab')
const { create } = await require('@bridge/sidebar')
const { WorldHub } = await require('@bridge/ui')
const { register, addTabActions } = await require('@bridge/tab-actions')
const { setup } = await require('@bridge/com-mojang')
const { readdir, getFileHandle, loadFileHandleAsDataUrl } =
	await require('@bridge/fs')
const { getCurrentProject } = await require('@bridge/env')

class WorldHubTab extends ContentTab {
	type = 'WorldHubTab'
	component = WorldHub
	availableWorlds = null
	isReady = false

	constructor(parent) {
		super(parent)

		setup.once(() => {
			this.isReady = true

			addTabActions(this)
			this.refresh()
		})
	}

	static is() {
		return false
	}
	async isFor() {
		return false
	}

	refresh() {
		readdir(`${getCurrentProject()}/worlds`, {
			withFileTypes: true,
		}).then(async (dirents) => {
			this.availableWorlds = await Promise.all(
				dirents
					.filter((dirent) => dirent.kind === 'directory')
					.map(async (dirent) => {
						return {
							folderName: dirent.name,
							name: await getFileHandle(
								`${getCurrentProject()}/worlds/${
									dirent.name
								}/levelname.txt`
							)
								.then((fileHandle) => fileHandle.getFile())
								.then((file) => file.text())
								.catch(() => dirent.name),
							imgSrc: await loadFileHandleAsDataUrl(
								await getFileHandle(
									`${getCurrentProject()}/worlds/${
										dirent.name
									}/world_icon.jpeg`
								).catch(() =>
									getFileHandle(
										`data/packages/common/packIcon.png`
									)
								)
							),
						}
					})
			)
		})
	}

	get icon() {
		return 'mdi-earth-box'
	}
	get iconColor() {
		return 'success'
	}
	get name() {
		return 'WorldHub'
	}
}

register({
	icon: 'mdi-refresh',
	name: '[Refresh]',
	trigger(tab) {
		tab.refresh()
	},
	isFor(tab) {
		return tab.type === 'WorldHubTab'
	},
})

let currentHubs = {}
create({
	displayName: '[WorldHub]',
	icon: 'mdi-earth-box',
	onClick: async () => {
		// Only allow one WorldHub to be open at once
		if (currentHubs[getCurrentProject()])
			return currentHubs[getCurrentProject()].select()

		const tab = await openTab(WorldHubTab)
		currentHubs[getCurrentProject()] = tab
		tab.onClose.on(() => {
			currentHubs[getCurrentProject()] = undefined
		})
	},
})