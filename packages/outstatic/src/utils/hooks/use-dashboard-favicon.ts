import { useEffect } from 'react'

export const OUTSTATIC_FAVICON_SVG =
  `<svg width="1280" height="1280" viewBox="0 0 1280 1280" fill="none" xmlns="http://www.w3.org/2000/svg">
<g clip-path="url(#clip0_4594_271)">
<path d="M0 640C0 160 160 0 640 0C1120 0 1280 160 1280 640C1280 1120 1120 1280 640 1280C160 1280 0 1120 0 640Z" fill="white"/>
<path d="M643.142 1104C562.787 1104 493.851 1090.46 436.334 1063.39C379.662 1036.31 333.564 1000.35 298.039 955.512C262.513 909.824 236.292 859.482 219.375 804.486C202.458 749.491 194 694.495 194 639.5C194 586.197 202.881 532.47 220.644 478.321C239.253 423.326 266.742 372.984 303.114 327.295C340.331 281.607 386.429 244.802 441.409 216.881C497.235 188.96 562.364 175 636.799 175C714.616 175 781.438 188.96 837.263 216.881C893.935 244.802 940.456 282.03 976.827 328.564C1013.2 374.253 1040.27 424.172 1058.03 478.321C1076.64 532.47 1085.94 586.197 1085.94 639.5C1085.94 691.957 1076.64 745.684 1058.03 800.679C1040.27 854.828 1012.78 905.17 975.559 951.705C939.187 997.393 893.512 1034.2 838.532 1062.12C783.552 1090.04 718.422 1104 643.142 1104ZM649.486 1038.01C698.545 1038.01 740.837 1027.01 776.363 1005.01C812.734 983.01 842.338 953.82 865.176 917.439C888.86 880.211 906.2 839.599 917.195 795.602C928.191 750.76 933.689 706.341 933.689 662.344C933.689 608.195 927.345 556.161 914.658 506.242C901.97 455.477 882.516 410.211 856.295 370.445C830.919 329.833 799.2 298.105 761.137 275.261C723.075 251.571 679.091 239.725 629.186 239.725C580.127 239.725 537.412 251.148 501.041 273.992C464.67 296.836 435.065 326.872 412.227 364.1C389.39 400.481 372.05 441.093 360.208 485.936C349.212 529.932 343.714 574.352 343.714 619.194C343.714 663.19 349.635 709.725 361.477 758.798C373.319 807.871 391.504 853.559 416.034 895.863C440.563 938.168 471.859 972.434 509.922 998.663C548.831 1024.89 595.352 1038.01 649.486 1038.01Z" fill="#050505"/>
</g>
<defs>
<clipPath id="clip0_4594_271">
<rect width="1280" height="1280" fill="white"/>
</clipPath>
</defs>
</svg>`
    .replace(/\s+/g, ' ')
    .trim()

export const OUTSTATIC_FAVICON_DATA_URI = `data:image/svg+xml,${encodeURIComponent(
  OUTSTATIC_FAVICON_SVG
)}`

export const OUTSTATIC_FAVICON_LINK_ID = 'outstatic-dashboard-favicon'

const ICON_SELECTOR =
  'link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]'

/**
 * While the Outstatic dashboard is mounted, override the host site's favicon
 * with the Outstatic logomark, then restore the host's icons on unmount.
 */
export function useDashboardFavicon() {
  useEffect(() => {
    if (typeof document === 'undefined') return
    // StrictMode / re-mount safety: never inject twice.
    if (document.getElementById(OUTSTATIC_FAVICON_LINK_ID)) return

    const head = document.head
    const stashed: Element[] = []
    head.querySelectorAll(ICON_SELECTOR).forEach((el) => {
      stashed.push(el)
      el.remove()
    })

    const link = document.createElement('link')
    link.id = OUTSTATIC_FAVICON_LINK_ID
    link.rel = 'icon'
    link.type = 'image/svg+xml'
    link.href = OUTSTATIC_FAVICON_DATA_URI
    head.appendChild(link)

    return () => {
      document.getElementById(OUTSTATIC_FAVICON_LINK_ID)?.remove()
      stashed.forEach((el) => head.appendChild(el))
    }
  }, [])
}
