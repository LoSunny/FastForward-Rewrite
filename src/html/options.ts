import brws from 'webextension-polyfill';
import ace from 'ace-builds';
import UIkit from 'uikit';
import Icons from 'uikit/dist/js/uikit-icons';
import 'ace-builds/src-noconflict/mode-javascript';
import 'ace-builds/src-noconflict/theme-monokai';
// @ts-ignore
UIkit.use(Icons);

document.querySelector("[data-message='optionsNavigationDelay']")!.innerHTML = document.querySelector("[data-message='optionsNavigationDelay']")!.innerHTML.replace('%', '<input id="option-navigation-delay" type="number" min="0" skip="1" style="width:34px">');
document.querySelector("[data-message='optionsCrowdAutoOpen']")!.innerHTML = document.querySelector("[data-message='optionsCrowdAutoOpen']")!.innerHTML.replace('%', '<input id="option-crowd-open-delay" type="number" min="0" skip="1" style="width:34px">');
document.querySelector("[data-message='optionsCrowdAutoClose']")!.innerHTML = document.querySelector("[data-message='optionsCrowdAutoClose']")!.innerHTML.replace('%', '<input id="option-crowd-close-delay" type="number" min="3" skip="1" style="width:34px">');
document.querySelector("[data-message='optionsUserscriptsDescription']")!.innerHTML = document.querySelector("[data-message='optionsUserscriptsDescription']")!.textContent!.replace('GitHub', "<a href='https://github.com/FastForwardTeam/FastForward/blob/main/src/js/injection_script.js' target='_blank'>GitHub</a>");

const updateButton = document.querySelector("[data-message='update']")! as HTMLButtonElement;
const enabledCheckbox = document.getElementById('option-enabled')! as HTMLInputElement;
const enabledLabel = document.querySelector("label[for='option-enabled']")!;
const navigationDelayInput = document.getElementById('option-navigation-delay')! as HTMLInputElement;
const navigationDelayCheckbox = document.getElementById('navigation-delay-toggle')! as HTMLInputElement;
const trackerBypassCheckbox = document.getElementById('option-tracker-bypass')! as HTMLInputElement;
const instantNavigationTrackersCheckbox = document.getElementById('option-instant-navigation-trackers')! as HTMLInputElement;
const blockIPLoggersCheckbox = document.getElementById('option-block-ip-loggers')! as HTMLInputElement;
const crowdBypassCheckbox = document.getElementById('option-crowd-bypass')! as HTMLInputElement;
const crowdOpenDelayInput = document.getElementById('option-crowd-open-delay')! as HTMLInputElement;
const crowdOpenDelayCheckbox = document.getElementById('option-crowd-open-delay-toggle')! as HTMLInputElement;
const crowdCloseDelayInput = document.getElementById('option-crowd-close-delay')! as HTMLInputElement;
const crowdCloseDelayCheckbox = document.getElementById('option-crowd-close-delay-toggle')! as HTMLInputElement;
const instantNavigationTrackersLogic = () => {
    if (!trackerBypassCheckbox.checked || (navigationDelayCheckbox.checked && navigationDelayInput.value === '0')) {
        instantNavigationTrackersCheckbox.setAttribute('disabled', 'disabled');
    } else {
        instantNavigationTrackersCheckbox.removeAttribute('disabled');
    }
};
const crowdOpenDelayLogic = () => {
    if (crowdOpenDelayCheckbox.checked) {
        crowdOpenDelayInput.removeAttribute('disabled');
    } else {
        crowdOpenDelayInput.setAttribute('disabled', 'disabled');
    }
};
const crowdCloseDelayLogic = () => {
    if (crowdCloseDelayCheckbox.checked) {
        crowdCloseDelayInput.removeAttribute('disabled');
    } else {
        crowdCloseDelayInput.setAttribute('disabled', 'disabled');
    }
};
const defaultUserScript = `// Some examples of what you can do with custom bypasses:
domainBypass("example.com", () => {
	// Triggered on example.com and subdomains (e.g. www.example.com)
	ensureDomLoaded(() => {
		// Triggered as soon as the DOM is ready
	})
	// You can use ifElement to check if an element is available via document.querySelector:
	ifElement("a#skip_button[href]", a => {
		safelyNavigate(a.href)
		// safelyNavigate asserts that given URL is valid before navigating and returns false if not
	}, () => {
		// Optional function to be called if the given element is not available
	})
	// You can also use awaitElement to wait until an element is available via a query selector:
	awaitElement("a#skip_button[href]", a => {
		safelyAssign(a.href)
		// safelyAssign is the same as safelyNavigate but skips the
		// "You're almost at your destination" page, should the user have it enabled
	})
})
domainBypass(/example\\.(com|org)/, () => {
	// Triggered if the regex matches any part of the hostname
})
hrefBypass(/example\\.(com|org)/, () => {
	// Triggered if the regex matches any part of the URL
})
// Enjoy! Your changes will be saved automatically.
`;

