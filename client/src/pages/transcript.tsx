import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { api } from "../lib/api";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Download, Bus, Shield, Users, Gavel as GavelIcon } from "lucide-react";
import type { TranscriptEntry, Verdict } from "../types/api";

const PHASES = [
  { id: "opening", name: "Opening Statements" },
  { id: "evidence", name: "Evidence" },
  { id: "cross", name: "Cross-Examination" },
  { id: "closing", name: "Closing Arguments" },
  { id: "verdict", name: "Verdict" },
  { id: "opinion", name: "Judge Opinion" },
];

const getRoleIcon = (role: string) => {
  switch (role.toLowerCase()) {
    case "prosecution":
      return <Bus className="text-red-600" size={20} />;
    case "defense":
      return <Shield className="text-blue-600" size={20} />;
    case "jury":
      return <Users className="text-purple-600" size={20} />;
    case "judge":
      return <GavelIcon className="text-gray-700" size={20} />;
    default:
      return <Bus className="text-gray-600" size={20} />;
  }
};

const getRoleColor = (role: string) => {
  switch (role.toLowerCase()) {
    case "prosecution":
      return "bg-red-100";
    case "defense":
      return "bg-blue-100";
    case "jury":
      return "bg-purple-100";
    case "judge":
      return "bg-gray-100";
    default:
      return "bg-slate-100";
  }
};

const getCitationColor = (citation: string) => {
  if (citation.startsWith("doc:")) {
    return "bg-yellow-100 text-yellow-800";
  } else if (citation.startsWith("kb:")) {
    return "bg-blue-100 text-blue-800";
  }
  return "bg-gray-100 text-gray-800";
};

export default function Transcript() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedPhase, setSelectedPhase] = useState<string>("opening");

  const { data: caseData, isLoading: caseLoading } = useQuery({
    queryKey: ["/api/cases", id],
    queryFn: () => api.getCase(id!),
    enabled: !!id,
  });

  const { data: transcript, isLoading: transcriptLoading } = useQuery({
    queryKey: ["/api/cases", id, "transcript"],
    queryFn: () => api.getTranscript(id!),
    enabled: !!id,
  });

  const handleExport = async () => {
    try {
      await api.exportTranscript(id!);
      toast({
        title: "Export Started",
        description: "Transcript download has started.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export transcript. Please try again.",
        variant: "destructive",
      });
    }
  };

  const filteredTranscript = transcript?.filter((entry: TranscriptEntry) => 
    selectedPhase === "all" || entry.phase === selectedPhase
  ) || [];

  const verdict = caseData?.verdict as Verdict | null;

  if (caseLoading || transcriptLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Skeleton className="h-8 w-64 mb-8" />
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Case Not Found</h2>
          <p className="text-gray-600 mt-2">The case you're looking for doesn't exist.</p>
          <Button onClick={() => navigate("/")} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Transcript Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/case/${id}`)}
                data-testid="button-back-case"
              >
                <ArrowLeft size={16} />
              </Button>
              <div>
                <h2 className="font-playfair text-2xl font-semibold text-judicial-navy">
                  Trial Transcript
                </h2>
                <p className="text-slate-500 text-sm">{caseData.title}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={handleExport}
                data-testid="button-export-transcript"
              >
                <Download size={16} className="mr-2" />
                Export Transcript
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phase Navigation */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedPhase === "all" ? "default" : "outline"}
              onClick={() => setSelectedPhase("all")}
              className={selectedPhase === "all" ? "bg-judicial-gold text-white hover:bg-yellow-600" : ""}
              data-testid="button-phase-all"
            >
              All Phases
            </Button>
            {PHASES.map((phase) => (
              <Button
                key={phase.id}
                variant={selectedPhase === phase.id ? "default" : "outline"}
                onClick={() => setSelectedPhase(phase.id)}
                className={selectedPhase === phase.id ? "bg-judicial-gold text-white hover:bg-yellow-600" : ""}
                data-testid={`button-phase-${phase.id}`}
              >
                {phase.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Transcript Content */}
      <div className="space-y-6">
        {filteredTranscript.length > 0 ? (
          filteredTranscript.map((entry: TranscriptEntry, index: number) => (
            <Card key={index} data-testid={`transcript-entry-${index}`}>
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getRoleColor(entry.role)}`}>
                      {getRoleIcon(entry.role)}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-judicial-navy">{entry.role}</h4>
                      <Badge variant="secondary" className="text-xs">
                        {PHASES.find(p => p.id === entry.phase)?.name || entry.phase}
                      </Badge>
                    </div>
                    <div className="prose prose-sm max-w-none text-slate-700">
                      <p className="whitespace-pre-wrap">{entry.text}</p>
                    </div>
                    {/* Citations */}
                    {entry.citations && entry.citations.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {entry.citations.map((citation, citationIndex) => (
                          <Badge
                            key={citationIndex}
                            variant="outline"
                            className={`text-xs ${getCitationColor(citation)}`}
                            data-testid={`citation-${citation}`}
                          >
                            {citation}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <GavelIcon className="mx-auto h-12 w-12 text-slate-400 mb-4" />
              <h4 className="font-medium text-slate-900 mb-2">No Transcript Available</h4>
              <p className="text-slate-500">
                {selectedPhase === "all" 
                  ? "The simulation hasn't been completed yet."
                  : `No entries found for the ${PHASES.find(p => p.id === selectedPhase)?.name} phase.`
                }
              </p>
            </CardContent>
          </Card>
        )}

        {/* Verdict Section */}
        {verdict && (selectedPhase === "all" || selectedPhase === "verdict") && (
          <Card className="bg-gradient-to-r from-slate-800 to-judicial-navy text-white" data-testid="verdict-section">
            <CardContent className="p-8">
              <div className="text-center">
                <div className="bg-judicial-gold rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <GavelIcon className="text-judicial-navy" size={24} />
                </div>
                <h3 className="font-playfair text-2xl font-semibold mb-4">Jury Verdict</h3>
                <div className="bg-white bg-opacity-10 rounded-lg p-6 max-w-2xl mx-auto">
                  <p className="text-xl font-medium mb-4" data-testid="verdict-decision">
                    {verdict.verdict}
                  </p>
                  <p className="text-slate-200 leading-relaxed" data-testid="verdict-rationale">
                    {verdict.rationale}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
