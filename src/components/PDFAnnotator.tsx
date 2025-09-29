'use client';

import { useState, useCallback, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Download, 
  MessageSquare, 
  CheckCircle,
  AlertCircle,
  Lightbulb,
  X
} from 'lucide-react';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface Annotation {
  id: string;
  type: 'suggestion' | 'error' | 'highlight';
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  page: number;
}

interface PDFAnnotatorProps {
  fileUrl: string;
  analysisResult?: any;
  onAnnotationAdd?: (annotation: Annotation) => void;
  onAnnotationRemove?: (annotationId: string) => void;
}

export default function PDFAnnotator({ 
  fileUrl, 
  analysisResult, 
  onAnnotationAdd, 
  onAnnotationRemove 
}: PDFAnnotatorProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentAnnotation, setCurrentAnnotation] = useState<Partial<Annotation> | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  }, []);

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.2, 3.0));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  const handleMouseDown = (event: React.MouseEvent) => {
    if (!isDrawing) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / scale;
    const y = (event.clientY - rect.top) / scale;
    
    setCurrentAnnotation({
      id: Date.now().toString(),
      x,
      y,
      width: 0,
      height: 0,
      page: pageNumber,
      type: 'highlight'
    });
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!isDrawing || !currentAnnotation) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / scale;
    const y = (event.clientY - rect.top) / scale;
    
    setCurrentAnnotation(prev => prev ? {
      ...prev,
      width: Math.abs(x - prev.x),
      height: Math.abs(y - prev.y)
    } : null);
  };

  const handleMouseUp = () => {
    if (currentAnnotation && currentAnnotation.width > 10 && currentAnnotation.height > 10) {
      const annotation: Annotation = {
        ...currentAnnotation,
        text: 'Click to add comment...',
        type: 'highlight'
      } as Annotation;
      
      setAnnotations(prev => [...prev, annotation]);
      onAnnotationAdd?.(annotation);
    }
    setCurrentAnnotation(null);
  };

  const addSuggestion = (type: 'suggestion' | 'error', text: string) => {
    const annotation: Annotation = {
      id: Date.now().toString(),
      type,
      x: 100,
      y: 100,
      width: 200,
      height: 50,
      text,
      page: pageNumber
    };
    
    setAnnotations(prev => [...prev, annotation]);
    onAnnotationAdd?.(annotation);
  };

  const removeAnnotation = (id: string) => {
    setAnnotations(prev => prev.filter(ann => ann.id !== id));
    onAnnotationRemove?.(id);
  };

  const getAnnotationIcon = (type: string) => {
    switch (type) {
      case 'suggestion': return <Lightbulb className="w-4 h-4" />;
      case 'error': return <AlertCircle className="w-4 h-4" />;
      case 'highlight': return <CheckCircle className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getAnnotationColor = (type: string) => {
    switch (type) {
      case 'suggestion': return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'error': return 'bg-red-100 border-red-300 text-red-800';
      case 'highlight': return 'bg-blue-100 border-blue-300 text-blue-800';
      default: return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg border">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomOut}
            disabled={scale <= 0.5}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium">{Math.round(scale * 100)}%</span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomIn}
            disabled={scale >= 3.0}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleRotate}>
            <RotateCw className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant={isDrawing ? "default" : "outline"}
            size="sm"
            onClick={() => setIsDrawing(!isDrawing)}
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            {isDrawing ? 'Stop Drawing' : 'Add Annotation'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowSuggestions(!showSuggestions)}>
            <Lightbulb className="w-4 h-4 mr-2" />
            {showSuggestions ? 'Hide' : 'Show'} Suggestions
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PDF Viewer */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Resume Preview
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">
                    Page {pageNumber} of {numPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPageNumber(prev => Math.max(prev - 1, 1))}
                    disabled={pageNumber <= 1}
                  >
                    ←
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPageNumber(prev => Math.min(prev + 1, numPages))}
                    disabled={pageNumber >= numPages}
                  >
                    →
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                ref={containerRef}
                className="relative border rounded-lg overflow-auto max-h-[600px]"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
              >
                <Document
                  file={fileUrl}
                  onLoadSuccess={onDocumentLoadSuccess}
                  loading={<div className="p-8 text-center">Loading PDF...</div>}
                  error={<div className="p-8 text-center text-red-500">Failed to load PDF</div>}
                >
                  <Page
                    pageNumber={pageNumber}
                    scale={scale}
                    rotate={rotation}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                  />
                </Document>

                {/* Annotations Overlay */}
                {annotations
                  .filter(ann => ann.page === pageNumber)
                  .map(annotation => (
                    <div
                      key={annotation.id}
                      className="absolute border-2 border-dashed rounded"
                      style={{
                        left: annotation.x * scale,
                        top: annotation.y * scale,
                        width: annotation.width * scale,
                        height: annotation.height * scale,
                        borderColor: annotation.type === 'suggestion' ? '#fbbf24' : 
                                   annotation.type === 'error' ? '#ef4444' : '#3b82f6'
                      }}
                    >
                      <div className={`absolute -top-8 left-0 px-2 py-1 rounded text-xs font-medium ${getAnnotationColor(annotation.type)}`}>
                        {getAnnotationIcon(annotation.type)}
                        <span className="ml-1">{annotation.text}</span>
                        <button
                          onClick={() => removeAnnotation(annotation.id)}
                          className="ml-2 hover:bg-black/10 rounded"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}

                {/* Current Drawing */}
                {currentAnnotation && (
                  <div
                    className="absolute border-2 border-blue-500 border-dashed rounded bg-blue-100/20"
                    style={{
                      left: currentAnnotation.x * scale,
                      top: currentAnnotation.y * scale,
                      width: currentAnnotation.width * scale,
                      height: currentAnnotation.height * scale,
                    }}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Suggestions Panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Suggestions</CardTitle>
            </CardHeader>
            <CardContent>
              {showSuggestions && analysisResult && (
                <div className="space-y-3">
                  {analysisResult.suggestions?.slice(0, 5).map((suggestion: any, index: number) => (
                    <div key={index} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <Lightbulb className="w-4 h-4 text-yellow-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-yellow-800">
                            {suggestion.title}
                          </p>
                          <p className="text-xs text-yellow-700 mt-1">
                            {suggestion.description}
                          </p>
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-2 text-xs"
                            onClick={() => addSuggestion('suggestion', suggestion.title)}
                          >
                            Add to PDF
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => addSuggestion('suggestion', 'Consider adding quantifiable metrics here')}
              >
                <Lightbulb className="w-4 h-4 mr-2" />
                Add Metrics Suggestion
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => addSuggestion('error', 'Fix grammar or formatting issue')}
              >
                <AlertCircle className="w-4 h-4 mr-2" />
                Mark for Review
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => addSuggestion('highlight', 'This section looks great!')}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Highlight Good Section
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Annotations ({annotations.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {annotations.map(annotation => (
                  <div key={annotation.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center space-x-2">
                      {getAnnotationIcon(annotation.type)}
                      <span className="text-sm truncate">{annotation.text}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeAnnotation(annotation.id)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
