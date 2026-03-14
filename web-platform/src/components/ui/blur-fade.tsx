"use client"

import { useRef } from "react"
import {
    AnimatePresence,
    motion,
    useInView,
    type Variants,
} from "framer-motion"

interface BlurFadeProps {
    children: React.ReactNode
    className?: string
    duration?: number
    delay?: number
    offset?: number
    direction?: "up" | "down" | "left" | "right"
    inView?: boolean
    blur?: string
}

export function BlurFade({
    children,
    className,
    duration = 0.4,
    delay = 0,
    offset = 6,
    direction = "up",
    inView = true,
    blur = "6px",
}: BlurFadeProps) {
    const ref = useRef(null)
    const inViewResult = useInView(ref, { once: true, margin: "-50px" })
    const isInView = !inView || inViewResult

    const axis = direction === "left" || direction === "right" ? "x" : "y"
    const sign = direction === "right" || direction === "down" ? -1 : 1

    const variants: Variants = {
        hidden: {
            [axis]: offset * sign,
            opacity: 0,
            filter: `blur(${blur})`,
        },
        visible: {
            [axis]: 0,
            opacity: 1,
            filter: "blur(0px)",
        },
    }

    return (
        <AnimatePresence>
            <motion.div
                ref={ref}
                initial="hidden"
                animate={isInView ? "visible" : "hidden"}
                exit="hidden"
                variants={variants}
                transition={{
                    delay: 0.04 + delay,
                    duration,
                    ease: "easeOut",
                }}
                className={className}
            >
                {children}
            </motion.div>
        </AnimatePresence>
    )
}
