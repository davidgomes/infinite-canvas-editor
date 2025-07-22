
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback, useRef } from 'react';
import type { Canvas, CanvasWithShapes, Shape, CreateCanvasInput, CreateShapeInput, UpdateShapeInput, ShapeType, UserCursor } from '../../server/src/schema';

interface CollaborationState {
  userId: string;
  userName: string;
  cursors: UserCursor[];
}

function App() {
  // Canvas management
  const [canvases, setCanvases] = useState<Canvas[]>([]);
  const [currentCanvas, setCurrentCanvas] = useState<CanvasWithShapes | null>(null);
  const [isLoadingCanvases, setIsLoadingCanvases] = useState(false);
  const [isLoadingCanvas, setIsLoadingCanvas] = useState(false);

  // Canvas creation
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newCanvasData, setNewCanvasData] = useState<CreateCanvasInput>({
    name: '',
    description: null
  });

  // Shape manipulation
  const [selectedTool, setSelectedTool] = useState<ShapeType>('rectangle');
  const [selectedColor, setSelectedColor] = useState('#3b82f6');
  const [selectedShape, setSelectedShape] = useState<Shape | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Canvas view state
  const [viewOffset, setViewOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Real-time collaboration
  const [collaboration, setCollaboration] = useState<CollaborationState>({
    userId: `user_${Math.random().toString(36).substr(2, 9)}`,
    userName: `User ${Math.floor(Math.random() * 1000)}`,
    cursors: []
  });

  // Load canvases on mount
  const loadCanvases = useCallback(async () => {
    setIsLoadingCanvases(true);
    try {
      const result = await trpc.getCanvases.query();
      setCanvases(result);
    } catch (error) {
      console.error('Failed to load canvases:', error);
    } finally {
      setIsLoadingCanvases(false);
    }
  }, []);

  useEffect(() => {
    loadCanvases();
  }, [loadCanvases]);

  // Load specific canvas with shapes
  const loadCanvas = useCallback(async (canvasId: number) => {
    setIsLoadingCanvas(true);
    try {
      const result = await trpc.getCanvas.query({ id: canvasId });
      setCurrentCanvas(result);
      // Reset view when loading new canvas
      setViewOffset({ x: 0, y: 0 });
      setZoom(1);
    } catch (error) {
      console.error('Failed to load canvas:', error);
    } finally {
      setIsLoadingCanvas(false);
    }
  }, []);

  // Load cursors for real-time collaboration
  const loadCursors = useCallback(async (canvasId: number) => {
    try {
      const cursors = await trpc.getCursors.query({ canvasId });
      setCollaboration(prev => ({ ...prev, cursors }));
    } catch (error) {
      console.error('Failed to load cursors:', error);
    }
  }, []);

  // Periodically update cursors for real-time collaboration
  useEffect(() => {
    if (!currentCanvas) return;

    const interval = setInterval(() => {
      loadCursors(currentCanvas.id);
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, [currentCanvas, loadCursors]);

  // Create new canvas
  const handleCreateCanvas = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await trpc.createCanvas.mutate(newCanvasData);
      setCanvases(prev => [...prev, result]);
      setNewCanvasData({ name: '', description: null });
      setShowCreateDialog(false);
      // Automatically load the new canvas
      await loadCanvas(result.id);
    } catch (error) {
      console.error('Failed to create canvas:', error);
    }
  };

  // Convert screen coordinates to canvas coordinates
  const screenToCanvas = useCallback((screenX: number, screenY: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    
    const rect = canvasRef.current.getBoundingClientRect();
    const canvasX = (screenX - rect.left - viewOffset.x) / zoom;
    const canvasY = (screenY - rect.top - viewOffset.y) / zoom;
    
    return { x: canvasX, y: canvasY };
  }, [viewOffset, zoom]);

  // Update cursor position for collaboration
  const updateCursorPosition = useCallback(async (x: number, y: number) => {
    if (!currentCanvas) return;
    
    try {
      await trpc.updateCursor.mutate({
        canvas_id: currentCanvas.id,
        user_id: collaboration.userId,
        user_name: collaboration.userName,
        x,
        y
      });
    } catch (error) {
      console.error('Failed to update cursor:', error);
    }
  }, [currentCanvas, collaboration.userId, collaboration.userName]);

  // Handle mouse move on canvas
  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    const canvasPos = screenToCanvas(e.clientX, e.clientY);
    
    // Update cursor position for collaboration
    updateCursorPosition(canvasPos.x, canvasPos.y);

    if (isDragging && selectedShape && currentCanvas) {
      const deltaX = canvasPos.x - dragStart.x;
      const deltaY = canvasPos.y - dragStart.y;
      
      const updateData: UpdateShapeInput = {
        id: selectedShape.id,
        x: selectedShape.x + deltaX,
        y: selectedShape.y + deltaY
      };

      // Update shape position
      trpc.updateShape.mutate(updateData).then(() => {
        loadCanvas(currentCanvas.id);
      }).catch(error => {
        console.error('Failed to update shape:', error);
      });

      setDragStart(canvasPos);
    }
  }, [screenToCanvas, updateCursorPosition, isDragging, selectedShape, currentCanvas, dragStart, loadCanvas]);

  // Handle canvas click to create shapes
  const handleCanvasClick = useCallback(async (e: React.MouseEvent) => {
    if (!currentCanvas) return;
    
    const canvasPos = screenToCanvas(e.clientX, e.clientY);
    
    // If clicking on empty space, create new shape
    if (!selectedShape) {
      const shapeData: CreateShapeInput = {
        canvas_id: currentCanvas.id,
        type: selectedTool,
        x: canvasPos.x - 25, // Center the shape on cursor
        y: canvasPos.y - 25,
        width: 50,
        height: 50,
        color: selectedColor
      };

      try {
        await trpc.createShape.mutate(shapeData);
        await loadCanvas(currentCanvas.id);
      } catch (error) {
        console.error('Failed to create shape:', error);
      }
    }
  }, [currentCanvas, screenToCanvas, selectedShape, selectedTool, selectedColor, loadCanvas]);

  // Handle shape selection and dragging
  const handleShapeMouseDown = useCallback((shape: Shape, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedShape(shape);
    setIsDragging(true);
    const canvasPos = screenToCanvas(e.clientX, e.clientY);
    setDragStart(canvasPos);
  }, [screenToCanvas]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Delete selected shape
  const handleDeleteShape = useCallback(async () => {
    if (!selectedShape || !currentCanvas) return;
    
    try {
      await trpc.deleteShape.mutate({ id: selectedShape.id });
      setSelectedShape(null);
      await loadCanvas(currentCanvas.id);
    } catch (error) {
      console.error('Failed to delete shape:', error);
    }
  }, [selectedShape, currentCanvas, loadCanvas]);

  // Update shape color
  const handleColorChange = useCallback(async (color: string) => {
    setSelectedColor(color);
    
    if (!selectedShape || !currentCanvas) return;
    
    const updateData: UpdateShapeInput = {
      id: selectedShape.id,
      color: color
    };

    try {
      await trpc.updateShape.mutate(updateData);
      await loadCanvas(currentCanvas.id);
    } catch (error) {
      console.error('Failed to update shape color:', error);
    }
  }, [selectedShape, currentCanvas, loadCanvas]);

  // Render shape based on type
  const renderShape = (shape: Shape) => {
    const isSelected = selectedShape?.id === shape.id;
    const style = {
      position: 'absolute' as const,
      left: `${shape.x}px`,
      top: `${shape.y}px`,
      width: `${shape.width}px`,
      height: `${shape.height}px`,
      backgroundColor: shape.color,
      border: isSelected ? '2px solid #ef4444' : '1px solid #d1d5db',
      cursor: 'grab',
      zIndex: shape.z_index,
      transform: shape.type === 'triangle' ? 'none' : undefined
    };

    if (shape.type === 'triangle') {
      return (
        <div
          key={shape.id}
          style={{
            ...style,
            backgroundColor: 'transparent',
            width: `${shape.width}px`,
            height: `${shape.height}px`,
            clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
            background: shape.color
          }}
          onMouseDown={(e) => handleShapeMouseDown(shape, e)}
        />
      );
    }

    const borderRadius = shape.type === 'square' ? '0' : shape.type === 'rectangle' ? '4px' : '50%';

    return (
      <div
        key={shape.id}
        style={{ ...style, borderRadius }}
        onMouseDown={(e) => handleShapeMouseDown(shape, e)}
      />
    );
  };

  // Render other users' cursors
  const renderCursors = () => {
    return collaboration.cursors
      .filter(cursor => cursor.user_id !== collaboration.userId)
      .map(cursor => (
        <div
          key={cursor.id}
          className="absolute pointer-events-none z-50"
          style={{
            left: `${cursor.x}px`,
            top: `${cursor.y}px`,
            transform: 'translate(-2px, -2px)'
          }}
        >
          <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-lg" />
          <div className="bg-red-500 text-white text-xs px-2 py-1 rounded mt-1 whitespace-nowrap shadow-lg">
            {cursor.user_name}
          </div>
        </div>
      ));
  };

  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseUp]);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="border-b bg-white p-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900">🎨 Collaborative Canvas</h1>
          {currentCanvas && (
            <Badge variant="secondary" className="text-sm">
              {currentCanvas.name}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            👤 {collaboration.userName}
          </Badge>
          {collaboration.cursors.length > 1 && (
            <Badge variant="secondary" className="text-xs">
              🌐 {collaboration.cursors.length - 1} others online
            </Badge>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 border-r bg-white p-6 overflow-y-auto">
          {/* Canvas Management */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">📋 Canvases</h2>
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">+ New</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Canvas</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateCanvas} className="space-y-4">
                    <Input
                      placeholder="Canvas name"
                      value={newCanvasData.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setNewCanvasData(prev => ({ ...prev, name: e.target.value }))
                      }
                      required
                    />
                    <Input
                      placeholder="Description (optional)"
                      value={newCanvasData.description || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setNewCanvasData(prev => ({ 
                          ...prev, 
                          description: e.target.value || null 
                        }))
                      }
                    />
                    <Button type="submit" className="w-full">Create Canvas</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {isLoadingCanvases ? (
              <div className="text-center py-4 text-gray-500">Loading canvases...</div>
            ) : canvases.length === 0 ? (
              <div className="text-center py-4 text-gray-500">No canvases yet</div>
            ) : (
              <div className="space-y-2">
                {canvases.map((canvas: Canvas) => (
                  <Card 
                    key={canvas.id} 
                    className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                      currentCanvas?.id === canvas.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => loadCanvas(canvas.id)}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">{canvas.name}</CardTitle>
                    </CardHeader>
                    {canvas.description && (
                      <CardContent className="pt-0">
                        <p className="text-xs text-gray-600">{canvas.description}</p>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Tools */}
          {currentCanvas && (
            <>
              <div className="mb-6">
                <h3 className="text-md font-medium mb-3">🛠️ Tools</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Shape</label>
                    <Select value={selectedTool} onValueChange={(value: ShapeType) => setSelectedTool(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rectangle">📱 Rectangle</SelectItem>
                        <SelectItem value="square">⬜ Square</SelectItem>
                        <SelectItem value="triangle">🔺 Triangle</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Color</label>
                    <div className="flex gap-2 flex-wrap">
                      {['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'].map(color => (
                        <button
                          key={color}
                          className={`w-8 h-8 rounded border-2 transition-all ${
                            selectedColor === color ? 'border-gray-800 scale-110' : 'border-gray-300'
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => handleColorChange(color)}
                        />
                      ))}
                    </div>
                    <Input
                      type="color"
                      value={selectedColor}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleColorChange(e.target.value)}
                      className="mt-2 h-10"
                    />
                  </div>
                </div>
              </div>

              {/* Selected Shape Actions */}
              {selectedShape && (
                <div className="mb-6">
                  <h3 className="text-md font-medium mb-3">✏️ Selected Shape</h3>
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600">
                      {selectedShape.type} at ({Math.round(selectedShape.x)}, {Math.round(selectedShape.y)})
                    </div>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={handleDeleteShape}
                      className="w-full"
                    >
                      🗑️ Delete Shape
                    </Button>
                  </div>
                </div>
              )}

              {/* Canvas Info */}
              <div>
                <h3 className="text-md font-medium mb-3">📊 Canvas Info</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <div>Shapes: {currentCanvas.shapes.length}</div>
                  <div>Zoom: {Math.round(zoom * 100)}%</div>
                  <div>Online Users: {collaboration.cursors.length}</div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Canvas Area */}
        <div className="flex-1 relative overflow-hidden">
          {!currentCanvas ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <div className="text-6xl mb-4">🎨</div>
                <div className="text-xl mb-2">Select a canvas to start drawing</div>
                <div className="text-sm">or create a new one to get started</div>
              </div>
            </div>
          ) : isLoadingCanvas ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <div className="text-2xl mb-2">Loading canvas...</div>
              </div>
            </div>
          ) : (
            <div
              ref={canvasRef}
              className="w-full h-full relative cursor-crosshair"
              style={{ 
                backgroundImage: 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)',
                backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
                backgroundPosition: `${viewOffset.x}px ${viewOffset.y}px`
              }}
              onClick={handleCanvasClick}
              onMouseMove={handleCanvasMouseMove}
            >
              {/* Canvas content with zoom and offset */}
              <div
                style={{
                  transform: `translate(${viewOffset.x}px, ${viewOffset.y}px) scale(${zoom})`,
                  transformOrigin: '0 0',
                  width: '100%',
                  height: '100%',
                  position: 'relative'
                }}
              >
                {/* Render shapes */}
                {currentCanvas.shapes.map((shape: Shape) => renderShape(shape))}
                
                {/* Render other users' cursors */}
                {renderCursors()}
              </div>

              {/* Zoom controls */}
              <div className="absolute bottom-4 right-4 flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setZoom(prev => Math.max(0.1, prev - 0.1))}
                >
                  🔍−
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setZoom(1)}
                >
                  1:1
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setZoom(prev => Math.min(3, prev + 0.1))}
                >
                  🔍+
                </Button>
              </div>

              {/* Instructions overlay */}
              {currentCanvas.shapes.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="bg-white bg-opacity-90 p-6 rounded-lg text-center shadow-lg">
                    <div className="text-4xl mb-2">✨</div>
                    <div className="text-lg font-medium mb-2">Start Creating!</div>
                    <div className="text-sm text-gray-600">
                      Click anywhere on the canvas to add a {selectedTool}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
