import { jsPDF } from 'jspdf';
import { AtelierProfile, DailyTrendPoint, Transaction } from '../types';

export type PdfReportPeriod = 'mes_atual' | '30_dias' | 'completo';

export interface StaffReportStat {
  staffId: string;
  name: string;
  role: string;
  atendimentosCount: number;
  faturamentoTotal: number;
  taxaOcupacao: number;
  mediaTempoMinutos: number;
}

export interface ConsolidatedPdfReportOptions {
  atelier?: AtelierProfile;
  period: PdfReportPeriod;
  includeMonthlyRevenue: boolean;
  includeTeamPerformance: boolean;
  includeAttendanceHistory: boolean;
  includeLoyaltyAndPayments: boolean;
  transactions: Transaction[];
  staffStats: StaffReportStat[];
  monthlyGoal: number;
  todayRevenue: number;
  currentMonthRevenue: number;
  trendsData: DailyTrendPoint[];
  loyaltySummary: {
    cartoesCompletados: number;
    brindesResgatadosMes: number;
  };
}

const formatBRL = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const formatPaymentMethod = (method?: string): string => {
  switch (method) {
    case 'pix':
      return 'Pix';
    case 'cartao_credito':
      return 'Cartão Crédito';
    case 'cartao_debito':
      return 'Cartão Débito';
    case 'tap_on_phone':
      return 'Tap on Phone';
    case 'dinheiro':
      return 'Dinheiro';
    default:
      return 'Pix / Caixa';
  }
};

