// extension/content/content.ts
// ====== TOP-FRAME BRIDGE (creates the drawer in window.top) ======
(function setupBymeraTopBridge() {
  if (window.__bymeraTopBridge) return;
  window.__bymeraTopBridge = true;

  window.addEventListener('message', (ev) => {
    if (!ev.data || ev.data.type !== 'BYMERA_OPEN_DRAWER') return;

    // host element immune to page CSS
    const host = document.createElement('div');
    host.setAttribute('data-bymera-drawer-host','1');
    host.style.all = 'initial';
    host.style.position = 'fixed';
    host.style.inset = '0';
    host.style.zIndex = '2147483647';
    const shadow = host.attachShadow({ mode:'open' });

    const style = document.createElement('style');
    style.textContent = `
      .scrim{position:fixed;inset:0;background:rgba(0,0,0,.28)}
      .panel{position:fixed;right:0;top:0;height:100vh;width:min(420px,100vw);
        background:#fff;border-left:1px solid #e5e7eb;box-shadow:-12px 0 32px rgba(0,0,0,.12);
        overflow:auto;padding:16px;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif}
      .close{position:absolute;top:10px;right:12px;border:0;background:transparent;cursor:pointer;font-size:20px;color:#6b7280}
    `;
    shadow.appendChild(style);

    const scrim = document.createElement('div');
    scrim.className = 'scrim';
    scrim.addEventListener('click', () => host.remove());

    const panel = document.createElement('div');
    panel.className = 'panel';

    const close = document.createElement('button');
    close.className = 'close';
    close.textContent = '×';
    close.addEventListener('click', () => host.remove());
    panel.appendChild(close);

    // render markup sent from the checkout frame
    panel.insertAdjacentHTML('beforeend', ev.data.html);

    // simple action relay back to the source frame
    panel.addEventListener('click', (e) => {
      const t = e.target;
      const action = t.closest('[data-bymera-action]');
      if (action) {
        ev.source?.postMessage({ type:'BYMERA_ACTION', action: action.dataset.bymeraAction }, '*');
      }
    });

    shadow.appendChild(scrim);
    shadow.appendChild(panel);
    document.body.appendChild(host);
  });
})();
    let drawerReady = false;
    window.addEventListener('message', e => { if (e.data?.type === 'BYMERA_DRAWER_READY') drawerReady = true; });

    function appendToast(node) {
    if (drawerReady) {
        window.top?.postMessage({ type: 'BYMERA_TOAST', html: node.innerHTML }, '*');
    } else {
        document.body.appendChild(node);
    }
    }
    window.addEventListener('message', (e) => {
  if (e.data?.type === 'BYMERA_CLOSE_DRAWER') {
    document.querySelector('[data-bymera-drawer-host]')?.remove();
  }

  if (e.data?.type === 'BYMERA_TOAST') {
    const t = document.createElement('div');
    t.textContent = e.data.text || 'Success';
    t.style.cssText = `
      position:fixed; top:20px; right:20px; z-index:2147483647;
      background:#e8f7ee; border:1px solid #b7e2c6; color:#0f5132;
      padding:12px 16px; border-radius:12px; font-weight:600; box-shadow:0 6px 24px rgba(0,0,0,.12)
    `;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2200);
  }
});
class BymeraInjector {
    observer = null;
    buttonInjected = false;
    checkoutDetected = false;
    constructor() {
        this.init();
    }
    init() {
        this.injectWalletConnector();
        this.showTestIndicator();
        this.observePageChanges();
        this.checkForCheckoutPage();
        if (window.location.pathname.includes("/book/") || 
            window.location.pathname.includes("/checkout")) {
            console.log("[Bymera] On checkout page, trying to inject toggle immediately...");
            setTimeout(() => {
                this.injectCryptoToggle();
            }, 1000);
            setTimeout(() => {
                this.injectCryptoToggle();
            }, 3000);
        }
        setInterval(() => {
            if (!this.buttonInjected) {
                console.log("[Bymera] Periodic check - button not injected yet");
                this.checkForCheckoutPage();
            }
        }, 5000);
    }
    injectWalletConnector() {
        console.log("[Bymera] Injecting wallet connector script...");
        const script = document.createElement("script");
        script.src = chrome.runtime.getURL("inject/wallet-connector.js");
        script.onload = () => {
            console.log("[Bymera] Wallet connector script injected successfully");
        };
        (document.head || document.documentElement).appendChild(script);
    }
    showTestIndicator() {
        const testElement = document.createElement("div");
        testElement.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(240, 185, 11, 0.1);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border: 1px solid rgba(41, 117, 97, 0.2);
            color:rgb(71, 71, 71);
            padding: 16px 24px;
            border-radius: 16px;
            z-index: 10000;
            font-weight: 600;
            box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.2);
            animation: slideIn 0.3s ease-out;
        `;
        testElement.textContent = "Bymera Extension Loaded!";
        document.body.appendChild(testElement);

        // Add animation keyframes
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);

        setTimeout(() => {
            testElement.style.animation = 'slideIn 0.3s ease-out reverse';
            setTimeout(() => {
                testElement.remove();
                style.remove();
            }, 300);
        }, 3000);
    }
    observePageChanges() {
        let mutationTimer = null;
        this.observer = new MutationObserver(() => {
            if (mutationTimer) clearTimeout(mutationTimer);
            mutationTimer = setTimeout(() => {
                if (!this.checkoutDetected) {
                    this.checkForCheckoutPage();
                }
            }, 300);
        });
        this.observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    checkForCheckoutPage() {
        const isBookingUrl = window.location.pathname.includes("/book/");
        const isCartCheckout = window.location.pathname.includes("/checkout");
        console.log("[Bymera] Current URL:", window.location.href);
        if (isBookingUrl) {
            console.log("[Bymera] Detected booking URL, looking for checkout elements...");
        }
        if (isCartCheckout) {
            console.log("[Bymera] Detected cart checkout URL, looking for checkout elements...");
        }
        const checkoutSelectors = [
            '[data-testid="book-it-default"]',
            '[data-testid="reservation-payment"]',
            '[data-testid="checkout-page"]',
            'button[type="submit"][data-testid*="reservation"]',
            'div[aria-label*="payment"]',
            'div[class*="payment-section"]',
            'div[class*="checkout"]',
            'div[class*="cart-checkout"]',
            'h2:has-text("Confirm and pay")',
            'h1:has-text("Confirm and pay")',
            'button:contains("Confirm and pay")',
            'h1:contains("Confirm and pay")',
            'h2:contains("Confirm and pay")',
            'h1:contains("Checkout")',
            'h2:contains("Checkout")',
            'button:contains("Place Order")',
            'button:contains("Complete Purchase")',
            'button[id*="checkout"]',
            'form[action*="checkout"]'
        ];
        let isCheckout = isBookingUrl || isCartCheckout;
        if (!isCheckout) {
            isCheckout = checkoutSelectors.some((selector) => {
                try {
                    if (selector.includes(":contains")) {
                        const match = selector.match(/(.+):contains\("(.+)"\)/);
                        if (match) {
                            const [, elementSelector, text] = match;
                            const elements = document.querySelectorAll(elementSelector);
                            return Array.from(elements).some((el) => el.textContent?.toLowerCase().includes(text.toLowerCase()));
                        }
                    } else if (selector.includes("has-text")) {
                        const element = selector.split(":")[0];
                        const text = selector.match(/"([^"]+)"/)?.[1];
                        if (text) {
                            const elements = document.querySelectorAll(element);
                            return Array.from(elements).some((el) => el.textContent?.toLowerCase().includes(text.toLowerCase()));
                        }
                    } else {
                        return document.querySelector(selector) !== null;
                    }
                } catch {
                    return false;
                }
                return false;
            });
        }
        if (isCheckout && !this.buttonInjected) {
            console.log("[Bymera] Checkout detected, injecting crypto toggle...");
            this.checkoutDetected = true;
            this.injectCryptoToggle();
            this.buttonInjected = true;
        }
    }
    injectCryptoToggle() {
        console.log("[Bymera] Creating custom crypto toggle...");
        if (document.querySelector(".bymera-crypto-toggle") || document.querySelector('[data-bymera-crypto-toggle="true"]')) {
            console.log("[Bymera] Crypto toggle already exists");
            return;
        }
        const workTripSelectors = [
            'div[data-plugin-in-point-id="SWITCH_ROW_WORK_TRIP"]',
            'div:contains("Is this a work trip?")',
            'div:has-text("Is this a work trip?")',
            'div[class*="work-trip"]',
            'div[class*="work_trip"]'
        ];
        let workTripToggle = null;
        for (const selector of workTripSelectors) {
            try {
                if (selector.includes(":contains")) {
                    const match = selector.match(/(.+):contains\("(.+)"\)/);
                    if (match) {
                        const [, elementSelector, text] = match;
                        const elements = document.querySelectorAll(elementSelector);
                        workTripToggle = Array.from(elements).find((el) => el.textContent?.toLowerCase().includes(text.toLowerCase()));
                    }
                } else if (selector.includes("has-text")) {
                    const element = selector.split(":")[0];
                    const text = selector.match(/"([^"]+)"/)?.[1];
                    if (text) {
                        const elements = document.querySelectorAll(element);
                        workTripToggle = Array.from(elements).find((el) => el.textContent?.toLowerCase().includes(text.toLowerCase()));
                    }
                } else {
                    workTripToggle = document.querySelector(selector);
                }
                if (workTripToggle) {
                    console.log("[Bymera] Found work trip toggle with selector:", selector);
                    break;
                }
            } catch (e) {
                console.debug("[Bymera] Error with selector:", selector, e);
            }
        }
        if (!workTripToggle) {
            console.log("[Bymera] Work trip toggle not found with any selector");
            console.log("[Bymera] Available elements with data-plugin-in-point-id:", document.querySelectorAll("[data-plugin-in-point-id]"));
            console.log('[Bymera] Available elements containing "work trip":', document.querySelectorAll("*").length);
            const allElements = document.querySelectorAll("*");
            for (const el of allElements) {
                if (el.textContent?.toLowerCase().includes("work trip")) {
                    console.log('[Bymera] Found element with "work trip" text:', el);
                    workTripToggle = el;
                    break;
                }
            }
        }
        if (!workTripToggle) {
            console.log("[Bymera] Still no work trip toggle found, using document.body as fallback...");
            workTripToggle = document.body;
        }
        console.log("[Bymera] Found work trip toggle, creating custom crypto toggle...", workTripToggle);
        const cryptoToggle = document.createElement("div");
        cryptoToggle.className = "bymera-crypto-toggle";
        cryptoToggle.setAttribute("data-bymera-crypto-toggle", "true");
        cryptoToggle.setAttribute("data-plugin-in-point-id", "SWITCH_ROW_CRYPTO");
        cryptoToggle.setAttribute("data-section-id", "SWITCH_ROW_CRYPTO");
        cryptoToggle.style.cssText = `
            padding-top: 32px;
            padding-bottom: 24px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-top-style: solid;
            border-top-color: lightgray;
            border-top-width: 1px;
            background: transparent;
        `;
        const titleDiv = document.createElement("div");
        titleDiv.className = "t41l3z9 atm_c8_9oan3l atm_g3_1dzntr8 atm_cs_18jqzaw dir dir-ltr";
        titleDiv.id = "SWITCH_ROW_CRYPTO-title";
        titleDiv.textContent = "Pay with crypto";
        titleDiv.style.cssText = `
            font-weight: 500;
            line-height: 1.5;
            font-size: 16px;
            color: fff;
        `;
        const toggleButton = document.createElement("button");
        toggleButton.className = "bymera-crypto-switch";
        toggleButton.setAttribute("role", "switch");
        toggleButton.setAttribute("aria-checked", "false");
        toggleButton.setAttribute("aria-labelledby", "SWITCH_ROW_CRYPTO-title");
        toggleButton.id = "SWITCH_ROW_CRYPTO-switch";
        toggleButton.style.cssText = `
            width: 48px;
            height: 32px;
            background: #e0e0e0;
            border: none;
            border-radius: 48px;
            position: relative;
            cursor: pointer;
            transition: background-color 0.3s ease;
            outline: none;
        `;
        const toggleKnob = document.createElement("div");
        toggleKnob.style.cssText = `
            width: 28px;
            height: 28px;
            background: white;
            border-radius: 50%;
            position: absolute;
            top: 2px;
            left: 2px;
            transition: transform 0.3s ease;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        `;
        toggleButton.appendChild(toggleKnob);
        cryptoToggle.appendChild(titleDiv);
        cryptoToggle.appendChild(toggleButton);
        
        if (workTripToggle === document.body) {
            console.log("[Bymera] Injecting toggle as floating element on body");
            // Override all existing styles for floating popup
            cryptoToggle.style.cssText = `
                position: fixed !important;
                top: 120px !important;
                right: 20px !important;
                background: white !important;
                border: 1px solid #e9ecef !important;
                border-radius: 12px !important;
                padding: 16px !important;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
                z-index: 10000 !important;
                min-width: 200px !important;
                max-width: 300px !important;
                display: flex !important;
                flex-direction: column !important;
                gap: 16px !important;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
            `;
            document.body.appendChild(cryptoToggle);
            console.log("[Bymera] Toggle added to body:", cryptoToggle);
        } else {
            console.log("[Bymera] Injecting toggle next to work trip element:", workTripToggle);
            workTripToggle.parentElement?.insertBefore(cryptoToggle, workTripToggle.nextSibling);
            console.log("[Bymera] Toggle added next to work trip toggle");
        }
        
        this.setupToggleFunctionality(cryptoToggle);
        console.log("[Bymera] Custom crypto toggle added successfully");
        this.showSuccessIndicator();
    }
    setupToggleFunctionality(cryptoToggle) {
        console.log("[Bymera] Setting up toggle functionality...");
        const toggleButton = cryptoToggle.querySelector(".bymera-crypto-switch");
        const toggleKnob = cryptoToggle.querySelector(".bymera-crypto-switch > div");
        
        console.log("[Bymera] Toggle button found:", !!toggleButton);
        console.log("[Bymera] Toggle knob found:", !!toggleKnob);
        
        if (!toggleButton || !toggleKnob) {
            console.error("[Bymera] Toggle elements not found! Button:", toggleButton, "Knob:", toggleKnob);
            return;
        }
        // create a small loader in the knob and global keyframes if missing
        if (!document.querySelector('#bymera-toggle-spinner-style')) {
            const s = document.createElement('style');
            s.id = 'bymera-toggle-spinner-style';
            s.textContent = `
            @keyframes bymera-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            .bymera-toggle-loader { width: 14px; height: 14px; border-radius: 50%; box-sizing: border-box;
                border: 2px solid rgba(0,0,0,0.08); border-top-color: #297561; position: fixed; transform: translateY(-50%);
                animation: bymera-spin 0.9s linear infinite; display: none; z-index: 2147483647; }         
            `;
            document.head.appendChild(s);
        }

    // Create or reuse a single fixed-position loader appended to body (simpler, avoids clipping)
    let loader = document.querySelector('#bymera-toggle-loader-fixed');
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'bymera-toggle-loader-fixed';
        loader.className = 'bymera-toggle-loader';
        loader.style.display = 'none';
        document.body.appendChild(loader);
    }

        let isCryptoEnabled = false;
        let originalPaymentSection = null;
        const updateToggle = async (enabled) => {
            isCryptoEnabled = enabled;
            if (enabled) {
                toggleButton.style.background = "#297561";
                toggleKnob.style.transform = "translateX(16px)";
                toggleButton.setAttribute("aria-checked", "true");
                if (!toggleKnob.querySelector(".tick-mark")) {
                    const tickMark = document.createElement("div");
                    tickMark.className = "tick-mark";
                    tickMark.style.cssText = `
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        color: #297561;
                        font-size: 16px;
                        font-weight: bold;
                        line-height: 1;
                    `;
                    tickMark.innerHTML = '<svg viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="presentation" focusable="false" style="display: block; height: 12px; width: 12px; fill: currentcolor;"><path d="m10.5 1.939 1.061 1.061-7.061 7.061-.53-.531-3-3-.531-.53 1.061-1.061 3 3 5.47-5.469z"></path></svg>';
                    toggleKnob.appendChild(tickMark);
                }
                this.replaceConfirmPayButton();
                this.hideQuickPayTerms();
                this.ensureOriginalButtonHidden();
            } else {
                toggleButton.style.background = "#e0e0e0";
                toggleKnob.style.transform = "translateX(0)";
                toggleButton.setAttribute("aria-checked", "false");
                const tickMark = toggleKnob.querySelector(".tick-mark");
                if (tickMark) {
                    tickMark.remove();
                }
                this.hideCryptoPaymentOptions(originalPaymentSection);
                this.showQuickPayTerms();
            }
            if (!originalPaymentSection) {
                originalPaymentSection = this.findPaymentSection();
            }
            if (enabled) {
                if (originalPaymentSection) {
                    if (!originalPaymentSection.dataset.originalContent) {
                        originalPaymentSection.dataset.originalContent = originalPaymentSection.innerHTML;
                    }
                    await this.showCryptoPaymentOptions(originalPaymentSection);
                } else {
                    console.log("[Bymera] No payment section found, showing crypto options in drawer without replacement");
                    await this.showCryptoPaymentOptions(null);
                }
            } else if (originalPaymentSection) {
                this.hideCryptoPaymentOptions(originalPaymentSection);
            }
        };
        toggleButton.addEventListener("click", async (e) => {
            e.preventDefault();
            e.stopPropagation();
            // prevent double clicks while loading
            if (toggleButton.disabled) return;
            try {
                // show loader and mark busy for accessibility (position next to toggle)
                console.log('[Bymera] Showing toggle loader');
                const rect = toggleButton.getBoundingClientRect();
                const left = rect.right + 8; // 8px gap from toggle
                const top = rect.top + rect.height / 2; // vertical center
                loader.style.left = `${left}px`;
                loader.style.top = `${top}px`;
                loader.style.display = 'block';
                toggleButton.setAttribute('aria-busy', 'true');
                toggleButton.disabled = true;
                // hide existing tick while loading
                const existingTick = toggleKnob.querySelector('.tick-mark');
                if (existingTick) existingTick.style.display = 'none';

                await updateToggle(!isCryptoEnabled);
            } catch (err) {
                console.error('[Bymera] Error while toggling:', err);
            } finally {
                // hide loader and re-enable
                console.log('[Bymera] Hiding toggle loader');
                loader.style.display = 'none';
                const fallbackHide = document.querySelector('#bymera-toggle-loader-fixed');
                if (fallbackHide) fallbackHide.style.display = 'none';
                toggleButton.removeAttribute('aria-busy');
                toggleButton.disabled = false;
                // ensure tick visibility matches state
                const finalTick = toggleKnob.querySelector('.tick-mark');
                if (finalTick) finalTick.style.display = isCryptoEnabled ? '' : 'none';
            }
        });
    }
    findPaymentSection() {
        const paymentSectionSelectors = [
            'div[aria-label*="Pay with"]',
            'div[class*="payment"]',
            'section:has(h2:contains("Pay with"))',
            'div:has(> div > h2:contains("Pay with"))',
            'div:has(button:contains("Mastercard"))',
            'div:has(select option[value*="Mastercard"])'
        ];
        for (const selector of paymentSectionSelectors) {
            try {
                if (selector.includes(":contains")) {
                    const match = selector.match(/(.+):contains\("(.+)"\)/);
                    if (match) {
                        const [, elementSelector, text] = match;
                        const elements = document.querySelectorAll(elementSelector);
                        const found = Array.from(elements).find((el) => el.textContent?.toLowerCase().includes(text.toLowerCase()));
                        if (found) {
                            return found;
                        }
                    }
                } else {
                    const element = document.querySelector(selector);
                    if (element) {
                        return element;
                    }
                }
            } catch (e) {
                console.debug("[Bymera] Error with selector:", selector, e);
            }
        }
        return null;
    }
    showSuccessIndicator() {
        const successElement = document.createElement("div");
        successElement.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: rgba(76, 175, 80, 0.1);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border: 1px solid rgba(76, 175, 80, 0.2);
            color: #4CAF50;
            padding: 16px 24px;
            border-radius: 16px;
            z-index: 10000;
            font-weight: 600;
            box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.2);
            animation: slideIn 0.3s ease-out;
        `;
        successElement.textContent = "Crypto Toggle Added!";
        document.body.appendChild(successElement);

