'use client';

/**
 * /dev/palette — three-column comparison.
 *
 * Same minimal spec applied with three different accents so you can see
 * them side by side, not toggle. Spec is from research: bg #0A0A0A,
 * 3-step text, hairline borders, no tinted card fills, mono only on data,
 * sharp corners (2px max).
 *
 * Pick a column and I'll apply that direction to the real pages.
 */

import { useState } from 'react';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';

interface Direction {
    id: string;
    name: string;
    tagline: string;
    accent: string | null;
}

const DIRECTIONS: Direction[] = [
    {
        id: 'indigo',
        name: 'Linear Indigo',
        tagline: 'Consensus pick. What 4/7 of the studied devtools converge on. Safest, professional, "looks like 2026."',
        accent: '#5E6AD2',
    },
    {
        id: 'clay',
        name: 'Anthropic Clay',
        tagline: 'Differentiator. Warm coral is the only accent that doesn\'t read as "another dark SaaS." Most distinctive.',
        accent: '#CC785C',
    },
    {
        id: 'none',
        name: 'No Accent',
        tagline: 'Pure Vercel grayscale. Hardest to nail — type and spacing have to be perfect. No color crutch.',
        accent: null,
    },
];

const SPEC = {
    bg: '#0A0A0A',
    text1: '#EDEDED',
    text2: '#A1A1A1',
    text3: '#666666',
    border: 'rgba(255,255,255,0.08)',
    fontSans: GeistSans.style.fontFamily,
    fontMono: GeistMono.style.fontFamily,
};

// ─── Atoms ────────────────────────────────────────────────────────────────────

function MonoLabel({ children }: { children: React.ReactNode }) {
    return (
        <div
            style={{
                fontFamily: SPEC.fontMono,
                fontSize: 10,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: SPEC.text3,
            }}
        >
            {children}
        </div>
    );
}

// Section header — uses `·` middle dot as separator (not `//`).
// `//` is reserved for body code-comments where it's semantically meaningful.
function CommentHeader({
    label, version, accent,
}: { label: string; version?: string; accent: string | null }) {
    return (
        <div
            style={{
                fontFamily: SPEC.fontMono,
                fontSize: 10,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: SPEC.text3,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
            }}
        >
            <span style={{ color: SPEC.text2 }}>{label}</span>
            {version && (
                <>
                    <span style={{ color: SPEC.text3, opacity: 0.6 }}>·</span>
                    <span>{version}</span>
                </>
            )}
        </div>
    );
}

// Title with the orange-bar-on-the-left accent (from Gemini's reference).
function AccentedTitle({
    children, accent, mono = false,
}: { children: React.ReactNode; accent: string | null; mono?: boolean }) {
    return (
        <div style={{ display: 'flex', alignItems: 'stretch', gap: 14 }}>
            <div style={{ width: 2, background: accent ?? SPEC.text1, flexShrink: 0 }} />
            <div
                style={{
                    fontFamily: mono ? SPEC.fontMono : SPEC.fontSans,
                    fontSize: mono ? 18 : 22,
                    fontWeight: mono ? 500 : 500,
                    letterSpacing: mono ? '0.02em' : '-0.015em',
                    color: SPEC.text1,
                    paddingTop: 2,
                    paddingBottom: 2,
                    textTransform: mono ? 'uppercase' : 'none',
                }}
            >
                {children}
            </div>
        </div>
    );
}

// Bracketed status token. `[OK]`, `[PEND]`, `[FAIL]`.
function StatusToken({ status, accent }: { status: 'ok' | 'pend' | 'fail'; accent: string | null }) {
    const colorMap = {
        ok: accent ?? SPEC.text1,
        pend: SPEC.text2,
        fail: '#F87171',
    };
    return (
        <span
            style={{
                fontFamily: SPEC.fontMono,
                fontSize: 10,
                letterSpacing: '0.08em',
                color: colorMap[status],
                textTransform: 'uppercase',
            }}
        >
            [{status}]
        </span>
    );
}