export const filterTransactionsByPeriod = (
  transactions: Transaction[],
  period: PdfReportPeriod
): Transaction[] => {
  const now = new Date();
  if (period === 'mes_atual') {
    return transactions.filter((tx) => {
      const d = new Date(tx.data);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
  }
  if (period === '30_dias') {
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return transactions.filter((tx) => tx.data >= cutoff);
  }
  return transactions;
};

export const getPeriodLabel = (period: PdfReportPeriod): string => {
  if (period === 'mes_atual') {
    const monthName = new Date().toLocaleDateString('pt-BR', {
      month: 'long',
      year: 'numeric',
    });
    return `Mês Vigente (${monthName.charAt(0).toUpperCase() + monthName.slice(1)})`;
  }
  if (period === '30_dias') return 'Últimos 30 Dias';
  return 'Histórico Completo';
};

export function generateConsolidatedFinancePDF(options: ConsolidatedPdfReportOptions): string {
  const {
    atelier,
    period,
    includeMonthlyRevenue,
    includeTeamPerformance,
    includeAttendanceHistory,
    includeLoyaltyAndPayments,
    transactions,
    staffStats,
    monthlyGoal,
    todayRevenue,
    currentMonthRevenue,
    loyaltySummary,
  } = options;

  const filteredTx = [...filterTransactionsByPeriod(transactions, period)].sort(
    (a, b) => b.data - a.data
  );

  const periodRevenue = filteredTx.reduce((sum, tx) => sum + tx.valor, 0);
  const periodCount = filteredTx.length;
  const periodAvgTicket = periodCount > 0 ? periodRevenue / periodCount : 0;
  const goalPct = monthlyGoal > 0 ? Math.min(100, Math.round((currentMonthRevenue / monthlyGoal) * 100)) : 0;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = 0;

  const businessName = atelier?.nome_negocio || 'Atelier Barbearia';
  const emittedAt = `${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;

  // Header Banner
  doc.setFillColor(19, 19, 19);
  doc.rect(0, 0, pageWidth, 34, 'F');
  doc.setFillColor(242, 202, 80);
  doc.rect(0, 34, pageWidth, 1.5, 'F');

  doc.setTextColor(242, 202, 80);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('RELATÓRIO EXECUTIVO DE GESTÃO', margin, 11);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text(businessName.toUpperCase(), margin, 19);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(200, 200, 200);
  doc.text(`Período: ${getPeriodLabel(period)}`, margin, 26.5);

  doc.setFontSize(8.5);
  doc.text(`Emitido em: ${emittedAt}`, pageWidth - margin, 26.5, { align: 'right' });

  y = 43;

  const ensureSpace = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - 18) {
      doc.addPage();
      y = 16;
    }
  };

  const drawSectionTitle = (title: string, subtitle?: string) => {
    ensureSpace(16);
    doc.setFillColor(242, 202, 80);
    doc.rect(margin, y, 2.5, 6, 'F');

    doc.setTextColor(25, 25, 25);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11.5);
    doc.text(title, margin + 5, y + 4.8);

    if (subtitle) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(110, 110, 110);
      doc.text(subtitle, pageWidth - margin, y + 4.5, { align: 'right' });
    }
    y += 10;
  };

  // SECTION 1: Faturamento Mensal & Meta
  if (includeMonthlyRevenue) {
    drawSectionTitle('1. Faturamento Mensal & Indicadores', getPeriodLabel(period));

    const cardGap = 3.5;
    const cardWidth = (contentWidth - cardGap * 3) / 4;
    const cards = [
      {
        label: 'FATURAMENTO HOJE',
        value: formatBRL(todayRevenue),
        sub: 'Atendimentos do dia',
        highlight: true,
      },
      {
        label: 'MÊS VIGENTE',
        value: formatBRL(currentMonthRevenue),
        sub: `${goalPct}% da meta mensal`,
        highlight: false,
      },
      {
        label: 'TOTAL NO PERÍODO',
        value: formatBRL(periodRevenue),
        sub: `${periodCount} atendimentos`,
        highlight: false,
      },
      {
        label: 'TICKET MÉDIO',
        value: formatBRL(periodAvgTicket),
        sub: 'Média por atendimento',
        highlight: false,
      },
    ];

    cards.forEach((card, idx) => {
      const cx = margin + idx * (cardWidth + cardGap);
      if (card.highlight) {
        doc.setFillColor(242, 202, 80);
        doc.roundedRect(cx, y, cardWidth, 21, 2, 2, 'F');
        doc.setTextColor(40, 35, 10);
      } else {
        doc.setFillColor(247, 247, 246);
        doc.setDrawColor(225, 225, 222);
        doc.roundedRect(cx, y, cardWidth, 21, 2, 2, 'FD');
        doc.setTextColor(100, 100, 100);
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.8);
      doc.text(card.label, cx + 3, y + 5.5);

      doc.setFontSize(11);
      doc.setTextColor(20, 20, 20);
      doc.text(card.value, cx + 3, y + 12.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(card.highlight ? 50 : 120, card.highlight ? 45 : 120, card.highlight ? 20 : 120);
      doc.text(card.sub, cx + 3, y + 17.8);
    });

    y += 25.5;

    // Monthly Goal Bar
    ensureSpace(19);
    doc.setFillColor(250, 250, 248);
    doc.setDrawColor(225, 225, 220);
    doc.roundedRect(margin, y, contentWidth, 16, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 30, 30);
    doc.text(
      `Meta Mensal: ${formatBRL(monthlyGoal)}   |   Realizado: ${formatBRL(currentMonthRevenue)} (${goalPct}%)`,
      margin + 4,
      y + 6
    );

    const remaining = Math.max(0, monthlyGoal - currentMonthRevenue);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(95, 95, 95);
    doc.text(
      remaining > 0 ? `Faltam ${formatBRL(remaining)} para atingir a meta` : 'Meta mensal atingida!',
      pageWidth - margin - 4,
      y + 6,
      { align: 'right' }
    );

    const barX = margin + 4;
    const barY = y + 9.5;
    const barW = contentWidth - 8;
    const barH = 3.2;
    doc.setFillColor(225, 225, 225);
    doc.roundedRect(barX, barY, barW, barH, 1.5, 1.5, 'F');
    const filledW = Math.max(barW * (goalPct / 100), goalPct > 0 ? 3 : 0);
    if (filledW > 0) {
      doc.setFillColor(goalPct >= 100 ? 37 : 218, goalPct >= 100 ? 175 : 165, goalPct >= 100 ? 95 : 32);
      doc.roundedRect(barX, barY, Math.min(barW, filledW), barH, 1.5, 1.5, 'F');
    }

    y += 21;
  }

  // SECTION 2: Pagamentos e Fidelidade
  if (includeLoyaltyAndPayments) {
    drawSectionTitle('Resumo por Forma de Pagamento & Fidelidade');
    ensureSpace(26);

    const methodMap = new Map<string, { count: number; total: number }>();
    filteredTx.forEach((tx) => {
      const label = formatPaymentMethod(tx.metodo_pagamento);
      const curr = methodMap.get(label) || { count: 0, total: 0 };
      curr.count += 1;
      curr.total += tx.valor;
      methodMap.set(label, curr);
    });

    const entries = Array.from(methodMap.entries());
    const boxLeftW = contentWidth * 0.62;
    const boxRightW = contentWidth - boxLeftW - 4;
    const boxH = Math.max(22, 9 + Math.max(1, entries.length) * 5.2);

    ensureSpace(boxH + 4);

    // Left: payment breakdown
    doc.setFillColor(248, 248, 247);
    doc.setDrawColor(225, 225, 220);
    doc.roundedRect(margin, y, boxLeftW, boxH, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(40, 40, 40);
    doc.text('RECEITA POR MÉTODO DE PAGAMENTO', margin + 4, y + 6);

    if (entries.length === 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text('Sem transações registradas no período.', margin + 4, y + 13);
    } else {
      entries.forEach(([method, data], idx) => {
        const rowY = y + 11.5 + idx * 5;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(50, 50, 50);
        doc.text(`${method} (${data.count}x)`, margin + 4, rowY);

        doc.setFont('helvetica', 'bold');
        doc.text(formatBRL(data.total), margin + boxLeftW - 4, rowY, { align: 'right' });
      });
    }

    // Right: loyalty summary
    const rightX = margin + boxLeftW + 4;
    doc.setFillColor(248, 248, 247);
    doc.setDrawColor(225, 225, 220);
    doc.roundedRect(rightX, y, boxRightW, boxH, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(40, 40, 40);
    doc.text('CLUBE DE FIDELIDADE', rightX + 4, y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(70, 70, 70);
    doc.text('Cartões completados:', rightX + 4, y + 12.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(20, 20, 20);
    doc.text(`${loyaltySummary.cartoesCompletados}`, rightX + boxRightW - 4, y + 12.5, {
      align: 'right',
    });

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(70, 70, 70);
    doc.text('Brindes resgatados:', rightX + 4, y + 18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(20, 20, 20);
    doc.text(`${loyaltySummary.brindesResgatadosMes}`, rightX + boxRightW - 4, y + 18, {
      align: 'right',
    });

    y += boxH + 7;
  }

  // SECTION 3: Desempenho da Equipe
  if (includeTeamPerformance) {
    drawSectionTitle('Desempenho da Equipe', `${staffStats.length} profissionais`);

    if (staffStats.length === 0) {
      ensureSpace(12);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      doc.text('Nenhum profissional cadastrado na equipe até o momento.', margin, y + 4);
      y += 12;
    } else {
      const colWidths = [48, 34, 24, 28, 24, 24]; // sum = 182mm = contentWidth
      const drawTeamHeader = () => {
        ensureSpace(14);
        doc.setFillColor(28, 28, 27);
        doc.rect(margin, y, contentWidth, 7.5, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(242, 202, 80);

        let cx = margin + 2.5;
        doc.text('PROFISSIONAL', cx, y + 5);
        cx += colWidths[0];
        doc.text('CARGO', cx, y + 5);
        cx += colWidths[1];
        doc.text('ATEND.', cx + colWidths[2] - 4, y + 5, { align: 'right' });
        cx += colWidths[2];
        doc.text('FATURAMENTO', cx + colWidths[3] - 4, y + 5, { align: 'right' });
        cx += colWidths[3];
        doc.text('OCUPAÇÃO', cx + colWidths[4] - 4, y + 5, { align: 'right' });
        cx += colWidths[4];
        doc.text('TEMPO MÉD.', cx + colWidths[5] - 3, y + 5, { align: 'right' });
        y += 7.5;
      };

      drawTeamHeader();

      let totalTeamServices = 0;
      let totalTeamRevenue = 0;

      staffStats.forEach((st, idx) => {
        if (y + 7.5 > pageHeight - 18) {
          doc.addPage();
          y = 16;
          drawTeamHeader();
        }

        totalTeamServices += st.atendimentosCount;
        totalTeamRevenue += st.faturamentoTotal;

        if (idx % 2 === 0) {
          doc.setFillColor(248, 248, 247);
          doc.rect(margin, y, contentWidth, 7, 'F');
        }
        doc.setDrawColor(232, 232, 228);
        doc.line(margin, y + 7, margin + contentWidth, y + 7);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(25, 25, 25);
        let cx = margin + 2.5;
        doc.text(st.name.slice(0, 26), cx, y + 4.8);

        cx += colWidths[0];
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(90, 90, 90);
        doc.text(st.role.slice(0, 18), cx, y + 4.8);

        cx += colWidths[1];
        doc.setTextColor(30, 30, 30);
        doc.text(String(st.atendimentosCount), cx + colWidths[2] - 4, y + 4.8, { align: 'right' });

        cx += colWidths[2];
        doc.setFont('helvetica', 'bold');
        doc.text(formatBRL(st.faturamentoTotal), cx + colWidths[3] - 4, y + 4.8, { align: 'right' });

        cx += colWidths[3];
        doc.setFont('helvetica', 'normal');
        doc.text(`${st.taxaOcupacao}%`, cx + colWidths[4] - 4, y + 4.8, { align: 'right' });

        cx += colWidths[4];
        doc.text(`${st.mediaTempoMinutos} min`, cx + colWidths[5] - 3, y + 4.8, { align: 'right' });

        y += 7;
      });

      // Team Total Row
      ensureSpace(9);
      doc.setFillColor(242, 202, 80);
      doc.rect(margin, y, contentWidth, 7.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(20, 20, 20);
      doc.text('TOTAL DA EQUIPE', margin + 2.5, y + 5);
      doc.text(
        String(totalTeamServices),
        margin + colWidths[0] + colWidths[1] + colWidths[2] - 1.5,
        y + 5,
        { align: 'right' }
      );
      doc.text(
        formatBRL(totalTeamRevenue),
        margin + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] - 1.5,
        y + 5,
        { align: 'right' }
      );

      y += 14;
    }
  }

  // SECTION 4: Histórico de Atendimentos
  if (includeAttendanceHistory) {
    drawSectionTitle(
      'Histórico Consolidado de Atendimentos',
      `${filteredTx.length} registro(s)`
    );

    if (filteredTx.length === 0) {
      ensureSpace(12);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      doc.text('Nenhum atendimento finalizado encontrado para o período selecionado.', margin, y + 4);
      y += 12;
    } else {
      const colWidths = [30, 44, 58, 26, 24]; // sum = 182mm
      const drawHistoryHeader = () => {
        ensureSpace(14);
        doc.setFillColor(28, 28, 27);
        doc.rect(margin, y, contentWidth, 7.5, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(242, 202, 80);

        let cx = margin + 2.5;
        doc.text('DATA / HORA', cx, y + 5);
        cx += colWidths[0];
        doc.text('CLIENTE', cx, y + 5);
        cx += colWidths[1];
        doc.text('SERVIÇO REALIZADO', cx, y + 5);
        cx += colWidths[2];
        doc.text('PAGAMENTO', cx, y + 5);
        cx += colWidths[3];
        doc.text('VALOR', cx + colWidths[4] - 3, y + 5, { align: 'right' });
        y += 7.5;
      };

      drawHistoryHeader();

      filteredTx.forEach((tx, idx) => {
        if (y + 7 > pageHeight - 18) {
          doc.addPage();
          y = 16;
          drawHistoryHeader();
        }

        if (idx % 2 === 0) {
          doc.setFillColor(248, 248, 247);
          doc.rect(margin, y, contentWidth, 6.8, 'F');
        }
        doc.setDrawColor(232, 232, 228);
        doc.line(margin, y + 6.8, margin + contentWidth, y + 6.8);

        const d = new Date(tx.data);
        const dateStr = `${d.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: '2-digit',
        })} ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;

        let cx = margin + 2.5;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(90, 90, 90);
        doc.text(dateStr, cx, y + 4.7);

        cx += colWidths[0];
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(25, 25, 25);
        doc.text(tx.cliente_nome.slice(0, 23), cx, y + 4.7);

        cx += colWidths[1];
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(55, 55, 55);
        doc.text(tx.servico.slice(0, 32), cx, y + 4.7);

        cx += colWidths[2];
        doc.setTextColor(80, 80, 80);
        doc.text(formatPaymentMethod(tx.metodo_pagamento), cx, y + 4.7);

        cx += colWidths[3];
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(20, 20, 20);
        doc.text(formatBRL(tx.valor), cx + colWidths[4] - 3, y + 4.7, { align: 'right' });

        y += 6.8;
      });

      // Summary footer row
      ensureSpace(10);
      doc.setFillColor(242, 202, 80);
      doc.rect(margin, y, contentWidth, 7.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(20, 20, 20);
      doc.text(`TOTAL CONSOLIDADO (${filteredTx.length} ATENDIMENTOS)`, margin + 2.5, y + 5);
      doc.text(formatBRL(periodRevenue), margin + contentWidth - 2.5, y + 5, {
        align: 'right',
      });
      y += 10;
    }
  }

  // Page numbering footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i += 1) {
    doc.setPage(i);
    doc.setDrawColor(230, 230, 225);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(125, 125, 125);
    doc.text(`${businessName} • Relatório Confidencial do Proprietário`, margin, pageHeight - 7);
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 7, { align: 'right' });
  }

  const dateSlug = new Date().toISOString().split('T')[0];
  const cleanName = businessName.replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `Relatorio-Consolidado-${cleanName}-${dateSlug}.pdf`;

  doc.save(fileName);
  return fileName;
}