let navigationDelayInputTimer: ReturnType<typeof setTimeout>;
let crowdOpenDelayInputTimer: ReturnType<typeof setTimeout>;
let crowdCloseDelayInputTimer: ReturnType<typeof setTimeout>;
let saveTimer: ReturnType<typeof setTimeout>;

const hash = window.location.hash.toString()
    .replace('#', '');
if (hash) {
    if (hash === 'firstrun') {
        document.getElementById('firstrun-alert')!.classList.remove('uk-hidden');
    } else {
        const elm = document.querySelector(`[for='${hash}']`);
        if (elm) {
            elm.classList.add('uk-text-warning');
        }
    }
}

ace.config.setModuleUrl('ace/mode/javascript', require('file-loader?esModule=false!ace-builds/src-noconflict/mode-javascript.js'));
ace.config.setModuleUrl('ace/theme/monokai', require('file-loader?esModule=false!ace-builds/src-noconflict/theme-monokai.js'));

const editor = ace.edit('userscript', {
    mode: 'ace/mode/javascript',
    theme: 'ace/theme/monokai',
    useWorker: false,
});
editor.on('change', () => {
    clearInterval(saveTimer);
    saveTimer = setTimeout(() => {
        brws.storage.local.set({
            userscript: editor.getValue(),
        });
    }, 500);
});

const port = brws.runtime.connect({name: 'options'});
let wasUpdating = false;
let devMode = false;
let amoVersion = false;
port.onMessage.addListener((data) => {
    if ('extension_version' in data) {
        document.getElementById('version')!.textContent = data.extension_version;
    }
    if ('amo' in data) {
        if (data.amo) {
            updateButton.classList.add('uk-hidden');
            amoVersion = true;
        }
    }
    if ('upstreamCommit' in data) {
        if (data.upstreamCommit) {
            devMode = false;
            document.getElementById('definitionsVersion')!.innerHTML = `${brws.i18n.getMessage('definitionsVersion')} <code>${data.upstreamCommit.substr(0, 7)}</code>`;
            document.getElementById('dev-alert')!
                .classList
                .add('uk-hidden');
        } else {
            devMode = true;
            document.getElementById('definitionsVersion')!.textContent = 'Development Mode';
            document.getElementById('dev-alert')!
                .classList
                .remove('uk-hidden');
        }
    }
    if ('bypassCounter' in data && data.bypassCounter > 1) {
        const counter = document.getElementById('counter')!;
        const span = counter.querySelector('span')!;
        span.textContent = brws.i18n.getMessage('bypassCounter');
        span.innerHTML = span.innerHTML.replace('%', `<b>${data.bypassCounter}</b>`);
        counter.classList.remove('uk-hidden');
    }
    if ('userScript' in data) {
        if (data.userScript) {
            editor.setValue(data.userScript);
        } else {
            editor.setValue(defaultUserScript);
        }
        editor.resize();
        editor.clearSelection();
    }
    if ('updateSuccess' in data && !devMode && !amoVersion) {
        UIkit.notification({
            message: brws.i18n.getMessage(`updat${data.updateSuccess ? 'ing' : 'eNo'}`),
            status: 'primary',
            timeout: 3000,
        });
    }
    if ('updateStatus' in data && !amoVersion) {
        if (data.updateStatus) {
            updateButton.setAttribute('disabled', 'disabled');
            if (data.updateStatus === 'updating') {
                updateButton.textContent = brws.i18n.getMessage('updating');
                wasUpdating = true;
            }
        } else {
            updateButton.textContent = brws.i18n.getMessage('update');
            updateButton.removeAttribute('disabled');
            if (wasUpdating) {
                UIkit.notification({
                    message: devMode ? 'Successfully loaded local bypass definitions.' : brws.i18n.getMessage('updateYes'),
                    status: 'success',
                    timeout: 3000,
                });
                wasUpdating = false;
            }
        }
    }
});
updateButton.onclick = () => {
    if (!updateButton.hasAttribute('disabled')) {
        port.postMessage({type: 'update'});
    }
};

