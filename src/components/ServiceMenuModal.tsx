import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  Plus,
  Trash2,
  Clock,
  X,
  Package,
  AlertTriangle,
  Link2,
  Scissors,
  History,
  Check,
  ArrowDownRight,
  ArrowUpRight,
  Sliders,
  Camera,
  ImagePlus,
  Upload,
} from 'lucide-react';
import {
  ServiceItem,
  InventoryProduct,
  InventoryMovement,
  ServiceProductUsage,
} from '../types';
import { serviceRepository, inventoryRepository } from '../services/store';

interface ServiceMenuModalProps {
  atelierId: string;
  initialTab?: 'servicos' | 'estoque';
  onClose: () => void;
}

export const ServiceMenuModal: React.FC<ServiceMenuModalProps> = ({
  atelierId,
  initialTab = 'servicos',
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'servicos' | 'estoque'>(initialTab);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Add Service Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('30');
  const [isLoading, setIsLoading] = useState(false);

  // Add Product Modal
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [prodName, setProdName] = useState('');
  const [prodPhotoUrl, setProdPhotoUrl] = useState('');
  const [prodCategory, setProdCategory] = useState<InventoryProduct['categoria']>('consumo_interno');
  const [prodUnit, setProdUnit] = useState('un');
  const [prodQty, setProdQty] = useState('20');
  const [prodMinQty, setProdMinQty] = useState('5');
  const [prodCost, setProdCost] = useState('');
  const [prodAssociations, setProdAssociations] = useState<ServiceProductUsage[]>([]);

  // Edit Photo Modal for existing product
  const [photoEditingProduct, setPhotoEditingProduct] = useState<InventoryProduct | null>(null);
  const [tempEditPhotoUrl, setTempEditPhotoUrl] = useState('');

  // Associate Services Modal for an existing product
  const [associatingProduct, setAssociatingProduct] = useState<InventoryProduct | null>(null);
  const [editingAssociations, setEditingAssociations] = useState<ServiceProductUsage[]>([]);
  const [editingMinProductId, setEditingMinProductId] = useState<string | null>(null);
  const [tempMinValue, setTempMinValue] = useState<string>('5');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadData = () => {
    setServices(serviceRepository.getServices(atelierId));
    setProducts(inventoryRepository.getProducts(atelierId));
    setMovements(inventoryRepository.getMovements(atelierId));
  };

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('estilo_store_updated', handleUpdate);
    return () => window.removeEventListener('estilo_store_updated', handleUpdate);
  }, [atelierId]);

  const lowStockProducts = products.filter((p) => p.quantidadeAtual <= p.estoqueMinimo);
  const totalAutoLinks = products.reduce((acc, p) => acc + (p.servicosAssociados?.length || 0), 0);

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    try {
      await serviceRepository.addService(
        atelierId,
        name.trim(),
        parseFloat(price) || 0,
        parseInt(duration, 10) || 30
      );
      setName('');
      setPrice('');
      setDuration('30');
      setIsAddModalOpen(false);
      loadData();
      showToast('Serviço adicionado ao catálogo!');
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteService = async (id: string) => {
    await serviceRepository.deleteService(id);
    loadData();
  };

  const handleToggleAssocInList = (
    list: ServiceProductUsage[],
    setList: React.Dispatch<React.SetStateAction<ServiceProductUsage[]>>,
    service: ServiceItem
  ) => {
    const exists = list.some((a) => a.serviceId === service.id);
    if (exists) {
      setList(list.filter((a) => a.serviceId !== service.id));
    } else {
      setList([
        ...list,
        {
          serviceId: service.id,
          serviceName: service.nome,
          consumoPorAtendimento: 1,
        },
      ]);
    }
  };

  const handleUpdateAssocQtyInList = (
    list: ServiceProductUsage[],
    setList: React.Dispatch<React.SetStateAction<ServiceProductUsage[]>>,
    serviceId: string,
    qty: number
  ) => {
    const safeQty = Math.max(1, qty);
    setList(
      list.map((a) => (a.serviceId === serviceId ? { ...a, consumoPorAtendimento: safeQty } : a))
    );
  };

  const compressImageToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Falha ao ler imagem'));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error('Formato de imagem inválido'));
        img.onload = () => {
          const maxSize = 360;
          let { width, height } = img;
          if (width > height && width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          } else if (height >= width && height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(String(reader.result || ''));
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.82));
        };
        img.src = String(reader.result || '');
      };
      reader.readAsDataURL(file);
    });
  };

  const handlePhotoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    onResult: (dataUrl: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageToDataUrl(file);
      onResult(compressed);
    } catch {
      showToast('Não foi possível processar a imagem selecionada.');
    } finally {
      e.target.value = '';
    }
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim()) return;

    inventoryRepository.addProduct(atelierId, {
      nome: prodName.trim(),
      fotoUrl: prodPhotoUrl.trim() || undefined,
      categoria: prodCategory,
      unidade: prodUnit.trim() || 'un',
      quantidadeAtual: Math.max(0, parseInt(prodQty, 10) || 0),
      estoqueMinimo: Math.max(0, parseInt(prodMinQty, 10) || 0),
      custoUnitario: prodCost ? parseFloat(prodCost) : undefined,
      servicosAssociados: prodAssociations,
    });

    setProdName('');
    setProdPhotoUrl('');
    setProdCategory('consumo_interno');
    setProdUnit('un');
    setProdQty('20');
    setProdMinQty('5');
    setProdCost('');
    setProdAssociations([]);
    setIsAddProductOpen(false);
    loadData();
    showToast('Produto cadastrado no estoque com sucesso!');
  };

  const handleOpenPhotoModal = (product: InventoryProduct) => {
    setPhotoEditingProduct(product);
    setTempEditPhotoUrl(product.fotoUrl || '');
  };

  const handleSaveProductPhoto = () => {
    if (!photoEditingProduct) return;
    inventoryRepository.updateProduct(photoEditingProduct.id, {
      fotoUrl: tempEditPhotoUrl.trim() || undefined,
    });
    setPhotoEditingProduct(null);
    setTempEditPhotoUrl('');
    loadData();
    showToast('Foto do produto atualizada!');
  };

  const handleOpenAssociations = (product: InventoryProduct) => {
    setAssociatingProduct(product);
    setEditingAssociations(product.servicosAssociados ? [...product.servicosAssociados] : []);
  };

  const handleSaveAssociations = () => {
    if (!associatingProduct) return;
    inventoryRepository.setProductServiceAssociations(associatingProduct.id, editingAssociations);
    setAssociatingProduct(null);
    loadData();
    showToast('Vínculos de baixa automática atualizados!');
  };

  const handleSaveMinStock = (productId: string) => {
    const val = Math.max(0, parseInt(tempMinValue, 10) || 0);
    inventoryRepository.updateProduct(productId, { estoqueMinimo: val });
    setEditingMinProductId(null);
    loadData();
    showToast(`Nível mínimo atualizado para ${val}.`);
  };

  const categoryLabels: Record<InventoryProduct['categoria'], string> = {
    consumo_interno: 'Consumo nos Atendimentos',
    higiene_descartaveis: 'Higiene & Descartáveis',
    revenda: 'Produto de Revenda',
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 overflow-y-auto">
      <div className={`min-h-screen ${activeTab === 'estoque' ? 'max-w-3xl' : 'max-w-xl'} mx-auto p-6 sm:p-8 flex flex-col justify-between transition-all`}>
        <div>
          {/* Top Bar */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={onClose}
              className="p-2 -ml-2 rounded-xl text-[#F2CA50] hover:bg-white/5 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6" />
              <span className="text-xs font-bold tracking-wider uppercase">Voltar</span>
            </button>
            <span className="font-heading font-black text-xs uppercase tracking-widest text-[#F2CA50]">
              CATÁLOGO & ESTOQUE
            </span>
          </div>

          <div className="mb-6">
            <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-white">
              {activeTab === 'servicos' ? 'Menu de Serviços' : 'Gestão de Estoque de Produtos'}
            </h2>
            <p className="text-xs text-white/50 mt-1">
              {activeTab === 'servicos'
                ? 'Personalize os serviços, valores e acompanhe insumos vinculados.'
                : 'Cadastre produtos usados nos atendimentos, defina alertas mínimos e associe serviços para baixa automática.'}
            </p>
          </div>

          {/* Segmented Tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-[#1C1C1B] border border-white/10 mb-6 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('servicos')}
              className={`py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'servicos'
                  ? 'bg-[#F2CA50] text-black shadow-md font-black'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Scissors className="w-4 h-4 shrink-0" />
              <span>Serviços ({services.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('estoque')}
              className={`py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'estoque'
                  ? 'bg-[#F2CA50] text-black shadow-md font-black'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Package className="w-4 h-4 shrink-0" />
              <span>Gestão de Estoque</span>
              {lowStockProducts.length > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-black leading-none ${
                    activeTab === 'estoque'
                      ? 'bg-red-600 text-white'
                      : 'bg-red-500 text-white animate-pulse'
                  }`}
                >
                  {lowStockProducts.length}
                </span>
              )}
            </button>
          </div>

          {/* TAB 1: MENU DE SERVIÇOS */}
          {activeTab === 'servicos' && (
            <div className="space-y-3">
              {services.length === 0 ? (
                <div className="py-16 text-center text-white/30 text-sm">
                  Nenhum serviço cadastrado ainda.
                </div>
              ) : (
                services.map((item) => {
                  const linkedProducts = products.filter((p) =>
                    p.servicosAssociados?.some((a) => a.serviceId === item.id)
                  );

                  return (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl bg-[#1C1C1B] border border-white/5 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 space-y-1">
                        <h3 className="font-heading font-bold text-white text-sm truncate">
                          {item.nome}
                        </h3>
                        <div className="text-xs text-white/40 flex items-center gap-2 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-[#F2CA50]" />
                            <span>{item.duracao} min</span>
                          </span>
                          {linkedProducts.length > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold flex items-center gap-1">
                              <Link2 className="w-3 h-3" />
                              <span>{linkedProducts.length} produto(s) p/ baixa auto</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="font-heading font-black text-[#F2CA50] text-sm">
                          R$ {item.preco.toFixed(2)}
                        </span>
                        <button
                          onClick={() => handleDeleteService(item.id)}
                          title="Excluir serviço"
                          className="p-2 rounded-lg text-white/30 hover:text-red-400 hover:bg-white/5 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 2: GESTÃO DE ESTOQUE DE PRODUTOS */}
          {activeTab === 'estoque' && (
            <div className="space-y-6">
              {/* Banner de Alerta de Reposição */}
              {lowStockProducts.length > 0 && (
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-red-950/60 via-[#1C1C1B] to-amber-950/30 border border-red-500/40 space-y-3 shadow-xl">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-heading font-black text-sm text-white flex items-center gap-2 flex-wrap">
                        <span>Alerta de Reposição de Estoque</span>
                        <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 text-[10px] font-black border border-red-500/30">
                          {lowStockProducts.length} {lowStockProducts.length === 1 ? 'item crítico' : 'itens críticos'}
                        </span>
                      </h3>
                      <p className="text-xs text-white/60 mt-0.5">
                        Os produtos abaixo atingiram ou ficaram abaixo do nível mínimo definido para reposição:
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {lowStockProducts.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-xl bg-black/50 border border-red-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2.5 text-xs min-w-0">
                          {item.fotoUrl && (
                            <img
                              src={item.fotoUrl}
                              alt={item.nome}
                              className="w-8 h-8 rounded-lg object-cover border border-white/10 shrink-0"
                            />
                          )}
                          <div className="min-w-0">
                            <span className="font-bold text-white">{item.nome}</span>
                            <span className="text-red-300 ml-2 font-semibold">
                              Restam {item.quantidadeAtual} {item.unidade} (mín. {item.estoqueMinimo} {item.unidade})
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            inventoryRepository.adjustStock(item.id, 10, 'entrada', 'Reposição rápida (+10)');
                            loadData();
                            showToast(`+10 ${item.unidade} adicionados a ${item.nome}!`);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-[#25D366] hover:bg-[#20b858] text-black font-heading font-black text-[11px] uppercase tracking-wider cursor-pointer transition-transform active:scale-95 self-start sm:self-auto shrink-0"
                        >
                          +10 Repor Agora
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* KPIs de Estoque */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-[#1C1C1B] border border-white/10">
                  <div className="text-[10px] font-black uppercase tracking-wider text-white/40">
                    Produtos Ativos
                  </div>
                  <div className="font-heading text-2xl font-black text-white mt-1">
                    {products.length}
                  </div>
                  <div className="text-[10px] text-white/40">No catálogo de insumos</div>
                </div>

                <div className={`p-3.5 rounded-2xl bg-[#1C1C1B] border ${lowStockProducts.length > 0 ? 'border-red-500/40' : 'border-emerald-500/30'}`}>
                  <div className={`text-[10px] font-black uppercase tracking-wider ${lowStockProducts.length > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    Alertas de Reposição
                  </div>
                  <div className={`font-heading text-2xl font-black mt-1 ${lowStockProducts.length > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {lowStockProducts.length}
                  </div>
                  <div className="text-[10px] text-white/40">Abaixo ou no mínimo</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#1C1C1B] border border-[#F2CA50]/25">
                  <div className="text-[10px] font-black uppercase tracking-wider text-[#F2CA50]">
                    Baixas Automáticas
                  </div>
                  <div className="font-heading text-2xl font-black text-[#F2CA50] mt-1">
                    {totalAutoLinks}
                  </div>
                  <div className="text-[10px] text-white/40">Vínculos c/ serviços</div>
                </div>
              </div>

              {/* Lista de Produtos em Estoque */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#F2CA50]">
                    INSUMOS & PRODUTOS CADASTRADOS ({products.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsAddProductOpen(true)}
                    className="px-3.5 py-2 rounded-xl bg-[#F2CA50] hover:bg-[#ebd05d] text-black font-heading font-black text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Novo Produto</span>
                  </button>
                </div>

                {products.length === 0 ? (
                  <div className="p-12 text-center text-white/30 text-sm rounded-2xl bg-[#1C1C1B] border border-white/5">
                    Nenhum produto cadastrado no estoque ainda.
                  </div>
                ) : (
                  products.map((product) => {
                    const isOut = product.quantidadeAtual === 0;
                    const isLow = product.quantidadeAtual <= product.estoqueMinimo;
                    const referenceMax = Math.max(product.estoqueMinimo * 3, product.quantidadeAtual, 10);
                    const pct = Math.min(100, Math.round((product.quantidadeAtual / referenceMax) * 100));

                    return (
                      <div
                        key={product.id}
                        className={`p-4 sm:p-5 rounded-2xl bg-[#1C1C1B] border space-y-3.5 transition-all ${
                          isOut
                            ? 'border-red-500/50'
                            : isLow
                            ? 'border-amber-500/40'
                            : 'border-white/10'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="flex items-start gap-3.5 min-w-0">
                            <button
                              type="button"
                              onClick={() => handleOpenPhotoModal(product)}
                              title={product.fotoUrl ? 'Alterar foto do produto' : 'Adicionar foto do produto'}
                              className="group relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-black/50 border border-white/10 hover:border-[#F2CA50]/60 overflow-hidden flex items-center justify-center shrink-0 cursor-pointer transition-colors"
                            >
                              {product.fotoUrl ? (
                                <>
                                  <img
                                    src={product.fotoUrl}
                                    alt={product.nome}
                                    className="w-full h-full object-cover"
                                  />
                                  <span className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                    <Camera className="w-4 h-4 text-[#F2CA50]" />
                                  </span>
                                </>
                              ) : (
                                <div className="flex flex-col items-center justify-center text-white/30 group-hover:text-[#F2CA50] transition-colors">
                                  <ImagePlus className="w-5 h-5" />
                                  <span className="text-[9px] font-bold mt-0.5">Foto</span>
                                </div>
                              )}
                            </button>

                            <div className="min-w-0 space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-heading font-bold text-white text-sm">
                                  {product.nome}
                                </h3>
                              <span className="px-2 py-0.5 rounded-full bg-white/5 text-white/60 text-[10px] font-bold border border-white/10">
                                {categoryLabels[product.categoria]}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                                  isOut
                                    ? 'bg-red-500/20 text-red-400 border-red-500/30'
                                    : isLow
                                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                    : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                }`}
                              >
                                {isOut ? 'Esgotado' : isLow ? 'Reposição Necessária' : 'Estoque Normal'}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 flex-wrap text-xs text-white/50">
                              <span>
                                Saldo atual:{' '}
                                <strong className={isLow ? 'text-amber-300' : 'text-white'}>
                                  {product.quantidadeAtual} {product.unidade}
                                </strong>
                              </span>
                              <span>•</span>
                              {editingMinProductId === product.id ? (
                                <span className="inline-flex items-center gap-1.5">
                                  <span>Mínimo:</span>
                                  <input
                                    type="number"
                                    min={0}
                                    value={tempMinValue}
                                    onChange={(e) => setTempMinValue(e.target.value)}
                                    className="w-14 px-2 py-0.5 rounded bg-black/70 border border-[#F2CA50] text-white text-xs text-center focus:outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleSaveMinStock(product.id)}
                                    className="px-2 py-0.5 rounded bg-[#F2CA50] text-black text-[10px] font-black cursor-pointer"
                                  >
                                    OK
                                  </button>
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingMinProductId(product.id);
                                    setTempMinValue(String(product.estoqueMinimo));
                                  }}
                                  className="hover:text-[#F2CA50] transition-colors inline-flex items-center gap-1 cursor-pointer"
                                  title="Editar nível mínimo de alerta"
                                >
                                  <span>
                                    Nível mínimo: <strong className="text-white/80">{product.estoqueMinimo} {product.unidade}</strong>
                                  </span>
                                  <Sliders className="w-3 h-3 text-[#F2CA50]" />
                                </button>
                              )}
                              {product.custoUnitario !== undefined && (
                                <>
                                  <span>•</span>
                                  <span>Custo unit.: R$ {product.custoUnitario.toFixed(2)}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                          {/* Controles rápidos de entrada/saída */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                inventoryRepository.adjustStock(product.id, -1, 'ajuste_manual', 'Saída manual (-1)');
                                loadData();
                              }}
                              disabled={product.quantidadeAtual === 0}
                              className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-bold border border-white/10 cursor-pointer disabled:opacity-30"
                            >
                              -1
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                inventoryRepository.adjustStock(product.id, 1, 'entrada', 'Entrada manual (+1)');
                                loadData();
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#25D366] text-xs font-bold border border-[#25D366]/30 cursor-pointer"
                            >
                              +1
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                inventoryRepository.adjustStock(product.id, 5, 'entrada', 'Reposição (+5)');
                                loadData();
                                showToast(`+5 ${product.unidade} em ${product.nome}`);
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#25D366] text-xs font-bold border border-[#25D366]/30 cursor-pointer"
                            >
                              +5
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                inventoryRepository.deleteProduct(product.id);
                                loadData();
                                showToast('Produto removido do estoque.');
                              }}
                              title="Excluir produto"
                              className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-white/5 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Barra visual de nível */}
                        <div className="w-full h-2 rounded-full bg-black/60 border border-white/5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isOut ? 'bg-red-500' : isLow ? 'bg-amber-400' : 'bg-[#25D366]'
                            }`}
                            style={{ width: `${Math.max(4, pct)}%` }}
                          />
                        </div>

                        {/* Serviços Associados para Baixa Automática */}
                        <div className="pt-2 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-white/40 mr-1">
                              Baixa automática em:
                            </span>
                            {product.servicosAssociados && product.servicosAssociados.length > 0 ? (
                              product.servicosAssociados.map((assoc) => (
                                <span
                                  key={assoc.serviceId}
                                  className="px-2 py-0.5 rounded-md bg-[#F2CA50]/10 text-[#F2CA50] text-[10px] font-bold border border-[#F2CA50]/25"
                                >
                                  {assoc.serviceName} (-{assoc.consumoPorAtendimento} {product.unidade})
                                </span>
                              ))
                            ) : (
                              <span className="text-[11px] text-white/35 italic">
                                Nenhum serviço vinculado
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleOpenAssociations(product)}
                            className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#F2CA50] text-[11px] font-bold border border-[#F2CA50]/30 flex items-center gap-1.5 cursor-pointer self-start sm:self-auto shrink-0"
                          >
                            <Link2 className="w-3.5 h-3.5" />
                            <span>Associar Serviços</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Histórico Recente de Movimentações */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#1C1C1B] border border-white/5 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                  <div className="text-[10px] font-black uppercase tracking-widest text-[#F2CA50] flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5" />
                    <span>ÚLTIMAS MOVIMENTAÇÕES DE ESTOQUE</span>
                  </div>
                  <span className="text-[10px] text-white/40">Baixas automáticas e reposições</span>
                </div>

                {movements.length === 0 ? (
                  <div className="py-6 text-center text-xs text-white/30">
                    Nenhuma movimentação registrada ainda.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {movements.slice(0, 12).map((mov) => {
                      const isIn = mov.quantidade > 0;
                      const time = new Date(mov.timestamp).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      });
                      const date = new Date(mov.timestamp).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                      });

                      return (
                        <div
                          key={mov.id}
                          className="p-2.5 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                isIn
                                  ? 'bg-[#25D366]/15 text-[#25D366]'
                                  : mov.tipo === 'baixa_automatica'
                                  ? 'bg-[#F2CA50]/15 text-[#F2CA50]'
                                  : 'bg-amber-500/15 text-amber-400'
                              }`}
                            >
                              {isIn ? (
                                <ArrowUpRight className="w-4 h-4" />
                              ) : (
                                <ArrowDownRight className="w-4 h-4" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-white truncate">{mov.productName}</div>
                              <div className="text-[11px] text-white/45 truncate">{mov.motivo}</div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <div
                              className={`font-heading font-black text-xs ${
                                isIn ? 'text-[#25D366]' : 'text-amber-300'
                              }`}
                            >
                              {isIn ? `+${mov.quantidade}` : mov.quantidade}
                            </div>
                            <div className="text-[10px] text-white/35">
                              {date} {time}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Primary Action Button */}
        <div className="pt-6">
          {activeTab === 'servicos' ? (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="w-full py-4 px-6 rounded-xl bg-[#F2CA50] hover:bg-[#ebd05d] text-black font-heading font-black tracking-wider uppercase text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#F2CA50]/15 transition-transform active:scale-98"
            >
              <Plus className="w-5 h-5 text-black" />
              <span>NOVO SERVIÇO</span>
            </button>
          ) : (
            <button
              onClick={() => setIsAddProductOpen(true)}
              className="w-full py-4 px-6 rounded-xl bg-[#F2CA50] hover:bg-[#ebd05d] text-black font-heading font-black tracking-wider uppercase text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#F2CA50]/15 transition-transform active:scale-98"
            >
              <Plus className="w-5 h-5 text-black" />
              <span>CADASTRAR PRODUTO NO ESTOQUE</span>
            </button>
          )}
        </div>
      </div>

      {/* Add Service Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#1C1C1B] border border-white/10 p-6 space-y-5 animate-slideUp">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-black text-lg text-white uppercase tracking-wider">
                ADICIONAR SERVIÇO
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-white/40 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddService} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40 mb-1.5">
                  Nome do Serviço
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Corte Degradê"
                  required
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl bg-black/40 text-white border border-white/10 focus:border-[#F2CA50] focus:outline-none text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40 mb-1.5">
                    Preço (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="50.00"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-black/40 text-white border border-white/10 focus:border-[#F2CA50] focus:outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40 mb-1.5">
                    Duração (min)
                  </label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="30"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-black/40 text-white border border-white/10 focus:border-[#F2CA50] focus:outline-none text-sm"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase cursor-pointer"
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-3 px-4 rounded-xl bg-[#F2CA50] text-black text-xs font-heading font-black uppercase cursor-pointer"
                >
                  {isLoading ? 'SALVANDO...' : 'SALVAR'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {isAddProductOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-[#1C1C1B] border border-white/10 p-6 space-y-5 my-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-black text-lg text-white uppercase tracking-wider flex items-center gap-2">
                <Package className="w-5 h-5 text-[#F2CA50]" />
                <span>NOVO PRODUTO NO ESTOQUE</span>
              </h3>
              <button
                onClick={() => setIsAddProductOpen(false)}
                className="p-1 rounded-lg text-white/40 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40 mb-1.5">
                  Nome do Produto / Insumo
                </label>
                <input
                  type="text"
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  placeholder="Ex: Óleo de Barba Premium, Toalha Descartável..."
                  required
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl bg-black/40 text-white border border-white/10 focus:border-[#F2CA50] focus:outline-none text-sm"
                />
              </div>

              {/* Foto do Produto */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40">
                  Foto do Produto (opcional)
                </label>
                <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex items-center gap-3">
                  <div className="w-16 h-16 rounded-xl bg-black/60 border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                    {prodPhotoUrl ? (
                      <img
                        src={prodPhotoUrl}
                        alt="Pré-visualização do produto"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="w-6 h-6 text-white/25" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <label className="px-3 py-1.5 rounded-lg bg-[#F2CA50]/15 hover:bg-[#F2CA50]/25 text-[#F2CA50] border border-[#F2CA50]/30 text-[11px] font-bold flex items-center gap-1.5 cursor-pointer">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Enviar Foto</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handlePhotoUpload(e, setProdPhotoUrl)}
                          className="hidden"
                        />
                      </label>
                      {prodPhotoUrl && (
                        <button
                          type="button"
                          onClick={() => setProdPhotoUrl('')}
                          className="px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[11px] font-bold cursor-pointer"
                        >
                          Remover
                        </button>
                      )}
                    </div>
                    <input
                      type="url"
                      value={prodPhotoUrl.startsWith('data:') ? '' : prodPhotoUrl}
                      onChange={(e) => setProdPhotoUrl(e.target.value)}
                      placeholder="Ou cole o link (URL) da imagem..."
                      className="w-full px-3 py-1.5 rounded-lg bg-black/50 text-white border border-white/10 focus:border-[#F2CA50] focus:outline-none text-[11px]"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40 mb-1.5">
                    Categoria
                  </label>
                  <select
                    value={prodCategory}
                    onChange={(e) => setProdCategory(e.target.value as InventoryProduct['categoria'])}
                    className="w-full px-3.5 py-3 rounded-xl bg-black/40 text-white border border-white/10 focus:border-[#F2CA50] focus:outline-none text-xs"
                  >
                    <option value="consumo_interno">Consumo nos Atendimentos</option>
                    <option value="higiene_descartaveis">Higiene & Descartáveis</option>
                    <option value="revenda">Produto de Revenda</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40 mb-1.5">
                    Unidade de Medida
                  </label>
                  <select
                    value={prodUnit}
                    onChange={(e) => setProdUnit(e.target.value)}
                    className="w-full px-3.5 py-3 rounded-xl bg-black/40 text-white border border-white/10 focus:border-[#F2CA50] focus:outline-none text-xs"
                  >
                    <option value="un">Unidade (un)</option>
                    <option value="doses">Doses / Aplicações</option>
                    <option value="ml">Mililitros (ml)</option>
                    <option value="g">Gramas (g)</option>
                    <option value="cx">Caixas (cx)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40 mb-1.5">
                    Qtd. Inicial
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={prodQty}
                    onChange={(e) => setProdQty(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-xl bg-black/40 text-white border border-white/10 focus:border-[#F2CA50] focus:outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-amber-400 mb-1.5">
                    Nível Mínimo
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={prodMinQty}
                    onChange={(e) => setProdMinQty(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-xl bg-black/40 text-white border border-amber-500/30 focus:border-[#F2CA50] focus:outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40 mb-1.5">
                    Custo Unit. (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={prodCost}
                    onChange={(e) => setProdCost(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2.5 rounded-xl bg-black/40 text-white border border-white/10 focus:border-[#F2CA50] focus:outline-none text-sm"
                  />
                </div>
              </div>

              {/* Associar serviços já no cadastro */}
              <div className="space-y-2 pt-2 border-t border-white/5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#F2CA50]">
                  Associar Serviços para Baixa Automática (opcional)
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {services.map((srv) => {
                    const matched = prodAssociations.find((a) => a.serviceId === srv.id);
                    return (
                      <div
                        key={srv.id}
                        className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs ${
                          matched
                            ? 'bg-[#F2CA50]/10 border-[#F2CA50]/40 text-white'
                            : 'bg-black/40 border-white/5 text-white/60'
                        }`}
                      >
                        <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={!!matched}
                            onChange={() => handleToggleAssocInList(prodAssociations, setProdAssociations, srv)}
                            className="w-4 h-4 rounded text-[#F2CA50] bg-black border-white/20 cursor-pointer"
                          />
                          <span className="truncate font-semibold">{srv.nome}</span>
                        </label>

                        {matched && (
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="text-[10px] text-white/60">Consumo:</span>
                            <input
                              type="number"
                              min={1}
                              value={matched.consumoPorAtendimento}
                              onChange={(e) =>
                                handleUpdateAssocQtyInList(
                                  prodAssociations,
                                  setProdAssociations,
                                  srv.id,
                                  parseInt(e.target.value, 10) || 1
                                )
                              }
                              className="w-12 px-1.5 py-0.5 rounded bg-black/60 border border-white/15 text-center text-[#F2CA50] font-bold text-xs"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddProductOpen(false)}
                  className="flex-1 py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase cursor-pointer"
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 rounded-xl bg-[#F2CA50] text-black text-xs font-heading font-black uppercase cursor-pointer"
                >
                  SALVAR PRODUTO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Associate Services Modal */}
      {associatingProduct && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#1C1C1B] border border-[#F2CA50]/40 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-heading font-black text-base text-white uppercase tracking-wider flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-[#F2CA50]" />
                  <span>Baixa Automática por Serviço</span>
                </h3>
                <p className="text-xs text-white/50 mt-0.5">
                  Produto: <strong className="text-white">{associatingProduct.nome}</strong>
                </p>
              </div>
              <button
                onClick={() => setAssociatingProduct(null)}
                className="p-1 rounded-lg text-white/40 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-white/60 leading-relaxed">
              Selecione em quais serviços este produto é utilizado. Ao finalizar o atendimento no caixa, a quantidade definida será descontada automaticamente.
            </p>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {services.map((srv) => {
                const matched = editingAssociations.find((a) => a.serviceId === srv.id);
                return (
                  <div
                    key={srv.id}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-2 text-xs ${
                      matched
                        ? 'bg-[#F2CA50]/12 border-[#F2CA50]/50 text-white'
                        : 'bg-black/40 border-white/10 text-white/65'
                    }`}
                  >
                    <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={!!matched}
                        onChange={() =>
                          handleToggleAssocInList(editingAssociations, setEditingAssociations, srv)
                        }
                        className="w-4 h-4 rounded text-[#F2CA50] bg-black border-white/20 cursor-pointer"
                      />
                      <span className="font-bold truncate">{srv.nome}</span>
                    </label>

                    {matched && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] text-white/60">Consumo:</span>
                        <input
                          type="number"
                          min={1}
                          value={matched.consumoPorAtendimento}
                          onChange={(e) =>
                            handleUpdateAssocQtyInList(
                              editingAssociations,
                              setEditingAssociations,
                              srv.id,
                              parseInt(e.target.value, 10) || 1
                            )
                          }
                          className="w-12 px-2 py-1 rounded-lg bg-black/70 border border-white/15 text-center text-[#F2CA50] font-black text-xs"
                        />
                        <span className="text-[10px] text-white/50">{associatingProduct.unidade}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => setAssociatingProduct(null)}
                className="flex-1 py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveAssociations}
                className="flex-1 py-3 px-4 rounded-xl bg-[#F2CA50] text-black text-xs font-heading font-black uppercase cursor-pointer"
              >
                Salvar Vínculos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Edit Modal for Existing Product */}
      {photoEditingProduct && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#1C1C1B] border border-[#F2CA50]/40 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-heading font-black text-base text-white uppercase tracking-wider flex items-center gap-2">
                  <Camera className="w-4 h-4 text-[#F2CA50]" />
                  <span>Foto do Produto</span>
                </h3>
                <p className="text-xs text-white/50 mt-0.5 truncate">
                  {photoEditingProduct.nome}
                </p>
              </div>
              <button
                onClick={() => setPhotoEditingProduct(null)}
                className="p-1 rounded-lg text-white/40 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-black/50 border border-white/10">
              <div className="w-32 h-32 rounded-2xl bg-black/60 border border-white/10 overflow-hidden flex items-center justify-center">
                {tempEditPhotoUrl ? (
                  <img
                    src={tempEditPhotoUrl}
                    alt={photoEditingProduct.nome}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Package className="w-10 h-10 text-white/20" />
                )}
              </div>

              <div className="flex items-center gap-2">
                <label className="px-3.5 py-2 rounded-xl bg-[#F2CA50] hover:bg-[#ebd05d] text-black font-heading font-black text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer">
                  <Upload className="w-4 h-4" />
                  <span>Escolher Foto</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handlePhotoUpload(e, setTempEditPhotoUrl)}
                    className="hidden"
                  />
                </label>

                {tempEditPhotoUrl && (
                  <button
                    type="button"
                    onClick={() => setTempEditPhotoUrl('')}
                    className="px-3 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-400 text-xs font-bold cursor-pointer"
                  >
                    Remover Foto
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40 mb-1.5">
                Ou cole o link (URL) da imagem
              </label>
              <input
                type="url"
                value={tempEditPhotoUrl.startsWith('data:') ? '' : tempEditPhotoUrl}
                onChange={(e) => setTempEditPhotoUrl(e.target.value)}
                placeholder="https://exemplo.com/produto.jpg"
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 text-white border border-white/10 focus:border-[#F2CA50] focus:outline-none text-xs"
              />
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => setPhotoEditingProduct(null)}
                className="flex-1 py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveProductPhoto}
                className="flex-1 py-3 px-4 rounded-xl bg-[#F2CA50] text-black text-xs font-heading font-black uppercase cursor-pointer"
              >
                Salvar Foto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[60] px-4 py-3 rounded-xl bg-[#1C1C1B] border border-[#F2CA50] text-white text-xs font-bold flex items-center gap-2 shadow-2xl">
          <Check className="w-4 h-4 text-[#F2CA50]" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
