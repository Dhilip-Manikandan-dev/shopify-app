/**
 * Smart Offer Rules — Unified Storefront JavaScript SDK
 * Handles real-time condition evaluation, upsell rendering, free shipping progress,
 * and high-fidelity analytics event tracking across product, collection, and cart surfaces.
 */
(function () {
  "use strict";

  if (window.SmartOfferRulesSDK) {
    return; // Prevent duplicate instantiation
  }

  const CONFIG = {
    apiEndpoint: "/apps/smart-offer-rules/api/storefront/offers",
    analyticsEndpoint: "/apps/smart-offer-rules/api/analytics/events",
    debounceMs: 300,
  };

  class SmartOfferRules {
    constructor() {
      this.shop = window.Shopify ? window.Shopify.shop : window.location.hostname;
      this.currency = (window.Shopify && window.Shopify.currency && window.Shopify.currency.active) || "INR";
      this.cache = new Map();
      this.currentOffers = null;
      this.cartFingerprint = null;
      this.debounceTimer = null;
      this.trackedImpressions = new Set();

      this.init();
    }

    init() {
      // Listen to native cart events
      this.hookCartRequests();
      this.observeCartEvents();

      // Initial evaluation when DOM is ready
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => this.evaluate());
      } else {
        this.evaluate();
      }
    }

    /**
     * Intercept fetch / XMLHttpRequest calls targeting Shopify cart endpoints
     */
    hookCartRequests() {
      const originalFetch = window.fetch;
      const self = this;

      window.fetch = async function (...args) {
        const response = await originalFetch.apply(this, args);
        const url = typeof args[0] === "string" ? args[0] : args[0] ? args[0].url : "";

        if (
          url &&
          (url.includes("/cart/add") ||
            url.includes("/cart/change") ||
            url.includes("/cart/clear") ||
            url.includes("/cart/update"))
        ) {
          self.queueEvaluation();
        }

        return response;
      };
    }

    observeCartEvents() {
      // Support popular theme custom cart events
      const cartEvents = [
        "cart:updated",
        "cart:refresh",
        "cart:change",
        "cart:build",
        "cart:render",
      ];
      cartEvents.forEach((evt) => {
        document.addEventListener(evt, () => this.queueEvaluation());
      });
    }

    queueEvaluation() {
      if (this.debounceTimer) clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => this.evaluate(), CONFIG.debounceMs);
    }

    async getCartState() {
      try {
        const res = await fetch("/cart.js", { credentials: "same-origin" });
        return await res.json();
      } catch (e) {
        return null;
      }
    }

    getCustomerContext() {
      // Customer context injected by Liquid template if logged in
      const meta = window.__SMART_OFFER_CUSTOMER__ || {};
      return {
        tags: meta.tags || [],
        orderCount: meta.orderCount || 0,
        lifetimeSpend: meta.lifetimeSpend || 0,
        country: meta.country || "IN",
      };
    }

    getProductContext() {
      // Product context injected on product page
      const meta = window.__SMART_OFFER_PRODUCT__ || {};
      if (!meta.id) return undefined;
      return {
        id: String(meta.id),
        vendor: meta.vendor,
        productType: meta.productType,
        tags: meta.tags || [],
        collectionIds: meta.collectionIds || [],
      };
    }

    async evaluate() {
      const cart = await this.getCartState();
      if (!cart) return;

      const fingerprint = `${cart.token || ""}_${cart.total_price}_${cart.item_count}`;
      if (fingerprint === this.cartFingerprint && this.currentOffers) {
        this.renderAllBlocks(this.currentOffers, cart);
        return;
      }
      this.cartFingerprint = fingerprint;

      const customer = this.getCustomerContext();
      const product = this.getProductContext();

      const payload = {
        shop: this.shop,
        cart: {
          subtotal: (cart.total_price || 0) / 100,
          quantity: cart.item_count || 0,
          productIds: (cart.items || []).map((item) => String(item.product_id)),
          collectionIds: [],
          productCount: (cart.items || []).length,
          uniqueProductCount: new Set((cart.items || []).map((i) => i.product_id)).size,
        },
        customer,
        product,
        location: {
          country: customer.country || "IN",
        },
      };

      try {
        const res = await fetch("/api/storefront/offers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const json = await res.json();
        if (json.success && json.data) {
          this.currentOffers = json.data;
          this.renderAllBlocks(json.data, cart);
        }
      } catch (err) {
        console.warn("[SmartOfferRules] Evaluation unavailable:", err);
      }
    }

    renderAllBlocks(offers, cart) {
      this.renderFreeShippingBars(offers.freeShipping, cart);
      this.renderUpsellBlocks(offers.upsells || []);
    }

    renderFreeShippingBars(shippingData, cart) {
      const blocks = document.querySelectorAll("[data-smart-shipping-bar]");
      if (!blocks.length) return;

      blocks.forEach((el) => {
        if (!shippingData) {
          el.style.display = "none";
          return;
        }

        el.style.display = "block";
        const threshold = shippingData.threshold || 1000;
        const subtotal = (cart.total_price || 0) / 100;
        const progress = Math.min(100, Math.round((subtotal / threshold) * 100));
        const remaining = Math.max(0, threshold - subtotal);

        const fillEl = el.querySelector(".smart-shipping-fill");
        const textEl = el.querySelector(".smart-shipping-text");

        if (fillEl) {
          fillEl.style.width = `${progress}%`;
          if (progress >= 100) {
            fillEl.classList.add("completed");
          } else {
            fillEl.classList.remove("completed");
          }
        }

        if (textEl) {
          if (progress >= 100) {
            textEl.innerHTML = "🎉 <strong>Congratulations!</strong> You have unlocked <strong>Free Standard Shipping</strong>!";
          } else {
            const formattedRemaining = new Intl.NumberFormat(undefined, {
              style: "currency",
              currency: this.currency,
            }).format(remaining);
            textEl.innerHTML = `Add <strong>${formattedRemaining}</strong> more to unlock <strong>Free Shipping</strong>!`;
          }
        }
      });
    }

    renderUpsellBlocks(upsells) {
      const blocks = document.querySelectorAll("[data-smart-upsell-container]");
      if (!blocks.length) return;

      blocks.forEach((el) => {
        const surface = el.getAttribute("data-surface") || "PRODUCT";
        // Filter upsells matching this surface
        const surfaceUpsells = upsells.filter((u) => {
          if (surface === "CART" && !u.display?.cartPage) return false;
          if (surface === "COLLECTION" && !u.display?.collectionPage) return false;
          if (surface === "PRODUCT" && !u.display?.productPage) return false;
          return true;
        });

        if (surfaceUpsells.length === 0) {
          el.innerHTML = "";
          el.style.display = "none";
          return;
        }

        el.style.display = "block";
        el.innerHTML = surfaceUpsells
          .map((item) => this.generateUpsellHTML(item, surface))
          .join("");

        // Attach add-to-cart click handlers and track impressions
        surfaceUpsells.forEach((item) => {
          this.trackImpression(item.ruleId, item.productId, item.variantId, surface);
        });

        el.querySelectorAll("[data-smart-add-upsell]").forEach((btn) => {
          btn.addEventListener("click", (e) => this.handleAddUpsell(e));
        });
      });
    }

    generateUpsellHTML(item, surface) {
      const formattedOffer = new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: this.currency,
      }).format(item.offerPrice);

      const formattedOrig = item.originalPrice
        ? new Intl.NumberFormat(undefined, {
            style: "currency",
            currency: this.currency,
          }).format(item.originalPrice)
        : "";

      return `
        <div class="smart-upsell-card" data-rule-id="${item.ruleId}" data-variant-id="${item.variantId}" data-product-id="${item.productId}">
          ${item.imageUrl ? `<img class="smart-upsell-image" src="${item.imageUrl}" alt="${item.title}" loading="lazy" />` : ""}
          <div class="smart-upsell-details">
            <div class="smart-upsell-title">${item.title}</div>
            ${item.description ? `<div class="smart-upsell-desc">${item.description}</div>` : ""}
            <div class="smart-upsell-pricing">
              <span class="smart-offer-price">${formattedOffer}</span>
              ${formattedOrig ? `<span class="smart-orig-price">${formattedOrig}</span>` : ""}
              ${item.discountValue ? `<span class="smart-discount-badge">Save ${item.discountType === "PERCENTAGE" ? item.discountValue + "%" : formattedOrig ? formattedOrig : ""}</span>` : ""}
            </div>
          </div>
          <button type="button" class="smart-upsell-button" data-smart-add-upsell data-variant-id="${item.variantId}" data-rule-id="${item.ruleId}">
            ${item.buttonText || "Add to Cart"}
          </button>
        </div>
      `;
    }

    async handleAddUpsell(e) {
      const btn = e.currentTarget;
      const variantId = btn.getAttribute("data-variant-id");
      const ruleId = btn.getAttribute("data-rule-id");

      if (!variantId) return;

      btn.disabled = true;
      const originalText = btn.textContent;
      btn.textContent = "Adding...";

      try {
        const res = await fetch("/cart/add.js", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: [{ id: parseInt(variantId, 10), quantity: 1 }],
          }),
        });

        if (res.ok) {
          btn.textContent = "Added! ✓";
          this.trackEvent("UPSELL_ADDED", ruleId, variantId);
          setTimeout(() => {
            btn.disabled = false;
            btn.textContent = originalText;
          }, 2000);
          this.queueEvaluation();
        } else {
          btn.disabled = false;
          btn.textContent = originalText;
        }
      } catch (err) {
        btn.disabled = false;
        btn.textContent = originalText;
      }
    }

    trackImpression(ruleId, productId, variantId, surface) {
      const key = `${ruleId}_${variantId}_${surface}`;
      if (this.trackedImpressions.has(key)) return;
      this.trackedImpressions.add(key);

      this.trackEvent("UPSELL_VIEWED", ruleId, variantId, surface);
    }

    trackEvent(eventType, ruleId, variantId, surface = "PRODUCT") {
      const payload = {
        shop: this.shop,
        ruleId,
        eventType,
        variantId,
        surface,
      };

      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          "/api/analytics/events",
          new Blob([JSON.stringify(payload)], { type: "application/json" })
        );
      } else {
        fetch("/api/analytics/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          keepalive: true,
        }).catch(() => {});
      }
    }
  }

  window.SmartOfferRulesSDK = new SmartOfferRules();
})();
