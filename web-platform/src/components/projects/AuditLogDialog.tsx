"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FileCode, AlertCircle, CheckCircle2 } from "lucide-react"

interface AuditLogDialogProps {
    projectTitle: string
    features: any[]
}

export function AuditLogDialog({ projectTitle, features }: AuditLogDialogProps) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <FileCode className="w-4 h-4" /> View Audit Logs
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Audit Report: {projectTitle}</DialogTitle>
                    <DialogDescription>
                        Detailed breakdown of the AI verification process.
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="flex-1 mt-4 border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[200px]">Feature Claim</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Tier</TableHead>
                                <TableHead className="w-[400px]">AI Reasoning</TableHead>
                                <TableHead>Evidence</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {features.map((feat, i) => (
                                <TableRow key={i}>
                                    <TableCell className="font-medium">{feat.feature}</TableCell>
                                    <TableCell>
                                        <Badge variant={feat.status === "VERIFIED" ? "default" : "secondary"}>
                                            {feat.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <span className={`text-xs font-mono font-bold ${feat.tier?.includes("TIER_3") ? "text-purple-600" :
                                            feat.tier?.includes("TIER_2") ? "text-blue-600" : "text-slate-500"
                                            }`}>
                                            {feat.tier?.replace("TIER_", "")?.replace("_", " ") || "-"}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground whitespace-pre-wrap">
                                        {feat.tier_reasoning}
                                    </TableCell>
                                    <TableCell className="text-xs font-mono text-muted-foreground">
                                        {feat.evidence_file ? (
                                            <span className="flex items-center gap-1">
                                                <FileCode className="w-3 h-3" />
                                                {feat.evidence_file.split("/").pop()}
                                            </span>
                                        ) : "-"}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </ScrollArea>

                <div className="bg-muted p-3 rounded-md text-xs text-muted-foreground flex gap-2 items-center">
                    <AlertCircle className="w-4 h-4" />
                    <span>Scores are calculated based on Tier weights: Tier 1 (1pt), Tier 2 (10pts), Tier 3 (30-50pts).</span>
                </div>
            </DialogContent>
        </Dialog>
    )
}
