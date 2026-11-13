import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';
import {
  QrCode,
  Printer,
  FileDown,
  ImageDown,
  Copy,
  Check,
  X,
  Smartphone,
  Scissors,
  Sparkles,
} from 'lucide-react';
import { AtelierProfile } from '../types';

interface QueueCheckInQrModalProps {
  atelier: AtelierProfile;
  onClose: () => void;
  onViewPublicQueue: () => void;
}

export const QueueCheckInQrModal: React.FC<QueueCheckInQrModalProps> = ({
  atelier,
  onClose,
  onViewPublicQueue,
}) => {
  const queueUrl = `${window.location.origin}/#/fila/${atelier.id}`;

  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [posterTheme, setPosterTheme] = useState<'light' | 'dark'>('light');
  const [paperSize, setPaperSize] = useState<'a5' | 'a4'>('a5');
  const [headline, setHeadline] = useState<string>('ENTRE NA FILA PELO CELULAR');
  const [instruction, setInstruction] = useState<string>(
    'Aponte a câmera do seu celular para o QR Code abaixo e acompanhe sua vez em tempo real.'
  );
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(queueUrl, {
      width: 560,
      margin: 2,
      errorCorrectionLevel: 'H',
      color: {
        dark: '#131313',
        light: '#FFFFFF',
      },
    })
      .then((url) => {
        if (active) setQrDataUrl(url);
      })
      .catch((err) => {
        console.error('Erro ao gerar QR Code:', err);
      });

    return () => {
      active = false;
    };
  }, [queueUrl]);

  const showFeedback = (msg: string) => {
    setStatusFeedback(msg);
    setTimeout(() => setStatusFeedback(null), 4000);
  };

  const handleCopyUrl = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(queueUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2500);
    }
  };

  const handlePrint = () => {
    window.print();
    showFeedback('Janela de impressão aberta! Se preferir, baixe também o PDF pronto.');
  };

  const handleDownloadPng = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    const cleanName = atelier.nome_negocio.replace(/[^a-zA-Z0-9]/g, '_');
    link.href = qrDataUrl;
    link.download = `QRCode-Fila-${cleanName}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showFeedback('Imagem PNG do QR Code baixada com sucesso!');
  };

  const handleDownloadPdfPoster = () => {
    if (!qrDataUrl) return;

    const isA4 = paperSize === 'a4';
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: isA4 ? 'a4' : 'a5',
    });

    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = isA4 ? 18 : 12;

    if (posterTheme === 'dark') {
      doc.setFillColor(19, 19, 19);
      doc.rect(0, 0, pageW, pageH, 'F');
      doc.setDrawColor(242, 202, 80);
      doc.setLineWidth(1.2);
      doc.roundedRect(margin - 4, margin - 4, pageW - (margin - 4) * 2, pageH - (margin - 4) * 2, 4, 4, 'S');
    } else {
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, pageW, pageH, 'F');
      doc.setDrawColor(20, 20, 20);
      doc.setLineWidth(1);
      doc.roundedRect(margin - 4, margin - 4, pageW - (margin - 4) * 2, pageH - (margin - 4) * 2, 4, 4, 'S');
      doc.setFillColor(242, 202, 80);
      doc.rect(margin - 4, margin - 4, pageW - (margin - 4) * 2, 3.5, 'F');
    }

    // Business Name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(isA4 ? 14 : 11);
    doc.setTextColor(posterTheme === 'dark' ? 242 : 150, posterTheme === 'dark' ? 202 : 115, posterTheme === 'dark' ? 80 : 15);
    doc.text(atelier.nome_negocio.toUpperCase(), pageW / 2, margin + (isA4 ? 16 : 12), { align: 'center' });

    // Headline
    doc.setFontSize(isA4 ? 24 : 17);
    doc.setTextColor(posterTheme === 'dark' ? 255 : 19, posterTheme === 'dark' ? 255 : 19, posterTheme === 'dark' ? 255 : 19);
    const headlineLines = doc.splitTextToSize(headline.trim() || 'ENTRE NA FILA PELO CELULAR', pageW - margin * 2 - 8);
    const headlineY = margin + (isA4 ? 32 : 24);
    doc.text(headlineLines, pageW / 2, headlineY, { align: 'center' });

    // Instruction
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(isA4 ? 11.5 : 9.5);
    doc.setTextColor(posterTheme === 'dark' ? 205 : 85, posterTheme === 'dark' ? 205 : 85, posterTheme === 'dark' ? 205 : 85);
    const instrLines = doc.splitTextToSize(instruction.trim(), pageW - margin * 2 - 12);
    const instrY = headlineY + headlineLines.length * (isA4 ? 9 : 7) + 4;
    doc.text(instrLines, pageW / 2, instrY, { align: 'center' });

    // QR Code Frame
    const qrSize = isA4 ? 95 : 68;
    const qrX = (pageW - qrSize) / 2;
    const qrY = instrY + instrLines.length * (isA4 ? 5.5 : 4.5) + (isA4 ? 12 : 8);

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(242, 202, 80);
    doc.setLineWidth(1.5);
    doc.roundedRect(qrX - 5, qrY - 5, qrSize + 10, qrSize + 10, 4, 4, 'FD');
    doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);

    // Badge below QR
    const badgeY = qrY + qrSize + (isA4 ? 16 : 12);
    doc.setFillColor(242, 202, 80);
    const badgeW = isA4 ? 96 : 76;
    doc.roundedRect((pageW - badgeW) / 2, badgeY, badgeW, isA4 ? 10 : 8.5, 3, 3, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(isA4 ? 10 : 8.5);
    doc.setTextColor(19, 19, 19);
    doc.text('CHECK-IN RÁPIDO NA RECEPÇÃO', pageW / 2, badgeY + (isA4 ? 6.5 : 5.6), { align: 'center' });

    // Footer URL
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(isA4 ? 8.5 : 7);
    doc.setTextColor(posterTheme === 'dark' ? 160 : 110, posterTheme === 'dark' ? 160 : 110, posterTheme === 'dark' ? 160 : 110);
    doc.text(queueUrl, pageW / 2, pageH - margin - 2, { align: 'center', maxWidth: pageW - margin * 2 });

    const cleanName = atelier.nome_negocio.replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `Placa-QRCode-Recepcao-${cleanName}-${paperSize.toUpperCase()}.pdf`;
    doc.save(fileName);
    showFeedback(`Placa PDF (${paperSize.toUpperCase()}) gerada para impressão!`);
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 overflow-y-auto p-4 sm:p-6 flex items-center justify-center">
      <div className="w-full max-w-3xl rounded-3xl bg-[#1C1C1B] border border-[#F2CA50]/40 p-5 sm:p-7 space-y-6 shadow-2xl my-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#F2CA50]/15 border border-[#F2CA50]/30 flex items-center justify-center text-[#F2CA50] shrink-0">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-heading font-black text-white text-lg sm:text-xl uppercase tracking-wider">
                QR Code de Check-in na Recepção
              </h2>
              <p className="text-xs text-white/50 mt-0.5">
                Imprima ou baixe a placa para que seus clientes entrem diretamente na fila pública do atelier.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/5 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Left: Customization & Actions */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-white/50 mb-1.5">
                  Estilo da Placa
                </label>
                <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-black/50 border border-white/10 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setPosterTheme('light')}
                    className={`py-2 px-2 rounded-lg transition-all cursor-pointer ${
                      posterTheme === 'light'
                        ? 'bg-white text-black font-black shadow'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    Branco
                  </button>
                  <button
                    type="button"
                    onClick={() => setPosterTheme('dark')}
                    className={`py-2 px-2 rounded-lg transition-all cursor-pointer ${
                      posterTheme === 'dark'
                        ? 'bg-[#F2CA50] text-black font-black shadow'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    Obsidian
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-white/50 mb-1.5">
                  Formato PDF
                </label>
                <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-black/50 border border-white/10 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setPaperSize('a5')}
                    className={`py-2 px-2 rounded-lg transition-all cursor-pointer ${
                      paperSize === 'a5'
                        ? 'bg-[#F2CA50] text-black font-black shadow'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    A5 Balcão
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaperSize('a4')}
                    className={`py-2 px-2 rounded-lg transition-all cursor-pointer ${
                      paperSize === 'a4'
                        ? 'bg-[#F2CA50] text-black font-black shadow'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    A4 Parede
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-white/50 mb-1.5">
                Título da Placa
              </label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                maxLength={48}
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 text-white border border-white/10 focus:border-[#F2CA50] focus:outline-none text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-white/50 mb-1.5">
                Instrução para o Cliente
              </label>
              <textarea
                rows={2}
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                maxLength={140}
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 text-white border border-white/10 focus:border-[#F2CA50] focus:outline-none text-xs resize-none"
              />
            </div>

            {/* Direct Link Box */}
            <div className="p-3 rounded-2xl bg-black/40 border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-white/40">
                <span>Link Direto da Fila Pública</span>
                <button
                  type="button"
                  onClick={onViewPublicQueue}
                  className="text-[#F2CA50] hover:underline flex items-center gap-1 cursor-pointer normal-case font-bold"
                >
                  <Smartphone className="w-3 h-3" />
                  <span>Abrir Tela Pública</span>
                </button>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 px-2.5 py-1.5 rounded-lg bg-black/70 border border-white/5 text-[11px] font-mono text-white/80 truncate select-all">
                  {queueUrl}
                </div>
                <button
                  type="button"
                  onClick={handleCopyUrl}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0"
                >
                  {copiedUrl ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#25D366]" />
                      <span className="text-[#25D366]">Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-[#F2CA50]" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={handlePrint}
                disabled={!qrDataUrl}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#F2CA50] hover:bg-[#ebd05d] text-black font-heading font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#F2CA50]/15 cursor-pointer transition-transform active:scale-95 disabled:opacity-50"
              >
                <Printer className="w-4 h-4" />
                <span>IMPRIMIR PLACA DE CHECK-IN</span>
              </button>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={handleDownloadPdfPoster}
                  disabled={!qrDataUrl}
                  className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-heading font-bold text-xs flex items-center justify-center gap-1.5 border border-white/10 cursor-pointer disabled:opacity-50"
                >
                  <FileDown className="w-4 h-4 text-[#F2CA50]" />
                  <span>Baixar PDF ({paperSize.toUpperCase()})</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadPng}
                  disabled={!qrDataUrl}
                  className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-heading font-bold text-xs flex items-center justify-center gap-1.5 border border-white/10 cursor-pointer disabled:opacity-50"
                >
                  <ImageDown className="w-4 h-4 text-[#25D366]" />
                  <span>Baixar QR (PNG)</span>
                </button>
              </div>
            </div>

            {statusFeedback && (
              <div className="p-3 rounded-xl bg-[#25D366]/15 border border-[#25D366]/30 text-xs text-[#25D366] font-bold flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>{statusFeedback}</span>
              </div>
            )}
          </div>

          {/* Right: Live Printable Poster Preview */}
          <div className="flex flex-col items-center">
            <div className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#F2CA50]" />
              <span>Pré-visualização da Placa de Recepção</span>
            </div>

            <div
              className={`qr-print-sheet w-full max-w-[330px] rounded-3xl p-6 border-2 flex flex-col items-center text-center shadow-2xl transition-colors ${
                posterTheme === 'dark'
                  ? 'bg-[#131313] text-white border-[#F2CA50]'
                  : 'bg-white text-[#131313] border-[#131313]'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-[#F2CA50] text-black flex items-center justify-center mb-3 shadow">
                <Scissors className="w-5 h-5" />
              </div>

              <div
                className={`text-[11px] font-heading font-black uppercase tracking-widest ${
                  posterTheme === 'dark' ? 'text-[#F2CA50]' : 'text-amber-700'
                }`}
              >
                {atelier.nome_negocio}
              </div>

              <h3 className="font-heading font-black text-xl leading-tight mt-1.5">
                {headline || 'ENTRE NA FILA PELO CELULAR'}
              </h3>

              <p
                className={`text-xs leading-relaxed mt-2 mb-4 ${
                  posterTheme === 'dark' ? 'text-white/70' : 'text-neutral-600'
                }`}
              >
                {instruction}
              </p>

              <div className="p-3 rounded-2xl bg-white border-4 border-[#F2CA50] shadow-lg">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`QR Code de check-in para ${atelier.nome_negocio}`}
                    className="w-44 h-44 object-contain"
                  />
                ) : (
                  <div className="w-44 h-44 flex items-center justify-center text-xs text-neutral-400">
                    Gerando QR...
                  </div>
                )}
              </div>

              <div className="mt-4 px-4 py-1.5 rounded-full bg-[#F2CA50] text-black font-heading font-black text-[10px] uppercase tracking-wider">
                Check-in Rápido na Recepção
              </div>

              <div
                className={`mt-3 text-[9px] font-mono break-all ${
                  posterTheme === 'dark' ? 'text-white/40' : 'text-neutral-400'
                }`}
              >
                {queueUrl}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
