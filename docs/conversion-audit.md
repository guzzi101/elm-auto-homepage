# Elm Auto customer journey and conversion review

Reviewed September 27, 2026. Scope: the GitHub Pages homepage, its application handoff, and the existing application's first screen and vehicle-choice transition. This is a usability review, not a measured conversion-lift study.

## Customer journeys

| Visitor and context | Friction found | Action or result |
| --- | --- | --- |
| Cold paid visitor on a phone | Application commitment was unclear near the first button. | Added the existing application's verified free-to-apply/no-obligation reassurance beside the action; retained the vehicle, financing and free-delivery offer. |
| Cautious buyer or buyer concerned about credit | The first phone link was roughly 2,730 CSS pixels down the original phone layout. | Added a clearly secondary call link beside the hero action; retained realistic credit language and lender-approval qualification in the FAQ. |
| Visitor checking credibility | Reviews were deep in the page with no direct route from the first screen. | Added an in-page review link in the hero and navigation. Existing customer photos and attributed review excerpts remain. |
| Buyer exploring vehicle styles | The interactive photographs could be read as stock selection, but they do not prefill the application. | Labelled them as vehicle inspiration with variable availability. No invented stock, price or reservation promise. |
| Ready-to-apply phone visitor | Floating Apply stayed hidden throughout the entire hero image, even when the hero button had scrolled away. A clipped inline button could also suppress it. | Trigger the bar after the actual hero action passes above the viewport. Hide it when an inline action is at least 65% visible, or while the menu is open. |
| Returning tablet visitor | The header application action disappeared between the desktop and phone layouts. | Exposed the navigation application link at intermediate widths and allowed that navigation to wrap. |
| Visitor using enlarged reading text | An FAQ label overflowed at the narrowest width. | Gave the label a wrapping flex child and kept its expansion icon a fixed-size sibling. |
| Paid visitor continuing to the application | Landing campaign parameters were discarded by every hard-coded outbound action. | Preserve an allowlist of campaign parameters on application links. Unrelated parameters are excluded. |
| Visitor with JavaScript unavailable | Core content and links worked, but inactive interactive controls were visible and horizontal touch scrolling was constrained. | Hide script-only controls; allow native horizontal scrolling. The main application and phone links and native FAQ remain usable. |
| Privacy-conscious visitor | No direct privacy-policy link. | Added Elm Auto's existing privacy policy to the footer. |

## Verification

- Responsive Chromium frames at 320, 360, 375, 390, 430, 600, 768, 820, 1024, 1280, 1440 and 1920 CSS pixels. No horizontal document overflow or measured text-container overflow after the fixes.
- Doubled the root reading-text size from 17px to 34px at 320, 390, 768, 1024 and 1440 pixels. No measured overflow. This changes rem-based reading text; it is not a claim that every fixed-pixel heading was doubled or that physical OS text scaling was tested.
- Compact 320-by-568 layout: the hero Apply button remains fully within the initial viewport at normal text size. Narrow-button spacing was tightened to keep the normal label on one line.
- Customer-photo frames still match one another at 4:3. Carousel controls still measure 48 by 48 pixels across the tested widths.
- Vehicle changes, independent customer/review navigation, keyboard carousel navigation, FAQ expansion, mobile menu, and floating-action visibility checked. Application and phone destinations remain the intended Elm Auto URLs.
- JavaScript-disabled core links and FAQ checked. Production build and eight existing/extended automated checks pass, including campaign parameter filtering, interaction event payloads, and the mobile-action visibility cases.
- Browser testing uses responsive frames in Chromium. Physical iOS/Android devices, Safari, real cellular throttling, form submission, CRM receipt, approvals and downstream sales were not verified.

## Highest-priority remaining issue: application controls

The existing WordPress application is outside this homepage repository. On its initial screen at a 320-by-568 viewport, scrolling 243 pixels placed the Next control at x=252, y=503.9 with a 23-by-21-pixel box. The visible reCAPTCHA iframe started at x=235, y=494 and was 60 pixels tall. The rectangles overlap across the Next control. Its neighbouring back control is similarly small.

Fix the form's navigation layout so both controls have generous touch targets and remain clear of the reCAPTCHA badge at short phone heights. Preserve the required reCAPTCHA branding and functionality. Match the new homepage's readable typography and button treatment during that application pass. The vehicle-choice screen progressed when a vehicle was selected; no application was submitted.

## Measurement: what is ready and what still needs wiring

The homepage exposes these dataLayer events without adding an analytics vendor, network requests, cookies or form-data collection:

| Event | Payload | Interpretation |
| --- | --- | --- |
| `elm_apply_click` | `cta_location`: menu, header, hero, customers, process, faq, delivery or mobile-bar | Outbound application intent, not a completed lead. |
| `elm_phone_click` | `cta_location`: hero, faq or footer | Phone-link intent, not a connected or qualified call. |
| `elm_faq_open` | `question_id`: application-cost, credit, vehicle-first or delivery | Objection-related interaction, not an outcome. |

No analytics destination is configured in this preview. Connect these hooks to the production measurement setup and validate the consent configuration there. Configure and verify cross-domain measurement on the production homepage and application domains; forwarding campaign parameters alone does not provide GA4 cross-domain session linking.

The forwarded allowlist is `utm_source`, `utm_medium`, `utm_campaign`, `utm_id`, `utm_term`, `utm_content`, `gclid`, `gbraid`, `wbraid`, `fbclid` and `msclkid`. Values with control characters or over 512 characters are dropped. Query strings, identifiers, names and form answers are not included in the added event payloads. Keep personal information out of campaign naming and URLs.

Judge performance through application starts, completed applications, qualified leads and ultimately sales. Segment by device, traffic source and landing intent. Keep Apply clicks as a secondary diagnostic event. Compare a controlled copy or layout variant only after end-to-end measurement is verified; the audit does not establish an uplift or justify a claimed percentage improvement.

A useful first hypothesis is whether the clearer no-obligation explanation increases completed applications from cold mobile traffic without lowering lead quality. Do not assume more buttons or more animation will improve that outcome.

## Performance boundary

The built interaction bundle is about 29 KB gzipped and customer images are lazy-loaded. Hidden alternate hero photographs still create avoidable image-transfer cost. A later image-loading pass should defer those assets while preserving an immediate, stable response when someone changes a vehicle tab. Field LCP/INP/CLS and real slow-network behaviour have not been measured; no speed score is claimed.

## Source checks

- [Existing application](https://www.elmautocredit.ca/get-approved/): first-screen reassurance explicitly says applying is free and without obligation.
- [Elm Auto homepage](https://www.elmautocredit.ca/): vehicle sourcing, financing, credit options and free delivery.
- [Existing privacy policy](https://www.elmautocredit.ca/privacy-policy/): linked directly, not rewritten.

The temporary responsive review route is removed after validation. Its source remains in `scripts/responsive-review.html` for development use.
