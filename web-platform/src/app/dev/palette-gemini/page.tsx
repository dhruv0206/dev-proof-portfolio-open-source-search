'use client';

/**
 * /dev/palette-gemini
 *
 * Dedicated page for Gemini's "Minimal Techy" design proposals.
 * Restored to the exact state you requested, with the new explorations appended at the bottom.
 */

const SPEC = {
    bg: '#000000',
    text1: '#FAFAFA',
    text2: '#A1A1A1',
    text3: '#555555',
    border: 'rgba(255,255,255,0.06)',
    fontSans: 'system-ui, -apple-system, "Inter", sans-serif',
    fontMono: 'ui-monospace, "Geist Mono", "Berkeley Mono", Menlo, monospace',
};

function GeminiSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section style={{ marginBottom: 120 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 40 }}>
                <h2 style={{ fontSize: 11, fontFamily: SPEC.fontMono, color: '#888', letterSpacing: '0.2em', textTransform: 'uppercase', margin: 0 }}>
                    {title}
                </h2>
                <div style={{ height: 1, flex: 1, background: 'linear-gradient(90deg, rgba(255,255,255,0.1), transparent)' }} />
            </div>
            {children}
        </section>
    );
}

// ─── Variant A: Brutalist Editor (Raw IDE) ─────────────────────────────────
function BrutalistEditor() {
    return (
        <div style={{ 
            background: '#1A1A1A', 
            color: '#E5E5E5', 
            fontFamily: SPEC.fontMono, 
            border: '2px solid #404040',
            boxShadow: '8px 8px 0px rgba(255,255,255,0.05)',
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* Editor Tab Bar */}
            <div style={{ display: 'flex', borderBottom: '2px solid #404040', background: '#262626' }}>
                <div style={{ padding: '8px 16px', borderRight: '2px solid #404040', fontSize: 12, background: '#1A1A1A', color: '#fff', borderTop: '2px solid #38BDF8' }}>
                    metric_orchestrator.rs
                </div>
                <div style={{ padding: '8px 16px', borderRight: '2px solid #404040', fontSize: 12, color: '#A1A1A1' }}>
                    config.toml
                </div>
            </div>
            
            <div style={{ display: 'flex', flex: 1 }}>
                {/* Line Numbers */}
                <div style={{ width: 40, borderRight: '2px solid #404040', padding: '16px 0', textAlign: 'center', color: '#555555', fontSize: 12, background: '#111' }}>
                    1<br/>2<br/>3<br/>4<br/>5<br/>6
                </div>
                
                {/* Editor Content */}
                <div style={{ padding: 16, flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                        <div>
                            <div style={{ fontSize: 14, color: '#F97316', marginBottom: 8 }}>struct ScoreAggregate {'{'}</div>
                            <div style={{ paddingLeft: 20, fontSize: 14, color: '#A1A1A1', lineHeight: 1.6 }}>
                                depth_vector: <span style={{ color: '#38BDF8' }}>f64</span>,<br/>
                                reach_index: <span style={{ color: '#38BDF8' }}>f64</span>,<br/>
                                status: <span style={{ color: '#00FF41' }}>SystemStatus::Active</span>,
                            </div>
                            <div style={{ fontSize: 14, color: '#F97316', marginTop: 8 }}>{'}'}</div>
                        </div>
                        <div style={{ border: '2px solid #404040', padding: 16, background: '#111', textAlign: 'center', minWidth: 120 }}>
                            <div style={{ fontSize: 10, color: '#A1A1A1', marginBottom: 4 }}>CURRENT_SCORE</div>
                            <div style={{ fontSize: 32, color: '#fff' }}>0.73</div>
                        </div>
                    </div>
                    
                    <div style={{ borderTop: '2px dashed #404040', paddingTop: 16 }}>
                        <div style={{ fontSize: 10, color: '#555', marginBottom: 8 }}>// execution_log</div>
                        <div style={{ display: 'flex', gap: 16 }}>
                            <button style={{ background: '#E5E5E5', color: '#000', border: 'none', padding: '6px 12px', fontSize: 12, fontWeight: 'bold', cursor: 'pointer', fontFamily: SPEC.fontMono }}>RUN_AUDIT</button>
                            <span style={{ fontSize: 12, color: '#A1A1A1', alignSelf: 'center' }}>&gt; Waiting for input...</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Variant B: Structured Console (Hybrid IDE/Draft) ────────────────────────
// Middle ground between Variant A's heavy IDE and Variant C's minimal draft.
// 1px borders, clear panel separation, data-dense but structured.
function StructuredConsole() {
    const border = '1px solid #333';
    return (
        <div style={{ 
            background: '#050505', 
            color: '#E5E5E5', 
            fontFamily: SPEC.fontMono, 
            border: border,
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* Top Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: border, padding: '12px 20px', background: '#0A0A0A' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 8, height: 8, background: '#F97316' }} />
                    <span style={{ fontSize: 12, letterSpacing: '0.05em', color: '#FAFAFA' }}>metric_orchestrator</span>
                </div>
                <div style={{ fontSize: 10, color: '#666' }}>v4.0.2-stable</div>
            </div>

            <div style={{ display: 'flex' }}>
                {/* Side Panel (Metrics) */}
                <div style={{ width: 240, borderRight: border, padding: 20, background: '#0A0A0A' }}>
                    <div style={{ fontSize: 10, color: '#666', marginBottom: 16 }}>// AGGREGATE_OUTPUT</div>
                    <div style={{ fontSize: 48, color: '#FAFAFA', lineHeight: 1, marginBottom: 8 }}>0.73</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#00FF41', marginBottom: 32 }}>
                        <span style={{ display: 'inline-block', width: 4, height: 4, borderRadius: '50%', background: '#00FF41' }} />
                        SYSTEM_NOMINAL
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div>
                            <div style={{ fontSize: 9, color: '#666', marginBottom: 4 }}>ENGINE</div>
                            <div style={{ fontSize: 12, color: '#D4D4D8' }}>DISTRIBUTED</div>
                        </div>
                        <div>
                            <div style={{ fontSize: 9, color: '#666', marginBottom: 4 }}>SOURCE</div>
                            <div style={{ fontSize: 12, color: '#D4D4D8' }}>GQL_V4</div>
                        </div>
                    </div>
                </div>

                {/* Main Content (Log/Summary) */}
                <div style={{ flex: 1, padding: 30 }}>
                    <div style={{ fontSize: 10, color: '#666', marginBottom: 12 }}>[ PROCESS_SUMMARY ]</div>
                    <p style={{ fontSize: 13, lineHeight: 1.6, color: '#A1A1A1', margin: '0 0 32px 0', fontFamily: SPEC.fontSans, maxWidth: 500 }}>
                        Multi-threaded analysis pipeline extracting structural claims from raw source code. 
                        Utilizes vector embeddings to isolate authorship signals from broad network reach.
                    </p>

                    <div style={{ border: border }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 80px', padding: '8px 16px', borderBottom: border, fontSize: 10, color: '#666', background: '#0A0A0A' }}>
                            <div>MODULE</div>
                            <div>STATUS_MESSAGE</div>
                            <div style={{ textAlign: 'right' }}>LATENCY</div>
                        </div>
                        {[
                            { m: 'AST_PARSE', msg: 'Extracted 4,921 claims', l: '84ms', err: false },
                            { m: 'VEC_EMBED', msg: 'Index stable. No drift detected.', l: '142ms', err: false },
                            { m: 'REACH_ISO', msg: 'Pollution detected in downstream graph.', l: '12ms', err: true },
                        ].map((row, i) => (
                            <div key={i} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 80px', padding: '12px 16px', fontSize: 12, borderBottom: i === 2 ? 'none' : border }}>
                                <div style={{ color: '#D4D4D8' }}>{row.m}</div>
                                <div style={{ color: row.err ? '#F97316' : '#A1A1A1' }}>{row.msg}</div>
                                <div style={{ textAlign: 'right', color: '#666' }}>{row.l}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Variant C: Technical Draft (Minimalist Blueprint) ─────────────────────
// The exact minimal Variant C that you liked. (Grid background removed)
function TechnicalDraft() {
    return (
        <div style={{ 
            background: '#0A0A0A', 
            color: SPEC.text1, 
            fontFamily: SPEC.fontMono, 
            padding: 40, 
            border: `1px solid ${SPEC.border}`,
        }}>
            <div style={{ borderLeft: `2px solid #F97316`, paddingLeft: 16, marginBottom: 40 }}>
                <div style={{ fontSize: 10, color: '#F97316', marginBottom: 4, letterSpacing: '0.1em' }}>SPEC // 4.0.2</div>
                <h1 style={{ fontSize: 20, color: '#FAFAFA', fontWeight: 'normal', margin: 0, letterSpacing: '-0.02em' }}>METRIC_ORCHESTRATOR</h1>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', background: SPEC.border, border: `1px solid ${SPEC.border}` }}>
                {[
                    { label: 'ENGINE', value: 'DISTRIBUTED' },
                    { label: 'SOURCE', value: 'GQL_V4' },
                    { label: 'SYNC', value: 'REAL_TIME' },
                    { label: 'SCORE_V', value: 'GEMINI_3' },
                ].map((item, i) => (
                    <div key={i} style={{ background: '#0A0A0A', padding: '16px 20px' }}>
                        <div style={{ fontSize: 9, color: SPEC.text3, marginBottom: 6 }}>{item.label}</div>
                        <div style={{ fontSize: 12, color: '#D4D4D8' }}>{item.value}</div>
                    </div>
                ))}
            </div>

            <div style={{ marginTop: 40, display: 'flex', gap: 40 }}>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, color: SPEC.text3, marginBottom: 8 }}>// ARCHITECTURE_SUMMARY</div>
                    <p style={{ fontSize: 12, lineHeight: 1.6, color: SPEC.text2, margin: 0, fontFamily: SPEC.fontSans }}>
                        Multi-threaded analysis pipeline extracting structural claims from raw source code. 
                        Utilizes vector embeddings to compare contribution patterns.
                    </p>
                </div>
                <div style={{ width: 120, padding: 16, border: `1px solid ${SPEC.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ fontSize: 9, color: SPEC.text3, marginBottom: 4 }}>FINAL_SCORE</div>
                    <div style={{ fontSize: 24, color: '#FAFAFA' }}>0.73</div>
                </div>
            </div>
        </div>
    );
}

// ─── Variant D: Blueprint V (Original Maximalist Schematic) ───────────────
// The very first Variant C from the first iteration, just in case this is the one you meant!
function BlueprintV() {
    const t = {
        bg: '#0F172A',
        text: '#94A3B8',
        dim: '#475569',
        accent: '#F97316',
        border: '1px dashed rgba(148, 163, 184, 0.3)',
        font: '"Geist Mono", monospace',
    };
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

// ─── Variant E: Deep CAD Blueprint (Cyan on Navy) ───────────────────────────────
function DeepCadBlueprint() {
    const bg = '#020617'; 
    const gridColor = 'rgba(56, 189, 248, 0.05)';
    const accent = '#38BDF8';
    const border = `1px solid rgba(56, 189, 248, 0.2)`;
    
    return (
        <div style={{ 
            background: bg, 
            color: '#F8FAFC', 
            fontFamily: SPEC.fontMono, 
            padding: 40, 
            border: border,
            backgroundImage: `
                linear-gradient(${gridColor} 1px, transparent 1px),
                linear-gradient(90deg, ${gridColor} 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px',
            backgroundPosition: '-1px -1px'
        }}>
            <div style={{ borderLeft: `3px solid ${accent}`, paddingLeft: 16, marginBottom: 40 }}>
                <div style={{ fontSize: 10, color: accent, marginBottom: 4, letterSpacing: '0.1em' }}>SYSTEM // DIAGRAM_V2</div>
                <h1 style={{ fontSize: 20, color: '#F8FAFC', fontWeight: 'normal', margin: 0, letterSpacing: '0.05em' }}>METRIC_ORCHESTRATOR</h1>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderTop: border, borderLeft: border }}>
                {[
                    { label: 'ENGINE', value: 'DISTRIBUTED' },
                    { label: 'SOURCE', value: 'GQL_V4' },
                    { label: 'SYNC', value: 'REAL_TIME' },
                    { label: 'SCORE_V', value: 'GEMINI_3' },
                ].map((item, i) => (
                    <div key={i} style={{ padding: '12px 16px', borderRight: border, borderBottom: border, background: 'rgba(2, 6, 23, 0.8)' }}>
                        <div style={{ fontSize: 9, color: '#94A3B8', marginBottom: 4 }}>{item.label}</div>
                        <div style={{ fontSize: 12, color: accent }}>{item.value}</div>
                    </div>
                ))}
            </div>

            <div style={{ marginTop: 40, display: 'flex', gap: 40, background: 'rgba(2, 6, 23, 0.8)', padding: 20, border: border }}>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, color: '#94A3B8', marginBottom: 8 }}>// ARCHITECTURE_SUMMARY</div>
                    <p style={{ fontSize: 12, lineHeight: 1.6, color: '#CBD5E1', margin: 0, fontFamily: SPEC.fontSans }}>
                        Multi-threaded analysis pipeline extracting structural claims from raw source code. 
                        Utilizes vector embeddings to compare contribution patterns.
                    </p>
                </div>
                <div style={{ width: 120, paddingLeft: 20, borderLeft: border, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ fontSize: 9, color: accent, marginBottom: 4 }}>FINAL_SCORE</div>
                    <div style={{ fontSize: 32, color: '#F8FAFC' }}>0.73</div>
                </div>
            </div>
        </div>
    );
}

// ─── Variant F: Amber Telemetry (Dense Ledger) ─────────────────────────────────
function AmberTelemetry() {
    const bg = '#0A0A0A';
    const accent = '#F59E0B'; 
    const border = '1px solid rgba(255,255,255,0.1)';
    const textMuted = '#737373';

    return (
        <div style={{ 
            background: bg, 
            color: '#E5E5E5', 
            fontFamily: SPEC.fontMono, 
            padding: '40px 0', 
            borderTop: `2px solid ${accent}`,
            borderBottom: `1px solid ${accent}`
        }}>
            <div style={{ padding: '0 40px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 style={{ fontSize: 18, color: accent, fontWeight: 'normal', margin: 0, letterSpacing: '0.05em' }}>METRIC_ORCHESTRATOR</h1>
                    <div style={{ fontSize: 10, color: textMuted, marginTop: 4 }}>PRC_ID: 9482 // STATUS: NOMINAL</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 10, color: textMuted }}>SYS_SCORE</div>
                    <div style={{ fontSize: 24, color: '#fff' }}>0.73</div>
                </div>
            </div>

            <div style={{ borderTop: border, borderBottom: border }}>
                <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr 100px 100px', padding: '8px 40px', fontSize: 9, color: textMuted, borderBottom: border }}>
                    <div>COMPONENT</div>
                    <div>OPERATION_HASH</div>
                    <div style={{ textAlign: 'right' }}>LATENCY</div>
                    <div style={{ textAlign: 'right' }}>STATE</div>
                </div>
                {[
                    { c: 'DISCOVERY_NODE', h: '0x8f4b2a9e...c1', l: '12ms', s: 'OK' },
                    { c: 'AST_PARSER', h: '0x4b2a9e8f...d4', l: '84ms', s: 'OK' },
                    { c: 'VECTOR_EMBED', h: '0x2a9e8f4b...e7', l: '142ms', s: 'WAIT' },
                ].map((row, i) => (
                    <div key={i} style={{ 
                        display: 'grid', 
                        gridTemplateColumns: '150px 1fr 100px 100px', 
                        padding: '12px 40px', 
                        fontSize: 11, 
                        borderBottom: i === 2 ? 'none' : '1px solid rgba(255,255,255,0.04)',
                        background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent'
                    }}>
                        <div style={{ color: '#fff' }}>{row.c}</div>
                        <div style={{ color: textMuted }}>{row.h}</div>
                        <div style={{ textAlign: 'right', color: accent }}>{row.l}</div>
                        <div style={{ textAlign: 'right', color: row.s === 'WAIT' ? accent : textMuted }}>[{row.s}]</div>
                    </div>
                ))}
            </div>

            <div style={{ padding: '20px 40px 0', fontSize: 11, color: textMuted, lineHeight: 1.6, maxWidth: 600 }}>
                <span style={{ color: accent }}>&gt; </span>
                Multi-threaded analysis pipeline extracting structural claims. Embeddings routing to parallel queues.
            </div>
        </div>
    );
}

export default function GeminiPalettePage() {
    return (
        <div
            style={{
                minHeight: '100vh',
                background: '#000',
                color: '#fff',
                padding: '64px 32px',
                fontFamily: SPEC.fontSans,
            }}
        >
            <div style={{ maxWidth: 960, margin: '0 auto' }}>
                <header style={{ marginBottom: 80 }}>
                    <h1 style={{ fontSize: 32, fontWeight: 400, letterSpacing: '-0.02em', margin: '0 0 12px 0' }}>Gemini Minimal Tech</h1>
                    <p style={{ color: SPEC.text2, fontSize: 14, margin: 0, maxWidth: 600, lineHeight: 1.6 }}>
                        I have restored the exact page state you wanted. Variant A, B, and C are identical to the minimal iteration. 
                        I have also appended the deep-dive CAD/Telemetry variations below them for comparison.
                    </p>
                </header>

                {/* THE ORIGINAL MINIMAL ITERATION (Updated A & B) */}
                <GeminiSection title="Variant A: Brutalist Editor">
                    <BrutalistEditor />
                </GeminiSection>

                <GeminiSection title="Variant B: Structured Console (Hybrid)">
                    <StructuredConsole />
                </GeminiSection>

                <GeminiSection title="Variant C: Technical Draft (Untouched)">
                    <TechnicalDraft />
                </GeminiSection>

                <div style={{ height: 64 }} />
                <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', marginBottom: 64 }} />
                
                {/* THE NEW EXPLORATIONS AND ORIGINAL MAXIMALIST C */}
                <h2 style={{ fontSize: 24, fontWeight: 400, letterSpacing: '-0.02em', marginBottom: 40 }}>Additional Explorations</h2>

                <GeminiSection title="Variant D: Blueprint V (Original Maximalist)">
                    <BlueprintV />
                </GeminiSection>

                <GeminiSection title="Variant E: Deep CAD Blueprint">
                    <DeepCadBlueprint />
                </GeminiSection>

                <GeminiSection title="Variant F: Amber Telemetry (Ledger)">
                    <AmberTelemetry />
                </GeminiSection>

                <div style={{ height: 64 }} />
                <div style={{ height: 1, background: 'rgba(255,255,255,0.1)' }} />
                <div
                    style={{
                        marginTop: 24,
                        fontFamily: SPEC.fontMono,
                        fontSize: 11,
                        color: '#666',
                        display: 'flex',
                        gap: 18,
                        letterSpacing: '0.04em',
                    }}
                >
                    <span>draft_iterations.v4.0</span>
                    <span>schema.v4.0</span>
                    <span style={{ marginLeft: 'auto' }}>⌘ k</span>
                </div>
            </div>
        </div>
    );
}
