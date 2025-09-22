import React, { useRef } from 'react';
import { Order } from '../../types/calculator';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface OrderReceiptProps {
  order: Order;
}

export function OrderReceipt({ order }: OrderReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('uz-UZ').format(amount) + ' so\'m';
  };

  const formatDate = (date: Date) => {
    const orderDate = new Date(date);
    const day = orderDate.getDate().toString().padStart(2, '0');
    const month = (orderDate.getMonth() + 1).toString().padStart(2, '0');
    const year = orderDate.getFullYear();
    const hours = orderDate.getHours().toString().padStart(2, '0');
    const minutes = orderDate.getMinutes().toString().padStart(2, '0');
    
    return `${day}.${month}.${year} ${hours}:${minutes}`;
  };

  const downloadPDF = async () => {
    if (!receiptRef.current) return;

    try {
      // Create canvas from the receipt element
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2, // Higher quality
        useCORS: true,
        backgroundColor: '#ffffff',
        width: 300,
        height: receiptRef.current.scrollHeight,
      });

      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [80, 200] // Receipt size
      });

      // Calculate dimensions
      const imgWidth = 80;
      const pageHeight = 200;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      // Add image to PDF
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add new pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Generate filename
      const fileName = `Chek_${order.name}_${formatDate(order.createdAt).replace(/[.:\s]/g, '_')}.pdf`;
      
      // Download PDF
      pdf.save(fileName);
    } catch (error) {
      console.error('PDF yaratishda xatolik:', error);
      alert('PDF yaratishda xatolik yuz berdi!');
    }
  };

  const printReceipt = () => {
    window.print();
  };

  return (
    <div className="print-receipt">
      <style>{`
        @media print {
          @page {
            size: 80mm 200mm;
            margin: 0;
            padding: 0;
          }
          
          * {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          
          body {
            margin: 0 !important;
            padding: 0 !important;
          }
          
          body * {
            visibility: hidden;
          }
          
          .print-receipt, .print-receipt * {
            visibility: visible !important;
          }
          
          .print-receipt {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 80mm !important;
            height: auto !important;
            min-height: 200mm !important;
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            font-family: 'Courier New', monospace !important;
            font-size: 10px !important;
            line-height: 1.2 !important;
            overflow: visible !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            box-sizing: border-box !important;
          }
          
          .receipt-container {
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 8px !important;
            border: none !important;
            box-shadow: none !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            box-sizing: border-box !important;
          }
          
          .receipt-logo-img {
            height: 25px !important;
            width: auto !important;
            max-width: 100px !important;
          }
          
          .receipt-section {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            margin-bottom: 4px !important;
          }
          
          .receipt-items {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          
          .receipt-item {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          
          .no-print {
            display: none !important;
          }
        }
        
        .receipt-container {
          max-width: 300px;
          margin: 0 auto;
          background: white;
          border: 1px solid #ddd;
          padding: 15px;
          font-family: 'Courier New', monospace;
          font-size: 10px;
          line-height: 1.2;
        }
        
        .receipt-header {
          text-align: center;
          border-bottom: 1px dashed #333;
          padding-bottom: 8px;
          margin-bottom: 10px;
        }
        
        .receipt-logo {
          margin-bottom: 6px;
        }
        
        .receipt-logo-img {
          height: 30px;
          width: auto;
          max-width: 120px;
        }
        
        .receipt-title {
          font-size: 14px;
          font-weight: bold;
          margin-bottom: 4px;
        }
        
        .receipt-subtitle {
          font-size: 9px;
          color: #666;
          margin-bottom: 2px;
        }
        
        .receipt-section {
          margin-bottom: 8px;
        }
        
        .receipt-section-title {
          font-weight: bold;
          border-bottom: 1px solid #333;
          padding-bottom: 3px;
          margin-bottom: 6px;
          font-size: 11px;
        }
        
        .receipt-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 3px;
          align-items: center;
        }
        
        .receipt-row-label {
          flex: 1;
        }
        
        .receipt-row-value {
          flex: 1;
          text-align: right;
          font-weight: bold;
        }
        
        .receipt-items {
          margin-bottom: 6px;
        }
        
        .receipt-item {
          margin-bottom: 4px;
          padding: 2px 0;
          border-bottom: 1px dotted #ccc;
        }
        
        .receipt-item:last-child {
          border-bottom: none;
        }
        
        .receipt-total {
          border-top: 2px solid #333;
          padding-top: 8px;
          margin-top: 10px;
          font-weight: bold;
          font-size: 12px;
        }
        
        .receipt-footer {
          text-align: center;
          margin-top: 10px;
          padding-top: 6px;
          border-top: 1px dashed #333;
          font-size: 8px;
          color: #666;
        }
      `}</style>

      <div ref={receiptRef} className="receipt-container">
        <div className="receipt-header">
          <div className="w-[100%] receipt-logo text-center">
            <img 
              src="/logo_chek.png" 
              alt="TOGO GROUP Logo" 
              className="receipt-logo-img m-auto"
            />
          </div>
          <div className="receipt-subtitle">Professional Poligrafiya</div>
          <div className="receipt-subtitle">Chek № {order.id.slice(-8)}</div>
        </div>

        <div className="receipt-section">
          <div className="receipt-section-title">BUYURTMA</div>
          <div className="receipt-row">
            <span className="receipt-row-label">{order.name}</span>
          </div>
          {order.phone && (
            <div className="receipt-row">
              <span className="receipt-row-label">Tel: {order.phone}</span>
            </div>
          )}
          <div className="receipt-row">
            <span className="receipt-row-label">{formatDate(order.createdAt)}</span>
          </div>
          <div className="receipt-row">
            <span className="receipt-row-label">Mat: {order.materials[order.state.selectedMaterial]?.name || 'Tanlanmagan'}</span>
          </div>
          <div className="receipt-row">
            <span className="receipt-row-label">Xiz: {order.services[order.state.selectedService]?.name || 'Xizmat yo\'q'}</span>
          </div>
        </div>

        <div className="receipt-section">
          <div className="receipt-section-title">MAHSULOTLAR</div>
          <div className="receipt-items">
            {order.state.items.map((item, index) => (
              <div key={item.id} className="receipt-item">
                <div className="receipt-row">
                  <span className="receipt-row-label">{index + 1}. {item.name}</span>
                </div>
                <div className="receipt-row">
                  <span className="receipt-row-label">{item.width}×{item.height} m, {item.quantity} ta</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="receipt-section">
          <div className="receipt-section-title">HISOB-KITOB</div>
          <div className="receipt-row">
            <span className="receipt-row-label">Pech: {order.results.totalPrintArea.toFixed(2)}m²</span>
            <span className="receipt-row-value">{formatCurrency(order.results.printCost)}</span>
          </div>
          <div className="receipt-row">
            <span className="receipt-row-label">Material: {order.results.totalMaterialUsed.toFixed(2)}m²</span>
            <span className="receipt-row-value">{formatCurrency(order.results.materialCost)}</span>
          </div>
          <div className="receipt-row">
            <span className="receipt-row-label">Xizmat:</span>
            <span className="receipt-row-value">{formatCurrency(order.results.serviceCost)}</span>
          </div>
        </div>

        <div className="receipt-total">
          <div className="receipt-row">
            <span className="receipt-row-label">JAMI:</span>
            <span className="receipt-row-value">{formatCurrency(order.results.totalCost)}</span>
          </div>
        </div>

        <div className="receipt-footer">
          <div>Rahmat!</div>
        </div>
      </div>

      <div className="no-print" style={{ textAlign: 'center', marginTop: '20px' }}>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button 
            onClick={downloadPDF}
            style={{
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            📄 PDF yuklash
          </button>
          <button 
            onClick={printReceipt}
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            🖨️ Chop etish
          </button>
        </div>
      </div>
    </div>
  );
}
