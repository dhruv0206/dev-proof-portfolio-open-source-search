"use client"
// Force HMR Update

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Loader2, Plus, CheckCircle2, AlertTriangle, ShieldCheck, Circle, Trophy, Sparkles } from "lucide-react"
import type { V4Bundle } from "@/lib/types/v4-output"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

const PROGRESS_STEPS = [
    "Connecting to GitHub",
    "Verifying Authorship",
    "Reading Source Code",
    "Generating Rubric",
    "Deep Mentor Audit",
    "Finalizing Score"
]

interface AuditResult {
    // V4-only import returns { status: 'pending', project_id }. Score/tier
    // arrive via polling → v4Data once the V4 pipeline completes.
    status?: 'pending' | 'success'
    score?: number
    tier?: string
    project_id?: string
    scoringVersion?: number
    discipline?: string
    scoreBreakdown?: {
        feature_score: number
        architecture_score: number
        intent_score: number
        forensics_score: number
    }
}

type V4Status = 'pending' | 'ready' | 'failed'

interface V4StatusResponse {
    project_id: string
    v3_ready: boolean
    v4_ready: boolean
    v4_status: V4Status
    v4: V4Bundle | null
}

export function AddProjectModal({ userId, defaultGithubUsername }: { userId?: string, defaultGithubUsername?: string }) {
    const [open, setOpen] = useState(false)
    const [url, setUrl] = useState("")
    const [loading, setLoading] = useState(false)
    const [statusText, setStatusText] = useState("")

    // Contributor Mode State
    const [isContributor, setIsContributor] = useState(false)
    const [isContributionDetected, setIsContributionDetected] = useState(false)
    const [confirmedContribution, setConfirmedContribution] = useState(false)

    // Pre-Scan State
    const [scanResult, setScanResult] = useState<any>(null) // { stack: {...}, authorship: ... }
    const [projectType, setProjectType] = useState("")
    const [scanned, setScanned] = useState(false)
    const [showOverride, setShowOverride] = useState(false)
    const [extractedClaims, setExtractedClaims] = useState<string[]>([])
    const [selectedClaims, setSelectedClaims] = useState<string[]>([])
    const [claimsReviewed, setClaimsReviewed] = useState(false)
    const [rejectionReason, setRejectionReason] = useState<string | null>(null)
    // Structured error for private repos / invalid URLs / etc. When set,
    // we render a friendly fix-flow card instead of the generic alert.
    const [structuredError, setStructuredError] = useState<{
        error_code: string;
        title: string;
        message: string;
        fix_action?: string;
    } | null>(null)

    // New Progress State
    const [isAuditing, setIsAuditing] = useState(false)
    const [currentStep, setCurrentStep] = useState(0)
    const progressInterval = useRef<NodeJS.Timeout | null>(null)

    // V4 async status — poll /status/{project_id} after /import returns the
    // V3 preliminary. When v4_status flips to 'ready' the UI upgrades the
    // displayed score; on 'failed' we stop polling and keep V3.
    const [v4Status, setV4Status] = useState<V4Status>('pending')
    const [v4Data, setV4Data] = useState<V4Bundle | null>(null)
    const v4PollInterval = useRef<NodeJS.Timeout | null>(null)

    // Audit Result State
    const [auditResult, setAuditResult] = useState<AuditResult | null>(null)

    const router = useRouter()

    // Use the passed userId or fallback to demo if not provided (though page always provides it)
    const effectiveUserId = userId || "demo-user-123"

    // Cleanup interval on unmount
    useEffect(() => {
        return () => {
            if (progressInterval.current) clearInterval(progressInterval.current)
            if (v4PollInterval.current) clearInterval(v4PollInterval.current)
        }
    }, [])

    // V4 status polling — starts once /import returns a project_id, stops
    // on ready/failed or after ~20 min hard cap. Keeps network traffic low
    // (every 15s) and the UI honest (shows a pending pill until flip).
    useEffect(() => {
        const pid = auditResult?.project_id
        if (!pid) return
        if (v4Status === 'ready' || v4Status === 'failed') return

        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
        const start = Date.now()
        const HARD_CAP_MS = 20 * 60 * 1000

        const tick = async () => {
            try {
                const res = await fetch(`${API_URL}/api/projects/status/${pid}`)
                if (!res.ok) return
                const body: V4StatusResponse = await res.json()
                if (body.v4_ready && body.v4) {
                    setV4Data(body.v4)
                    setV4Status('ready')
                    if (v4PollInterval.current) clearInterval(v4PollInterval.current)
                    return
                }
                if (body.v4_status === 'failed') {
                    setV4Status('failed')
                    if (v4PollInterval.current) clearInterval(v4PollInterval.current)
                    return
                }
                if (Date.now() - start > HARD_CAP_MS) {
                    setV4Status('failed')
                    if (v4PollInterval.current) clearInterval(v4PollInterval.current)
                }
            } catch {
                // Swallow — next tick will retry. If network is truly out
                // the hard cap eventually flips this to 'failed'.
            }
        }

        tick() // fire immediately so the user sees the pending state
        v4PollInterval.current = setInterval(tick, 15000)

        return () => {
            if (v4PollInterval.current) clearInterval(v4PollInterval.current)
        }
    }, [auditResult?.project_id, v4Status])

    const handleScan = async () => {
        if (!url) return
        setLoading(true)
        setStatusText("Scanning Repository...")
        setRejectionReason(null)

        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const res = await fetch(`${API_URL}/api/projects/scan`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    repo_url: url,
                    user_id: effectiveUserId
                })
            })

            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.detail || "Scan failed")
            }

            const data = await res.json()
            setScanResult(data)
            setProjectType(data.archetype?.name || "Full Stack Application")

            // Proactive Detection: Check if repo belongs to someone else
            // Backend checks org membership with authenticated GitHub token
            if (!data.is_own_repo) {
                setIsContributionDetected(true)
                setIsContributor(true)
            }

            setScanned(true)

        } catch (e: any) {
            alert(e.message)
        } finally {
            setLoading(false)
            setStatusText("")
        }
    }

    const handleProceedToClaims = async () => {
        setLoading(true)
        setStatusText("Generating Custom Rubric & Features...")
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const res = await fetch(`${API_URL}/api/projects/extract-features`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ repo_url: url, user_id: effectiveUserId })
            })

            if (!res.ok) throw new Error("Failed to extract features")

            const data = await res.json()
            setExtractedClaims(data.features || [])
            setSelectedClaims(data.features || [])
            setClaimsReviewed(true)
        } catch (e: any) {
            alert(e.message)
        } finally {
            setLoading(false)
            setStatusText("")
        }
    }

    const handleToggleClaim = (claim: string) => {
        if (selectedClaims.includes(claim)) {
            setSelectedClaims(selectedClaims.filter(c => c !== claim))
        } else {
            setSelectedClaims([...selectedClaims, claim])
        }
    }

    const startSimulatedProgress = () => {
        setCurrentStep(0)

        // Clear any existing
        if (progressInterval.current) clearInterval(progressInterval.current)

        progressInterval.current = setInterval(() => {
            setCurrentStep(prev => {
                // Stall at "Deep Mentor Audit" (step 4) until actual response
                if (prev >= 4) {
                    return prev
                }
                return prev + 1
            })
        }, 2000) // Advance every 2 seconds roughly
    }

    const handleConfirmImport = async () => {
        setIsAuditing(true)
        startSimulatedProgress()

        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

            const res = await fetch(`${API_URL}/api/projects/import`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    repo_url: url,
                    user_id: effectiveUserId,
                    project_type: projectType,
                    target_claims: selectedClaims
                })
            })

            const data = await res.json()
            if (!res.ok) {
                // Structured error: backend returns { detail: { error_code, title, message, fix_action? } }
                // for known fixable cases (private repo, invalid URL, etc.)
                if (data.detail && typeof data.detail === 'object' && data.detail.error_code) {
                    if (progressInterval.current) clearInterval(progressInterval.current)
                    setStructuredError(data.detail)
                    setIsAuditing(false)
                    return
                }
                // Plain string — fall through to legacy error handling.
                throw new Error(typeof data.detail === 'string' ? data.detail : 'Audit failed')
            }

            // Log V2 pipeline info
            console.log(`%c[DevProof Audit] Pipeline: ${data.pipeline_version || 'v1'} | Evidence files: ${data.evidence_file_count || 'N/A'} | Score: ${data.score} | Tier: ${data.tier}`, 'color: #10b981; font-weight: bold;')
            console.log('[DevProof Audit] Full result:', data)

            // Success! Fast forward to end and show results
            if (progressInterval.current) clearInterval(progressInterval.current)
            setCurrentStep(PROGRESS_STEPS.length - 1) // Finalizing
            setAuditResult(data)
            setIsAuditing(false)

        } catch (e: any) {
            if (progressInterval.current) clearInterval(progressInterval.current)

            const msg = e.message || ""
            if (msg.includes("Low Authorship")) {
                setRejectionReason("Low Authorship")
                setIsAuditing(false) // Exit progress view to show rejection
            } else {
                alert("Verification Failed: " + msg)
                setIsAuditing(false)
            }
        }
    }

    const handleReset = () => {
        // Only reset if NOT auditing (to prevent accidental loss if closed)
        if (isAuditing) return

        setScanned(false)
        setScanResult(null)
        setProjectType("")
        setUrl("")
        setShowOverride(false)
        setClaimsReviewed(false)
        setExtractedClaims([])
        setSelectedClaims([])
        setStatusText("")
        setRejectionReason(null)
        setStructuredError(null)
        setIsContributor(false)
        setIsContributionDetected(false)
        setConfirmedContribution(false)
        setIsAuditing(false)
        setCurrentStep(0)
        setAuditResult(null)
        setV4Status('pending')
        setV4Data(null)
        if (progressInterval.current) clearInterval(progressInterval.current)
        if (v4PollInterval.current) clearInterval(v4PollInterval.current)
    }

    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen)
        if (!newOpen) {
            // Give a delay before reset to allow animation to close, 
            // but checked inside handleReset if we should actually reset
            setTimeout(handleReset, 300)
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Plus className="w-4 h-4" /> Add project for verification
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Import & Verify Project</DialogTitle>
                    <DialogDescription>
                        {auditResult ? "Verification Complete" :
                            isAuditing ? "Deep Mentor Analysis Running..." :
                                rejectionReason ? "Verification Failed" :
                                    isContributionDetected && !confirmedContribution ? "Contributor Verification" :
                                        !scanned ? "Step 1: Enter your GitHub URL to start." :
                                            !claimsReviewed ? "Step 2: Detect & Confirm Stack." :
                                                "Step 3: Confirm features to verify."}
                    </DialogDescription>
                </DialogHeader>

                {auditResult ? (
                    // RESULT VIEW — V4-only: pending until poll flips v4Status to 'ready'.
                    v4Status === 'pending' ? (
                        // ── Pending: /import returned, V4 still running in background ──
                        <div className="py-6 space-y-6">
                            <div className="flex flex-col items-center text-center space-y-3">
                                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                                </div>
                                <h3 className="font-bold text-lg">Deep analysis running</h3>
                                <p className="text-sm text-muted-foreground px-4">
                                    We're running the full V4 pipeline — graph analysis, pattern
                                    detection, semantic chunking, and forensics.
                                </p>
                                <p className="text-xs text-muted-foreground/70">
                                    Usually 1–15 min depending on repo size.
                                    <br />
                                    You can close this dialog — your project will appear on your
                                    profile when ready.
                                </p>
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs">
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    <span>Checking status every 15s</span>
                                </div>
                            </div>
                        </div>
                    ) : v4Status === 'failed' ? (
                        // ── Failed: V4 pipeline errored, timed out, or authorship too low ──
                        <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                                <AlertTriangle className="w-8 h-8 text-red-600" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="font-bold text-lg text-red-700">Audit Failed</h3>
                                <p className="text-sm text-muted-foreground px-4">
                                    The deep analysis didn't complete successfully. This usually
                                    means authorship is too low, the repo is private/inaccessible,
                                    or the pipeline hit an error.
                                </p>
                                <p className="text-xs text-muted-foreground/70 px-8">
                                    Try again or check the repo URL. If this keeps happening,
                                    reach out on support.
                                </p>
                            </div>
                        </div>
                    ) : (
                        // ── Ready: V4 finished — show V4 score + V4 breakdown ──
                        <div className="py-6 space-y-6">
                            <div className="flex flex-col items-center text-center space-y-3">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                                    <Trophy className="w-8 h-8 text-green-600" />
                                </div>
                                <h3 className="font-bold text-lg">Project Verified!</h3>
                                <div className="flex items-center gap-2">
                                    <span className="text-4xl font-bold">
                                        {Math.round(v4Data?.output?.repo_score ?? 0)}
                                    </span>
                                    <div className="text-left">
                                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                                            {v4Data?.output?.repo_tier ?? 'V4'}
                                        </Badge>
                                        {v4Data?.output?.discipline && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {v4Data.output.discipline}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs">
                                    <Sparkles className="w-3.5 h-3.5" />
                                    <span>Scored by V4 deep analysis</span>
                                </div>
                            </div>

                            {/* V4 Score Breakdown */}
                            {v4Data?.output?.score_breakdown && (
                                <div className="space-y-2 px-4">
                                    {[
                                        { label: "Features", value: v4Data.output.score_breakdown.features.score, max: 40, color: "bg-purple-500" },
                                        { label: "Architecture", value: v4Data.output.score_breakdown.architecture.score, max: 15, color: "bg-blue-500" },
                                        { label: "Intent & Standards", value: v4Data.output.score_breakdown.intent_and_standards.score, max: 25, color: "bg-emerald-500" },
                                        { label: "Forensics", value: v4Data.output.score_breakdown.forensics.score, max: 20, color: "bg-amber-500" },
                                    ].map(({ label, value, max, color }) => (
                                        <div key={label} className="space-y-1">
                                            <div className="flex justify-between text-xs">
                                                <span className="text-muted-foreground">{label}</span>
                                                <span className="font-mono font-bold">{value}/{max}</span>
                                            </div>
                                            <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                                                <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${Math.min((value / max) * 100, 100)}%` }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )
                ) : isAuditing ? (
                    // PROGRESS VIEW
                    <div className="py-6 space-y-6">
                        <div className="space-y-4 px-4">
                            {PROGRESS_STEPS.map((step, index) => {
                                const isCompleted = index < currentStep
                                const isCurrent = index === currentStep

                                return (
                                    <div key={index} className="flex items-center gap-3">
                                        {isCompleted ? (
                                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                                        ) : isCurrent ? (
                                            <Loader2 className="w-5 h-5 text-primary animate-spin" />
                                        ) : (
                                            <Circle className="w-5 h-5 text-muted-foreground/30" />
                                        )}
                                        <span className={`text-sm ${isCurrent ? "font-semibold text-foreground" : isCompleted ? "text-muted-foreground" : "text-muted-foreground/50"}`}>
                                            {step}
                                            {isCurrent && index === 2 && <span className="block text-xs font-normal text-muted-foreground mt-0.5">Fetching latest source files (ignoring assets)...</span>}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                        <p className="text-xs text-center text-muted-foreground/60 pt-4">
                            You can close this window. The audit will continue in the background.
                        </p>
                    </div>
                ) : structuredError ? (
                    // STRUCTURED-ERROR VIEW (private repo, invalid URL, etc.)
                    <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
                        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
                            <ShieldCheck className="w-8 h-8 text-amber-600" />
                        </div>
                        <div className="space-y-2 max-w-md">
                            <h3 className="font-bold text-lg text-amber-700">{structuredError.title}</h3>
                            <p className="text-sm text-muted-foreground px-4 leading-relaxed">
                                {structuredError.message}
                            </p>
                        </div>
                        {structuredError.fix_action === "grant_repo_scope" && (
                            <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-md text-sm text-blue-800 dark:text-blue-200 mt-2 mx-4 max-w-md flex flex-col gap-3 items-start text-left">
                                <div className="flex gap-2 items-start">
                                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                                    <span>
                                        <strong>Want to audit private repos?</strong>{" "}
                                        Visit <a href="/settings/github" className="underline hover:no-underline">Settings → GitHub Access</a>{" "}
                                        to grant DevProof read-access to your private repos. (Coming soon — currently only public repos are supported.)
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                ) : rejectionReason ? (
                    // REJECTION VIEW
                    <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                            <AlertTriangle className="w-8 h-8 text-red-600" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-bold text-lg text-red-700">Verification Rejected</h3>
                            <p className="text-sm text-muted-foreground px-4">
                                We could not verify your authorship. <br />
                                <strong>Reason: Authorship &lt; 15%</strong>
                            </p>
                            <p className="text-xs text-muted-foreground px-8">
                                To prevent fraud, DevProof requires you to be a primary contributor.
                            </p>
                        </div>
                        {rejectionReason === "ContactUs" && (
                            <div className="bg-blue-50 p-4 rounded-md text-sm text-blue-700 mt-2 mx-8 text-center flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" />
                                Please contact support to verify your relationship with this project.
                            </div>
                        )}
                    </div>
                ) : !scanned ? (
                    // STEP 1: INPUT
                    <div className="grid gap-4 py-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium">GitHub Repository URL</label>
                            <Input
                                placeholder="https://github.com/username/repo"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                disabled={loading}
                            />
                            <p className="text-[11px] text-muted-foreground">
                                💡 Tip: We analyze your <strong>README</strong> to find technical claims.
                            </p>
                        </div>
                    </div>
                ) : isContributionDetected && !confirmedContribution ? (
                    // CONTRIBUTION CONFIRMATION VIEW
                    <div className="flex flex-col items-center justify-center py-8 text-center space-y-6">
                        <div className="w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center">
                            <ShieldCheck className="w-8 h-8 text-cyan-600" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-bold text-lg">External Repository Detected</h3>
                            <p className="text-sm text-muted-foreground px-4">
                                This repository belongs to someone else. <br />
                                <strong>Are you a contributor to this project?</strong>
                            </p>
                        </div>
                        <div className="flex flex-col w-full gap-2 px-8">
                            <Button onClick={() => setConfirmedContribution(true)} className="bg-cyan-600 hover:bg-cyan-700">
                                Yes, I am a Contributor
                            </Button>
                            <Button variant="outline" onClick={() => setRejectionReason("ContactUs")}>
                                No, this is not my work
                            </Button>
                        </div>
                    </div>
                ) : !claimsReviewed ? (
                    // STEP 2: STACK CONFIRMATION
                    <div className="py-4 space-y-4">
                        <div className="bg-muted p-4 rounded-lg">
                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                Stack Detected
                            </h4>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {scanResult?.stack?.languages?.map((l: string) => <Badge key={l} variant="outline">{l}</Badge>)}
                                {scanResult?.stack?.frameworks?.map((f: string) => <Badge key={f} className="bg-blue-100 text-blue-800 hover:bg-blue-100">{f}</Badge>)}
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium">Project Archetype</label>
                            <Input
                                value={projectType}
                                onChange={(e) => setProjectType(e.target.value)}
                                className="font-semibold border-amber-200 bg-amber-50 focus:bg-white transition-colors"
                            />
                        </div>
                    </div>
                ) : (
                    // STEP 3: CLAIMS REVIEW
                    <div className="py-4 space-y-4">
                        <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950/30 p-3 rounded border border-blue-200 dark:border-blue-900">
                            <p>
                                I found these features in your README. Uncheck any that you haven't implemented yet.
                            </p>
                        </div>

                        <div className="space-y-2 max-h-[200px] overflow-y-auto border rounded-md p-2">
                            {extractedClaims.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">No specific claims found.</p>
                            ) : (
                                extractedClaims.map((claim, i) => (
                                    <div key={i} className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded cursor-pointer" onClick={() => handleToggleClaim(claim)}>
                                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${selectedClaims.includes(claim) ? "bg-primary border-primary text-primary-foreground" : "border-input"}`}>
                                            {selectedClaims.includes(claim) && <CheckCircle2 className="w-3 h-3" />}
                                        </div>
                                        <span className="text-sm">{claim}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                <DialogFooter>
                    {auditResult ? (
                        <Button className="w-full" onClick={() => {
                            setOpen(false)
                            handleReset()
                            window.location.reload()
                        }}>
                            View My Projects
                        </Button>
                    ) : isAuditing ? (
                        null
                    ) : rejectionReason ? (
                        <Button onClick={handleReset} variant="destructive" className="w-full">
                            {rejectionReason === "ContactUs" ? "Close" : "Okay, I understand"}
                        </Button>
                    ) : isContributionDetected && !confirmedContribution ? (
                        null
                    ) : !scanned ? (
                        <Button onClick={handleScan} disabled={loading || !url}>
                            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Scan Repository
                        </Button>
                    ) : !claimsReviewed ? (
                        <div className="flex gap-2 w-full justify-end">
                            <Button variant="ghost" onClick={() => setScanned(false)} disabled={loading}>Back</Button>
                            <Button onClick={handleProceedToClaims} disabled={loading}>
                                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Review Claims &rarr;
                            </Button>
                        </div>
                    ) : (
                        <div className="flex gap-2 w-full justify-end">
                            <Button variant="ghost" onClick={() => setClaimsReviewed(false)} disabled={loading}>Back</Button>
                            <Button onClick={handleConfirmImport} disabled={loading}>
                                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Confirm & Verify
                            </Button>
                        </div>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

