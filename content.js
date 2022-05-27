chrome.storage.sync.get('currentURL', (data) => {
	const url = data.currentURL;

	//Make sure this code only runs on google docs (for now)
	if (url.includes('docs.google.com')) {
		const focusWindow = window.open('');
		focusWindow.close();

		chrome.storage.sync.get('replacementPhrases', async (data) => {
			const replacementPhrases = data['replacementPhrases'];

			console.log(replacementPhrases);

			for (let i = 0; i < replacementPhrases.length; i++) {
				const phrase = replacementPhrases[i];

				if (phrase['enabled']) await replaceValuesOnDocs(phrase.toReplace, phrase.replaceWith);
			}
		});
	}
});

async function replaceValuesOnDocs(valueToReplace, replacementValue) {
	let advanceInterval = 100; //Advancement interval in ms

	return new Promise((resolve, reject) => {
		//Press Ctrl + H to bring up 'replace all' menu
		openReplaceAllMenu();

		console.log(valueToReplace, replacementValue);

		//Cache important UI elements from 'replace all' menu
		const replaceMenuCloseButton = document.querySelector('div.docs-findandreplacedialog span.modal-dialog-title-close');
		const findInput = document.getElementById('docs-findandreplacedialog-input');
		const replaceInput = document.getElementById('docs-findandreplacedialog-replace-input');
		const replaceAllButton = document.getElementById('docs-findandreplacedialog-button-replace-all');

		//Delay different phases of this procedure by 100ms so that there is enough time for menu elements to be generated by docs
		setTimeout(() => {
			//Put the value to be replaced in the 'find' input field
			findInput.value = valueToReplace;

			//This quickly closes and re-opens the menu, making sure that the 'Replace All' button is enabled
			clickDocsElement(replaceMenuCloseButton);
			openReplaceAllMenu();

			setTimeout(() => {
				//Put the replacement value in the 'replace with' input field
				replaceInput.value = replacementValue;

				//Click the 'replace all' button
				clickDocsElement(replaceAllButton);

				//Reset input fields
				findInput.value = '';
				replaceInput.value = '';

				//Close Menu
				clickDocsElement(replaceMenuCloseButton);

				resolve();
			}, advanceInterval);
		}, advanceInterval);
	});
}

//Pulled from StackOverflow: https://stackoverflow.com/questions/51848258/google-docs-programmatically-send-mouse-click-to-an-item-in-outline-pane
//Thanks to Iván Nokonoko!
function clickDocsElement(el) {
	var box = el.getBoundingClientRect(),
		coordX = box.left + (box.right - box.left) / 2,
		coordY = box.top + (box.bottom - box.top) / 2;

	simulateMouseEvent(el, 'mousedown', coordX, coordY);
	simulateMouseEvent(el, 'mouseup', coordX, coordY);
	simulateMouseEvent(el, 'click', coordX, coordY);
}

var simulateMouseEvent = function (element, eventName, coordX, coordY) {
	element.dispatchEvent(
		new MouseEvent(eventName, {
			view: window,
			bubbles: true,
			cancelable: true,
			clientX: coordX,
			clientY: coordY,
			button: 0
		})
	);
};

//Adds support for Macs (metaKey). Did not feel like it was worth OS checking
function openReplaceAllMenu() {
	//Non-Mac operating systems
	const openReplaceAllMenu = new KeyboardEvent('keydown', { key: 'h', ctrlKey: true });
	document.body.dispatchEvent(openReplaceAllMenu);

	//MacOS
	const openReplaceAllMenuMac = new KeyboardEvent('keydown', { key: 'h', metaKey: true });
	document.body.dispatchEvent(openReplaceAllMenuMac);
}