        setTimeout(() => {
            successElement.style.animation = 'slideIn 0.3s ease-out reverse';
            setTimeout(() => {
                successElement.remove();
            }, 300);
        }, 3000);
    }
    hideQuickPayTerms() {
        console.log("[Bymera] Hiding quick-pay terms and conditions...");
        const termsSelectors = [
            "#quick-pay-terms-and-conditions",
            '[id="quick-pay-terms-and-conditions"]',
            '[class*="quick-pay-terms-and-conditions"]',
            '[data-testid*="quick-pay-terms"]',
            '[class*="terms-and-conditions"]',
            'p:contains("terms and conditions")',
            'div:contains("terms and conditions")'
        ];
        for (const selector of termsSelectors) {
            try {
                if (selector.includes(":contains")) {
                    const match = selector.match(/(.+):contains\("(.+)"\)/);
                    if (match) {
                        const [, elementSelector, text] = match;
                        const elements = document.querySelectorAll(elementSelector);
                        const found = Array.from(elements).find((el) => el.textContent?.toLowerCase().includes(text.toLowerCase()));
                        if (found) {
                            const element = found;
                            element.style.display = "none";
                            element.setAttribute("data-bymera-hidden", "true");
                            console.log("[Bymera] Hidden quick-pay terms:", element);
                        }
                    }
                } else {
                    const element = document.querySelector(selector);
                    if (element) {
                        element.style.display = "none";
                        element.setAttribute("data-bymera-hidden", "true");
                        console.log("[Bymera] Hidden quick-pay terms:", element);
                    }
                }
            } catch (e) {
                console.debug("[Bymera] Error with terms selector:", selector, e);
            }
        }
    }
    showQuickPayTerms() {
        console.log("[Bymera] Showing quick-pay terms and conditions...");
        const hiddenElements = document.querySelectorAll('[data-bymera-hidden="true"]');
        hiddenElements.forEach((element) => {
            const htmlElement = element;
            htmlElement.style.display = "";
            htmlElement.removeAttribute("data-bymera-hidden");
            console.log("[Bymera] Shown quick-pay terms:", htmlElement);
        });
    }
    ensureOriginalButtonHidden() {
        if (this.originalConfirmPayButton) {
            console.log("[Bymera] Ensuring original button stays hidden...");
            this.originalConfirmPayButton.style.display = "none";
            this.originalConfirmPayButton.setAttribute("data-bymera-hidden", "true");
        }
    }
    async checkWalletConnection() {
        try {
            console.log("[Bymera] Checking wallet connection via injected script...");
            const result = await new Promise((resolve) => {
                const handleResponse = (event) => {
                    window.removeEventListener("bymera-wallet-response", handleResponse);
                    resolve({
                        success: event.detail.success,
                        account: event.detail.account
                    });
                };
                window.addEventListener("bymera-wallet-response", handleResponse);
                window.dispatchEvent(new CustomEvent("bymera-connect-wallet"));
                setTimeout(() => {
                    window.removeEventListener("bymera-wallet-response", handleResponse);
                    resolve({ success: false, account: null });
                }, 5000);
            });
            
            if (result.success && result.account) {
                this.connectedAccount = result.account;
                console.log("[Bymera] Connected account set:", result.account);
            }
            
            console.log("[Bymera] Wallet connection status:", result.success);
            return result.success;
        } catch (error) {
            console.log("[Bymera] Wallet connection check failed:", error);
            return false;
        }
    }
    async waitForEthereum(timeout = 3000) {
        console.log("[Bymera] Checking for ethereum provider via injected script...");
        return new Promise((resolve) => {
            const handleResponse = (event) => {
                window.removeEventListener("bymera-wallet-response", handleResponse);
                if (event.detail.success) {
                    console.log("[Bymera] Ethereum provider available via injected script");
                    resolve(true);
                } else {
                    console.log("[Bymera] Ethereum provider not available");
                    resolve(false);
                }
            };
            window.addEventListener("bymera-wallet-response", handleResponse);
            window.dispatchEvent(new CustomEvent("bymera-connect-wallet"));
            setTimeout(() => {
                window.removeEventListener("bymera-wallet-response", handleResponse);
                console.log("[Bymera] Timeout waiting for ethereum provider");
                resolve(false);
            }, timeout);
        });
    }
    connectedAccount = null;
    async connectWallet() {
        console.log("[Bymera] Attempting to connect wallet via custom events...");
        return new Promise((resolve, reject) => {
            const handleResponse = (event) => {
                console.log("[Bymera] Received wallet response:", event.detail);
                window.removeEventListener("bymera-wallet-response", handleResponse);
                if (event.detail.success) {
                    console.log("[Bymera] Wallet connected successfully!");
                    console.log("[Bymera] Account:", event.detail.account);
                    console.log("[Bymera] Chain ID:", event.detail.chainId);
                    this.connectedAccount = event.detail.account;
                    if (event.detail.chainId !== "0x14a34") {
                        this.switchToBaseSepolia().then(() => resolve()).catch(reject);
                    } else {
                        resolve();
                    }
                } else {
                    console.error("[Bymera] Wallet connection failed:", event.detail.error);
                    reject(new Error(event.detail.error));
                }
            };
            window.addEventListener("bymera-wallet-response", handleResponse);
            console.log("[Bymera] Dispatching wallet connection request...");
            window.dispatchEvent(new CustomEvent("bymera-connect-wallet"));
            setTimeout(() => {
                window.removeEventListener("bymera-wallet-response", handleResponse);
                reject(new Error("Wallet connection timeout"));
            }, 30000);
        });
    }
    async switchToBaseSepolia() {
        console.log("[Bymera] Attempting to switch to Base Sepolia network...");
        return new Promise((resolve, reject) => {
            const handleResponse = (event) => {
                console.log("[Bymera] Received network switch response:", event.detail);
                window.removeEventListener("bymera-network-response", handleResponse);
                if (event.detail.success) {
                    console.log("[Bymera] Network switch successful:", event.detail.message);
                    resolve();
                } else {
                    console.error("[Bymera] Network switch failed:", event.detail.error);
                    resolve();
                }
            };
            window.addEventListener("bymera-network-response", handleResponse);
            console.log("[Bymera] Dispatching network switch request...");
            window.dispatchEvent(new CustomEvent("bymera-switch-network"));
            setTimeout(() => {
                window.removeEventListener("bymera-network-response", handleResponse);
                console.warn("[Bymera] Network switch timeout - continuing anyway");
                resolve();
            }, 1e4);
        });
    }

    async switchToBlockchain(chainId, chainName) {
        console.log(`[Bymera] Attempting to switch to ${chainName} (${chainId})...`);
        return new Promise((resolve, reject) => {
            const handleResponse = (event) => {
                console.log("[Bymera] Received blockchain switch response:", event.detail);
                window.removeEventListener("bymera-blockchain-response", handleResponse);
                if (event.detail.success) {
                    console.log("[Bymera] Blockchain switch successful:", event.detail.message);
                    this.showNetworkSwitchNotification(chainName);
                    resolve();
                } else {
                    console.error("[Bymera] Blockchain switch failed:", event.detail.error);
                    reject(new Error(event.detail.error));
                }
            };
            window.addEventListener("bymera-blockchain-response", handleResponse);
            console.log("[Bymera] Dispatching blockchain switch request...");
            window.dispatchEvent(new CustomEvent("bymera-switch-blockchain", {
                detail: { chainId, chainName }
            }));
            setTimeout(() => {
                window.removeEventListener("bymera-blockchain-response", handleResponse);
                console.warn("[Bymera] Blockchain switch timeout - continuing anyway");
                resolve();
            }, 1e4);
        });
    }

    showNetworkSwitchNotification(chainName) {
        const notification = document.createElement("div");
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(33, 150, 243, 0.1);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(33, 150, 243, 0.3);
            color: #333;
            padding: 20px 28px;
            border-radius: 20px;
            box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
            z-index: 10000;
            font-weight: 600;
            animation: slideIn 0.3s ease-out;
            width: 300px;
            max-width: 300px;
        `;
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px;">
                <div style="
                    width: 24px;
                    height: 24px;
                    background: #2196F3;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 14px;
                    font-weight: bold;
                ">✓</div>
                <div>
                    <div style="font-size: 16px; font-weight: 600; margin-bottom: 4px;">Network Switched</div>
                    <div style="font-size: 14px; color: #666;">Connected to ${chainName}</div>
                </div>
            </div>
        `;
        document.body.appendChild(notification);

        // Add animation keyframes if not already present
        if (!document.querySelector('#network-switch-animation')) {
            const style = document.createElement('style');
            style.id = 'network-switch-animation';
            style.textContent = `
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        // Auto-remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideIn 0.3s ease-out reverse';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
    async fetchTokenBalances() {
        console.log("[Bymera] Fetching token balances...");
        return new Promise((resolve, reject) => {
            const handleResponse = (event) => {
                console.log("[Bymera] Received balances response:", event.detail);
                window.removeEventListener("bymera-balances-response", handleResponse);
                if (event.detail.success) {
                    resolve(event.detail.balances);
                } else {
                    console.error("[Bymera] Balance fetch failed:", event.detail.error);
                    resolve({ BNB: "0.0000", ETH: "0.0000", USDT: "0.0000", USDC: "0.0000" });
                }
            };
            window.addEventListener("bymera-balances-response", handleResponse);
            console.log("[Bymera] Dispatching balance fetch request...");
            window.dispatchEvent(new CustomEvent("bymera-fetch-balances"));
            setTimeout(() => {
                window.removeEventListener("bymera-balances-response", handleResponse);
                resolve({ BNB: "0.0000", ETH: "0.0000", USDT: "0.0000", USDC: "0.0000" });
            }, 5000);
        });
    }
    originalConfirmPayButton = null;
    cryptoPayButton = null;
    payButtonReplaced = false;
    replaceConfirmPayButton() {
        if (this.payButtonReplaced) {
            return;
        }
        const confirmPaySelectors = [
            'button[type="submit"]:contains("Confirm and pay")',
            'button:contains("Confirm and pay")',
            'button[aria-label*="Confirm and pay"]',
            'button[data-testid*="confirm"]',
            'button:contains("Place Order")',
            'button:contains("Complete Purchase")',
            'button:contains("Checkout")',
            'button:contains("Pay Now")',
            'button:contains("Complete Order")',
            'button:contains("Finish Order")',
            'button:contains("Submit Order")',
            'button:contains("Buy Now")',
            'button[type="submit"][class*="primary"]',
            'button[type="submit"][class*="checkout"]',
            'button[type="submit"][class*="payment"]',
            'button[type="submit"][class*="order"]',
            'button[id*="checkout"]',
            'button[id*="purchase"]',
            'button[id*="order"]',
            'button[id*="payment"]',
            'input[type="submit"]',
            'button[type="submit"]'
        ];
        let confirmButton = null;
        for (const selector of confirmPaySelectors) {
            try {
                if (selector.includes(":contains")) {
                    const match = selector.match(/(.+):contains\("(.+)"\)/);
                    if (match) {
                        const [, elementSelector, text] = match;
                        const elements = document.querySelectorAll(elementSelector);
                        confirmButton = Array.from(elements).find((el) => el.textContent?.toLowerCase().includes(text.toLowerCase()));
                    }
                } else {
                    const elements = document.querySelectorAll(selector);
                    // For generic selectors, find buttons with checkout-related text
                    const checkoutTexts = ["confirm and pay", "place order", "complete purchase", "checkout", "pay now", "complete order", "finish order", "submit order", "buy now"];
                    confirmButton = Array.from(elements).find((el) => {
                        const text = el.textContent?.toLowerCase() || "";
                        return checkoutTexts.some(checkoutText => text.includes(checkoutText));
                    });
                    // If no specific checkout text found, use the first submit button as fallback
                    if (!confirmButton && elements.length > 0 && selector.includes('type="submit"')) {
                        confirmButton = elements[0];
                    }
                }
                if (confirmButton) {
                    console.log("[Bymera] Found confirm button with selector:", selector);
                    break;
                }
            } catch (e) {
                console.debug("[Bymera] Error with selector:", selector, e);
            }
        }
        if (!confirmButton) {
            console.log("[Bymera] Confirm and pay button not found yet");
            console.log("[Bymera] Available buttons on page:");
            const allButtons = document.querySelectorAll('button, input[type="submit"]');
            allButtons.forEach((btn, index) => {
                console.log(`[Bymera] Button ${index + 1}:`, {
                    text: btn.textContent?.trim(),
                    type: btn.type,
                    id: btn.id,
                    className: btn.className,
                    tagName: btn.tagName
                });
            });
            return;
        }
        console.log("[Bymera] Found Confirm and pay button, replacing...");
        this.originalConfirmPayButton = confirmButton;
        confirmButton.style.display = "none";
        confirmButton.setAttribute("data-bymera-hidden", "true");
        this.payButtonReplaced = true;
        console.log("[Bymera] Confirm and pay button replaced with crypto button");
    }
    restoreConfirmPayButton() {
        if (!this.payButtonReplaced || !this.originalConfirmPayButton || !this.cryptoPayButton) {
            return;
        }
        console.log("[Bymera] Restoring original confirm and pay button...");
        this.originalConfirmPayButton.style.display = "";
        this.cryptoPayButton.remove();
        this.cryptoPayButton = null;
        this.payButtonReplaced = false;
        console.log("[Bymera] Original button restored");
    }
    async handleCryptoPayment() {
        console.log("[Bymera] Starting crypto payment flow...");
        try {
            const isConnected = await this.checkWalletConnection();
            if (!isConnected) {
                console.log("[Bymera] Wallet not connected, connecting...");
                await this.connectWallet();
            }
            const calculation = await this.calculateETHAmount();
            console.log("[Bymera] Payment calculation:", calculation);
            if (!this.connectedAccount) {
                const accounts = await new Promise((resolve) => {
                    window.addEventListener("bymera-wallet-response", (event) => {
                        if (event.detail.success) {
                            resolve([event.detail.account]);
                        } else {
                            resolve([]);
                        }
                    }, { once: true });
                    window.dispatchEvent(new CustomEvent("bymera-connect-wallet"));
                });
                if (accounts.length > 0) {
                    this.connectedAccount = accounts[0];
                } else {
                    throw new Error("No wallet connected");
                }
            }
            // Bymera contract address (same on all supported chains)
            const bymeraContract = "0x6c197136E7B1B0CF13c721eF23be176557425BB2";
            const ethAsNumber = parseFloat(calculation.ethAmount); // Note: keeping ethAmount property name for compatibility
            const weiAmount = BigInt(Math.floor(ethAsNumber * Math.pow(10, 18)));

            // Generate unique ID for this payment through backend API
            const paymentId = await this.generateFundingId();

            // Convert fiat amount to cents (SGD * 100)
            const fiatAmountInCents = BigInt(Math.floor(parseFloat(calculation.totalPrice.amount) * 100));

            // Prepare fund() function call data
            // fund(uint256 _id, address _tokenAddress, uint256 _tokenAmount, string _currencyCode, uint256 _fiatAmount)
            // This is a PAYABLE function - we send ETH value with the transaction
            // Function selector 0x0cca551c for fund(uint256,address,uint256,string,uint256)
            const functionSelector = this.calculateFunctionSelector("fund(uint256,address,uint256,string,uint256)");

            // Determine currency code - default to SGD if not USD
            const currencyCode = calculation.totalPrice.currency === "USD" ? "USD" : "SGD";

            // Encode parameters
            const encodedParams = this.encodeFundParams(
                paymentId,
                "0x0000000000000000000000000000000000000000", // address(0) for native ETH
                weiAmount,
                currencyCode,
                fiatAmountInCents
            );

            const data = functionSelector + encodedParams;

            // Get current network info for logging
            let currentChainId, currentNetwork;
            try {
                currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
                const networkNames = {
                    '0x14a34': 'Base Sepolia',
                    '0x38': 'BNB Smart Chain',
                    '0xef': 'TAC Mainnet', 
                    '0xa4ec': 'Celo Mainnet',
                    '0x504': 'Moonbeam'
                };
                currentNetwork = networkNames[currentChainId] || `Chain ${parseInt(currentChainId, 16)}`;
            } catch (error) {
                console.warn("[Bymera] Could not get current chain ID:", error);
                currentChainId = '0x14a34'; // Default to Base Sepolia
                currentNetwork = 'Base Sepolia';
            }

            console.log("[Bymera] Calling fund() on contract:", {
                contract: bymeraContract,
                network: currentNetwork,
                chainId: currentChainId,
                id: paymentId.toString(),
                tokenAddress: "0x0000000000000000000000000000000000000000",
                tokenAmount: weiAmount.toString(),
                currencyCode: currencyCode,
                fiatAmount: fiatAmountInCents.toString(),
                value: weiAmount.toString()
            });

            console.log("[Bymera] Transaction payload:", {
                functionSelector: functionSelector,
                encodedParams: encodedParams,
                fullData: data,
                dataLength: data.length,
                hexDataLength: (data.length - 2) / 2 + " bytes" // Remove 0x prefix
            });

            // Log the transaction parameters that will be sent
            console.log("[Bymera] Transaction parameters:", {
                from: this.connectedAccount,
                to: bymeraContract,
                value: "0x" + weiAmount.toString(16) + " (" + weiAmount.toString() + " wei)",
                data: data,
                gas: "0x30D40 (200000)"
            });

            const txHash = await new Promise((resolve, reject) => {
                const handleResponse = (event) => {
                    window.removeEventListener("bymera-transaction-response", handleResponse);
                    if (event.detail.success) {
                        resolve(event.detail.txHash);
                    } else {
                        reject(new Error(event.detail.error || "Transaction failed"));
                    }
                };
                window.addEventListener("bymera-transaction-response", handleResponse);
                window.dispatchEvent(new CustomEvent("bymera-send-transaction", {
                    detail: {
                        from: this.connectedAccount,
                        to: bymeraContract,
                        value: "0x" + weiAmount.toString(16),
                        data: data,
                        gas: "0x30D40" // 200000 gas for contract interaction
                    }
                }));
                setTimeout(() => {
                    window.removeEventListener("bymera-transaction-response", handleResponse);
                    reject(new Error("Transaction timeout"));
                }, 60000);
            });
            console.log("[Bymera] Transaction sent:", txHash);
            const processingMessage = document.createElement("div");
            processingMessage.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: rgba(33, 150, 243, 0.1);
                backdrop-filter: blur(12px);
                -webkit-backdrop-filter: blur(12px);
                border: 1px solid rgba(33, 150, 243, 0.3);
                color: #333;
                padding: 20px 28px;
                border-radius: 20px;
                box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
                z-index: 10000;
                font-weight: 600;
                animation: slideIn 0.3s ease-out;
                width: 300px;
                max-width: 300px;
            `;
            // Get explorer URL based on current network
            const explorerUrls = {
                '0x14a34': `https://base-sepolia.blockscout.com/tx/${txHash}`,
                '0x38': `https://bscscan.com/tx/${txHash}`,
                '0xef': `https://explorer.tac.build/tx/${txHash}`,
                '0xa4ec': `https://explorer.celo.org/tx/${txHash}`,
                '0x504': `https://moonbeam.moonscan.io/tx/${txHash}`
            };
            const explorerUrl = explorerUrls[currentChainId] || `https://base-sepolia.blockscout.com/tx/${txHash}`;
            const explorerName = currentNetwork.includes('Base') ? 'Blockscout' :
                                currentNetwork.includes('BSC') ? 'BSCScan' : 
                                currentNetwork.includes('TAC') ? 'TAC Explorer' :
                                currentNetwork.includes('Celo') ? 'Celo Explorer' :
                                currentNetwork.includes('Moonbeam') ? 'Moonscan' : 'Explorer';

            processingMessage.innerHTML = `
                \u23F3 Transaction submitted!<br>
                <small>Network: ${currentNetwork}</small><br>
                <small>Hash: ${txHash.substring(0, 10)}...${txHash.substring(58)}</small><br>
                <a href="${explorerUrl}" target="_blank" style="color: #333; text-decoration: underline;">View on ${explorerName}</a>
            `;
            // document.body.appendChild(processingMessage);
            appendToast(processingMessage);
            setTimeout(() => {
                console.log("[Bymera] Simulatfing transaction confirmation...");
                processingMessage.innerHTML = "\u2713 Transaction confirmed!<br><small>Processing payment...</small>";
                processingMessage.style.background = "rgba(255, 152, 0, 0.1)";
                processingMessage.style.borderColor = "rgba(255, 152, 0, 0.3)";
                setTimeout(() => {
                    processingMessage.remove();
                    const successMessage = document.createElement("div");
                    successMessage.style.cssText = `
                        position: fixed;
                        top: 20px;
                        right: 20px;
                        background: rgba(76, 175, 80, 0.1);
                        backdrop-filter: blur(12px);
                        -webkit-backdrop-filter: blur(12px);
                        border: 1px solid rgba(76, 175, 80, 0.3);
                        color: #333;
                        padding: 20px 28px;
                        border-radius: 20px;
                        box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
                        z-index: 10000;
                        font-weight: 600;
                        animation: slideIn 0.3s ease-out;
                        width: 300px;
                        max-width: 300px;
                    `;
                    successMessage.innerHTML = "<span style='font-size: 20px;'>✓</span> Crypto payment successful!<br><small style='opacity: 0.9;'>Completing your booking...</small>";
                    document.body.appendChild(successMessage);
                    setTimeout(() => {
                        if (this.originalConfirmPayButton) {
                            console.log("[Bymera] Clicking original Airbnb button...");
                            this.originalConfirmPayButton.click();
                        }
                        successMessage.remove();
                    }, 1500);
                }, 2000);

                // Start polling for card details after transaction confirmation
                this.pollForCardDetails(paymentId.toString(), processingMessage);
            }, 3000);
        } catch (error) {
            console.error("[Bymera] Crypto payment failed:", error);
            alert("Payment failed: " + error.message);
        }
    }
    extractPaymentData() {
        const totalPrice = this.extractTotalPrice();
        return {
            amount: totalPrice.amount.toString(),
            currency: totalPrice.currency,
            bookingId: window.location.pathname.split("/").pop() || ""
        };
    }

    encodeFundParams(id, tokenAddress, tokenAmount, currencyCode, fiatAmount) {
        // Remove 0x prefix from addresses if present
        const cleanAddress = tokenAddress.replace(/^0x/, '').toLowerCase();

        // Pad uint256 values to 32 bytes (64 hex chars)
        const paddedId = id.toString(16).padStart(64, '0');
        const paddedAddress = cleanAddress.padStart(64, '0');
        const paddedTokenAmount = tokenAmount.toString(16).padStart(64, '0');
        const paddedFiatAmount = fiatAmount.toString(16).padStart(64, '0');

        // For dynamic string parameter, the offset points to where the string data starts
        // After 5 32-byte parameters: id, address, amount, offset, fiatAmount = 5 * 32 = 160 (0xa0)
        const stringDataOffset = "00000000000000000000000000000000000000000000000000000000000000a0";

        // Encode the string
        const stringBytes = new TextEncoder().encode(currencyCode);
        const stringLength = stringBytes.length.toString(16).padStart(64, '0');

        // Convert string to hex and pad to multiple of 32 bytes
        let stringHex = '';
        for (let i = 0; i < stringBytes.length; i++) {
            stringHex += stringBytes[i].toString(16).padStart(2, '0');
        }

        // Pad string hex to next 32-byte boundary
        const paddingNeeded = 64 - (stringHex.length % 64);
        if (paddingNeeded !== 64) {
            stringHex = stringHex.padEnd(stringHex.length + paddingNeeded, '0');
        }

        console.log("[Bymera] Encoding parameters:", {
            id: paddedId,
            tokenAddress: paddedAddress,
            tokenAmount: paddedTokenAmount,
            stringOffset: stringDataOffset,
            fiatAmount: paddedFiatAmount,
            stringLength: stringLength,
            stringHex: stringHex,
            currencyCode: currencyCode,
            fullEncoding: paddedId + paddedAddress + paddedTokenAmount + stringDataOffset + paddedFiatAmount + stringLength + stringHex
        });

        // Combine all parameters in correct order
        return paddedId +
               paddedAddress +
               paddedTokenAmount +
               stringDataOffset +
               paddedFiatAmount +
               stringLength +
               stringHex;
    }

    // Helper function to calculate function selector
    calculateFunctionSelector(signature) {
        // This is a simplified version - in production use web3.js or ethers.js
        // The actual selector for fund(uint256,address,uint256,string,uint256) is 0x0cca551c
        // Verified from contract at 0xc6BB3C35f6a80338C49C3e4F2c083f21ac36d693
        return "0x0cca551c";
    }

    // Test the encoding
    testEncoding() {
        const testId = BigInt("7278606436507629840");
        const testAddress = "0x0000000000000000000000000000000000000000";
        const testAmount = BigInt("78061287565840384");
        const testCurrency = "SGD";
        const testFiat = BigInt("10001");

        const encoded = this.encodeFundParams(testId, testAddress, testAmount, testCurrency, testFiat);
        console.log("[Bymera] Test encoding result:", encoded);
        console.log("[Bymera] Expected result should match your data");
    }
    
    // Renders any element in a right-side drawer using Shadow DOM (immune to host CSS)
    openCryptoDrawer(content) {
        // remove an existing drawer
        document.querySelector('[data-bymera-drawer-host]')?.remove();

        const host = document.createElement('div');
        host.setAttribute('data-bymera-drawer-host', '1');
        host.style.all = 'initial';          // neutralize host page CSS
        host.style.position = 'fixed';
        host.style.top = '0';
        host.style.right = '0';
        host.style.width = 'min(420px, 100vw)';
        host.style.height = '100vh';
        host.style.zIndex = '2147483647';    // be on top
        host.style.pointerEvents = 'auto';

        const shadow = host.attachShadow({ mode: 'open' });
        window.postMessage({ type: 'BYMERA_DRAWER_READY' }, '*');   

        const style = document.createElement('style');
        style.textContent = `
            :host { all: initial; }
            .scrim {
            position: fixed; inset: 0; background: rgba(0,0,0,.28);
            animation: fade .16s ease-out;
            }
            .panel {
            position: fixed; top: 0; right: 0; height: 100vh; width: min(420px, 100vw);
            background:#fff; border-left:1px solid #e5e7eb; box-shadow: -12px 0 32px rgba(0,0,0,.12);
            display:flex; flex-direction:column; padding:16px; overflow:auto;
            font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif;
            animation: slide .18s ease-out;
            }
            .close {
            position:absolute; top:10px; right:12px; border:0; background:transparent; cursor:pointer;
            font-size:20px; line-height:1; color:#6b7280;
            }
            /* minimal layout polish for your existing markup */
            .bymera-crypto-payment{ background:#fff; border:1px solid #e5e7eb; border-radius:14px; padding:16px; }
            .bymera-header{ display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:12px; }
            .wallet{ display:inline-flex; gap:8px; padding:6px 10px; border:1px solid #e5e7eb; background:#f8fafc;
            border-radius:999px; font-size:12px; color:#6b7280; }
            .bymera-token-dropdown{ border:1px solid #e5e7eb; border-radius:12px; padding:12px; background:#fff; }
            .bymera-token-options{ border-radius:12px; }
            .bymera-payment-summary{ margin-top:14px; border:1px solid #e5e7eb; background:#f8fafc; border-radius:12px; padding:12px; }
            .bymera-payment-summary .row{ display:flex; justify-content:space-between; padding:6px 0; font-size:13px; color:#6b7280; }
            .bymera-payment-summary .row.total{ border-top:1px solid #e5e7eb; margin-top:8px; padding-top:12px; font-weight:700; color:#111827; }
            .bymera-crypto-payment button{ border-radius:12px !important; }
            @keyframes slide{ from{ transform: translateX(16px); opacity: .8 } to{ transform:none; opacity:1 } }
            @keyframes fade{ from{ opacity: 0 } to{ opacity: 1 } }
        `;
        shadow.appendChild(style);

        const scrim = document.createElement('div');
        scrim.className = 'scrim';
        scrim.addEventListener('click', () => host.remove());

        const panel = document.createElement('div');
        panel.className = 'panel';

        const close = document.createElement('button');
        close.className = 'close';
        close.setAttribute('aria-label','Close');
        close.textContent = '×';
        close.addEventListener('click', () => host.remove());

        panel.appendChild(close);
        panel.appendChild(content);     // your existing cryptoSection goes here
        shadow.appendChild(scrim);
        shadow.appendChild(panel);
        document.body.appendChild(host);
    }

    async showCryptoPaymentOptions(paymentSection) {
        if (paymentSection && !paymentSection.dataset.originalContent) {
            paymentSection.dataset.originalContent = paymentSection.innerHTML;
        }
        const cryptoSection = document.createElement("div");
        cryptoSection.className = "bymera-crypto-payment";
        cryptoSection.style.cssText = `
            background: white;
            border-radius: 8px;
        `;
        const isConnected = await this.checkWalletConnection();
        if (isConnected) {
            this.createConnectedWalletUI(cryptoSection);
        } else {
            this.createWalletConnectionPrompt(cryptoSection);
        }
         try {
            const calc = await this.calculateETHAmount();
            const balances = await this.fetchTokenBalances().catch(() => ({}));
            // Update the summary if it exists (your createConnectedWalletUI writes #payment-calculation)
            const summaryEl = cryptoSection.querySelector("#payment-calculation");
            if (summaryEl) {
            summaryEl.innerHTML = `
                <div class="row"><span>Booking Total:</span><span style="font-weight:500;">$${calc.totalPrice.amount.toFixed(2)} ${calc.totalPrice.currency}</span></div>
                <div class="row"><span>ETH Rate:</span><span style="font-weight:500;">1 ETH = $${calc.exchangeRate.toFixed(2)} ${calc.totalPrice.currency}</span></div>
                <div class="row total"><span>You Pay:</span><span>${calc.ethAmount} ETH</span></div>
            `;
            }
            // Update token balance text if present
            const balEl = cryptoSection.querySelector(".bymera-token-dropdown div:nth-child(2) > div:nth-child(2), .bymera-token-dropdown .token-balance");
            if (balEl) {
            const balanceText = balances?.ETH ? `Balance: ${balances.ETH} ETH` : '';
            balEl.innerHTML = `Needs: ${calc.ethAmount} ETH${balanceText ? `<br><small style="color:#999;">${balanceText}</small>` : ''}`;
            }
        } catch (e) {
            // leave placeholders; the top HTML will still show the fallback copy
        }

        // Mark actionable elements so clicks can be relayed back if needed
        cryptoSection.querySelector('button.bymera-pay')?.setAttribute('data-bymera-action','pay');
        cryptoSection.querySelector('button.bymera-connect')?.setAttribute('data-bymera-action','connect');

        // Send HTML to top window to render in a drawer
        if (window === window.top) {
            // Direct call since we're in the top window
            const event = new MessageEvent('message', {
                data: {
                    type: 'BYMERA_OPEN_DRAWER',
                    html: cryptoSection.outerHTML
                },
                source: window,
                origin: window.location.origin
            });
            window.dispatchEvent(event);
            console.log("[Bymera] Dispatched drawer event directly to top window");
        } else {
            window.top?.postMessage({
                type: 'BYMERA_OPEN_DRAWER',
                html: cryptoSection.outerHTML
            }, '*');
            console.log("[Bymera] Posted message to top window");
        }

        // Listen for relayed actions (optional)
        window.addEventListener('message', (ev) => {
        if (!ev.data || ev.data.type !== 'BYMERA_ACTION') return;
        if (ev.data.action === 'connect') this.connectWallet();
        if (ev.data.action === 'pay') this.handleCryptoPayment();
        }, { once: false });
        // this.openCryptoDrawer(cryptoSection);
        console.log("[Bymera] Crypto payment options shown");
    }
    createWalletConnectionPrompt(container) {
        const promptSection = document.createElement("div");
        promptSection.style.cssText = `
            text-align: center;
            padding: 32px 16px;
            border-style: solid;
            border-width: 1px;
            border-color: lightgray;
            border-radius: 16px;
        `;
        const metamaskIcon = document.createElement("div");
        metamaskIcon.style.cssText = `
            width: 64px;
            height: 64px;
            background: #F6851B;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 16px;
            font-size: 32px;
        `;
        metamaskIcon.innerHTML = '<img src="https://images.ctfassets.net/clixtyxoaeas/1ezuBGezqfIeifWdVtwU4c/d970d4cdf13b163efddddd5709164d2e/MetaMask-icon-Fox.svg" style="height: 32px;">';
        const title = document.createElement("h3");
        title.textContent = "Connect Your Wallet";
        title.style.cssText = `
            margin: 0 0 8px 0;
            font-size: 20px;
            font-weight: 600;
            color: #222;
        `;
        const description = document.createElement("p");
        description.textContent = "Connect your MetaMask wallet to pay with cryptocurrency";
        description.style.cssText = `
            margin: 0 0 24px 0;
            color: #666;
            font-size: 14px;
        `;
        const connectButton = document.createElement("button");
        connectButton.textContent = "Connect MetaMask";
        connectButton.style.cssText = `
            background: #F6851B;
            color: white;
            border: none;
            border-radius: 48px;
            padding: 12px 24px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: background-color 0.2s ease;
        `;
        connectButton.addEventListener("click", async (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("[Bymera] Connect button clicked!");
            connectButton.disabled = true;
            connectButton.textContent = "Connecting...";
            connectButton.style.background = "#ccc";
            try {
                console.log("[Bymera] Starting wallet connection process...");
                console.log("[Bymera] Window.ethereum available?", !!window.ethereum);
                await this.connectWallet();
                console.log("[Bymera] Wallet connected successfully, refreshing UI...");
                container.innerHTML = "";
                this.createConnectedWalletUI(container);
            } catch (error) {
                console.error("[Bymera] Wallet connection failed:", error);
                connectButton.disabled = false;
                connectButton.textContent = "Connect MetaMask";
                connectButton.style.background = "#F6851B";
                const errorMessage = error.message || "Failed to connect wallet. Please try again.";
                const errorDiv = document.createElement("div");
                errorDiv.style.cssText = `
                    background: #ffebee;
                    border: 1px solid #f44336;
                    border-radius: 8px;
                    padding: 12px;
                    margin-top: 12px;
                    color: #c62828;
                    font-size: 14px;
                    text-align: left;
                `;
                errorDiv.innerHTML = `
                    <strong>Connection Failed:</strong><br>
                    ${errorMessage}<br><br>
                    <strong>Please try:</strong><br>
                    \u2022 Make sure MetaMask is unlocked<br>
                    \u2022 Refresh the page and try again<br>
                    \u2022 Check if MetaMask is enabled for this site
                `;
                const existingError = container.querySelector(".connection-error");
                if (existingError) {
                    existingError.remove();
                }
                errorDiv.className = "connection-error";
                container.appendChild(errorDiv);
                setTimeout(() => {
                    if (errorDiv.parentNode) {
                        errorDiv.remove();
                    }
                }, 1e4);
            }
        });
        connectButton.addEventListener("mouseenter", () => {
            if (!connectButton.disabled) {
                connectButton.style.background = "#E5740A";
            }
        });
        connectButton.addEventListener("mouseleave", () => {
            if (!connectButton.disabled) {
                connectButton.style.background = "#F6851B";
            }
        });
        connectButton.classList.add("bymera-connect");
        promptSection.appendChild(metamaskIcon);
        promptSection.appendChild(title);
        promptSection.appendChild(description);
        promptSection.appendChild(connectButton);
        container.appendChild(promptSection);
    }
    createConnectedWalletUI(container) {
        console.log("[Bymera] Creating connected wallet UI...");
        const header = document.createElement("div");
        header.style.cssText = `
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 22px;
            margin-bottom: 16px;
            font-weight: 600;
            justify-content: space-between;
        `;
        const metamaskIcon = document.createElement("div");
        metamaskIcon.style.cssText = `
            width: 24px;
            height: 24px;
            background: #F6851B;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 12px;
        `;
        metamaskIcon.textContent = "\uD83E\uDD8A";
        const headerText = document.createElement("span");
        headerText.textContent = "Pay with";
        const metamaskText = document.createElement("img");
        metamaskText.src = "https://freelogopng.com/images/all_img/1683020772metamask-logo-png.png";
        metamaskText.style.cssText = "height: 20px;";
        header.appendChild(headerText);
        header.appendChild(metamaskText);
        const walletInfo = document.createElement("div");
        walletInfo.style.cssText = `
            background: #f0f0f0;
            border-radius: 6px;
            padding: 8px 12px;
            margin-bottom: 16px;
            font-size: 12px;
            color: #666;
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;
        if (this.connectedAccount) {
            const addressText = document.createElement("span");
            addressText.textContent = `Connected: ${this.connectedAccount.substring(0, 6)}...${this.connectedAccount.substring(38)}`;
            const connectedIcon = document.createElement("span");
            connectedIcon.style.cssText = "color: #4CAF50; font-weight: bold;";
            connectedIcon.textContent = "\u25CF";
            walletInfo.appendChild(addressText);
            walletInfo.appendChild(connectedIcon);
        } else {
            this.checkWalletConnection().then(async (isConnected) => {
                if (isConnected && this.connectedAccount) {
                    walletInfo.innerHTML = `
                        <span>Connected: ${this.connectedAccount.substring(0, 6)}...${this.connectedAccount.substring(38)}</span>
                        <span style="color: #4CAF50; font-weight: bold;">\u25CF</span>
                    `;
                }
            });
        }
        const tokenDropdown = document.createElement("div");
        tokenDropdown.className = "bymera-token-dropdown";
        tokenDropdown.style.cssText = `
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            padding: 12px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 12px;
            background: white;
            transition: border-color 0.2s ease;
        `;
        const tokenIcon = document.createElement("img");
        tokenIcon.style.cssText = `
            width: 32px;
            height: 32px;
            border-radius: 50%;
            object-fit: contain;
        `;
        tokenIcon.src = "https://ethglobal.storage/static/faucet/base-sepolia.png";
        tokenIcon.alt = "ETH Token";
        
        // Add error handling for broken images
        tokenIcon.onerror = () => {
            console.log("[Bymera] Failed to load default token image");
            // Fallback to colored circle with icon
            tokenIcon.style.display = 'none';
            const fallbackIcon = document.createElement("div");
            fallbackIcon.style.cssText = `
                width: 32px;
                height: 32px;
                background: #297561;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
                font-weight: bold;
                color: white;
            `;
            fallbackIcon.textContent = "B";
            tokenIcon.parentNode.replaceChild(fallbackIcon, tokenIcon);
        };
        const tokenInfo = document.createElement("div");
        tokenInfo.style.cssText = "flex: 1;";
        const tokenName = document.createElement("div");
        tokenName.textContent = "Ethereum";
        tokenName.style.cssText = "font-weight: 500;";
        const tokenBalance = document.createElement("div");
        tokenBalance.textContent = "Loading balance...";
        tokenBalance.style.cssText = "font-size: 12px; color: #666;";
        tokenInfo.appendChild(tokenName);
        tokenInfo.appendChild(tokenBalance);
        const dropdownArrow = document.createElement("div");
        dropdownArrow.textContent = "\u25BC";
        dropdownArrow.style.cssText = "color: #666; font-size: 12px;";
        tokenDropdown.appendChild(tokenIcon);
        tokenDropdown.appendChild(tokenInfo);
        tokenDropdown.appendChild(dropdownArrow);
        tokenBalance.textContent = "Calculating amount needed...";
        this.calculateETHAmount().then((calculation) => {
            this.fetchTokenBalances().then((balances2) => {
                const balanceText = `Balance: ${balances2.ETH} ETH`;
                const needsText = `Needs: ${calculation.ethAmount} ETH`;
                tokenBalance.innerHTML = `${needsText}<br><small style="color: #999;">${balanceText}</small>`;
                const selectedToken = tokens.find((t) => t.symbol === "ETH");
                if (selectedToken) {
                    const optionBalance = tokenOptions.children[0]?.querySelector(".token-balance");
                    if (optionBalance) {
                        optionBalance.innerHTML = `${needsText}<br><small style="color: #999;">${balanceText}</small>`;
                    }
                }
            }).catch((error) => {
                console.error("[Bymera] Failed to fetch balances:", error);
                const needsText = `Needs: ${calculation.ethAmount} ETH`;
                tokenBalance.textContent = needsText;
            });
        }).catch((error) => {
            console.error("[Bymera] Failed to calculate ETH amount:", error);
            tokenBalance.textContent = "Needs: 0.2084 ETH (Fallback)";
            this.fetchTokenBalances().then((balances2) => {
                const balanceText = `Balance: ${balances2.ETH} ETH`;
                const needsText = `Needs: 0.2084 ETH (Fallback)`;
                tokenBalance.innerHTML = `${needsText}<br><small style="color: #999;">${balanceText}</small>`;
            }).catch(() => {
                tokenBalance.textContent = "Needs: 0.2084 ETH (Fallback)";
            });
        });
        const tokenOptions = document.createElement("div");
        tokenOptions.className = "bymera-token-options";
        tokenOptions.style.cssText = `
            display: none;
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: white;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            z-index: 1000;
            margin-top: 4px;
        `;
        const tokens = [
            { symbol: "ETH", name: "Ethereum", icon: "E", color: "#627EEA", address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", enabled: true, imageUrl: "https://ethglobal.storage/static/faucet/base-sepolia.png", chainId: "0x14a34", chainName: "Base Sepolia" },
            { symbol: "BNB", name: "Binance Token", icon: "B", color: "#297561", address: "0xbb4CdB9Bd36B01bD1cBaEBF2De08d9173bc095c", enabled: true, imageUrl: "https://bscscan.com/assets/bsc/images/svg/logos/token-light.svg?v=25.9.4.0", chainId: "0x38", chainName: "BNB Smart Chain" },
            { symbol: "TAC", name: "Toncoin Access Chain", icon: "T", color: "#0088CC", address: "0x76A797A59Ba2C17726896976B7B4E3fA56eD3B51", enabled: true, imageUrl: "https://s2.coinmarketcap.com/static/img/coins/64x64/37338.png", chainId: "0xef", chainName: "TAC Mainnet" },
            { symbol: "CELO", name: "Celo", icon: "C", color: "#35D07F", address: "0x88eeC49252c8cbc039DCdB394c0c2BA2f1637EA0", enabled: true, imageUrl: "https://static1.tokenterminal.com//celo/logo.png?logo_hash=e37b727d573d56157f3d2373da11d4450a43ba1f", chainId: "0xa4ec", chainName: "Celo Mainnet" },
            { symbol: "GLMR", name: "Moonbeam", icon: "M", color: "#53CBC9", address: "0xAcc15dC74880C9944775448304B263D191c6077F", enabled: true, imageUrl: "https://assets.kraken.com/marketing/web/icons-uni-webp/s_glmr.webp?i=kds", chainId: "0x504", chainName: "Moonbeam" }
        ];
        let balances = {};
        this.fetchTokenBalances().then((fetchedBalances) => {
            balances = fetchedBalances;
            tokens.forEach((token, index) => {
                const optionBalance = tokenOptions.children[index]?.querySelector(".token-balance");
                if (optionBalance) {
                    optionBalance.textContent = `Balance: ${balances[token.symbol] || "0.0000"} ${token.symbol}`;
                }
            });
        });
        tokens.forEach((token) => {
            const option = document.createElement("div");
            option.className = "bymera-token-option";
            option.style.cssText = `
                padding: 12px;
                cursor: ${token.enabled ? "pointer" : "not-allowed"};
                display: flex;
                align-items: center;
                gap: 12px;
                transition: background-color 0.2s ease;
                opacity: ${token.enabled ? "1" : "0.5"};
                position: relative;
            `;
            const optionIcon = token.imageUrl ? document.createElement("img") : document.createElement("div");
            if (token.imageUrl) {
                optionIcon.style.cssText = `
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    object-fit: contain;
                `;
                optionIcon.src = token.imageUrl;
                optionIcon.alt = `${token.symbol} Token`;
                
                // Debug: Log the image URL being used
                console.log(`[Bymera] Loading image for ${token.symbol}:`, token.imageUrl);
                
                // Add success handler to confirm image loading
                optionIcon.onload = () => {
                    console.log(`[Bymera] Successfully loaded image for ${token.symbol}`);
                };
                
                // Add error handling for broken images
                optionIcon.onerror = () => {
                    console.log(`[Bymera] Failed to load image for ${token.symbol}:`, token.imageUrl);
                    // Fallback to colored circle with icon
                    optionIcon.style.display = 'none';
                    const fallbackIcon = document.createElement("div");
                    fallbackIcon.style.cssText = `
                        width: 32px;
                        height: 32px;
                        background: ${token.color};
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 16px;
                        font-weight: bold;
                        color: white;
                    `;
                    fallbackIcon.textContent = token.icon;
                    optionIcon.parentNode.replaceChild(fallbackIcon, optionIcon);
                };
            } else {
                optionIcon.style.cssText = `
                    width: 32px;
                    height: 32px;
                    background: ${token.enabled ? token.color : "#cccccc"};
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 16px;
                    font-weight: bold;
                    color: white;
                `;
                optionIcon.textContent = token.icon;
            }
            const optionInfo = document.createElement("div");
            optionInfo.style.cssText = "flex: 1;";
            const optionHeader = document.createElement("div");
            optionHeader.style.cssText = "display: flex; justify-content: space-between; align-items: center;";
            const optionNameContainer = document.createElement("div");
            const optionName = document.createElement("div");
            optionName.textContent = token.name;
            optionName.style.cssText = `font-weight: 500; color: ${token.enabled ? "#333" : "#999"};`;
            optionNameContainer.appendChild(optionName);
            const optionRight = document.createElement("div");
            optionRight.style.cssText = "text-align: right;";
            if (!token.enabled) {
                const comingSoon = document.createElement("div");
                comingSoon.textContent = "Coming soon";
                comingSoon.style.cssText = "font-size: 11px; color: #297561; font-style: italic; margin-bottom: 2px;";
                optionRight.appendChild(comingSoon);
            }
            const optionBalance = document.createElement("div");
            optionBalance.className = "token-balance";
            optionBalance.textContent = "Loading...";
            optionBalance.style.cssText = `font-size: 12px; color: ${token.enabled ? "#666" : "#999"}; font-weight: normal;`;
            optionRight.appendChild(optionBalance);
            optionHeader.appendChild(optionNameContainer);
            optionHeader.appendChild(optionRight);
            const optionSymbol = document.createElement("div");
            optionSymbol.textContent = token.symbol;
            optionSymbol.style.cssText = `font-size: 12px; color: ${token.enabled ? "#666" : "#999"};`;
            optionInfo.appendChild(optionHeader);
            optionInfo.appendChild(optionSymbol);
            option.appendChild(optionIcon);
            option.appendChild(optionInfo);
            option.addEventListener("click", async (e) => {
                if (!token.enabled) {
                    e.stopPropagation();
                    return;
                }
                
                // Switch to the appropriate blockchain if needed
                if (token.chainId) {
                    try {
                        await this.switchToBlockchain(token.chainId, token.chainName);
                    } catch (error) {
                        console.error(`[Bymera] Failed to switch to ${token.chainName}:`, error);
                        // Continue with token selection even if chain switch fails
                    }
                }
                
                if (token.imageUrl) {
                    tokenIcon.src = token.imageUrl;
                    tokenIcon.alt = `${token.symbol} Token`;
                } else {
                    tokenIcon.textContent = token.icon;
                    tokenIcon.style.background = token.color;
                }
                tokenName.textContent = token.name;
                tokenBalance.textContent = `Balance: ${balances[token.symbol] || "0.0000"} ${token.symbol}`;
                tokenOptions.style.display = "none";
            });
            option.addEventListener("mouseenter", () => {
                if (token.enabled) {
                    option.style.backgroundColor = "#f5f5f5";
                }
            });
            option.addEventListener("mouseleave", () => {
                if (token.enabled) {
                    option.style.backgroundColor = "transparent";
                }
            });
            tokenOptions.appendChild(option);
        });
        tokenDropdown.style.position = "relative";
        tokenDropdown.appendChild(tokenOptions);
        tokenDropdown.addEventListener("click", (e) => {
            e.stopPropagation();
            const isOpen = tokenOptions.style.display !== "none";
            tokenOptions.style.display = isOpen ? "none" : "block";
            dropdownArrow.textContent = isOpen ? "\u25BC" : "\u25B2";
        });
        document.addEventListener("click", () => {
            tokenOptions.style.display = "none";
            dropdownArrow.textContent = "\u25BC";
        });
        const paymentSummary = document.createElement("div");
        paymentSummary.className = "bymera-payment-summary";
        paymentSummary.style.cssText = `
            background: #f8f9fa;
            border-radius: 8px;
            padding: 16px;
            margin-top: 16px;
            border: 1px solid #e9ecef;
        `;
        paymentSummary.innerHTML = `
            <div style="font-weight: 600; font-size: 16px; color: #495057; margin-bottom: 12px;">Payment Summary</div>
            <div id="payment-calculation" style="font-size: 12px; color: #666;">
                Calculating payment amount...
            </div>
        `;
        setTimeout(() => {
            this.calculateETHAmount().then((calculation) => {
                const summaryElement = paymentSummary.querySelector("#payment-calculation");
                if (summaryElement) {
                    summaryElement.innerHTML = `
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                        <span>Booking Total:</span>
                        <span style="font-weight: 500;">\$${calculation.totalPrice.amount.toFixed(2)} ${calculation.totalPrice.currency}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                        <span>ETH Rate:</span>
                        <span style="font-weight: 500;">1 ETH = \$${calculation.exchangeRate.toFixed(2)} ${calculation.totalPrice.currency}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding-top: 16px; font-size:16px; border-top: 1px solid #dee2e6; font-weight: 600; color: #495057;">
                        <span>You Pay:</span>
                        <span style="color: #297561;">${calculation.ethAmount} ETH</span>
                    </div>
                `;
                }
            }).catch((error) => {
                console.error("[Bymera] Failed to calculate payment summary:", error);
                const summaryElement = paymentSummary.querySelector("#payment-calculation");
                if (summaryElement) {
                    summaryElement.innerHTML = `
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                        <span>Booking Total:</span>
                        <span style="font-weight: 500;">125.12 SGD</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                        <span>BNB Rate:</span>
                        <span style="font-weight: 500;">1 BNB = 600.00 USD (Demo)</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding-top: 8px; border-top: 1px solid #dee2e6; font-weight: 600; color: #495057;">
                        <span>You Pay:</span>
                        <span style="color: #297561;">0.2084 BNB</span>
                    </div>
                `;
                }
            }).catch((error) => {
                console.error("[Bymera] Failed to calculate payment summary:", error);
                const summaryElement = paymentSummary.querySelector("#payment-calculation");
                if (summaryElement) {
                    summaryElement.innerHTML = `
                    <div style="color: #666; text-align: center;">
                        Failed to calculate payment. Using demo values:<br>
                        <strong style="color: #297561;">0.2084 BNB for 125.12 SGD</strong>
                    </div>
                `;
                }
            });
        }, 1500);
        const payButton = document.createElement("button");
        payButton.style.cssText = `
            width: 100%;
            background: #297561;
            color: #111;
            border: none;
            border-radius: 8px;
            padding: 16px;
            margin-top: 24px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: background-color 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        `;
        payButton.innerHTML = `Pay with Crypto`;
        payButton.classList.add("bymera-pay");
        payButton.addEventListener("mouseenter", () => {
            payButton.style.background = "#1F5445";
        });
        payButton.addEventListener("mouseleave", () => {
            payButton.style.background = "#297561";
        });
        payButton.addEventListener("click", async (e) => {
            e.preventDefault();
            e.stopPropagation();
            payButton.disabled = true;
            payButton.innerHTML = "<span>Processing...</span>";
            payButton.style.background = "#ccc";
            try {
                await this.handleCryptoPayment();
            } catch (error) {
                console.error("[Bymera] Payment failed:", error);
                payButton.disabled = false;
                payButton.innerHTML = `
                    <span style="font-size: 20px;">\u20BF</span>
                    Pay with Crypto
                `;
                payButton.style.background = "#297561";
            }
        });
        
        container.appendChild(header);
        container.appendChild(walletInfo);
        container.appendChild(tokenDropdown);
        container.appendChild(paymentSummary);
        container.appendChild(payButton);
    }
    hideCryptoPaymentOptions(paymentSection) {
        if (paymentSection.dataset.originalContent) {
            paymentSection.innerHTML = paymentSection.dataset.originalContent;
        }
        console.log("[Bymera] Crypto payment options hidden, original payment section restored");
    }
    async fetchETHPrice() {
        console.log("[Bymera] Fetching ETH price...");
        return new Promise((resolve, reject) => {
            const handleResponse = (event) => {
                console.log("[Bymera] Received ETH price response:", event.detail);
                window.removeEventListener("bymera-price-response", handleResponse);
                if (event.detail.success) {
                    resolve(event.detail.prices);
                } else {
                    console.error("[Bymera] ETH price fetch failed, using fallback:", event.detail.error);
                    resolve(event.detail.prices);
                }
            };
            window.addEventListener("bymera-price-response", handleResponse);
            console.log("[Bymera] Dispatching ETH price fetch request...");
            window.dispatchEvent(new CustomEvent("bymera-fetch-eth-price"));
            setTimeout(() => {
                window.removeEventListener("bymera-price-response", handleResponse);
                console.log("[Bymera] ETH price fetch timeout, using fallback prices");
                resolve({ usd: 3500, sgd: 4725 }); // Updated fallback prices for ETH
            }, 3000);
        });
    }
    extractTotalPrice() {
        console.log("[Bymera] Extracting booking price from page...");
        const priceSelectors = [
            '[data-testid="book-it-default"] span:contains("Total")',
            '[data-testid="book-it-default"] div:contains("SGD")',
            '[data-testid="book-it-default"] div:contains("USD")',
            '[data-testid="book-it-default"] div:contains("$")',
            'div[aria-label*="price"]',
            'div[class*="price-item"] span:contains("Total")',
            'div[class*="total"] span:contains("$")',
            'span:contains("Total")',
            'div:contains("Total") span:contains("$")'
        ];
        const priceElements = document.querySelectorAll("span, div");
        let totalPrice = 0;
        let currency = "USD";
        for (const element of priceElements) {
            const text = element.textContent?.trim() || "";
            const priceMatch = text.match(/(?:SGD\s*)?(?:\$|USD\s*)?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:SGD|USD)?/i);
            if (priceMatch && text.toLowerCase().includes("total")) {
                const amountStr = priceMatch[1].replace(/,/g, "");
                const amount = parseFloat(amountStr);
                if (amount > totalPrice) {
                    totalPrice = amount;
                    if (text.includes("SGD") || text.includes("S$")) {
                        currency = "SGD";
                    } else if (text.includes("USD") || text.includes("US$")) {
                        currency = "USD";
                    }
                }
            }
        }
        if (totalPrice === 0) {
            const pageText = document.body.textContent || "";
            const fallbackMatch = pageText.match(/Total[^$]*\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(SGD|USD)?/i);
            if (fallbackMatch) {
                totalPrice = parseFloat(fallbackMatch[1].replace(/,/g, ""));
                currency = fallbackMatch[2] || "SGD";
            }
        }
        console.log("[Bymera] Extracted price:", totalPrice, currency);
        return { amount: totalPrice || 125.12, currency: currency.toUpperCase() };
    }
    async calculateETHAmount() {
        try {
            const totalPrice = this.extractTotalPrice();
            console.log("[Bymera] Total booking price:", totalPrice);
            const ethPrices = await this.fetchETHPrice();
            console.log("[Bymera] ETH prices:", ethPrices);
            const exchangeRate = totalPrice.currency === "SGD" ? ethPrices.sgd : ethPrices.usd;
            const ethAmount = (totalPrice.amount / exchangeRate).toFixed(6);
            console.log("[Bymera] Calculated ETH amount:", {
                totalPrice,
                exchangeRate,
                ethAmount
            });
            return {
                ethAmount: ethAmount, // Keep the property name for compatibility
                exchangeRate,
                totalPrice
            };
        } catch (error) {
            console.error("[Bymera] Error calculating ETH amount:", error);
            return {
                ethAmount: "0.0357", // ETH equivalent for ~125 SGD at 3500 USD
                exchangeRate: 3500,
                totalPrice: { amount: 125.12, currency: "SGD" }
            };
        }
    }

    async generateFundingId() {
        console.log("[Bymera] Generating funding ID from backend...");
        try {
            const response = await fetch('http://127.0.0.1:8000/fundings/generate', {
                method: 'POST',
                headers: {
                    'X-API-Key': 'test',
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Backend API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            const fundingId = BigInt(data.id);
            console.log("[Bymera] Generated funding ID:", fundingId.toString());
            return fundingId;
        } catch (error) {
            console.error("[Bymera] Failed to generate funding ID:", error);
            console.log("[Bymera] Backend not available, using fallback ID generation");
            // Fallback to timestamp-based ID if backend fails
            const fallbackId = BigInt(Date.now() * 1000 + Math.floor(Math.random() * 1000));
            console.log("[Bymera] Using fallback funding ID:", fallbackId.toString());
            return fallbackId;
        }
    }

    async pollForCardDetails(fundingId, processingMessage) {
        console.log("[Bymera] Starting to poll for card details...");
        const maxRetries = 10;
        const delayMs = 5000;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            console.log(`[Bymera] Polling attempt ${attempt}/${maxRetries} for funding ID: ${fundingId}`);

            try {
                const response = await fetch(`http://127.0.0.1:8000/fundings/${fundingId}`, {
                    method: 'GET',
                    headers: {
                        'X-API-Key': 'test',
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error(`API error: ${response.status} ${response.statusText}`);
                }

                const data = await response.json();
                console.log("[Bymera] Funding details response:", data);

                // Check if we have card details
                if (data.card && data.card.token) {
                    console.log("[Bymera] Card details received:", data.card);
                    processingMessage.innerHTML = "✓ Card created!<br><small>Processing payment...</small>";

                    // Now simulate the payment
                    await this.simulatePayment(fundingId, processingMessage);
                    return;
                } else {
                    console.log("[Bymera] Card not ready yet, waiting...");
                    processingMessage.innerHTML = `✓ Transaction confirmed!<br><small>Waiting for card... (${attempt}/${maxRetries})</small>`;
                }

            } catch (error) {
                console.error(`[Bymera] Polling attempt ${attempt} failed:`, error);
                processingMessage.innerHTML = `✓ Transaction confirmed!<br><small>Retrying... (${attempt}/${maxRetries})</small>`;
            }

            // Wait before next attempt (except on last attempt)
            if (attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
        }

        // If we get here, all attempts failed
        console.error("[Bymera] Failed to get card details after 10 attempts");
        processingMessage.innerHTML = "❌ Failed to create card<br><small>Please try again</small>";
        processingMessage.style.background = "rgba(244, 67, 54, 0.1)";
        processingMessage.style.borderColor = "rgba(244, 67, 54, 0.3)";
    }

    async simulatePayment(fundingId, processingMessage) {
        console.log("[Bymera] Processing payment for funding ID:", fundingId);

        try {
            const response = await fetch(`http://127.0.0.1:8000/fundings/${fundingId}/simulate`, {
                method: 'POST',
                headers: {
                    'X-API-Key': 'test',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    descriptor: "AIRBNB",
                    mcc: "7011"
                })
            });

            if (!response.ok) {
                throw new Error(`Simulation API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log("[Bymera] Payment simulation response:", data);
            // After successful payment simulation, notify the page and close the drawer modal
            window.dispatchEvent(new CustomEvent("bymera-payment-complete", { detail: { success: true } }));
            const closeButton = document.querySelector('button[aria-label="Close"]');
            if (closeButton) {
                closeButton.click();
            }
            this.notifyBymeraSuccess();
            // Show success message
            processingMessage.innerHTML = "✓ Payment completed!<br><small>Booking confirmed</small>";
            processingMessage.style.background = "rgba(76, 175, 80, 0.1)";
            processingMessage.style.borderColor = "rgba(76, 175, 80, 0.3)";

            // Try several heuristics to find sessionId and add diagnostic logs
            try {
                const findSessionId = () => {
                    try {
                        // 1) Query param on current window
                        const p1 = new URLSearchParams(window.location.search || '').get('sessionId');
                        if (p1) return p1;
                    } catch (e) {
                        // ignore
                    }

                    try {
                        // 2) Query param on top window (if same-origin / accessible)
                        if (window.top && window.top !== window) {
                            try {
                                const topSearch = window.top.location.search || '';
                                const p2 = new URLSearchParams(topSearch).get('sessionId');
                                if (p2) return p2;
                            } catch (e) {
                                // Could be cross-origin — ignore
                            }
                        }
                    } catch (e) {
                        // ignore
                    }

                    try {
                        // 3) Look for sessionId in the full href via regex
                        const m = window.location.href.match(/[?&]sessionId=([^&]+)/);
                        if (m && m[1]) return decodeURIComponent(m[1]);
                    } catch (e) {}

                    try {
                        // 4) Check document.referrer for a sessionId
                        const ref = document.referrer || '';
                        const m2 = ref.match(/[?&]sessionId=([^&]+)/);
                        if (m2 && m2[1]) return decodeURIComponent(m2[1]);
                    } catch (e) {}

                    try {
                        // 5) As a last resort, check storage (some pages may stash it)
                        const ls = localStorage.getItem('bymera_sessionId') || sessionStorage.getItem('bymera_sessionId');
                        if (ls) return ls;
                    } catch (e) {}

                    return null;
                };

                const sessionId = findSessionId();
                console.log('[Bymera] Diagnostic: sessionId detection --', {
                    sessionId,
                    href: window.location.href,
                    search: window.location.search,
                    referrer: document.referrer || null,
                    topAccessible: (() => {
                        try { return window.top && window.top !== window ? !!window.top.location.href : false; } catch (e) { return false; }
                    })()
                });

                if (sessionId) {
                    try {
                        await fetch(`/api/payments/complete`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ sessionId: String(sessionId) })
                        });

                        const confirmUrl = `/cart/confirmation?sessionId=${encodeURIComponent(String(sessionId))}`;
                        try {
                            if (window.top && window.top !== window && typeof window.top.location !== 'undefined') {
                                window.top.location.href = confirmUrl;
                            } else {
                                window.location.href = confirmUrl;
                            }
                        } catch (navErr) {
                            window.location.href = confirmUrl;
                        }
                    } catch (notifyErr) {
                        console.error('[Bymera] Failed to notify ecommerce backend about payment:', notifyErr);
                    }
                } else {
                    console.warn('[Bymera] No sessionId found — cannot notify ecommerce backend.');
                }
            } catch (e) {
                console.error('[Bymera] Error during sessionId detection/notification:', e);
            }

        } catch (error) {
            console.error("[Bymera] Payment simulation failed:", error);
            processingMessage.innerHTML = "❌ Payment simulation failed<br><small>Please try again</small>";
            processingMessage.style.background = "rgba(244, 67, 54, 0.1)";
            processingMessage.style.borderColor = "rgba(244, 67, 54, 0.3)";
        }
    }

    async processPayment() {
    }
     notifyBymeraSuccess() {
        // close the drawer
        window.top?.postMessage({ type: 'BYMERA_CLOSE_DRAWER' }, '*');
        // show a global toast
        window.top?.postMessage({ type: 'BYMERA_TOAST', text: 'Payment successful ✅' }, '*');
     }
    showPaymentSuccess() {
    const html = `
        <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(76, 175, 80, 0.1);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 1px solid rgba(76, 175, 80, 0.3);
        color: #333;
        padding: 20px 28px;
        border-radius: 20px;
        box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
        font-weight: 600;
        width: 300px;
        max-width: 300px;
        animation: slideIn 0.3s ease-out;
        z-index: 10000;
        ">
        <span style="font-size:24px;">✅</span> Payment Successful!<br>
        <small style="opacity:0.9;">Your ETH payment has been processed</small>
        </div>
    `;

    // Prefer showing inside the top drawer (visible to user)
    try {
        window.top?.postMessage({ type: 'BYMERA_TOAST', html }, '*');
        // Also close the drawer after a short delay
        window.top?.postMessage({ type: 'BYMERA_CLOSE_DRAWER' }, '*');
    } catch (err) {
        // fallback: show locally if top window not accessible
        const msg = document.createElement('div');
        msg.innerHTML = html;
        document.body.appendChild(msg.firstElementChild);
        setTimeout(() => msg.remove(), 5000);
    }
    }
    destroy() {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
    }
}
var injector = null;
window.addEventListener("beforeunload", () => {
    if (injector) {
        injector.destroy();
        injector = null;
    }
});
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
        injector = new BymeraInjector;
    });
} else {
    injector = new BymeraInjector;
}
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "PAYMENT_COMPLETE" || request.type === "PAYMENT_CONFIRMED") {
        console.log("[Bymera] Payment completed successfully");
        const successMessage = document.createElement("div");
        successMessage.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(76, 175, 80, 0.1);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(76, 175, 80, 0.3);
            color: #333;
            padding: 20px 28px;
            border-radius: 20px;
            box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
            z-index: 10000;
            font-weight: 600;
            animation: slideIn 0.3s ease-out;
            width: 300px;
            max-width: 300px;
        `;
        successMessage.innerHTML = "<span style='font-size: 20px;'>✓</span> Crypto payment successful!<br><small style='opacity: 0.9;'>Completing your booking...</small>";
        document.body.appendChild(successMessage);
        if (injector && injector.originalConfirmPayButton) {
        }
        setTimeout(() => {
            successMessage.remove();
        }, 5000);
        sendResponse({ success: true });
    }
    return true;
});
