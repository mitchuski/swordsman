/**
 * Page Analyzer - Privacy analysis for web pages
 *
 * Analyzes pages for trackers, cookie banners, forms,
 * and dark patterns to inform the orb gap score.
 */

export interface PageAnalysis {
  domain: string
  url: string
  timestamp: number
  trackers: TrackerInfo[]
  cookieBanner: CookieBannerInfo
  forms: FormInfo
  privacyPolicyLink: string | null
  gapScore: number
}

export interface TrackerInfo {
  hostname: string
  category: 'analytics' | 'advertising' | 'social' | 'session-recording' | 'tag-management' | 'data-collection' | 'unknown'
}

export interface CookieBannerInfo {
  detected: boolean
  hasRejectButton: boolean
  isDarkPattern: boolean
  type: 'onetrust' | 'cookiebot' | 'custom' | 'unknown' | null
}

export interface FormInfo {
  count: number
  sensitiveFields: number
  hasHiddenInputs: boolean
}

// Known tracker domains and their categories
const TRACKER_CATEGORIES: Record<string, TrackerInfo['category']> = {
  'google-analytics.com': 'analytics',
  'googletagmanager.com': 'tag-management',
  'facebook.net': 'social',
  'facebook.com': 'social',
  'doubleclick.net': 'advertising',
  'googlesyndication.com': 'advertising',
  'hotjar.com': 'session-recording',
  'fullstory.com': 'session-recording',
  'clarity.ms': 'session-recording',
  'mixpanel.com': 'analytics',
  'segment.com': 'data-collection',
  'segment.io': 'data-collection',
  'amplitude.com': 'analytics',
  'heap.io': 'analytics',
  'newrelic.com': 'analytics',
  'sentry.io': 'analytics',
  'intercom.io': 'analytics',
  'hubspot.com': 'analytics',
  'twitter.com': 'social',
  'linkedin.com': 'social',
  'pinterest.com': 'social',
  'tiktok.com': 'social',
  'snap.com': 'social',
  'bing.com': 'advertising',
  'criteo.com': 'advertising',
  'outbrain.com': 'advertising',
  'taboola.com': 'advertising'
}

// Cookie banner selectors
const BANNER_SELECTORS = [
  '#onetrust-banner-sdk',
  '#onetrust-consent-sdk',
  '.cookieconsent',
  '#cookie-banner',
  '#cookie-notice',
  '#cookie-law-info-bar',
  '[class*="cookie-banner"]',
  '[class*="cookie-consent"]',
  '[class*="cookiebanner"]',
  '[id*="cookie-banner"]',
  '[id*="cookie-consent"]',
  '[class*="gdpr"]',
  '[id*="gdpr"]',
  '[class*="consent-banner"]',
  '[id*="consent-banner"]',
  '.cc-banner',
  '#CybotCookiebotDialog'
]

// Reject button patterns
const REJECT_PATTERNS = /reject|decline|refuse|deny|no\s*thanks|essential\s*only|necessary\s*only|manage|customize|settings/i

export function analyzePage(): PageAnalysis {
  const domain = location.hostname
  const url = location.href
  const timestamp = Date.now()

  // Find trackers
  const trackers = findTrackers(domain)

  // Detect cookie banner
  const cookieBanner = detectCookieBanner()

  // Analyze forms
  const forms = analyzeForms()

  // Find privacy policy link
  const privacyPolicyLink = findPrivacyPolicyLink()

  // Calculate gap score
  const gapScore = calculateGapScore(trackers, cookieBanner, forms)

  return {
    domain,
    url,
    timestamp,
    trackers,
    cookieBanner,
    forms,
    privacyPolicyLink,
    gapScore
  }
}

function findTrackers(currentDomain: string): TrackerInfo[] {
  const trackers: TrackerInfo[] = []
  const seen = new Set<string>()

  // Check scripts
  for (const script of document.scripts) {
    if (!script.src) continue

    try {
      const url = new URL(script.src)
      const hostname = url.hostname

      // Skip same domain
      if (hostname === currentDomain || hostname.endsWith('.' + currentDomain)) continue
      if (seen.has(hostname)) continue
      seen.add(hostname)

      const category = categorizeTracker(hostname)
      trackers.push({ hostname, category })
    } catch {}
  }

  // Check iframes
  for (const iframe of document.querySelectorAll('iframe')) {
    const src = iframe.src
    if (!src) continue

    try {
      const url = new URL(src)
      const hostname = url.hostname

      if (hostname === currentDomain || hostname.endsWith('.' + currentDomain)) continue
      if (seen.has(hostname)) continue
      seen.add(hostname)

      const category = categorizeTracker(hostname)
      trackers.push({ hostname, category })
    } catch {}
  }

  // Check images (tracking pixels)
  for (const img of document.querySelectorAll('img')) {
    const src = img.src
    if (!src) continue

    try {
      const url = new URL(src)
      const hostname = url.hostname

      // Only count known tracker domains for images
      if (hostname === currentDomain || hostname.endsWith('.' + currentDomain)) continue
      if (seen.has(hostname)) continue

      const category = categorizeTracker(hostname)
      if (category !== 'unknown') {
        seen.add(hostname)
        trackers.push({ hostname, category })
      }
    } catch {}
  }

  return trackers
}

