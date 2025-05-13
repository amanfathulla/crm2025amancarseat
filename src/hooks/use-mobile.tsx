
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    
    // Add both event listener types for wider browser support
    mql.addEventListener("change", onChange)
    
    // Also listen for resize events to catch all dimension changes
    window.addEventListener("resize", onChange)
    
    // Initialize the state
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    
    return () => {
      mql.removeEventListener("change", onChange)
      window.removeEventListener("resize", onChange)
    }
  }, [])

  return !!isMobile
}
