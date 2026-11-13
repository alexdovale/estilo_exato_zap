import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  MapPin, 
  Navigation, 
  Sparkles, 
  ExternalLink, 
  Copy, 
  Check, 
  Send, 
  Compass, 
  Layers, 
  Clock, 
  Phone, 
  Car,
  Train,
  Coffee,
  AlertCircle
} from 'lucide-react';
import { 
  APIProvider, 
  Map as GoogleMap, 
  AdvancedMarker, 
  Pin,
  InfoWindow 
} from '@vis.gl/react-google-maps';
import { AtelierProfile } from '../types';

interface AtelierLocationModalProps {
  atelier: AtelierProfile;
  onClose: () => void;
}

interface GroundingMapSource {
  title?: string;
  uri?: string;
}

interface GroundingChunk {
  maps?: {
    uri?: string;
    title?: string;
    placeAnswerSources?: {
      reviewSnippets?: Array<{ reviewText?: string; authorAttribution?: { displayName?: string } }>;
    };
  };
  web?: {
    uri?: string;
    title?: string;
  };
}

export const AtelierLocationModal: React.FC<AtelierLocationModalProps> = ({
  atelier,
  onClose,
}) => {
  // Google Maps API Key
  const [apiKey, setApiKey] = useState<string>(
    ((import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY as string) || ''
  );

  useEffect(() => {
    if (!apiKey) {
      fetch('/api/maps/config')
        .then((res) => res.json())
        .then((data) => {
          if (data.apiKey) setApiKey(data.apiKey);
        })
        .catch((e) => console.error('Erro ao obter chave do Google Maps:', e));
    }
  }, [apiKey]);

  // Default atelier coordinates (São Paulo - Jardins/Paulista)
  const atelierCoords = {
    lat: -23.561414,
    lng: -46.655881,
  };

  const addressText = atelier.endereco?.endereco 
    ? `${atelier.endereco.endereco}, ${atelier.endereco.cidade} - ${atelier.endereco.cep}`
    : 'Rua Oscar Freire, 1200 - Jardins, São Paulo - SP, 01426-000';

  const [copied, setCopied] = useState(false);
  const [isMarkerOpen, setIsMarkerOpen] = useState(true);

  // Maps Grounding AI Assistant State (Gemini 3.8 Flash + googleMaps tool)
  const [userQuery, setUserQuery] = useState('');
  const [isAskingAI, setIsAskingAI] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [groundingSources, setGroundingSources] = useState<GroundingMapSource[]>([]);
  const [aiError, setAiError] = useState<string | null>(null);

  // User location for proximity-based questions
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
        },
        (err) => {
          console.warn('Geolocalização não concedida pelo usuário:', err.message);
        },
        { timeout: 5000 }
      );
    }
  }, []);

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(addressText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenGoogleMaps = () => {
    const query = encodeURIComponent(`${atelier.nome_negocio} ${addressText}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  const handleAskGrounding = async (queryText?: string) => {
    const promptToSend = queryText || userQuery;
    if (!promptToSend.trim()) return;

    setIsAskingAI(true);
    setAiError(null);
    setAiResponse(null);
    setGroundingSources([]);

    try {
      const fullPrompt = `Você é o assistente inteligente de localização e recepção do estabelecimento "${atelier.nome_negocio}".
Endereço do estabelecimento: ${addressText}.
Coordenadas: latitude ${atelierCoords.lat}, longitude ${atelierCoords.lng}.
Pergunta do cliente: "${promptToSend.trim()}".
Use a ferramenta do Google Maps para fornecer informações precisas, tempo estimado, rotas, estações de metrô ou pontos de referência próximos em português do Brasil, de forma amigável, clara e concisa.`;

      const response = await fetch('/api/maps/grounding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: fullPrompt,
          location: userLocation || {
            latitude: atelierCoords.lat,
            longitude: atelierCoords.lng,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Não foi possível obter a resposta no momento.');
      }

      setAiResponse(data.text);

      // Extract mandatory Maps Grounding sources
      const sources: GroundingMapSource[] = [];
      if (Array.isArray(data.groundingChunks)) {
        data.groundingChunks.forEach((chunk: GroundingChunk) => {
          if (chunk.maps?.uri) {
            sources.push({
              title: chunk.maps.title || 'Ver no Google Maps',
              uri: chunk.maps.uri,
            });
          }
          if (chunk.web?.uri && !chunk.maps?.uri) {
            sources.push({
              title: chunk.web.title || 'Fonte no Google',
              uri: chunk.web.uri,
            });
          }
        });
      }
      setGroundingSources(sources);
      if (!queryText) setUserQuery('');
    } catch (err: any) {
      console.error('Erro na consulta com Google Maps Grounding:', err);
      setAiError(err.message || 'Erro ao consultar o Google Maps.');
    } finally {
      setIsAskingAI(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 overflow-y-auto">
      <div className="min-h-screen max-w-3xl mx-auto p-4 sm:p-8 flex flex-col justify-between select-none">
        <div>
          {/* Header Bar */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={onClose}
              className="p-2 -ml-2 rounded-xl text-[#F2CA50] hover:bg-white/5 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6" />
              <span className="text-xs font-bold tracking-wider uppercase">Voltar</span>
            </button>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#25D366] animate-pulse" />
              <span className="font-heading font-black text-xs uppercase tracking-widest text-[#25D366]">
                GOOGLE MAPS PLATFORM
              </span>
            </div>
          </div>

          {/* Title Section */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#F2CA50]/15 border border-[#F2CA50]/30 flex items-center justify-center text-[#F2CA50] shrink-0">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-white">
                  Localização & Como Chegar
                </h1>
                <p className="text-xs text-white/50 mt-0.5">
                  Mapa interativo em tempo real e assistente de trajeto com inteligência artificial.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyAddress}
                className="py-2 px-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white text-xs font-bold border border-white/10 flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copiado!' : 'Copiar Endereço'}</span>
              </button>

              <button
                type="button"
                onClick={handleOpenGoogleMaps}
                className="py-2 px-4 rounded-xl bg-[#25D366] hover:bg-[#20b858] text-black font-heading font-black text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-lg transition-transform active:scale-95"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Navegar</span>
              </button>
            </div>
          </div>

          {/* Interactive Google Map Card */}
          <div className="mb-6 rounded-3xl bg-[#1C1C1B] border border-white/10 overflow-hidden shadow-2xl">
            {/* Map Canvas with mandatory zero-legacy standards and explicit height */}
            <div className="w-full h-80 sm:h-96 relative bg-[#131313]">
              {apiKey ? (
                <APIProvider apiKey={apiKey} language="pt-BR" region="BR">
                  <GoogleMap
                    mapId="DEMO_MAP_ID"
                    internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                    defaultCenter={atelierCoords}
                    defaultZoom={16}
                    gestureHandling="greedy"
                    disableDefaultUI={false}
                    className="w-full h-full"
                  >
                    <AdvancedMarker
                      position={atelierCoords}
                      onClick={() => setIsMarkerOpen(!isMarkerOpen)}
                      title={atelier.nome_negocio}
                    >
                      <Pin
                        background="#F2CA50"
                        glyphColor="#131313"
                        borderColor="#ffffff"
                        scale={1.25}
                      />
                    </AdvancedMarker>

                    {isMarkerOpen && (
                      <InfoWindow
                        position={atelierCoords}
                        onCloseClick={() => setIsMarkerOpen(false)}
                      >
                        <div className="p-1 max-w-[220px] text-zinc-900 select-text">
                          <h4 className="font-bold text-sm text-black">{atelier.nome_negocio}</h4>
                          <p className="text-[11px] text-zinc-600 mt-1 leading-snug">
                            {addressText}
                          </p>
                          <div className="mt-2 pt-2 border-t border-zinc-200 flex items-center justify-between text-[11px]">
                            <span className="font-bold text-emerald-700 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                              Aberto Agora
                            </span>
                            <button
                              onClick={handleOpenGoogleMaps}
                              className="text-blue-600 font-bold hover:underline cursor-pointer"
                            >
                              Rotas ➔
                            </button>
                          </div>
                        </div>
                      </InfoWindow>
                    )}
                  </GoogleMap>
                </APIProvider>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-white/40">
                  <MapPin className="w-10 h-10 mb-2 animate-bounce text-[#F2CA50]" />
                  <p className="text-xs font-bold text-white">Carregando mapa interativo...</p>
                  <p className="text-[11px] mt-1 text-white/50">
                    Sincronizando chave do Google Maps Platform.
                  </p>
                </div>
              )}

              {/* Float Badge Over Map */}
              <div className="absolute top-3 left-3 bg-[#131313]/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10 text-xs shadow-lg flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#F2CA50]" />
                <span className="font-heading font-bold text-white text-xs">{atelier.nome_negocio}</span>
              </div>
            </div>

            {/* Address & Quick Info Banner */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-black/60 to-black/30 border-t border-white/5 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#F2CA50] shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-white/40 block">Endereço</span>
                  <span className="text-white/90 text-xs font-medium leading-relaxed">{addressText}</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-[#25D366] shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-white/40 block">Horário de Funcionamento</span>
                  <span className="text-white/90 text-xs font-medium">Seg a Sáb: 09:00 às 20:00</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-white/40 block">Contato & Agendamentos</span>
                  <span className="text-white/90 text-xs font-medium">WhatsApp integrado disponível</span>
                </div>
              </div>
            </div>
          </div>

          {/* AI Grounded Location Assistant Section (Gemini 3.8 Flash + Google Maps Tool) */}
          <div className="p-5 sm:p-6 rounded-3xl bg-[#1C1C1B] border border-white/10 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-heading font-black text-sm text-white flex items-center gap-2">
                    <span>Assistente de Trajeto com Google Maps (IA)</span>
                    <span className="px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 text-[10px] font-bold border border-purple-500/30">
                      Gemini 3.8 Flash + Maps Grounding
                    </span>
                  </h3>
                  <p className="text-[11px] text-white/40 mt-0.5">
                    Informações em tempo real sobre rotas, transporte público, estacionamentos e pontos próximos.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Suggestions Buttons */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider shrink-0 mr-1">
                Perguntas rápidas:
              </span>
              <button
                type="button"
                onClick={() => handleAskGrounding('Como chegar de metrô ou transporte público até a barbearia?')}
                disabled={isAskingAI}
                className="px-3 py-1.5 rounded-xl bg-black/40 hover:bg-black/60 text-white/80 hover:text-white text-xs border border-white/10 flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors"
              >
                <Train className="w-3.5 h-3.5 text-blue-400" />
                <span>Como chegar de Metrô?</span>
              </button>

              <button
                type="button"
                onClick={() => handleAskGrounding('Onde tem estacionamento próximo para deixar o carro?')}
                disabled={isAskingAI}
                className="px-3 py-1.5 rounded-xl bg-black/40 hover:bg-black/60 text-white/80 hover:text-white text-xs border border-white/10 flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors"
              >
                <Car className="w-3.5 h-3.5 text-[#F2CA50]" />
                <span>Estacionamentos Próximos</span>
              </button>

              <button
                type="button"
                onClick={() => handleAskGrounding('Quais são os cafés e pontos de referência perto do atelier?')}
                disabled={isAskingAI}
                className="px-3 py-1.5 rounded-xl bg-black/40 hover:bg-black/60 text-white/80 hover:text-white text-xs border border-white/10 flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors"
              >
                <Coffee className="w-3.5 h-3.5 text-orange-400" />
                <span>Cafés e Pontos de Apoio</span>
              </button>
            </div>

            {/* Query Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAskGrounding();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                placeholder="Ex: Como está o trajeto saindo da Av. Paulista? Ou tem vagas na rua?"
                disabled={isAskingAI}
                className="flex-1 px-4 py-3 rounded-2xl bg-black/50 text-white text-xs border border-white/10 focus:border-purple-400 focus:outline-none placeholder:text-white/30"
              />
              <button
                type="submit"
                disabled={isAskingAI || !userQuery.trim()}
                className="px-5 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-heading font-black text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-lg transition-transform active:scale-95 disabled:opacity-40"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isAskingAI ? 'Consultando...' : 'Perguntar'}</span>
              </button>
            </form>

            {/* Loading Indicator */}
            {isAskingAI && (
              <div className="p-6 rounded-2xl bg-black/40 border border-purple-500/20 flex items-center justify-center gap-3 text-xs text-purple-300">
                <Sparkles className="w-4 h-4 animate-spin text-purple-400" />
                <span>Buscando dados em tempo real no Google Maps...</span>
              </div>
            )}

            {/* Error Message */}
            {aiError && (
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{aiError}</span>
              </div>
            )}

            {/* AI Grounded Output & Links */}
            {aiResponse && !isAskingAI && (
              <div className="p-5 rounded-2xl bg-black/60 border border-purple-500/30 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-purple-400 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3" />
                    Resposta Baseada no Google Maps
                  </span>
                  <span className="text-[10px] text-white/40">Grounded with Gemini 3.8 Flash</span>
                </div>

                <div className="text-xs text-white/90 leading-relaxed font-sans whitespace-pre-wrap">
                  {aiResponse}
                </div>

                {/* Mandatory Grounding Links / Attribution */}
                {groundingSources.length > 0 && (
                  <div className="pt-3 border-t border-white/10 space-y-2">
                    <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider block">
                      Fontes e Locais no Google Maps:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {groundingSources.map((source, idx) => (
                        <a
                          key={idx}
                          href={source.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-[#25D366] text-xs font-bold transition-colors cursor-pointer"
                        >
                          <MapPin className="w-3 h-3" />
                          <span className="truncate max-w-[200px]">{source.title || 'Ver Local'}</span>
                          <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-8 text-center text-white/20 text-xs">
          EstiloExatoZap • Powered by Google Maps Platform & Gemini 3.8 Flash
        </div>
      </div>
    </div>
  );
};