function categorizeTracker(hostname: string): TrackerInfo['category'] {
  // Check exact matches and partial matches
  for (const [pattern, category] of Object.entries(TRACKER_CATEGORIES)) {
    if (hostname === pattern || hostname.endsWith('.' + pattern)) {
      return category
    }
  }
  return 'unknown'
}

function detectCookieBanner(): CookieBannerInfo {
  let banner: Element | null = null
  let bannerType: CookieBannerInfo['type'] = null

  // Find banner using selectors
  for (const selector of BANNER_SELECTORS) {
    try {
      banner = document.querySelector(selector)
      if (banner) {
        // Determine type
        if (selector.includes('onetrust')) bannerType = 'onetrust'
        else if (selector.includes('Cookiebot')) bannerType = 'cookiebot'
        else bannerType = 'custom'
        break
      }
    } catch {}
  }

  if (!banner) {
    return {
      detected: false,
      hasRejectButton: false,
      isDarkPattern: false,
      type: null
    }
  }

  // Look for reject button
  const buttons = banner.querySelectorAll('button, a[role="button"], [class*="button"]')
  let rejectButton: Element | null = null

  for (const btn of buttons) {
    const text = btn.textContent || ''
    if (REJECT_PATTERNS.test(text)) {
      rejectButton = btn
      break
    }
  }

  // Check if reject button is hidden or de-emphasized (dark pattern)
  let isDarkPattern = false
  if (!rejectButton) {
    isDarkPattern = true // No reject button at all
  } else {
    const style = getComputedStyle(rejectButton)
    const rect = (rejectButton as HTMLElement).getBoundingClientRect()

    // Check if hidden
    if (
      style.display === 'none' ||
      style.visibility === 'hidden' ||
      style.opacity === '0' ||
      rect.width < 10 ||
      rect.height < 10
    ) {
      isDarkPattern = true
    }

    // Check if de-emphasized (smaller font, lighter color, link vs button)
    const acceptButton = [...buttons].find(btn => {
      const text = btn.textContent || ''
      return /accept|agree|allow|ok|got it/i.test(text)
    })

    if (acceptButton && rejectButton) {
      const acceptStyle = getComputedStyle(acceptButton)
      const rejectStyle = getComputedStyle(rejectButton)

      // If reject is significantly smaller or less visible
      const acceptSize = parseFloat(acceptStyle.fontSize)
      const rejectSize = parseFloat(rejectStyle.fontSize)
      if (rejectSize < acceptSize * 0.8) {
        isDarkPattern = true
      }
    }
  }

  return {
    detected: true,
    hasRejectButton: !!rejectButton,
    isDarkPattern,
    type: bannerType
  }
}

function analyzeForms(): FormInfo {
  const forms = document.querySelectorAll('form')

  // Sensitive input types
  const sensitiveInputs = document.querySelectorAll(`
    input[type="email"],
    input[type="tel"],
    input[type="password"],
    input[name*="email"],
    input[name*="phone"],
    input[name*="ssn"],
    input[name*="social"],
    input[name*="credit"],
    input[name*="card"],
    input[name*="cvv"],
    input[name*="passport"],
    input[name*="license"],
    input[autocomplete="email"],
    input[autocomplete="tel"],
    input[autocomplete="cc-number"]
  `)

  const hiddenInputs = document.querySelectorAll('input[type="hidden"]')

  return {
    count: forms.length,
    sensitiveFields: sensitiveInputs.length,
    hasHiddenInputs: hiddenInputs.length > 0
  }
}

function findPrivacyPolicyLink(): string | null {
  const selectors = [
    'a[href*="privacy"]',
    'a[href*="datenschutz"]',
    'a[href*="privacidade"]',
    'a[href*="confidentialite"]'
  ]

  for (const selector of selectors) {
    const link = document.querySelector(selector) as HTMLAnchorElement | null
    if (link?.href) {
      return link.href
    }
  }

  return null
}

function calculateGapScore(
  trackers: TrackerInfo[],
  cookieBanner: CookieBannerInfo,
  forms: FormInfo
): number {
  let score = 20 // Base score

  // Trackers (5 points each, max 50)
  score += Math.min(50, trackers.length * 5)

  // Advertising trackers are worse
  const adTrackers = trackers.filter(t => t.category === 'advertising')
  score += adTrackers.length * 3

  // Session recording is particularly invasive
  const sessionRecording = trackers.filter(t => t.category === 'session-recording')
  score += sessionRecording.length * 5

  // Cookie banner issues
  if (cookieBanner.detected) {
    if (cookieBanner.isDarkPattern) score += 20
    if (!cookieBanner.hasRejectButton) score += 15
  }

  // Forms with sensitive fields
  score += forms.sensitiveFields * 3

  // Hidden inputs (potential tracking)
  if (forms.hasHiddenInputs) score += 5

  // Clamp to 0-100
  return Math.min(100, Math.max(0, score))
}
