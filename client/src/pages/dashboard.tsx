import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { api, invalidateQueries } from "../lib/api";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, FolderOpen, Book, FileText, ChevronRight, Gavel, User } from "lucide-react";
import type { Case } from "@shared/schema";

export default function Dashboard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const { data: cases, isLoading } = useQuery({
    queryKey: ["/api/cases"],
    queryFn: () => api.getCases(),
  });

  const createCaseMutation = useMutation({
    mutationFn: api.createCase,
    onSuccess: (newCase) => {
      invalidateQueries.cases();
      setIsCreateModalOpen(false);
      setTitle("");
      setDescription("");
      toast({
        title: "Case Created",
        description: `"${newCase.title}" has been created successfully.`,
      });
      navigate(`/case/${newCase.id}`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create case. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateCase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    createCaseMutation.mutate({
      title: title.trim(),
      description: description.trim() || "",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "simulating":
        return "bg-blue-100 text-blue-800";
      case "ready":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Completed";
      case "simulating":
        return "Simulating";
      case "ready":
        return "Ready";
      default:
        return "Created";
    }
  };

  return (
    <>
      {/* Header */}
      <header className="bg-judicial-navy shadow-lg border-b-4 border-judicial-gold">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="bg-judicial-gold rounded-full p-3">
                <Gavel className="text-judicial-navy text-xl" size={24} />
              </div>
              <div>
                <h1 className="text-white font-playfair text-2xl font-semibold">AI Courtroom Simulator</h1>
                <p className="text-slate-300 text-sm">Educational Legal Case Analysis Platform</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-white text-sm font-medium">Demo User</p>
                <p className="text-slate-300 text-xs">Educational Use Only</p>
              </div>
              <div className="bg-slate-700 rounded-full p-2">
                <User className="text-judicial-gold" size={16} />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome Section */}
        <Card>
          <CardContent className="p-8">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="font-playfair text-3xl font-semibold text-judicial-navy mb-4">
                Welcome to AI Courtroom Simulator
              </h2>
              <p className="text-slate-600 text-lg leading-relaxed mb-8">
                Experience realistic legal proceedings powered by AI. Upload case documents, run simulations, 
                and analyze courtroom dynamics in a controlled educational environment.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center justify-center space-x-2 text-amber-800">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium text-sm">For Educational Purposes Only - Not Legal Advice</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Card className="hover:shadow-md transition-shadow cursor-pointer group" data-testid="button-create-case">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="bg-emerald-100 rounded-lg p-3 group-hover:bg-emerald-200 transition-colors">
                      <Plus className="text-emerald-600" size={24} />
                    </div>
                    <h3 className="font-semibold text-judicial-navy text-lg">Create New Case</h3>
                  </div>
                  <p className="text-slate-600 text-sm">
                    Start a new legal case analysis with document upload and AI simulation capabilities.
                  </p>
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-playfair text-xl font-semibold text-judicial-navy">
                  Create New Case
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateCase} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Case Title</label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter case title..."
                    data-testid="input-case-title"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Description (Optional)</label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief case description..."
                    className="h-20 resize-none"
                    data-testid="textarea-case-description"
                  />
                </div>
                <div className="flex space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="flex-1"
                    data-testid="button-cancel-case"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-judicial-gold text-white hover:bg-yellow-600"
                    disabled={createCaseMutation.isPending || !title.trim()}
                    data-testid="button-submit-case"
                  >
                    {createCaseMutation.isPending ? "Creating..." : "Create Case"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Card className="hover:shadow-md transition-shadow cursor-pointer group" data-testid="card-recent-cases">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="bg-blue-100 rounded-lg p-3 group-hover:bg-blue-200 transition-colors">
                  <FolderOpen className="text-blue-600" size={24} />
                </div>
                <h3 className="font-semibold text-judicial-navy text-lg">Recent Cases</h3>
              </div>
              <p className="text-slate-600 text-sm">
                Access and manage your previously created cases and simulation results.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer group" data-testid="card-documentation">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="bg-purple-100 rounded-lg p-3 group-hover:bg-purple-200 transition-colors">
                  <Book className="text-purple-600" size={24} />
                </div>
                <h3 className="font-semibold text-judicial-navy text-lg">Documentation</h3>
              </div>
              <p className="text-slate-600 text-sm">
                Learn how to use the platform effectively and understand legal simulation concepts.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Cases List */}
        <Card>
          <div className="px-6 py-4 border-b border-slate-200">
            <h3 className="font-semibold text-judicial-navy text-lg">Recent Cases</h3>
          </div>
          <CardContent className="p-6">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Skeleton className="w-12 h-12 rounded-lg" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Skeleton className="h-6 w-20 rounded-full" />
                      <Skeleton className="w-4 h-4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : cases && cases.length > 0 ? (
              <div className="space-y-4">
                {cases.slice(0, 5).map((caseItem: Case) => (
                  <div
                    key={caseItem.id}
                    className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/case/${caseItem.id}`)}
                    data-testid={`case-item-${caseItem.id}`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="bg-judicial-gold bg-opacity-20 rounded-lg p-3">
                        <FileText className="text-judicial-gold" size={20} />
                      </div>
                      <div>
                        <h4 className="font-medium text-judicial-navy">{caseItem.title}</h4>
                        <p className="text-slate-500 text-sm">
                          {caseItem.updatedAt 
                            ? `Last modified ${new Date(caseItem.updatedAt).toLocaleDateString()}`
                            : "Recently created"
                          }
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge className={getStatusColor(caseItem.status || "created")} data-testid={`status-${caseItem.id}`}>
                        {getStatusText(caseItem.status || "created")}
                      </Badge>
                      <ChevronRight className="text-slate-400" size={16} />
                    </div>
                  </div>
                ))}
                {cases.length > 5 && (
                  <div className="text-center mt-6">
                    <Button
                      variant="ghost"
                      className="text-judicial-gold hover:text-judicial-navy font-medium text-sm"
                      data-testid="button-view-all-cases"
                    >
                      View All Cases <ChevronRight className="ml-1" size={16} />
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                <h4 className="font-medium text-slate-900 mb-2">No cases yet</h4>
                <p className="text-slate-500 text-sm mb-4">
                  Create your first case to get started with legal simulations.
                </p>
                <Button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="bg-judicial-gold text-white hover:bg-yellow-600"
                  data-testid="button-create-first-case"
                >
                  <Plus className="mr-2" size={16} />
                  Create New Case
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
