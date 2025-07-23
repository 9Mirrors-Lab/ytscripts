"use client";nnimport { useState, useEffect } from "react";nimport { Button } from "@/components/ui/button";nimport { Input } from "@/components/ui/input";nimport { Label } from "@/components/ui/label";nimport { Card, CardContent } from "@/components/ui/card";nimport { Alert, AlertDescription } from "@/components/ui/alert";nimport { Badge } from "@/components/ui/badge";nimport { GlowCard } from "@/components/ui/glow-card";nimport {n  Drawer,n  DrawerClose,n  DrawerContent,n  DrawerDescription,n  DrawerFooter,n  DrawerHeader,n  DrawerTitle,n} from "@/components/ui/drawer";nimport { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";nimport { FileText, AlertCircle, CheckCircle, PlayCircle, Clock, Zap, ExternalLink, Eye, Grid3X3, List, Copy, Check, Trash2, FileDown, Share2 } from "lucide-react";nimport { saveProcessedVideo, loadProcessedVideos, updateVideoPlaybook, markPlaybookGenerationFailed, deleteProcessedVideo, ProcessedVideoDb } from "@/lib/supabase";nimport { generatePlaybookPDF } from "@/lib/pdf-generator";nimport { PlaybookTemplate } from "@/components/playbook";nimport { toast } from "sonner";nninterface ProcessedVideo {n  id: string;n  url: string;n  title: string;n  channelName?: string;n  prefix: string;n  processedAt: Date;n  markdown?: string;n  thumbnail?: string;n  playbook?: string;n  playbookError?: string;n  playbookPrefix?: string;n}nn// Helper function to convert DB record to UI formatnconst convertDbToUi = (dbRecord: ProcessedVideoDb): ProcessedVideo => ({n  id: dbRecord.id,n  url: dbRecord.video_url,n  title: dbRecord.title,n  channelName: dbRecord.channel_name,n  prefix: dbRecord.prefix,n  processedAt: new Date(dbRecord.processed_at),n  markdown: dbRecord.markdown_content,n  thumbnail: dbRecord.thumbnail_url,n  playbook: dbRecord.playbook_generated && dbRecord.playbook_content ? dbRecord.playbook_content : undefined,n  playbookError: dbRecord.playbook_content?.startsWith('ERROR:') ? dbRecord.playbook_content.replace('ERROR: ', '') : undefined,n  playbookPrefix: dbRecord.prefix,n});nnconst extractVideoId = (url: string): string => {n  const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/;n  const match = url.match(regex);n  return match ? match[1] : '';n};nnconst getYouTubeThumbnail = (url: string): string => {n  const videoId = extractVideoId(url);n  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;n};nnconst getYouTubeMetadata = async (url: string): Promise<{ title: string; channelName: string } | null> => {n  try {n    const response = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);n    if (!response.ok) throw new Error('Failed to fetch metadata');n    n    const data = await response.json();n    return {n      title: data.title || 'Unknown Video',n      channelName: data.author_name || 'Unknown Channel'n    };n  } catch (error) {n    console.error('Error fetching YouTube metadata:', error);n    return null;n  }n};nnconst formatDate = (date: Date): string => {n  return date.toLocaleDateString('en-US', {n    month: 'short',n    day: 'numeric',n    year: 'numeric',n    hour: '2-digit',n    minute: '2-digit'n  });n};nnconst generatePlaybook = async (transcript: string, prefix?: string): Promise<{ playbook?: string; error?: string; prefix?: string }> => {n  try {n    const response = await fetch('/api/generate-playbook', {n      method: 'POST',n      headers: {n        'Content-Type': 'application/json',n      },n      body: JSON.stringify({n        transcript: transcript,n        prefix: prefix || undefinedn      }),n    });nn    if (!response.ok) {n      throw new Error(`Playbook generation failed: ${response.status} ${response.statusText}`);n    }nn    const result = await response.json();n    return { playbook: result.playbook, prefix: result.prefix };n  } catch (error) {n    console.error('Error generating playbook:', error);n    return { error: error instanceof Error ? error.message : 'Failed to generate playbook' };n  }n};nnconst isValidYouTubeUrlOrId = (input: string) => {n  if (/^[0-9A-Za-z_-]{11}$/.test(input)) return true;n  return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/.test(input);n};nnexport default function YTScriptsPage() {n  const [url, setUrl] = useState("");n  const [prefix, setPrefix] = useState("");n  const [isLoading, setIsLoading] = useState(false);n  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);n  const [processedVideos, setProcessedVideos] = useState<ProcessedVideo[]>([]);n  const [selectedVideo, setSelectedVideo] = useState<ProcessedVideo | null>(null);n  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');n  const [drawerOpen, setDrawerOpen] = useState(false);n  const [generatingPlaybookIds, setGeneratingPlaybookIds] = useState<Set<string>>(new Set());n  const [copiedTranscript, setCopiedTranscript] = useState(false);n  const [deletingVideoIds, setDeletingVideoIds] = useState<Set<string>>(new Set());n  const [sharingVideoIds, setSharingVideoIds] = useState<Set<string>>(new Set());nn  useEffect(() => {n    const loadVideos = async () => {n      try {n        const dbVideos = await loadProcessedVideos();n        const uiVideos = dbVideos.map(convertDbToUi);n        setProcessedVideos(uiVideos);n      } catch (error) {n        console.error('Error loading videos:', error);n      }n    };n    loadVideos();n  }, []);nn  const handleCopyTranscript = async (content: string) => {n    try {n      await navigator.clipboard.writeText(content);n      setCopiedTranscript(true);n      setTimeout(() => setCopiedTranscript(false), 2000);n    } catch (error) {n      console.error('Failed to copy transcript:', error);n    }n  };nn  const handleGeneratePlaybook = async (video: ProcessedVideo) => {n    if (!video.markdown) return;nn    setGeneratingPlaybookIds(prev => new Set([...prev, video.id]));nn    try {n      const result = await generatePlaybook(video.markdown, video.prefix);nn      let updatedVideo: ProcessedVideo;nn      if (result.error) {n        await markPlaybookGenerationFailed(video.id, result.error);n        updatedVideo = {n          ...video,n          playbook: undefined,n          playbookError: result.errorn        };n        toast.error(`Playbook generation failed: ${result.error}`);n      } else if (result.playbook) {n        await updateVideoPlaybook(video.id, result.playbook);n        updatedVideo = {n          ...video,n          playbook: result.playbook,n          playbookError: undefined,n          playbookPrefix: result.prefixn        };n        toast.success("Playbook generated successfully!");n      } else {n        throw new Error("No playbook content received");n      }nn      setSelectedVideo(updatedVideo);n      setProcessedVideos(prev => prev.map(v => v.id === updatedVideo.id ? updatedVideo : v));n    } catch (error) {n      console.error('Error in playbook generation:', error);n      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';n      await markPlaybookGenerationFailed(video.id, errorMessage);n      const updatedVideo = {n        ...video,n        playbook: undefined,n        playbookError: errorMessagen      };n      setSelectedVideo(updatedVideo);n      setProcessedVideos(prev => prev.map(v => v.id === updatedVideo.id ? updatedVideo : v));n      toast.error(`Playbook generation failed: ${errorMessage}`);n    } finally {n      setGeneratingPlaybookIds(prev => {n        const newSet = new Set(prev);n        newSet.delete(video.id);n        return newSet;n      });n    }n  };nn  const handleDeleteVideo = async (video: ProcessedVideo, event: React.MouseEvent) => {n    event.stopPropagation();n    if (!confirm('Are you sure you want to delete this video?')) return;nn    setDeletingVideoIds(prev => new Set([...prev, video.id]));n    try {n      await deleteProcessedVideo(video.id);n      setProcessedVideos(prev => prev.filter(v => v.id !== video.id));n      if (selectedVideo?.id === video.id) {n        setSelectedVideo(null);n        setDrawerOpen(false);n      }n      toast.success("Video deleted successfully");n    } catch (error) {n      console.error('Error deleting video:', error);n      toast.error("Failed to delete video");n    } finally {n      setDeletingVideoIds(prev => {n        const newSet = new Set(prev);n        newSet.delete(video.id);n        return newSet;n      });n    }n  };nn  const handleDownloadPDF = async (video: ProcessedVideo) => {n    if (!video.playbook) return;nn    try {n      const pdfBlob = await generatePlaybookPDF(video.playbook, {n        title: video.title,n        author: 'YouTube Scripts',n        subject: 'AI-Generated Startup Strategy',n        keywords: video.playbookPrefix || 'startup, strategy, ai'n      });n      const url = URL.createObjectURL(pdfBlob);n      const link = document.createElement('a');n      link.href = url;n      link.download = `${video.prefix}_playbook.pdf`;n      document.body.appendChild(link);n      link.click();n      document.body.removeChild(link);n      URL.revokeObjectURL(url);n      toast.success("PDF downloaded successfully");n    } catch (error) {n      console.error('Error downloading PDF:', error);n      toast.error("Failed to download PDF");n    }n  };nn  const handleSharePlaybook = async (video: ProcessedVideo, event?: React.MouseEvent) => {n    event?.stopPropagation();n    if (!video.playbook) return;nn    setSharingVideoIds(prev => new Set([...prev, video.id]));n    try {n      // This would typically create a shareable linkn      // For now, just copy the playbook content to clipboardn      await navigator.clipboard.writeText(video.playbook);n      toast.success("Playbook content copied to clipboard");n    } catch (error) {n      console.error('Error sharing playbook:', error);n      toast.error("Failed to share playbook");n    } finally {n      setSharingVideoIds(prev => {n        const newSet = new Set(prev);n        newSet.delete(video.id);n        return newSet;n      });n    }n  };nn  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {n    e.preventDefault();n    setIsLoading(true);n    setMessage(null);nn    if (!isValidYouTubeUrlOrId(url)) {n      setMessage({ type: "error", text: "Please enter a valid YouTube URL or video ID." });n      setIsLoading(false);n      return;n    }nn    try {n      const metadata = await getYouTubeMetadata(url);n      const videoTitle = metadata?.title || 'Unknown Video';n      const channelName = metadata?.channelName || 'Unknown Channel';nn      const formData = new FormData();n      formData.append('url', url);n      formData.append('prefix', prefix);nn      const response = await fetch('/api/transcribe', {n        method: 'POST',n        body: formData,n      });nn      const data = await response.json();nn      if (!response.ok) {n        throw new Error(data.error || 'Failed to process video');n      }nn      const markdownContent = data.markdown;n      const newVideo = await saveProcessedVideo({n        video_url: url,n        title: videoTitle,n        channel_name: channelName,n        prefix: prefix,n        markdown_content: markdownContent,n        thumbnail_url: getYouTubeThumbnail(url)n      });nn      const uiVideo = convertDbToUi(newVideo);n      setProcessedVideos(prev => [uiVideo, ...prev]);n      setMessage({ type: "success", text: `Successfully processed: ${videoTitle}` });n      setSelectedVideo(uiVideo);n      setDrawerOpen(true);n      setUrl("");n      setPrefix("");n    } catch (error) {n      setMessage({ n        type: "error", n        text: error instanceof Error ? error.message : "An unexpected error occurred" n      });n    } finally {n      setIsLoading(false);n    }n  };nn  return (n    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">n      <div className="max-w-7xl mx-auto space-y-8">n        <div className="text-center space-y-4 py-6">n          <div className="flex items-center justify-center gap-3 mb-4">n            <div className="p-3 rounded-full bg-gradient-to-r from-purple-500 to-blue-500">n              <PlayCircle className="h-8 w-8 text-white" />n            </div>n            <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">n              YouTube Transcript Processorn            </h1>n          </div>n          <p className="text-gray-300 text-lg max-w-2xl mx-auto">n            Transform YouTube videos into clean, readable transcripts and actionable startup playbooks.n          </p>n        </div>n        <div className="flex flex-wrap items-center justify-center gap-6 py-2">n          <div className="flex items-center gap-2 text-sm text-gray-400">n            <Zap className="h-4 w-4 text-blue-400" />n            <span>Fast Processing</span>n          </div>n          <div className="flex items-center gap-2 text-sm text-gray-400">n            <FileText className="h-4 w-4 text-purple-400" />n            <span>Markdown Format</span>n          </div>n          <div className="flex items-center gap-2 text-sm text-gray-400">n            <Eye className="h-4 w-4 text-green-400" />n            <span>AI Playbooks</span>n          </div>n        </div>n        <div className="w-full">n          <GlowCard glowColor="blue" customSize={true} className="w-full p-0 h-auto">n            <Card className="border-0 bg-transparent shadow-none">n              <CardContent className="p-4">n                {message && (n                  <Alert variant={message.type === "error" ? "destructive" : "default"} className="border-gray-700 bg-gray-800/50 mb-4">n                    {message.type === "error" ? (n                      <AlertCircle className="h-4 w-4" />n                    ) : (n                      <CheckCircle className="h-4 w-4" />n                    )}n                    <AlertDescription className="text-gray-200">{message.text}</AlertDescription>n                  </Alert>n                )}n                <form onSubmit={handleSubmit} className="space-y-4">n                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">n                    <div className="md:col-span-6">n                      <Label htmlFor="url" className="text-gray-200 text-sm font-medium">YouTube URL or ID</Label>n                      <Inputn                        id="url"n                        type="text"n                        placeholder="https://youtu.be/... or video_id"n                        value={url}n                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUrl(e.target.value)}n                        requiredn                        disabled={isLoading}n                        className="bg-gray-800/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-500 h-10"n                      />n                    </div>n                    <div className="md:col-span-3">n                      <Label htmlFor="prefix" className="text-gray-200 text-sm font-medium">Output Prefix</Label>n                      <Inputn                        id="prefix"n                        type="text"n                        placeholder="e.g. my_video"n                        value={prefix}n                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPrefix(e.target.value)}n                        requiredn                        disabled={isLoading}n                        className="bg-gray-800/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-500 h-10"n                      />n                    </div>n                    <div className="md:col-span-3">n                      <Button n                        type="submit" n                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 border-0 h-10 text-sm font-medium"n                        disabled={isLoading}n                      >n                        {isLoading ? (n                          <>n                            <Clock className="h-4 w-4 mr-2 animate-spin" />n                            Processing...n                          </>n                        ) : (n                          <>n                            <PlayCircle className="h-4 w-4 mr-2" />n                            Process Videon                          </>n                        )}n                      </Button>n                    </div>n                  </div>n                </form>n              </CardContent>n            </Card>n          </GlowCard>n        </div>n        <div className="space-y-6">n          <div className="flex items-center justify-between">n            <h2 className="text-2xl font-bold text-white">Processed Videos</h2>n            {processedVideos.length > 0 && (n              <div className="flex items-center gap-2">n                <Buttonn                  variant={viewMode === 'grid' ? 'default' : 'outline'}n                  size="sm"n                  onClick={() => setViewMode('grid')}n                  className="h-8 px-3"n                >n                  <Grid3X3 className="h-4 w-4" />n                </Button>n                <Buttonn                  variant={viewMode === 'list' ? 'default' : 'outline'}n                  size="sm"n                  onClick={() => setViewMode('list')}n                  className="h-8 px-3"n                >n                  <List className="h-4 w-4" />n                </Button>n              </div>n            )}n          </div>n          {processedVideos.length > 0 ? (n            <div className={viewMode === 'grid' n              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" n              : "space-y-4"n            }>n              {processedVideos.map((video) => (n                <Card n                  key={video.id} 
                  className={`bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-all cursor-pointer ${
                    viewMode === 'list' ? 'p-4' : ''
                  }`}
                  onClick={() => {
                    setSelectedVideo(video);
                    setDrawerOpen(true);
                  }}
                >
                  {viewMode === 'grid' ? (
                    <>
                      <div className="aspect-video relative overflow-hidden rounded-t-lg group">
                        <img 
                          src={video.thumbnail || getYouTubeThumbnail(video.url)} 
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 px-3 py-2 bg-black/60 backdrop-blur-sm rounded-b-lg">
                          <h3 className="text-white text-sm font-medium line-clamp-2 mb-1">
                            {video.title}
                          </h3>
                          {video.channelName && (
                            <p className="text-gray-300 text-xs">{video.channelName}</p>
                          )}
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex flex-nowrap items-center gap-x-2 min-w-0">
                            <Badge variant="secondary" className="text-xs whitespace-nowrap px-2 py-1">
                              {video.prefix}
                            </Badge>
                            {video.playbook && (
                              <Badge variant="default" className="text-xs bg-green-600 whitespace-nowrap px-2 py-1">
                                Playbook Ready
                              </Badge>
                            )}
                            {generatingPlaybookIds.has(video.id) && (
                              <Badge variant="outline" className="text-xs whitespace-nowrap px-2 py-1 flex items-center">
                                <Clock className="h-3 w-3 mr-1 shrink-0" />
                                Generating
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-gray-400 whitespace-nowrap">
                            {formatDate(video.processedAt)}
                          </span>
                        </div>
                      </CardContent>
                    </>
                  ) : (
                    <div className="flex items-center gap-4">
                      <div className="w-24 h-16 flex-shrink-0 rounded-lg overflow-hidden">
                        <img 
                          src={video.thumbnail || getYouTubeThumbnail(video.url)} 
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white text-sm font-medium line-clamp-2 mb-1">
                          {video.title}
                        </h3>
                        {video.channelName && (
                          <p className="text-gray-400 text-xs mb-2">
                            {video.channelName}
                          </p>
                        )}
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {video.prefix}
                          </Badge>
                          {video.playbook && (
                            <Badge variant="default" className="text-xs bg-green-600">
                              Playbook Ready
                            </Badge>
                          )}
                          {generatingPlaybookIds.has(video.id) && (
                            <Badge variant="outline" className="text-xs">
                              <Clock className="h-3 w-3 mr-1 animate-spin" />
                              Generating
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="text-xs text-gray-400">
                          {formatDate(video.processedAt)}
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-center">
              <div className="space-y-3">
                <FileText className="h-12 w-12 text-gray-500 mx-auto" />
                <div>
                  <h3 className="text-lg font-medium text-gray-400">No videos processed yet</h3>
                  <p className="text-sm text-gray-500">Process your first YouTube video to see it here</p>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="text-center text-gray-500 text-sm">
          <p>Powered by YouTube API and AI transcription</p>
        </div>
      </div>
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen} direction="right">
        <DrawerContent className="h-full w-[750px] mt-0 ml-auto rounded-l-lg fixed right-0 top-0">
          <div className="flex flex-col h-full">
            {selectedVideo && (
              <>
                <DrawerHeader className="border-b border-gray-700 py-3 px-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <DrawerTitle className="text-left text-base font-medium leading-tight line-clamp-2">
                        {selectedVideo.title}
                      </DrawerTitle>
                      <DrawerDescription className="text-left mt-1">
                        {selectedVideo.channelName && (
                          <span className="text-xs text-gray-500">
                            by {selectedVideo.channelName} • Processed {formatDate(selectedVideo.processedAt)}
                          </span>
                        )}
                      </DrawerDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-gray-400 hover:text-red-400 hover:bg-red-950/30 ml-2 flex-shrink-0"
                      onClick={(e) => handleDeleteVideo(selectedVideo, e)}
                      disabled={deletingVideoIds.has(selectedVideo.id)}
                    >
                      {deletingVideoIds.has(selectedVideo.id) ? (
                        <Clock className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </DrawerHeader>
                <div className="flex-1 p-3 overflow-y-auto space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      {generatingPlaybookIds.has(selectedVideo.id) && (
                        <Clock className="h-3 w-3 animate-spin text-purple-400 ml-auto" />
                      )}
                    </div>
                    <div className="space-y-3">
                      {!selectedVideo.playbook && !selectedVideo.playbookError && !generatingPlaybookIds.has(selectedVideo.id) && (
                        <div className="text-center py-4">
                          <Button 
                            onClick={() => handleGeneratePlaybook(selectedVideo)}
                            disabled={!selectedVideo.markdown}
                            size="sm"
                            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-xs h-8"
                          >
                            <Zap className="h-3 w-3 mr-1" />
                            Generate Playbook
                          </Button>
                          <p className="text-xs text-gray-500 mt-2">
                            Transform this transcript into actionable startup strategies
                          </p>
                        </div>
                      )}
                      {generatingPlaybookIds.has(selectedVideo.id) && (
                        <div className="text-center py-4">
                          <Clock className="h-6 w-6 animate-spin text-purple-400 mx-auto mb-2" />
                          <p className="text-xs text-gray-400">
                            Generating startup playbook...
                          </p>
                        </div>
                      )}
                      {selectedVideo.playbookError && (
                        <div className="bg-red-900/20 border border-red-700 rounded-lg p-3">
                          <p className="text-red-400 text-xs">
                            Error generating playbook: {selectedVideo.playbookError}
                          </p>
                          <Button 
                            onClick={() => handleGeneratePlaybook(selectedVideo)}
                            disabled={generatingPlaybookIds.has(selectedVideo.id)}
                            size="sm"
                            variant="outline"
                            className="mt-2 text-xs h-7"
                          >
                            Try Again
                          </Button>
                        </div>
                      )}
                      {selectedVideo.playbook && (
                        <div className="space-y-3">
                          <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-lg border border-purple-500/30 p-3">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <Zap className="h-4 w-4 text-purple-400" />
                                <h3 className="text-purple-300 font-medium text-sm">Startup Playbook</h3>
                                <Badge variant="default" className="bg-green-600 text-xs">
                                  Ready
                                </Badge>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 px-3 text-xs border-purple-500/30 hover:bg-purple-900/30 hover:border-purple-400/50"
                                  onClick={() => handleDownloadPDF(selectedVideo)}
                                >
                                  <FileDown className="h-3 w-3 mr-1" />
                                  PDF
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 px-3 text-xs border-blue-500/30 hover:bg-blue-900/30 hover:border-blue-400/50"
                                  onClick={() => handleSharePlaybook(selectedVideo)}
                                  disabled={sharingVideoIds.has(selectedVideo.id)}
                                >
                                  {sharingVideoIds.has(selectedVideo.id) ? (
                                    <Clock className="h-3 w-3 mr-1 animate-spin" />
                                  ) : (
                                    <Share2 className="h-3 w-3 mr-1" />
                                  )}
                                  Share
                                </Button>
                              </div>
                            </div>
                            <PlaybookTemplate 
                              content={selectedVideo.playbook} 
                              prefix={selectedVideo.playbookPrefix}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              onClick={() => handleGeneratePlaybook(selectedVideo)}
                              disabled={generatingPlaybookIds.has(selectedVideo.id)}
                              size="sm"
                              variant="outline"
                              className="text-xs h-7"
                            >
                              <Zap className="h-3 w-3 mr-1" />
                              Regenerate
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="video-info" className="border-gray-700">
                      <AccordionTrigger className="text-white hover:text-purple-400 text-sm py-3">
                        Video Information
                      </AccordionTrigger>
                      <AccordionContent className="text-gray-300 pb-3">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <ExternalLink className="h-3 w-3 text-blue-400 flex-shrink-0" />
                            <a 
                              href={selectedVideo.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 underline text-xs"
                            >
                              Watch on YouTube
                            </a>
                          </div>
                          <div className="flex items-center gap-2">
                            <FileText className="h-3 w-3 text-green-400 flex-shrink-0" />
                            <span className="text-xs">Prefix: {selectedVideo.prefix}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3 text-purple-400 flex-shrink-0" />
                            <span className="text-xs">Processed: {formatDate(selectedVideo.processedAt)}</span>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="transcript" className="border-gray-700">
                      <AccordionTrigger className="text-white hover:text-purple-400 text-sm py-3">
                        Transcript Content
                      </AccordionTrigger>
                      <AccordionContent className="text-gray-300 pb-3">
                        <div className="space-y-3">
                          {selectedVideo.markdown && (
                            <div className="flex justify-end">
                              <Button
                                onClick={() => handleCopyTranscript(selectedVideo.markdown!)}
                                size="sm"
                                variant="outline"
                                className="text-xs h-7 gap-1"
                              >
                                {copiedTranscript ? (
                                  <>
                                    <Check className="h-3 w-3" />
                                    Copied!
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-3 w-3" />
                                    Copy Transcript
                                  </>
                                )}
                              </Button>
                            </div>
                          )}
                          <div className="prose prose-invert max-w-none">
                            {selectedVideo.markdown ? (
                              <pre className="whitespace-pre-wrap text-xs leading-relaxed bg-slate-900/50 p-3 rounded-lg border border-gray-700 font-mono">
                                {selectedVideo.markdown}
                              </pre>
                            ) : (
                              <p className="text-gray-400 text-xs">No transcript available</p>
                            )}
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
                <DrawerFooter className="border-t border-gray-700 py-3 px-4">
                  <DrawerClose asChild>
                    <Button variant="outline" className="w-full text-xs h-8">Close</Button>
                  </DrawerClose>
                </DrawerFooter>
              </>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </div>n  );n}