brws.storage.sync.get(['disable', 'navigation_delay', 'no_tracker_bypass', 'no_instant_navigation_trackers', 'allow_ip_loggers', 'crowd_bypass', 'crowd_open_delay', 'crowd_close_delay', 'no_info_box'])
    .then((res: Record<string, any>) => {
        if (res === undefined) res = {};
        if (!res.disable || res.disable !== 'true') {
            enabledCheckbox.setAttribute('checked', 'checked');
        } else {
            enabledLabel.classList.add('uk-text-danger');
        }
        if (res.navigation_delay < 0) {
            navigationDelayInput.value = String((res.navigation_delay * -1) - 1);
            navigationDelayInput.setAttribute('disabled', 'disabled');
        } else {
            navigationDelayInput.value = res.navigation_delay;
            navigationDelayCheckbox.setAttribute('checked', 'checked');
        }
        if (res.no_tracker_bypass !== 'true') {
            trackerBypassCheckbox.setAttribute('checked', 'checked');
        }
        if (res.no_instant_navigation_trackers !== 'true') {
            instantNavigationTrackersCheckbox.setAttribute('checked', 'checked');
        }
        if (res.allow_ip_loggers !== 'true') {
            blockIPLoggersCheckbox.setAttribute('checked', 'checked');
        }
        if (res.crowd_bypass === 'true') {
            crowdBypassCheckbox.setAttribute('checked', 'checked');
        }
        if (res.crowd_open_delay < 0) {
            crowdOpenDelayInput.value = String((res.crowd_open_delay * -1) - 1);
            crowdOpenDelayInput.setAttribute('disabled', 'disabled');
        } else {
            crowdOpenDelayInput.value = res.crowd_open_delay;
            crowdOpenDelayCheckbox.setAttribute('checked', 'checked');
        }
        if (res.crowd_close_delay < 0) {
            crowdCloseDelayInput.value = String((res.crowd_close_delay * -1) - 1);
            crowdCloseDelayInput.setAttribute('disabled', 'disabled');
        } else {
            crowdCloseDelayInput.value = res.crowd_close_delay;
            crowdCloseDelayCheckbox.setAttribute('checked', 'checked');
        }
        instantNavigationTrackersLogic();
        enabledCheckbox.onchange = function () {
            enabledLabel.classList.remove('uk-text-danger');
            brws.storage.sync.set({
                disable: (!enabledCheckbox.checked).toString(),
            });
        };
        navigationDelayInput.oninput = () => {
            clearTimeout(navigationDelayInputTimer);
            navigationDelayInputTimer = setTimeout(() => {
                brws.storage.sync.set({
                    navigation_delay: navigationDelayInput.value,
                });
                instantNavigationTrackersLogic();
            }, 300);
        };
        navigationDelayCheckbox.onchange = function () {
            let navigation_delay = parseInt(navigationDelayInput.value);
            if (!navigationDelayCheckbox.checked) {
                navigation_delay = (navigation_delay + 1) * -1;
            }
            brws.storage.sync.set({navigation_delay});
            if (navigationDelayCheckbox.checked) {
                navigationDelayInput.removeAttribute('disabled');
            } else {
                navigationDelayInput.setAttribute('disabled', 'disabled');
            }
            instantNavigationTrackersLogic();
        };
        trackerBypassCheckbox.onchange = function () {
            brws.storage.sync.set({
                no_tracker_bypass: (!trackerBypassCheckbox.checked).toString(),
            });
            instantNavigationTrackersLogic();
        };
        instantNavigationTrackersCheckbox.onchange = function () {
            brws.storage.sync.set({
                no_instant_navigation_trackers: (!instantNavigationTrackersCheckbox.checked).toString(),
            });
        };
        blockIPLoggersCheckbox.onchange = function () {
            brws.storage.sync.set({
                allow_ip_loggers: (!blockIPLoggersCheckbox.checked).toString(),
            });
        };
        crowdBypassCheckbox.onchange = function () {
            brws.storage.sync.set({
                crowd_bypass: crowdBypassCheckbox.checked.toString(),
            });
            if (crowdBypassCheckbox.checked) {
                crowdOpenDelayCheckbox.removeAttribute('disabled');
                crowdCloseDelayCheckbox.removeAttribute('disabled');
                crowdOpenDelayLogic();
                crowdCloseDelayLogic();
            } else {
                crowdOpenDelayCheckbox.setAttribute('disabled', 'disabled');
                crowdOpenDelayInput.setAttribute('disabled', 'disabled');
                crowdCloseDelayCheckbox.setAttribute('disabled', 'disabled');
                crowdCloseDelayInput.setAttribute('disabled', 'disabled');
            }
        };
        crowdOpenDelayCheckbox.onchange = function () {
            let crowd_open_delay = parseInt(crowdOpenDelayInput.value);
            if (!crowdOpenDelayCheckbox.checked) {
                crowd_open_delay = (crowd_open_delay + 1) * -1;
            }
            brws.storage.sync.set({crowd_open_delay});
            crowdOpenDelayLogic();
        };
        crowdOpenDelayInput.oninput = function () {
            clearTimeout(crowdOpenDelayInputTimer);
            crowdOpenDelayInputTimer = setTimeout(() => {
                brws.storage.sync.set({
                    crowd_open_delay: crowdOpenDelayInput.value,
                });
            }, 300);
        };
        crowdCloseDelayCheckbox.onchange = function () {
            let crowd_close_delay = parseInt(crowdCloseDelayInput.value);
            if (!crowdCloseDelayCheckbox.checked) {
                crowd_close_delay = (crowd_close_delay + 1) * -1;
            } else if (crowd_close_delay < 3) {
                crowd_close_delay = 3;
            }
            brws.storage.sync.set({crowd_close_delay});
            crowdCloseDelayLogic();
        };
        crowdCloseDelayInput.oninput = function () {
            clearTimeout(crowdCloseDelayInputTimer);
            crowdCloseDelayInputTimer = setTimeout(() => {
                let crowd_close_delay = parseInt(crowdCloseDelayInput.value);
                if (crowd_close_delay < 3) {
                    crowd_close_delay = 3;
                }
                brws.storage.sync.set({crowd_close_delay});
            }, 300);
        };
    });
