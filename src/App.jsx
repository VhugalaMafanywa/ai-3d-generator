import { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage, Environment, useGLTF } from '@react-three/drei';
import axios from 'axios';
import { 
  Beaker, 
  Upload, 
  Brain, 
  RotateCw, 
  AlertCircle, 
  Image as ImageIcon,
  MousePointerClick,
  Download 
} from 'lucide-react';

function RealModel({ url }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} scale={2.5} />;
}

function App() {
  const [prompt, setPrompt] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [modelUrl, setModelUrl] = useState(null);
  const [summary, setSummary] = useState('');
  const [error, setError] = useState('');

  const BACKEND_URL = 'https://ai-3d-generator-6.onrender.com/';

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('Image too large (max 10MB)');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreview(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  const toBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
    });

  const handleGenerate = async () => {
    if (!prompt.trim() && !imageFile) {
      alert('Please enter a description or upload an image');
      return;
    }

    setIsGenerating(true);
    setError('');
    setModelUrl(null);
    setSummary('');
    setImagePreview(null);

    try {
      let imageBase64 = null;
      if (imageFile) {
        imageBase64 = await toBase64(imageFile);
      }

      const response = await axios.post(`${BACKEND_URL}/analyze`, {
        text: prompt.trim(),
        image: imageBase64,
      }, {
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        timeout: 180000,
      });

      setModelUrl(response.data.model_url);
      setSummary(response.data.summary || '');

    } catch (err) {
      console.error('Full error:', err);
      let errorMsg = 'Unknown error';
      if (err.response) {
        const data = err.response.data;
        errorMsg = data?.error || data?.message || JSON.stringify(data).slice(0, 200);
      } else if (err.request) {
        errorMsg = 'Backend server is not responding. Is Flask running?';
      } else {
        errorMsg = err.message;
      }
      setError(`❌ ${errorMsg}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-zinc-950 text-white">
      {/* Header */}
      <div className="h-14 border-b border-zinc-800 flex items-center px-6 text-lg font-semibold">
        <Beaker className="w-6 h-6 mr-3 text-blue-500" />
        AI 3D Asset Generator
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Input */}
        <div className="w-80 border-r border-zinc-800 p-6 flex flex-col gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-5 h-5 text-blue-400" />
              <label className="block text-sm font-medium">Text Description</label>
            </div>
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="yellow hard hat, fire extinguisher..."
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500"
              disabled={isGenerating}
            />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <ImageIcon className="w-5 h-5 text-blue-400" />
              <label className="block text-sm font-medium">Or upload an image</label>
            </div>
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-zinc-700 rounded-2xl cursor-pointer hover:border-blue-500 transition-colors">
              <Upload className="w-8 h-8 text-zinc-400 mb-2" />
              <span className="text-sm text-zinc-400">Choose File</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                disabled={isGenerating}
                className="hidden"
              />
            </label>
            {imagePreview && (
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="mt-4 w-full rounded-2xl border border-zinc-700" 
              />
            )}
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="mt-auto bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 px-6 py-4 rounded-2xl font-medium text-lg transition-all flex items-center justify-center gap-3"
          >
            {isGenerating ? (
              <>
                <RotateCw className="w-5 h-5 animate-spin" />
                Generating 3D Model...
              </>
            ) : (
              'Generate 3D Model'
            )}
          </button>

          {error && (
            <div className="p-4 bg-red-900/30 border border-red-500 rounded-2xl text-sm flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>{error}</div>
            </div>
          )}
        </div>

        {/* 3D Viewer */}
        <div className="flex-1 flex flex-col relative bg-zinc-900">
          <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
            <Stage environment="city" intensity={0.6}>
              {modelUrl ? (
                <RealModel url={modelUrl} />
              ) : (
                <mesh rotation={[0, Math.PI / 4, 0]}>
                  <boxGeometry args={[1.5, 1.5, 1.5]} />
                  <meshStandardMaterial color="#000000" />
                </mesh>
              )}
            </Stage>
            <OrbitControls enablePan enableZoom enableRotate />
            <Environment preset="city" />
          </Canvas>

          {/* Download Button - appears only when model is loaded */}
          {modelUrl && (
            <a
              href={modelUrl}
              download
              className="absolute bottom-6 right-6 bg-zinc-800 hover:bg-zinc-700 text-white px-5 py-3 rounded-2xl flex items-center gap-2 text-sm font-medium transition-all shadow-xl border border-zinc-600 hover:border-blue-500"
            >
              <Download className="w-4 h-4" />
              Download 
            </a>
          )}

          {/* Instructions */}
          <div className="absolute bottom-6 left-6 bg-black/70 text-xs px-4 py-2 rounded-2xl flex items-center gap-2">
            <MousePointerClick className="w-4 h-4" />
            Drag to rotate • Scroll with two fingers to zoom
          </div>
        </div>

        {/* Educational Summary */}
        <div className="w-80 border-l border-zinc-800 p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold">Educational Summary</h2>
          </div>
          <div className="flex-1 bg-zinc-900 rounded-3xl p-6 text-sm leading-relaxed text-zinc-300 overflow-auto">
            {summary || 'Generate a model to see the AI-powered educational summary here.'}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