// 4-column metadata strip (ENGINE | SOURCE | SYNC | SCORE_V).
function MetaStrip({
    items,
}: {
    items: { label: string; value: string }[];
}) {
    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${items.length}, 1fr)`,
                border: `1px solid ${SPEC.border}`,
            }}
        >
            {items.map((item, i) => (
                <div
                    key={item.label}
                    style={{
                        padding: '10px 14px',
                        borderRight: i < items.length - 1 ? `1px solid ${SPEC.border}` : 'none',
                    }}
                >
                    <div
                        style={{
                            fontFamily: SPEC.fontMono,
                            fontSize: 9,
                            letterSpacing: '0.1em',
                            color: SPEC.text3,
                            textTransform: 'uppercase',
                            marginBottom: 4,
                        }}
                    >
                        {item.label}
                    </div>
                    <div
                        style={{
                            fontFamily: SPEC.fontMono,
                            fontSize: 11,
                            color: SPEC.text1,
                            letterSpacing: '0.04em',
                        }}
                    >
                        {item.value}
                    </div>
                </div>
            ))}
        </div>
    );
}

function Hairline() {
    return <div style={{ height: 1, background: SPEC.border }} />;
}

function BrandMark({ accent }: { accent: string | null }) {
    return (
        <div style={{ fontFamily: SPEC.fontMono, fontSize: 12, color: SPEC.text1 }}>
            <span style={{ color: SPEC.text3 }}>{'<'}</span>
            <span>devproof</span>
            <span style={{ color: accent ?? SPEC.text2 }}>/</span>
            <span style={{ color: SPEC.text3 }}>{'>'}</span>
        </div>
    );
}

function CTAButton({ accent, children }: { accent: string | null; children: React.ReactNode }) {
    return (
        <button
            style={{
                fontFamily: SPEC.fontSans,
                fontSize: 12,
                fontWeight: 500,
                padding: '7px 14px',
                background: accent ?? SPEC.text1,
                color: accent ? '#fff' : SPEC.bg,
                border: 'none',
                borderRadius: 2,
                cursor: 'pointer',
            }}
        >
            {children}
        </button>
    );
}

function GhostButton({ children }: { children: React.ReactNode }) {
    return (
        <button
            style={{
                fontFamily: SPEC.fontSans,
                fontSize: 12,
                fontWeight: 500,
                padding: '6px 14px',
                background: 'transparent',
                color: SPEC.text1,
                border: `1px solid ${SPEC.border}`,
                borderRadius: 2,
                cursor: 'pointer',
            }}
        >
            {children}
        </button>
    );
}

// ─── Sections ─────────────────────────────────────────────────────────────────

function ScoreReadout({
    label, score, accent, isPrimary,
}: {
    label: string;
    score: number;
    accent: string | null;
    isPrimary: boolean;
}) {
    const numColor = isPrimary && accent ? accent : SPEC.text1;
    return (
        <div style={{ flex: 1 }}>
            <MonoLabel>{label}</MonoLabel>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 12 }}>
                <span
                    style={{
                        fontFamily: SPEC.fontMono,
                        fontSize: 44,
                        fontWeight: 400,
                        color: numColor,
                        fontVariantNumeric: 'tabular-nums',
                        lineHeight: 1,
                        letterSpacing: '-0.04em',
                    }}
                >
                    {score}
                </span>
                <span style={{ fontFamily: SPEC.fontMono, fontSize: 11, color: SPEC.text3 }}>/100</span>
            </div>
        </div>
    );
}

function ClaimRow() {
    return (
        <div style={{ paddingTop: 14, paddingBottom: 14 }}>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    gap: 12,
                    marginBottom: 6,
                }}
            >
                <div style={{ fontSize: 13, color: SPEC.text1, fontFamily: SPEC.fontSans, fontWeight: 500 }}>
                    Multi-provider Telephony Pipeline
                </div>
                <div
                    style={{
                        fontFamily: SPEC.fontMono,
                        fontSize: 10,
                        color: SPEC.text2,
                        whiteSpace: 'nowrap',
                    }}
                >
                    tier_2
                </div>
            </div>
            <div style={{ fontSize: 12, color: SPEC.text2, lineHeight: 1.55, marginBottom: 8, fontFamily: SPEC.fontSans }}>
                Orchestrates Twilio + Telnyx + LiveKit SIP trunks with stateful provisioning.
            </div>
            <div
                style={{
                    fontFamily: SPEC.fontMono,
                    fontSize: 10,
                    color: SPEC.text3,
                    display: 'flex',
                    gap: 12,
                    flexWrap: 'wrap',
                }}
            >
                <span>telephony.py:384</span>
                <span>telnyx_provider.py:107</span>
            </div>
        </div>
    );
}

function PipelineRow({ n, name, desc, status, accent }: { n: string; name: string; desc: string; status: string; accent?: string | null }) {
    const statusColor = status === '[OK]' ? (accent ?? SPEC.text1) : SPEC.text3;
    return (
        <div
            style={{
                gridTemplateColumns: '24px 1fr auto',
                display: 'grid',
                gap: 12,
                alignItems: 'baseline',
                padding: '10px 0',
            }}
        >
            <div
                style={{
                    fontFamily: SPEC.fontMono,
                    fontSize: 11,
                    color: SPEC.text3,
                    fontVariantNumeric: 'tabular-nums',
                }}
            >
                {n}
            </div>
            <div>
                <div
                    style={{
                        fontFamily: SPEC.fontMono,
                        fontSize: 11,
                        letterSpacing: '0.04em',
                        color: SPEC.text1,
                        marginBottom: 2,
                    }}
                >
                    {name}
                </div>
                <div style={{ fontSize: 11, color: SPEC.text2, fontFamily: SPEC.fontSans, lineHeight: 1.5 }}>
                    {desc}
                </div>
            </div>
            <div
                style={{
                    fontFamily: SPEC.fontMono,
                    fontSize: 10,
                    color: statusColor,
                    letterSpacing: '0.05em',
                }}
            >
                {status}
            </div>
        </div>
    );
}

// ─── Column ───────────────────────────────────────────────────────────────────

function DirectionColumn({
    d, isPicked, onPick,
}: {
    d: Direction;
    isPicked: boolean;
    onPick: () => void;
}) {
    return (
        <div
            style={{
                background: SPEC.bg,
                color: SPEC.text1,
                padding: 32,
                border: isPicked ? `1px solid ${d.accent ?? SPEC.text1}` : `1px solid ${SPEC.border}`,
                borderRadius: 0,
                fontFamily: SPEC.fontSans,
            }}
        >
            {/* Header */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 24,
                }}
            >
                <BrandMark accent={d.accent} />
                <button
                    onClick={onPick}
                    style={{
                        fontFamily: SPEC.fontMono,
                        fontSize: 10,
                        letterSpacing: '0.12em',
                        padding: '5px 11px',
                        background: isPicked ? (d.accent ?? SPEC.text1) : 'transparent',
                        color: isPicked ? (d.accent ? '#fff' : SPEC.bg) : SPEC.text2,
                        border: `1px solid ${isPicked ? (d.accent ?? SPEC.text1) : SPEC.border}`,
                        cursor: 'pointer',
                        borderRadius: 2,
                        textTransform: 'uppercase',
                    }}
                >
                    {isPicked ? '✓ picked' : 'pick'}
                </button>
            </div>

            {/* Title — accented bar + comment-style version */}
            <CommentHeader label="DIRECTION" version="V1" accent={d.accent} />
            <div style={{ height: 10 }} />
            <AccentedTitle accent={d.accent} mono>
                {d.name.replace(/ /g, '_')}
            </AccentedTitle>

            <div style={{ height: 14 }} />
            <div
                style={{
                    fontFamily: SPEC.fontMono,
                    fontSize: 11,
                    color: SPEC.text2,
                    lineHeight: 1.6,
                    marginBottom: 14,
                }}
            >
                <span style={{ color: SPEC.text3 }}>// </span>
                {d.tagline}
            </div>

            {/* Metadata strip */}
            <MetaStrip
                items={[
                    { label: 'ACCENT', value: d.accent ?? 'NONE' },
                    { label: 'BG', value: SPEC.bg },
                    { label: 'TYPE', value: 'GEIST' },
                    { label: 'RADIUS', value: '2_PX' },
                ]}
            />

            <div style={{ height: 32 }} />

            {/* CTAs */}
            <CommentHeader label="CTA" accent={d.accent} />
            <Hairline />
            <div style={{ display: 'flex', gap: 8, padding: '14px 0' }}>
                <CTAButton accent={d.accent}>Run audit</CTAButton>
                <GhostButton>Methodology</GhostButton>
            </div>
            <Hairline />

            <div style={{ height: 32 }} />

            {/* Scoreboard */}
            <CommentHeader label="SCOREBOARD" version="DUAL_AXIS" accent={d.accent} />
            <Hairline />
            <div style={{ display: 'flex', gap: 16, paddingTop: 18, paddingBottom: 18 }}>
                <ScoreReadout label="eng_depth" score={73} accent={d.accent} isPrimary={true} />
                <div style={{ width: 1, background: SPEC.border }} />
                <ScoreReadout label="reach" score={32} accent={d.accent} isPrimary={false} />
            </div>
            <Hairline />

            <div style={{ height: 32 }} />

            {/* Claim */}
            <CommentHeader label="CLAIM" version="06_DETECTED" accent={d.accent} />
            <Hairline />
            <ClaimRow />
            <Hairline />

            <div style={{ height: 32 }} />

            {/* Pipeline */}
            <CommentHeader label="PIPELINE" version="04_PHASE" accent={d.accent} />
            <Hairline />
            <PipelineRow n="01" name="DISCOVERY" desc="Walk repo skeleton, detect entry points." status="[OK]" accent={d.accent} />
            <Hairline />
            <PipelineRow n="02" name="MAP" desc="Per-file claim extraction." status="[OK]" accent={d.accent} />
            <Hairline />
            <PipelineRow n="03" name="REDUCE" desc="Apply caps + scoring." status="[PEND]" accent={d.accent} />
            <Hairline />

            <div style={{ height: 32 }} />

            {/* Typography */}
            <CommentHeader label="TYPE" accent={d.accent} />
            <Hairline />
            <div style={{ paddingTop: 16 }}>
                <div
                    style={{
                        fontSize: 22,
                        fontWeight: 500,
                        letterSpacing: '-0.015em',
                        marginBottom: 8,
                    }}
                >
                    Engineering depth, quantified.
                </div>
                <div style={{ fontSize: 12, color: SPEC.text2, lineHeight: 1.6 }}>
                    A weighted aggregate of audit scores. Authorship × recency × log-impact.
                </div>
            </div>
        </div>
    );
}

// ─── Gemini Redesigns ────────────────────────────────────────────────────────

const GEMINI_THEMES = {
    terminal: {
        bg: '#050705',
        text: '#00FF41',
        dim: '#003B00',
        accent: '#00FF41',
        border: '1px solid #003B00',
        font: 'ui-monospace, "SF Mono", Monaco, "Andale Mono", monospace',
    },
    hud: {
        bg: '#020617',
        text: '#F8FAFC',
        dim: '#64748B',
        accent: '#38BDF8',
        border: '1px solid rgba(56, 189, 248, 0.2)',
        font: 'system-ui, -apple-system, sans-serif',
    },
    blueprint: {
        bg: '#0F172A',
        text: '#94A3B8',
        dim: '#475569',
        accent: '#F97316',
        border: '1px dashed rgba(148, 163, 184, 0.3)',
        font: '"Geist Mono", monospace',
    },
};

function GeminiSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section style={{ marginBottom: 120 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 40 }}>
                <div style={{ height: 1, flex: 1, background: 'linear-gradient(90deg, transparent, #333)' }} />
                <h2 style={{ fontSize: 14, fontFamily: SPEC.fontMono, color: '#666', letterSpacing: '0.4em', textTransform: 'uppercase' }}>
                    Gemini Variant / {title}
                </h2>
                <div style={{ height: 1, flex: 1, background: 'linear-gradient(270deg, transparent, #333)' }} />
            </div>
            {children}
        </section>
    );
}

function TerminalPrime() {
    const t = GEMINI_THEMES.terminal;
    return (
        <div style={{ 
            background: t.bg, 
            color: t.text, 
            fontFamily: t.font, 
            padding: 40, 
            border: t.border,
            position: 'relative',
            overflow: 'hidden',
            borderRadius: 4
        }}>
            <div className="scanline" />
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: t.border, paddingBottom: 10, marginBottom: 30, fontSize: 12 }}>
                <span>[SYSTEM_STATUS: ACTIVE]</span>
                <span>LOC: DEV-PROOF // CORE-01</span>
                <span>{new Date().toISOString()}</span>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 40 }}>
                <div>
                    <h3 style={{ fontSize: 32, marginBottom: 20, textShadow: '0 0 10px #00FF41' }}>{'>'} AUDIT_INITIALIZED</h3>
                    <p style={{ color: '#008F11', lineHeight: 1.6, marginBottom: 30, fontSize: 14 }}>
                        WEIGHED_AGGREGATE: DETECTING_DEPTH...<br/>
                        AUTHORSHIP_VECTORS: STABLE<br/>
                        RECENCY_WEIGHT: 0.94<br/>
                        IMPACT_COEFFICIENT: CALIBRATING...
                    </p>
                    <div style={{ display: 'flex', gap: 20 }}>
                        <button style={{ background: t.text, color: t.bg, border: 'none', padding: '10px 20px', fontWeight: 'bold', cursor: 'pointer', fontFamily: t.font }}>EXECUTE_SCAN</button>
                        <button style={{ background: 'transparent', color: t.text, border: t.border, padding: '10px 20px', cursor: 'pointer', fontFamily: t.font }}>VIEW_LOGS</button>
                    </div>
                </div>
                <div style={{ border: t.border, padding: 20, background: 'rgba(0,59,0,0.1)' }}>
                    <div style={{ fontSize: 12, color: '#008F11', marginBottom: 15 }}>// ENG_DEPTH_QUANTIFIER</div>
                    <div style={{ fontSize: 72, lineHeight: 1 }}>73<span style={{ fontSize: 24, color: '#003B00' }}>%</span></div>
                    <div style={{ marginTop: 20, height: 4, background: '#003B00' }}>
                        <div style={{ width: '73%', height: '100%', background: t.text, boxShadow: '0 0 15px #00FF41' }} />
                    </div>
                </div>
            </div>

            <div style={{ marginTop: 40, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
                {[1,2,3].map(i => (
                    <div key={i} style={{ border: t.border, padding: 15, fontSize: 12 }}>
                        <div style={{ color: '#008F11' }}>CLAIM_SET_{i}</div>
                        <div style={{ marginTop: 5 }}>DEPTH_SCAN: COMPLETE</div>
                        <div style={{ marginTop: 5, color: '#003B00' }}>0x${Math.random().toString(16).slice(2, 10)}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function CyberHUD() {
    const t = GEMINI_THEMES.hud;
    return (
        <div style={{ 
            background: t.bg, 
            color: t.text, 
            fontFamily: t.font, 
            padding: 40, 
            borderRadius: 16,
            border: t.border,
            backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(56, 189, 248, 0.05) 0%, transparent 80%)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            position: 'relative',
            overflow: 'hidden'
        }}>
            <div style={{ position: 'absolute', top: 20, left: 20, width: 20, height: 20, borderTop: '2px solid ' + t.accent, borderLeft: '2px solid ' + t.accent }} />
            <div style={{ position: 'absolute', top: 20, right: 20, width: 20, height: 20, borderTop: '2px solid ' + t.accent, borderRight: '2px solid ' + t.accent }} />
            <div style={{ position: 'absolute', bottom: 20, left: 20, width: 20, height: 20, borderBottom: '2px solid ' + t.accent, borderLeft: '2px solid ' + t.accent }} />
            <div style={{ position: 'absolute', bottom: 20, right: 20, width: 20, height: 20, borderBottom: '2px solid ' + t.accent, borderRight: '2px solid ' + t.accent }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 50 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: t.accent, boxShadow: `0 0 10px ${t.accent}` }} />
                    <span style={{ fontWeight: 700, letterSpacing: '0.1em', fontSize: 14 }}>DEVPROOF N-9</span>
                </div>
                <div style={{ color: t.dim, fontSize: 12 }}>SYSTEM_UPTIME: 99.98%</div>
            </div>

            <div style={{ display: 'flex', gap: 40 }}>
                <div style={{ flex: 1 }}>
                    <h1 style={{ fontSize: 48, fontWeight: 800, lineHeight: 1.1, marginBottom: 24, color: '#fff' }}>
                        Engineering Depth <br/> <span style={{ color: t.accent }}>Quantified.</span>
                    </h1>
                    <p style={{ color: t.dim, fontSize: 16, lineHeight: 1.6, maxWidth: 400, marginBottom: 32 }}>
                        A synthetic intelligence layer analyzing authorship, impact, and structural integrity across the neural mesh.
                    </p>
                    <div style={{ display: 'flex', gap: 16 }}>
                        <button style={{ background: t.accent, color: '#000', padding: '12px 24px', borderRadius: 8, fontWeight: 600, border: 'none', cursor: 'pointer', boxShadow: `0 0 20px ${t.accent}44`, fontFamily: t.font }}>Analyze Repo</button>
                        <button style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', padding: '12px 24px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontFamily: t.font }}>Documentation</button>
                    </div>
                </div>
                
                <div style={{ width: 240, height: 240, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="hud-ring" style={{ position: 'absolute', inset: 0, border: `2px dashed ${t.accent}33`, borderRadius: '50%' }} />
                    <div className="hud-ring-rev" style={{ position: 'absolute', inset: 20, border: `1px solid ${t.accent}66`, borderRadius: '50%' }} />
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 12, color: t.accent, letterSpacing: '0.2em' }}>SCORE</div>
                        <div style={{ fontSize: 56, fontWeight: 800 }}>73</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function BlueprintV() {
    const t = GEMINI_THEMES.blueprint;
    return (
        <div style={{ 
            background: t.bg, 
            color: t.text, 
            fontFamily: t.font, 
            padding: 40, 
            border: '1px solid rgba(148, 163, 184, 0.1)',
            backgroundImage: `linear-gradient(${t.dim}22 1px, transparent 1px), linear-gradient(90deg, ${t.dim}22 1px, transparent 1px)`,
            backgroundSize: '30px 30px',
            position: 'relative'
        }}>
            <div style={{ borderLeft: `4px solid ${t.accent}`, paddingLeft: 24, marginBottom: 60 }}>
                <div style={{ fontSize: 12, color: t.accent, fontWeight: 'bold', marginBottom: 8, letterSpacing: '0.1em' }}>TECHNICAL SPECIFICATION // v4.0.2</div>
                <h1 style={{ fontSize: 32, color: '#F8FAFC', fontWeight: 'normal', margin: 0 }}>METRIC_ORCHESTRATOR</h1>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, background: 'rgba(148, 163, 184, 0.1)', border: '1px solid rgba(148, 163, 184, 0.1)' }}>
                {[
                    { label: 'CALC_ENGINE', value: 'DISTRIBUTED' },
                    { label: 'DATA_SOURCE', value: 'GITHUB_V4' },
                    { label: 'SYNC_RATE', value: 'REAL_TIME' },
                    { label: 'AUTH_SCOPES', value: 'REPOS, GISTS' },
                    { label: 'SCORING_V', value: 'GEMINI_3.0_P' },
                    { label: 'REGION', value: 'GCP_US_WEST' },
                ].map((item, i) => (
                    <div key={i} style={{ background: t.bg, padding: 20 }}>
                        <div style={{ fontSize: 10, color: t.dim, marginBottom: 4 }}>{item.label}</div>
                        <div style={{ fontSize: 14, color: '#CBD5E1' }}>{item.value}</div>
                    </div>
                ))}
            </div>

            <div style={{ marginTop: 60, display: 'flex', alignItems: 'flex-start', gap: 40 }}>
                <div style={{ flex: 1 }}>
                    <div style={{ marginBottom: 30 }}>
                        <div style={{ fontSize: 11, color: t.dim, marginBottom: 8 }}>// ARCHITECTURE_SUMMARY</div>
                        <p style={{ fontSize: 14, lineHeight: 1.7, margin: 0 }}>
                            A multi-threaded analysis pipeline that extracts structural claims from raw source code. 
                            Utilizes vector embeddings to compare contribution patterns against historical benchmarks.
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: 20 }}>
                        <div style={{ flex: 1, borderTop: `1px solid ${t.accent}`, paddingTop: 10 }}>
                            <div style={{ fontSize: 10, color: t.accent }}>LATENCY</div>
                            <div style={{ fontSize: 18 }}>124ms</div>
                        </div>
                        <div style={{ flex: 1, borderTop: `1px solid ${t.dim}`, paddingTop: 10 }}>
                            <div style={{ fontSize: 10, color: t.dim }}>LOAD</div>
                            <div style={{ fontSize: 18 }}>12.4%</div>
                        </div>
                    </div>
                </div>
                <div style={{ width: 150, padding: 20, border: `1px solid ${t.accent}`, textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: t.accent }}>FINAL_SCORE</div>
                    <div style={{ fontSize: 32, color: '#F8FAFC' }}>0.73</div>
                </div>
            </div>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

// ─── Code-editor variant ──────────────────────────────────────────────────────

// Syntax-highlighted code line. Children are tokenized inline.
function CodeLine({ n, children }: { n: number; children: React.ReactNode }) {
    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: '40px 1fr',
                gap: 0,
                fontFamily: SPEC.fontMono,
                fontSize: 13,
                lineHeight: 1.85,
            }}
        >
            <div
                style={{
                    color: SPEC.text3,
                    textAlign: 'right',
                    paddingRight: 16,
                    fontVariantNumeric: 'tabular-nums',
                    userSelect: 'none',
                    opacity: 0.6,
                }}
            >
                {n}
            </div>
            <div style={{ color: SPEC.text2 }}>{children}</div>
        </div>
    );
}

// Tokens for syntax coloring. Same palette is used regardless of accent
// — the side score panel + tab indicator are where the accent shows.
const TOK = {
    kw: '#CC785C',          // keywords (struct, pub, fn, let, impl) — coral by default
    type: '#7DD3FC',        // f64, String, Vec, &str — sky blue
    str: '#A3E635',         // string literals — lime
    num: '#FBBF24',         // numbers — amber
    comment: SPEC.text3,    // comments
    ident: SPEC.text1,      // identifiers
    punct: SPEC.text2,      // punctuation
};

function K({ children }: { children: React.ReactNode }) {
    return <span style={{ color: TOK.kw }}>{children}</span>;
}
function T({ children }: { children: React.ReactNode }) {
    return <span style={{ color: TOK.type }}>{children}</span>;
}
function N({ children }: { children: React.ReactNode }) {
    return <span style={{ color: TOK.num, fontVariantNumeric: 'tabular-nums' }}>{children}</span>;
}
function S({ children }: { children: React.ReactNode }) {
    return <span style={{ color: TOK.str }}>{children}</span>;
}
function I({ children }: { children: React.ReactNode }) {
    return <span style={{ color: TOK.ident }}>{children}</span>;
}
function C({ children }: { children: React.ReactNode }) {
    return <span style={{ color: TOK.comment, fontStyle: 'italic' }}>{children}</span>;
}

function EditorTab({
    name, active, accent,
}: { name: string; active: boolean; accent: string | null }) {
    const indicator = accent ?? SPEC.text1;
    return (
        <div
            style={{
                fontFamily: SPEC.fontMono,
                fontSize: 12,
                padding: '10px 18px',
                color: active ? SPEC.text1 : SPEC.text3,
                borderTop: active ? `2px solid ${indicator}` : '2px solid transparent',
                background: active ? SPEC.bg : 'transparent',
                cursor: 'pointer',
                letterSpacing: '0.02em',
            }}
        >
            {name}
        </div>
    );
}

function CodeEditorVariant({ accent }: { accent: string | null }) {
    return (
        <section>
            {/* Section header */}
            <div style={{ marginBottom: 28 }}>
                <CommentHeader label="VARIANT_04" version="CODE_EDITOR" accent={accent} />
                <div style={{ height: 12 }} />
                <AccentedTitle accent={accent} mono>METRIC_ORCHESTRATOR</AccentedTitle>
                <div style={{ height: 12 }} />
                <div
                    style={{
                        fontFamily: SPEC.fontMono,
                        fontSize: 11,
                        color: SPEC.text2,
                        lineHeight: 1.6,
                    }}
                >
                    <span style={{ color: SPEC.text3 }}>// </span>
                    Renders the audit output as the data structure it actually is. Reads like
                    code because it is code — score, claims, and caps live in one declarative
                    spec.
                </div>
            </div>

            {/* Editor frame */}
            <div style={{ border: `1px solid ${SPEC.border}`, background: SPEC.bg }}>
                {/* Tab bar */}
                <div
                    style={{
                        display: 'flex',
                        borderBottom: `1px solid ${SPEC.border}`,
                        background: '#080808',
                    }}
                >
                    <EditorTab name="person_score.rs" active={true} accent={accent} />
                    <EditorTab name="audit_result.rs" active={false} accent={accent} />
                    <EditorTab name="caps.rs" active={false} accent={accent} />
                    <div style={{ flex: 1 }} />
                    <div
                        style={{
                            fontFamily: SPEC.fontMono,
                            fontSize: 10,
                            color: SPEC.text3,
                            padding: '14px 18px',
                            letterSpacing: '0.08em',
                        }}
                    >
                        BRANCH · main
                    </div>
                </div>

                {/* Body: code + side panel */}
                <div style={{ display: 'flex', minHeight: 280 }}>
                    {/* Code area */}
                    <div style={{ flex: 1, padding: '20px 0' }}>
                        <CodeLine n={1}>
                            <K>struct</K> <I>ScoreAggregate</I> <span style={{ color: TOK.punct }}>{'{'}</span>
                        </CodeLine>
                        <CodeLine n={2}>
                            {'    '}<I>depth_vector</I><span style={{ color: TOK.punct }}>:</span> <T>f64</T><span style={{ color: TOK.punct }}>,</span>{'  '}
                            <C>// 0.73 weighted aggregate</C>
                        </CodeLine>
                        <CodeLine n={3}>
                            {'    '}<I>reach_index</I><span style={{ color: TOK.punct }}>:</span> <T>f64</T><span style={{ color: TOK.punct }}>,</span>{'   '}
                            <C>// 0.32 log-normalized</C>
                        </CodeLine>
                        <CodeLine n={4}>
                            {'    '}<I>cohort</I><span style={{ color: TOK.punct }}>:</span> <T>CohortKey</T><span style={{ color: TOK.punct }}>,</span>{'    '}
                            <C>// python|3-7y</C>
                        </CodeLine>
                        <CodeLine n={5}>
                            {'    '}<I>claims</I><span style={{ color: TOK.punct }}>:</span> <T>Vec</T><span style={{ color: TOK.punct }}>{'<'}</span><T>Claim</T><span style={{ color: TOK.punct }}>{'>'}</span><span style={{ color: TOK.punct }}>,</span>{'  '}
                            <C>// {'['} 6 detected {']'}</C>
                        </CodeLine>
                        <CodeLine n={6}>
                            {'    '}<I>formula</I><span style={{ color: TOK.punct }}>:</span> <span style={{ color: TOK.punct }}>&</span><K>str</K><span style={{ color: TOK.punct }}>,</span>{'      '}
                            <S>"person_score.v1.0"</S><span style={{ color: TOK.punct }}>,</span>
                        </CodeLine>
                        <CodeLine n={7}>
                            {'    '}<I>status</I><span style={{ color: TOK.punct }}>:</span> <T>AuditStatus</T><span style={{ color: TOK.punct }}>::</span><I>Active</I><span style={{ color: TOK.punct }}>,</span>
                        </CodeLine>
                        <CodeLine n={8}>
                            <span style={{ color: TOK.punct }}>{'}'}</span>
                        </CodeLine>
                    </div>

                    {/* Side score panel */}
                    <div
                        style={{
                            width: 200,
                            padding: '20px 22px',
                            borderLeft: `1px solid ${SPEC.border}`,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 28,
                        }}
                    >
                        <div>
                            <div
                                style={{
                                    fontFamily: SPEC.fontMono,
                                    fontSize: 10,
                                    color: SPEC.text3,
                                    letterSpacing: '0.12em',
                                    marginBottom: 8,
                                    textTransform: 'uppercase',
                                }}
                            >
                                Depth_Vector
                            </div>
                            <div
                                style={{
                                    fontFamily: SPEC.fontMono,
                                    fontSize: 32,
                                    color: accent ?? SPEC.text1,
                                    fontVariantNumeric: 'tabular-nums',
                                    letterSpacing: '-0.02em',
                                }}
                            >
                                0.73
                            </div>
                        </div>
                        <div>
                            <div
                                style={{
                                    fontFamily: SPEC.fontMono,
                                    fontSize: 10,
                                    color: SPEC.text3,
                                    letterSpacing: '0.12em',
                                    marginBottom: 8,
                                    textTransform: 'uppercase',
                                }}
                            >
                                Reach_Index
                            </div>
                            <div
                                style={{
                                    fontFamily: SPEC.fontMono,
                                    fontSize: 32,
                                    color: SPEC.text1,
                                    fontVariantNumeric: 'tabular-nums',
                                    letterSpacing: '-0.02em',
                                }}
                            >
                                0.32
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom log strip */}
                <div
                    style={{
                        borderTop: `1px dashed ${SPEC.border}`,
                        padding: '14px 22px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 18,
                        background: '#080808',
                    }}
                >
                    <button
                        style={{
                            fontFamily: SPEC.fontMono,
                            fontSize: 11,
                            fontWeight: 500,
                            padding: '6px 14px',
                            background: accent ?? SPEC.text1,
                            color: accent ? '#fff' : SPEC.bg,
                            border: 'none',
                            borderRadius: 2,
                            cursor: 'pointer',
                            letterSpacing: '0.06em',
                            textTransform: 'uppercase',
                        }}
                    >
                        Run_Audit
                    </button>
                    <span
                        style={{
                            fontFamily: SPEC.fontMono,
                            fontSize: 11,
                            color: SPEC.text3,
                            letterSpacing: '0.04em',
                        }}
                    >
                        // execution_log
                    </span>
                    <span
                        style={{
                            fontFamily: SPEC.fontMono,
                            fontSize: 11,
                            color: SPEC.text2,
                            marginLeft: 'auto',
                        }}
                    >
                        {'>'} Waiting for input
                        <span style={{ animation: 'blink 1s steps(1) infinite', marginLeft: 2 }}>_</span>
                    </span>
                </div>
            </div>

            <style>{`@keyframes blink { 50% { opacity: 0; } }`}</style>
        </section>
    );
}

// ─── Schematic-frame variant ──────────────────────────────────────────────────

/**
 * Card with bracket corners instead of a continuous border. Inspired by
 * the schematic/PCB-layout reference, but built differently:
 *
 * - 4 L-bracket corners drawn as ::before/::after-style absolute boxes
 * - Each corner has a small mono identifier label inline with the bracket
 *   (top-left = index, top-right = type code, bottom-left = status,
 *    bottom-right = build number)
 * - No continuous border — gaps between brackets imply the frame
 * - Single mid-card horizontal hairline divides header from body
 */
function SchematicCard({
    index, typeCode, status, build, repo, headline, score, accent, isPrimary,
}: {
    index: string;
    typeCode: string;
    status: string;
    build: string;
    repo: string;
    headline: string;
    score: number;
    accent: string | null;
    isPrimary?: boolean;
}) {
    const accentColor = accent ?? SPEC.text1;
    // Corner brackets are ALWAYS subtle — never accent-colored, never prominent.
    // The accent shows up on score and status only. Corners are the implied frame.
    const cornerColor = 'rgba(255,255,255,0.18)';
    const cornerSize = 10;
    const corner: React.CSSProperties = {
        position: 'absolute',
        width: cornerSize,
        height: cornerSize,
        pointerEvents: 'none',
    };
    return (
        <div
            style={{
                position: 'relative',
                padding: '36px 28px',
                minHeight: 220,
                background: SPEC.bg,
                fontFamily: SPEC.fontMono,
            }}
        >
            {/* Top-left bracket */}
            <div
                style={{
                    ...corner,
                    top: 0,
                    left: 0,
                    borderTop: `1px solid ${cornerColor}`,
                    borderLeft: `1px solid ${cornerColor}`,
                }}
            />
            {/* Top-right bracket */}
            <div
                style={{
                    ...corner,
                    top: 0,
                    right: 0,
                    borderTop: `1px solid ${cornerColor}`,
                    borderRight: `1px solid ${cornerColor}`,
                }}
            />
            {/* Bottom-left bracket */}
            <div
                style={{
                    ...corner,
                    bottom: 0,
                    left: 0,
                    borderBottom: `1px solid ${cornerColor}`,
                    borderLeft: `1px solid ${cornerColor}`,
                }}
            />
            {/* Bottom-right bracket */}
            <div
                style={{
                    ...corner,
                    bottom: 0,
                    right: 0,
                    borderBottom: `1px solid ${cornerColor}`,
                    borderRight: `1px solid ${cornerColor}`,
                }}
            />

            {/* Top label row — sits in the corner gaps */}
            <div
                style={{
                    position: 'absolute',
                    top: 8,
                    left: 32,
                    right: 32,
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 10,
                    color: SPEC.text3,
                    letterSpacing: '0.12em',
                }}
            >
                <span>{index}</span>
                <span>{typeCode}</span>
            </div>

            {/* Bottom label row */}
            <div
                style={{
                    position: 'absolute',
                    bottom: 8,
                    left: 32,
                    right: 32,
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 10,
                    color: SPEC.text3,
                    letterSpacing: '0.12em',
                }}
            >
                <span style={{ color: status === 'OK' ? accentColor : SPEC.text3 }}>● {status}</span>
                <span>{build}</span>
            </div>

            {/* Card body */}
            <div style={{ paddingTop: 8 }}>
                <div
                    style={{
                        fontSize: 10,
                        color: SPEC.text3,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        marginBottom: 6,
                    }}
                >
                    {repo}
                </div>
                <div
                    style={{
                        fontSize: 18,
                        color: SPEC.text1,
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        fontWeight: 500,
                        marginBottom: 18,
                    }}
                >
                    {headline}
                </div>

                {/* Hairline divider — only one, mid-card */}
                <div
                    style={{
                        height: 1,
                        background: SPEC.border,
                        margin: '14px 0',
                    }}
                />

                {/* Score readout */}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span
                        style={{
                            fontSize: 11,
                            color: SPEC.text3,
                            letterSpacing: '0.12em',
                            textTransform: 'uppercase',
                        }}
                    >
                        score
                    </span>
                    <span
                        style={{
                            fontSize: 32,
                            color: isPrimary ? accentColor : SPEC.text1,
                            fontVariantNumeric: 'tabular-nums',
                            letterSpacing: '-0.03em',
                            fontWeight: 400,
                        }}
                    >
                        {score}
                    </span>
                    <span style={{ fontSize: 12, color: SPEC.text3 }}>/100</span>
                </div>
            </div>
        </div>
    );
}

function SchematicVariant({ accent }: { accent: string | null }) {
    return (
        <section>
            {/* Header */}
            <div style={{ marginBottom: 32 }}>
                <CommentHeader label="VARIANT_05" version="SCHEMATIC_FRAME" accent={accent} />
                <div style={{ height: 12 }} />
                <AccentedTitle accent={accent} mono>REPO_INDEX</AccentedTitle>
                <div style={{ height: 12 }} />
                <div
                    style={{
                        fontFamily: SPEC.fontMono,
                        fontSize: 11,
                        color: SPEC.text2,
                        lineHeight: 1.6,
                    }}
                >
                    <span style={{ color: SPEC.text3 }}>// </span>
                    No continuous borders — bracket corners + corner-gap labels imply the frame.
                    Reads as schematic drawing rather than UI card. Each repo gets a discrete unit.
                </div>
            </div>

            {/* Card grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                <SchematicCard
                    index="01"
                    typeCode="TYPE · TS"
                    status="OK"
                    build="BUILD · 2026.05"
                    repo="dhruv0206/dev-proof-portfolio"
                    headline="MAIN_PORTFOLIO"
                    score={82}
                    accent={accent}
                    isPrimary
                />
                <SchematicCard
                    index="02"
                    typeCode="TYPE · PY"
                    status="OK"
                    build="BUILD · 2026.04"
                    repo="Nenyax-AI/Nenyax"
                    headline="VOICE_AGENT"
                    score={73}
                    accent={accent}
                />
                <SchematicCard
                    index="03"
                    typeCode="TYPE · TS"
                    status="PEND"
                    build="BUILD · 2026.04"
                    repo="dhruv0206/Clawckathon"
                    headline="HACK_DEMO"
                    score={68}
                    accent={accent}
                />
            </div>
        </section>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PalettePage() {
    const [picked, setPicked] = useState<string | null>(null);

    return (
        <div
            style={{
                minHeight: '100vh',
                background: '#000',
                color: '#fff',
                padding: 32,
                fontFamily: SPEC.fontSans,
            }}
        >
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes scanline {
                    0% { transform: translateY(-100%); }
                    100% { transform: translateY(100%); }
                }
                .scanline {
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(to bottom, transparent, rgba(0, 255, 65, 0.05), transparent);
                    height: 20%;
                    width: 100%;
                    animation: scanline 8s linear infinite;
                    pointer-events: none;
                    z-index: 10;
                }
                @keyframes rotate {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes rotate-rev {
                    from { transform: rotate(360deg); }
                    to { transform: rotate(0deg); }
                }
                .hud-ring { animation: rotate 20s linear infinite; }
                .hud-ring-rev { animation: rotate-rev 10s linear infinite; }
                button:hover { filter: brightness(1.1); transition: 0.2s; }
            `}} />

            <div style={{ maxWidth: 1700, margin: '0 auto' }}>
                <div style={{ textAlign: 'center', padding: '40px 0', borderBottom: `1px solid ${SPEC.border}`, marginBottom: 60 }}>
                    <h1 style={{ fontSize: 12, fontFamily: SPEC.fontMono, color: '#444', letterSpacing: '0.8em', margin: 0 }}>CLAUDE'S DIRECTION (CURRENT)</h1>
                </div>

                <header style={{ marginBottom: 32, maxWidth: 720 }}>
                    <div
                        style={{
                            fontFamily: SPEC.fontMono,
                            fontSize: 10,
                            letterSpacing: '0.12em',
                            color: SPEC.text3,
                            textTransform: 'uppercase',
                            marginBottom: 14,
                            display: 'flex',
                            gap: 8,
                        }}
                    >
                        <span style={{ color: SPEC.text2 }}>SPEC</span>
                        <span style={{ color: SPEC.text3, opacity: 0.6 }}>·</span>
                        <span>V1.0.0</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'stretch', gap: 14, marginBottom: 14 }}>
                        <div style={{ width: 2, background: '#EDEDED' }} />
                        <h1
                            style={{
                                fontSize: 26,
                                fontWeight: 500,
                                letterSpacing: '0.02em',
                                fontFamily: SPEC.fontMono,
                                textTransform: 'uppercase',
                                paddingTop: 2,
                            }}
                        >
                            DESIGN_DIRECTION_REVIEW
                        </h1>
                    </div>
                    <p
                        style={{
                            fontSize: 13,
                            color: SPEC.text2,
                            lineHeight: 1.65,
                        }}
                    >
                        Same components, same hairlines, same type. Only the accent changes.
                    </p>
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 120 }}>
                    {DIRECTIONS.map((d) => (
                        <DirectionColumn
                            key={d.id}
                            d={d}
                            isPicked={picked === d.id}
                            onPick={() => setPicked(picked === d.id ? null : d.id)}
                        />
                    ))}
                </div>

                {/* Code-editor variant — mix of the 3 above + IDE aesthetic */}
                <div style={{ height: 80 }} />
                <Hairline />
                <div style={{ height: 64 }} />
                <CodeEditorVariant accent="#CC785C" />
                <div style={{ height: 24 }} />
                <CodeEditorVariant accent="#5E6AD2" />
                <div style={{ height: 24 }} />
                <CodeEditorVariant accent={null} />

                {/* Schematic-frame variant — bracket corners, no continuous borders */}
                <div style={{ height: 80 }} />
                <Hairline />
                <div style={{ height: 64 }} />
                <SchematicVariant accent="#CC785C" />
                <div style={{ height: 32 }} />
                <SchematicVariant accent="#5E6AD2" />
                <div style={{ height: 32 }} />
                <SchematicVariant accent={null} />

                <div style={{ height: 128 }} />
                <Hairline />
                <div
                    style={{
                        marginTop: 24,
                        fontFamily: SPEC.fontMono,
                        fontSize: 11,
                        color: SPEC.text3,
                        display: 'flex',
                        gap: 18,
                        letterSpacing: '0.04em',
                    }}
                >
                    <span>person_score.v1.0</span>
                    <span>schema.v4.0</span>
                    <span style={{ marginLeft: 'auto' }}>⌘ k</span>
                </div>
            </div>
        </div>
    );
}
